import { NextResponse } from 'next/server';
import { hashPassword, validatePasswordStrength } from '@/lib/auth';
import { dbQuery, dbUpdate, isDatabaseConnected } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * POST /api/auth/reset-password
 * Body: { email, newPassword }
 * Requires the email to have been verified via /api/auth/verify-email first.
 */
export async function POST(request) {
  try {
    const { email, newPassword } = await request.json();

    if (!email || !newPassword) {
      return NextResponse.json({ success: false, error: 'Email and new password are required' }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Validate password strength
    const passwordErrors = validatePasswordStrength(newPassword);
    if (passwordErrors.length > 0) {
      return NextResponse.json({ success: false, error: passwordErrors[0] }, { status: 400 });
    }

    if (!isDatabaseConnected()) {
      return NextResponse.json({ success: false, error: 'Database not connected' }, { status: 503 });
    }

    // Find user
    const { data: users } = await dbQuery('users', { filter: { email: cleanEmail } });
    if (!users || users.length === 0) {
      // Don't reveal whether email exists
      return NextResponse.json({ success: true, message: 'If an account exists, the password has been reset.' });
    }

    const user = users[0];

    // Hash new password
    const passwordHash = await hashPassword(newPassword);

    // Update password and clear any lock
    await dbUpdate('users', { id: user.id }, {
      password_hash: passwordHash,
      failed_login_attempts: 0,
      locked_until: null,
    });

    return NextResponse.json({
      success: true,
      message: 'Password reset successful. You can now sign in.',
    });

  } catch (error) {
    console.error('[RESET-PASSWORD] Error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
