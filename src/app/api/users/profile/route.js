import { NextResponse } from 'next/server';
import { dbQuery, dbUpdate, isDatabaseConnected } from '@/lib/db';
import { getUserFromRequest, requireAuth, sanitizeInput } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * GET /api/users/profile — Get current user's profile
 */
export async function GET(request) {
  try {
    const user = await getUserFromRequest(request);
    const auth = requireAuth(user);
    if (!auth.authorized) return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });

    if (!isDatabaseConnected()) {
      return NextResponse.json({ success: false, error: 'Database not connected' }, { status: 503 });
    }

    const { data: users, error } = await dbQuery('users', { filter: { id: user.id } });
    if (error) return NextResponse.json({ success: false, error }, { status: 500 });

    const u = users?.[0];
    if (!u) return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });

    return NextResponse.json({
      success: true,
      user: {
        id: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone,
        role: u.role,
        country: u.country,
        currency: u.currency,
        avatar_url: u.avatar_url,
        email_verified: u.email_verified,
        status: u.status,
        created_at: u.created_at,
        last_login_at: u.last_login_at,
      },
    });
  } catch (error) {
    console.error('Profile GET error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PATCH /api/users/profile — Update current user's profile
 */
export async function PATCH(request) {
  try {
    const user = await getUserFromRequest(request);
    const auth = requireAuth(user);
    if (!auth.authorized) return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });

    if (!isDatabaseConnected()) {
      return NextResponse.json({ success: false, error: 'Database not connected' }, { status: 503 });
    }

    const body = await request.json();
    const { name, phone, country, currency } = body;

    const updates = {};
    if (name !== undefined) updates.name = sanitizeInput(name);
    if (phone !== undefined) updates.phone = phone;
    if (country !== undefined) updates.country = country;
    if (currency !== undefined) updates.currency = currency;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ success: false, error: 'No updates provided' }, { status: 400 });
    }

    updates.updated_at = new Date().toISOString();

    const { data: updated, error } = await dbUpdate('users', { id: user.id }, updates);
    if (error) return NextResponse.json({ success: false, error }, { status: 500 });

    return NextResponse.json({
      success: true,
      user: {
        id: updated.id,
        name: updated.name,
        email: updated.email,
        phone: updated.phone,
        role: updated.role,
        country: updated.country,
        currency: updated.currency,
      },
    });
  } catch (error) {
    console.error('Profile PATCH error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
