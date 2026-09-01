import { NextResponse } from 'next/server';
import { dbRaw, isDatabaseConnected } from '@/lib/db';
import { getUserFromRequest, requireRole } from '@/lib/auth';
import { getRedisHealth } from '@/lib/redis';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const user = await getUserFromRequest(request);
    const auth = requireRole(user, 'admin');
    if (!auth.authorized) return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });

    const checks = [];

    // Database check
    try {
      if (isDatabaseConnected()) {
        const result = await dbRaw('SELECT 1 as ok');
        checks.push({ name: 'Database (PostgreSQL)', status: 'Connected', ok: true });
      } else {
        checks.push({ name: 'Database (PostgreSQL)', status: 'Not Connected', ok: false });
      }
    } catch (e) {
      checks.push({ name: 'Database (PostgreSQL)', status: 'Error: ' + e.message, ok: false });
    }

    // Email service check
    const hasBrevo = !!process.env.BREVO_API_KEY;
    const hasBrevoSender = !!process.env.BREVO_SENDER_EMAIL;
    checks.push({
      name: 'Email Service (Brevo)',
      status: hasBrevo && hasBrevoSender ? 'Configured' : !hasBrevo ? 'Missing BREVO_API_KEY' : 'Missing BREVO_SENDER_EMAIL',
      ok: hasBrevo && hasBrevoSender,
    });

    // Paystack check
    const hasPaystack = !!(process.env.PAYSTACK_SECRET_KEY || process.env.PAYSTACK_SECRET);
    checks.push({
      name: 'Payment Gateway (Paystack)',
      status: hasPaystack ? 'Configured' : 'Not Configured',
      ok: hasPaystack,
    });

    // Auth check
    const hasJwt = !!process.env.JWT_SECRET;
    checks.push({
      name: 'Authentication Service',
      status: hasJwt ? 'Operational' : 'JWT_SECRET missing',
      ok: hasJwt,
    });

    // File uploads
    const hasCloudinary = !!process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    checks.push({
      name: 'File Uploads (Cloudinary)',
      status: hasCloudinary ? 'Configured' : 'Not Configured (optional)',
      ok: hasCloudinary,
    });

    // Webhook secret
    const hasWebhookSecret = !!process.env.PAYSTACK_WEBHOOK_SECRET;
    checks.push({
      name: 'Webhook Signature Verification',
      status: hasWebhookSecret ? 'Configured' : 'Not Configured (recommended)',
      ok: hasWebhookSecret,
    });

    // Redis check
    try {
      const redisStatus = await getRedisHealth();
      checks.push({
        name: 'Redis Cache (Rate Limiting)',
        status: redisStatus.status,
        ok: redisStatus.ok,
      });
    } catch {
      checks.push({ name: 'Redis Cache (Rate Limiting)', status: 'Error', ok: false });
    }

    return NextResponse.json({ success: true, checks });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
