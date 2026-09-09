import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { checkPermission } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

/**
 * GET /api/secure-document?url=...
 * Auth-gated proxy for KYC identity documents stored on remote storage
 * (e.g. Cloudinary/Supabase in future). Admins and sub-admins with the
 * 'vendors' permission may fetch; documents are NEVER public.
 *
 * Security:
 * - Server-side role check (session-based, never client-claimed)
 * - SSRF protection: https only, no internal/private hosts, no redirects
 * - Size limit (10 MB) and content-type allowlist
 * - Response is Cache-Control: no-store so documents don't sit in caches
 */
const BLOCKED_HOST_PATTERNS = [
  /^localhost$/i, /^127\./, /^0\./, /^10\./, /^169\.254\./, /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.168\./, /^\[?::1\]?$/, /\.local$/i, /^169\.254\.169\.254$/, // cloud metadata endpoint
];
const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'];

export async function GET(request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }
    if (user.role !== 'admin') {
      const { allowed } = await checkPermission(request, 'vendors');
      if (!allowed) {
        return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
      }
    }

    const { searchParams } = new URL(request.url);
    const rawUrl = searchParams.get('url');
    if (!rawUrl) {
      return NextResponse.json({ success: false, error: 'url parameter required' }, { status: 400 });
    }

    let target;
    try { target = new URL(rawUrl); } catch {
      return NextResponse.json({ success: false, error: 'Invalid URL' }, { status: 400 });
    }

    // SSRF protection: https only, no internal hosts, no embedded credentials
    if (target.protocol !== 'https:') {
      return NextResponse.json({ success: false, error: 'Only https URLs are allowed' }, { status: 400 });
    }
    if (BLOCKED_HOST_PATTERNS.some(p => p.test(target.hostname))) {
      return NextResponse.json({ success: false, error: 'Blocked host' }, { status: 400 });
    }
    if (target.username || target.password) {
      return NextResponse.json({ success: false, error: 'Credentials in URL not allowed' }, { status: 400 });
    }

    const res = await fetch(target.toString(), {
      redirect: 'error', // never follow redirects (SSRF hardening)
      headers: { 'User-Agent': 'OjaBridge-KYC-Proxy/1.0' },
      signal: AbortSignal.timeout(10_000),
    });

    if (!res.ok) {
      return NextResponse.json({ success: false, error: 'Document unavailable' }, { status: 404 });
    }

    const mime = (res.headers.get('content-type') || '').split(';')[0].trim();
    if (!ALLOWED_MIME.includes(mime)) {
      return NextResponse.json({ success: false, error: 'Unsupported document type' }, { status: 415 });
    }

    const len = parseInt(res.headers.get('content-length') || '0');
    if (len > 10 * 1024 * 1024) {
      return NextResponse.json({ success: false, error: 'Document too large' }, { status: 413 });
    }

    const buf = await res.arrayBuffer();
    if (buf.byteLength > 10 * 1024 * 1024) {
      return NextResponse.json({ success: false, error: 'Document too large' }, { status: 413 });
    }

    return new NextResponse(buf, {
      status: 200,
      headers: {
        'Content-Type': mime,
        'Content-Disposition': 'inline',
        'Cache-Control': 'no-store, private',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    console.error('[SECURE-DOC] Error:', error.message);
    return NextResponse.json({ success: false, error: 'Failed to load document' }, { status: 500 });
  }
}
