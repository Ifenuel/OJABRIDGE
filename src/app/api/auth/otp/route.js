import { NextResponse } from 'next/server';
import { dbQuery, dbInsert, dbUpdate, isDatabaseConnected } from '@/lib/db';
import { validateEmail } from '@/lib/auth';
import { cacheGet, cacheSet, cacheDel } from '@/lib/redis';

export const dynamic = 'force-dynamic';

/**
 * POST /api/auth/otp — Send OTP to email
 * POST /api/auth/otp { action: 'verify' } — Verify OTP code
 *
 * OTP storage uses Redis (via cacheGet/cacheSet) with automatic fallback
 * to in-memory if Redis is not configured.
 */

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, otp, action } = body;

    // VERIFY OTP
    if (action === 'verify') {
      if (!email || !otp) {
        return NextResponse.json({ success: false, error: 'Email and OTP are required' }, { status: 400 });
      }

      const storedKey = `otp:${email.toLowerCase()}`;
      const stored = await cacheGet(storedKey);
      if (!stored) {
        return NextResponse.json({ success: false, error: 'OTP expired or not found. Please request a new code.' }, { status: 400 });
      }

      if (stored.expiresAt < Date.now()) {
        await cacheDel(storedKey);
        return NextResponse.json({ success: false, error: 'OTP expired. Please request a new code.' }, { status: 400 });
      }

      if (stored.attempts >= 5) {
        await cacheDel(storedKey);
        return NextResponse.json({ success: false, error: 'Too many failed attempts. Please request a new code.' }, { status: 429 });
      }

      if (stored.code !== otp) {
        stored.attempts = (stored.attempts || 0) + 1;
        await cacheSet(storedKey, stored, 600);
        return NextResponse.json({ success: false, error: `Invalid OTP. ${5 - stored.attempts} attempts remaining.` }, { status: 400 });
      }

      // OTP verified successfully
      await cacheDel(storedKey);

      // Mark user as email verified if they exist
      if (isDatabaseConnected()) {
        const { data: users } = await dbQuery('users', { filter: { email: email.toLowerCase() } });
        if (users?.[0]) {
          await dbUpdate('users', { id: users[0].id }, { email_verified: true });
        }
      }

      return NextResponse.json({ success: true, message: 'Email verified successfully' });
    }

    // SEND OTP
    if (!email || !validateEmail(email)) {
      return NextResponse.json({ success: false, error: 'Valid email address is required' }, { status: 400 });
    }

    // Rate limit: max 3 OTPs per email per 15 minutes
    const storeKey = `otp:${email.toLowerCase()}`;
    const existing = await cacheGet(storeKey);
    if (existing && existing.sentCount >= 3 && (Date.now() - existing.firstSentAt) < 900000) {
      return NextResponse.json({ success: false, error: 'Too many OTP requests. Please wait 15 minutes.' }, { status: 429 });
    }

    const code = generateOtp();
    await cacheSet(storeKey, {
      code,
      expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
      attempts: 0,
      sentCount: (existing?.sentCount || 0) + 1,
      firstSentAt: existing?.firstSentAt || Date.now(),
    }, 600);

    // Send OTP email
    try {
      const { sendEmail } = await import('@/lib/email');
      await sendEmail({
        to: email,
        subject: `Your OjaBridge Verification Code: ${code}`,
        htmlContent: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background: #f8f9fa; }
              .container { max-width: 600px; margin: 0 auto; background: #ffffff; }
              .header { background: linear-gradient(135deg, #0f172a 0%, #6b21a8 100%); padding: 32px; text-align: center; }
              .header h1 { color: #ffffff; margin: 0; font-size: 28px; letter-spacing: 2px; }
              .content { padding: 32px; color: #1e293b; line-height: 1.6; text-align: center; }
              .otp-code { font-size: 48px; font-weight: bold; color: #6b21a8; letter-spacing: 12px; margin: 24px 0; padding: 20px; background: #f8f9fa; border-radius: 12px; border: 2px dashed #e2e8f0; }
              .footer { background: #0f172a; padding: 24px; text-align: center; color: #94a3b8; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>OJABRIDGE</h1>
              </div>
              <div class="content">
                <h2>Verify Your Email</h2>
                <p>Use the code below to verify your email address. This code expires in 10 minutes.</p>
                <div class="otp-code">${code}</div>
                <p style="color:#64748b;font-size:13px;">If you didn't request this code, you can safely ignore this email.</p>
              </div>
              <div class="footer">
                <p>OjaBridge — Shop • Connect • Grow</p>
              </div>
            </div>
          </body>
          </html>
        `,
      });
    } catch (emailErr) {
      console.error('[OTP] Email send failed:', emailErr.message);
      // Still return success — OTP is stored in memory for dev mode
    }

    return NextResponse.json({
      success: true,
      message: 'Verification code sent to your email',
      // In development, include OTP in response for testing
      ...(process.env.NODE_ENV === 'development' && { devOtp: code }),
    });
  } catch (error) {
    console.error('OTP error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
