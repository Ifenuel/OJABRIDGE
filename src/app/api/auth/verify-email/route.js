import { NextResponse } from 'next/server';
import { dbQuery, dbUpdate, isDatabaseConnected } from '@/lib/db';
import { cacheGet, cacheSet, cacheDel } from '@/lib/redis';

export const dynamic = 'force-dynamic';

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * POST /api/auth/verify-email
 * Action: send — sends a verification code to the email
 * Action: verify — verifies the code and marks email as verified
 * Action: resend — sends a new code (rate limited)
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { email, otp, action = 'send' } = body;

    if (!email) {
      return NextResponse.json({ success: false, error: 'Email is required' }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();

    // === VERIFY OTP ===
    if (action === 'verify') {
      if (!otp || otp.length !== 6) {
        return NextResponse.json({ success: false, error: 'Please enter the 6-digit code' }, { status: 400 });
      }

      const storedKey = `verify:${cleanEmail}`;
      const stored = await cacheGet(storedKey);

      if (!stored) {
        return NextResponse.json({ success: false, error: 'Code expired or not found. Please request a new code.' }, { status: 400 });
      }

      if (stored.expiresAt < Date.now()) {
        await cacheDel(storedKey);
        return NextResponse.json({ success: false, error: 'Code expired. Please request a new code.' }, { status: 400 });
      }

      if (stored.attempts >= 5) {
        await cacheDel(storedKey);
        return NextResponse.json({ success: false, error: 'Too many failed attempts. Please request a new code.' }, { status: 429 });
      }

      if (stored.code !== otp) {
        stored.attempts = (stored.attempts || 0) + 1;
        await cacheSet(storedKey, stored, 600);
        return NextResponse.json({
          success: false,
          error: `Invalid code. ${5 - stored.attempts} attempts remaining.`,
        }, { status: 400 });
      }

      // Code verified — mark user as email verified
      await cacheDel(storedKey);

      if (isDatabaseConnected()) {
        const { data: users } = await dbQuery('users', { filter: { email: cleanEmail } });
        if (users && users[0]) {
          await dbUpdate('users', { id: users[0].id }, {
            email_verified: true,
            status: users[0].status === 'pending_verification' ? 'active' : users[0].status,
          });
        }
      }

      return NextResponse.json({ success: true, message: 'Email verified successfully' });
    }

    // === SEND / RESEND OTP ===
    if (!isDatabaseConnected()) {
      // In dev mode without DB, still allow sending
      if (process.env.NODE_ENV !== 'development') {
        return NextResponse.json({ success: false, error: 'Service unavailable' }, { status: 503 });
      }
    }

    // Rate limit: max 3 codes per 15 minutes
    const storeKey = `verify:${cleanEmail}`;
    const existing = await cacheGet(storeKey);
    if (existing && existing.sentCount >= 3 && (Date.now() - (existing.firstSentAt || 0)) < 900000) {
      const waitMin = Math.ceil((900000 - (Date.now() - existing.firstSentAt)) / 60000);
      return NextResponse.json({
        success: false,
        error: `Too many requests. Please wait ${waitMin} minute${waitMin > 1 ? 's' : ''}.`,
      }, { status: 429 });
    }

    const code = generateOtp();
    await cacheSet(storeKey, {
      code,
      expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
      attempts: 0,
      sentCount: (existing?.sentCount || 0) + 1,
      firstSentAt: existing?.firstSentAt || Date.now(),
    }, 600);

    // Send verification email
    try {
      const { sendEmail } = await import('@/lib/email');
      await sendEmail({
        to: cleanEmail,
        subject: `Verify Your OjaBridge Email — Code: ${code}`,
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
                <p>Welcome to OjaBridge! Use the code below to verify your email address and activate your account.</p>
                <div class="otp-code">${code}</div>
                <p style="color:#64748b;font-size:13px;">This code expires in 10 minutes. If you didn't create an OjaBridge account, you can safely ignore this email.</p>
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
      console.error('[VERIFY-EMAIL] Send failed:', emailErr.message);
      // Don't fail — in dev mode OTP is returned in response
    }

    return NextResponse.json({
      success: true,
      message: 'Verification code sent to your email',
      // Dev mode: include code for testing
      ...(process.env.NODE_ENV === 'development' && { devOtp: code }),
    });

  } catch (error) {
    console.error('[VERIFY-EMAIL] Error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
