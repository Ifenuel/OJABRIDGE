import { NextResponse } from 'next/server';
import { verifyPassword, hashPassword, validatePasswordStrength, getUserFromRequest, requireAuth } from '@/lib/auth';
import { dbQuery, dbUpdate, isDatabaseConnected } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * POST /api/auth/change-password
 * Requires current password + new password
 */
export async function POST(request) {
  try {
    const authUser = await getUserFromRequest(request);
    const auth = requireAuth(authUser);
    if (!auth.authorized) return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });

    if (!isDatabaseConnected()) {
      return NextResponse.json({ success: false, error: 'Database not connected' }, { status: 503 });
    }

    const body = await request.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ success: false, error: 'Current and new passwords are required' }, { status: 400 });
    }

    // Validate new password strength
    const strengthErrors = validatePasswordStrength(newPassword);
    if (strengthErrors.length > 0) {
      return NextResponse.json({ success: false, errors: strengthErrors }, { status: 400 });
    }

    // Fetch user from DB
    const { data: users, error: findError } = await dbQuery('users', { filter: { id: authUser.id } });
    if (findError || !users?.[0]) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    const user = users[0];

    // Verify current password
    const isValid = await verifyPassword(currentPassword, user.password_hash);
    if (!isValid) {
      return NextResponse.json({ success: false, error: 'Current password is incorrect' }, { status: 400 });
    }

    // Hash new password
    const newHash = await hashPassword(newPassword);

    // Update in database
    const { error: updateError } = await dbUpdate('users', { id: authUser.id }, {
      password_hash: newHash,
      updated_at: new Date().toISOString(),
    });

    if (updateError) {
      return NextResponse.json({ success: false, error: 'Failed to update password' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
