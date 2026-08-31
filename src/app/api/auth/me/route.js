import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { dbQuery, isDatabaseConnected } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/auth/me
 * Get current authenticated user from session cookie
 */
export async function GET(request) {
  try {
    const user = await getUserFromRequest(request);

    if (!user) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    // Get fresh user data from database
    if (isDatabaseConnected()) {
      const { data: users } = await dbQuery('users', { filter: { id: user.id } });
      const dbUser = users?.[0];

      if (!dbUser) {
        return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
      }

      // Check if account is still active
      if (dbUser.status === 'suspended' || dbUser.status === 'banned') {
        return NextResponse.json({ success: false, error: 'Account is not active' }, { status: 403 });
      }

      return NextResponse.json({
        success: true,
        user: {
          id: dbUser.id,
          name: dbUser.name,
          email: dbUser.email,
          role: dbUser.role,
          phone: dbUser.phone,
          avatar: dbUser.avatar_url,
          status: dbUser.status,
          emailVerified: dbUser.email_verified,
          mfaEnabled: dbUser.mfa_enabled,
          createdAt: dbUser.created_at,
        },
      });
    }

    // Fallback: return from token payload
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
      },
    });
  } catch (error) {
    console.error('Auth check error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
