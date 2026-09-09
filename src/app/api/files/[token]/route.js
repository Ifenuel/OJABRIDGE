import { NextResponse } from 'next/server';
import { dbRaw } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/files/[token] — Serve a stored upload by its unguessable token.
 *
 * Public files (product images, avatars, CMS media) are served to anyone.
 * Private files (KYC identity documents) are NEVER served here — the
 * viewer fetches those through /api/secure-document which enforces
 * owner/admin authorization.
 *
 * Long immutable cache: tokens are random, so content can never change
 * for a given URL.
 */
export async function GET(request, { params }) {
  try {
    const { token } = await params;

    if (!token || !/^[a-f0-9]{32,64}$/i.test(token)) {
      return NextResponse.json({ success: false, error: 'Invalid file token' }, { status: 400 });
    }

    const { rows } = await dbRaw(
      'SELECT mime_type, data, is_public FROM uploads WHERE token = $1 LIMIT 1',
      [token]
    );

    if (!rows || rows.length === 0) {
      return NextResponse.json({ success: false, error: 'File not found' }, { status: 404 });
    }

    const file = rows[0];
    if (!file.is_public) {
      return NextResponse.json(
        { success: false, error: 'This file is private. Sign in to view it.' },
        { status: 403 }
      );
    }

    const body = Buffer.isBuffer(file.data) ? file.data : Buffer.from(file.data);

    return new NextResponse(body, {
      status: 200,
      headers: {
        'Content-Type': file.mime_type || 'application/octet-stream',
        'Content-Length': String(body.length),
        'Cache-Control': 'public, max-age=31536000, immutable',
        'X-Content-Type-Options': 'nosniff',
        'Content-Disposition': 'inline',
      },
    });
  } catch (error) {
    console.error('File serve error:', error);
    return NextResponse.json({ success: false, error: 'Failed to load file' }, { status: 500 });
  }
}
