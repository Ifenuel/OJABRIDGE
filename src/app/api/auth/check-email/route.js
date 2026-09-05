import { NextResponse } from 'next/server';
import { dbQuery, isDatabaseConnected } from '@/lib/db';
import { validateEmailDetailed } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * POST /api/auth/check-email
 * Check if an email is available for registration.
 * Called early in the registration flow BEFORE the user fills out the long form.
 * 
 * Body: { email: string }
 * Returns: { success: boolean, available: boolean, error?: string, role?: string }
 */
export async function POST(request) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Email address is required' },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();

    // 1. Validate email format + disposable domains
    const validation = validateEmailDetailed(cleanEmail);
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: validation.error, available: false },
        { status: 400 }
      );
    }

    // 2. Check database for existing account with this email
    if (isDatabaseConnected()) {
      const { data: users, error } = await dbQuery('users', {
        filter: { email: cleanEmail },
        select: 'id,email,role,status',
      });

      if (error) {
        console.error('[CHECK-EMAIL] DB error:', error);
        // Don't block registration on DB errors — let the register API handle it
        return NextResponse.json({ success: true, available: true });
      }

      if (users && users.length > 0) {
        const existing = users[0];
        const roleLabel = existing.role
          ? existing.role.charAt(0).toUpperCase() + existing.role.slice(1)
          : 'OjaBridge';

        return NextResponse.json({
          success: false,
          available: false,
          error: `This email is already registered to an OjaBridge ${roleLabel} account. Each email can only be used for one OjaBridge account. Please use a different email address or log in to your existing account.`,
        });
      }
    }

    // Email is available
    return NextResponse.json({
      success: true,
      available: true,
      message: 'Email address is available',
    });
  } catch (error) {
    console.error('[CHECK-EMAIL] Error:', error);
    // Don't block registration on unexpected errors
    return NextResponse.json({ success: true, available: true });
  }
}
