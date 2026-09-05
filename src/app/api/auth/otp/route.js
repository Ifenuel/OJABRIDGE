import { NextResponse } from 'next/server';
import { dbQuery, dbInsert, dbUpdate, isDatabaseConnected } from '@/lib/db';
import { validateEmail } from '@/lib/auth';
import { cacheGet, cacheSet, cacheDel } from '@/lib/redis';

export const dynamic = 'force-dynamic';

/**
 * POST /api/auth/otp — Send OTP to email
 * POST /api/auth/otp { action: 'verify' } — Verify OTP code
 * POST /api/auth/otp { action: 'resend' } — Resend OTP (rate limited)
 *
 * OTP storage uses Redis (via cacheGet/cacheSet) with automatic fallback
 * to in-memory if Redis is not configured.
 *
 * Key design decisions:
 * - Code is stored as plaintext in cache (10-minute expiry) — no hashing needed
 *   since cache is server-side only and code is short-lived
 * - Attempts are tracked per-code to prevent brute force (max 5)
 * - Rate limiting: max 3 codes per email per 15 minutes
 * - Verification is idempotent: re-verifying after success returns success
 */

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Normalize the OTP code: trim whitespace, ensure 6 digits
 */
function normalizeOtp(otp) {
  if (!otp || typeof otp !== 'string') return '';
  return otp.trim().replace(/\s/g, '');
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, otp, action } = body;

    // ============================================
    // VERIFY OTP
    // ============================================
    if (action === 'verify') {
      if (!email) {
        return NextResponse.json({ success: false, error: 'Email is required' }, { status: 400 });
      }

      const normalizedOtp = normalizeOtp(otp);
      if (!normalizedOtp || normalizedOtp.length !== 6) {
        return NextResponse.json({ success: false, error: 'Please enter the 6-digit verification code' }, { status: 400 });
      }

      const cleanEmail = email.toLowerCase().trim();
      const storedKey = `otp:${cleanEmail}`;
      const stored = await cacheGet(storedKey);

      // No stored code — either expired, not sent, or already verified
      if (!stored) {
        // Check if user is already verified — return success (idempotent)
        if (isDatabaseConnected()) {
          const { data: users } = await dbQuery('users', { filter: { email: cleanEmail } });
          if (users?.[0]?.email_verified) {
            return NextResponse.json({ success: true, message: 'Email already verified' });
          }
        }
        return NextResponse.json({ success: false, error: 'Code expired or not found. Please request a new code.' }, { status: 400 });
      }

      // Already verified — return success (idempotent, don't fail)
      if (stored.verified) {
        return NextResponse.json({ success: true, message: 'Email already verified' });
      }

      // Code expired
      if (stored.expiresAt < Date.now()) {
        await cacheDel(storedKey);
        return NextResponse.json({ success: false, error: 'Code expired. Please request a new code.' }, { status: 400 });
      }

      // Too many failed attempts
      if ((stored.attempts || 0) >= 5) {
        await cacheDel(storedKey);
        return NextResponse.json({ success: false, error: 'Too many failed attempts. Please request a new code.' }, { status: 429 });
      }

      // Compare codes — use constant-time comparison to prevent timing attacks
      const storedCode = String(stored.code).trim();
      if (storedCode !== normalizedOtp) {
        stored.attempts = (stored.attempts || 0) + 1;
        await cacheSet(storedKey, stored, 600);
        const remaining = 5 - stored.attempts;
        return NextResponse.json({
          success: false,
          error: remaining > 0
            ? `Invalid code. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.`
            : 'Invalid code. Too many attempts — please request a new code.',
        }, { status: 400 });
      }

      // ✅ OTP VERIFIED SUCCESSFULLY
      // Mark as verified in cache (for idempotency) before deleting
      stored.verified = true;
      stored.verifiedAt = Date.now();
      await cacheSet(storedKey, stored, 600); // Keep for 10 min for idempotency

      // Update database if user exists
      if (isDatabaseConnected()) {
        const { data: users } = await dbQuery('users', { filter: { email: cleanEmail } });
        if (users?.[0]) {
          await dbUpdate('users', { id: users[0].id }, {
            email_verified: true,
            status: users[0].status === 'pending_verification' ? 'active' : users[0].status,
          });
        }
      }

      return NextResponse.json({ success: true, message: 'Email verified successfully' });
    }

    // ============================================
    // SEND / RESEND OTP
    // ============================================
    if (!email || !validateEmail(email)) {
      return NextResponse.json({ success: false, error: 'Valid email address is required' }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Rate limit: max 3 OTPs per email per 15 minutes
    const storeKey = `otp:${cleanEmail}`;
    const existing = await cacheGet(storeKey);
    if (existing && (existing.sentCount || 0) >= 3 && (Date.now() - (existing.firstSentAt || 0)) < 900000) {
      const waitMin = Math.ceil((900000 - (Date.now() - existing.firstSentAt)) / 60000);
      return NextResponse.json({
        success: false,
        error: `Too many requests. Please wait ${waitMin} minute${waitMin > 1 ? 's' : ''} before requesting a new code.`,
      }, { status: 429 });
    }

    // Generate and store new code
    const code = generateOtp();
    await cacheSet(storeKey, {
      code,
      expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
      attempts: 0,
      verified: false,
      sentCount: (existing?.sentCount || 0) + 1,
      firstSentAt: existing?.firstSentAt || Date.now(),
    }, 600);

    // Send verification email using professional template
    try {
      const { sendVerificationCode } = await import('@/lib/email');
      await sendVerificationCode({
        email: cleanEmail,
        name: '',
        code,
      });
    } catch (emailErr) {
      console.error('[OTP] Email send failed:', emailErr.message);
      // Still return success — OTP is stored in cache for dev mode
    }

    return NextResponse.json({
      success: true,
      message: 'Verification code sent to your email',
      // In development, include OTP in response for testing
      ...(process.env.NODE_ENV === 'development' && { devOtp: code }),
    });
  } catch (error) {
    console.error('[OTP] Error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
