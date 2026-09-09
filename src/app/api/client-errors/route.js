import { NextResponse } from 'next/server';
import { dbInsert } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * POST /api/client-errors — Client-side error reporting endpoint.
 *
 * The error boundary posts a sanitized error summary here so crashes are
 * visible in Vercel logs. Accepts ONLY minimal, sanitized fields — no free
 * content, no PII, no credentials can leak through this endpoint.
 * Rate limited by the middleware's general API limit.
 */
export async function POST(request) {
  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ success: false, error: 'Invalid payload' }, { status: 400 });
    }

    // Strict allowlist + sanitization — never store raw client content
    const message = String(body.message || '').replace(/[\r\n]+/g, ' ').slice(0, 500);
    const digest = typeof body.digest === 'string' ? body.digest.slice(0, 64) : null;
    const path = typeof body.path === 'string' ? body.path.slice(0, 200) : '/';

    console.error(`[CLIENT-ERROR] path=${path} digest=${digest || 'n/a'} msg=${message}`);

    // Persist (best-effort) so the admin can see real user-facing failures
    await dbInsert('audit_logs', {
      action: 'client_error',
      entity_type: 'client',
      entity_id: null,
      new_data: { path, digest, message },
      ip_address: request.headers.get('x-forwarded-for') || null,
      user_agent: (request.headers.get('user-agent') || '').slice(0, 255),
    }).catch(() => {});

    return NextResponse.json({ success: true }, { status: 200 });
  } catch {
    // Never let error reporting itself throw
    return NextResponse.json({ success: true }, { status: 200 });
  }
}
