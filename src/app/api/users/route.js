import { NextResponse } from 'next/server';
import { dbQuery, dbInsert, dbUpdate, dbRaw, isDatabaseConnected } from '@/lib/db';
import { getUserFromRequest, requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * GET /api/users — Fetch all users (admin only)
 * Supports: search, filter by role/status, pagination
 */
export async function GET(request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 });
    }

    if (!isDatabaseConnected()) {
      return NextResponse.json({
        success: true, users: [], pagination: { page: 1, limit: 20, total: 0, pages: 0 }, dbConnected: false,
      });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const search = searchParams.get('search');
    const role = searchParams.get('role');
    const status = searchParams.get('status');
    const offset = (page - 1) * limit;

    let conditions = [];
    const params = [];
    let paramIndex = 1;

    if (search && search.trim()) {
      conditions.push(`(name ILIKE $${paramIndex} OR email ILIKE $${paramIndex} OR phone ILIKE $${paramIndex})`);
      params.push(`%${search.trim()}%`);
      paramIndex++;
    }
    if (role) {
      conditions.push(`role = $${paramIndex}`);
      params.push(role);
      paramIndex++;
    }
    if (status) {
      conditions.push(`status = $${paramIndex}`);
      params.push(status);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Count
    const countResult = await dbRaw(`SELECT COUNT(*) as total FROM users ${whereClause}`, params);
    const total = parseInt(countResult.rows?.[0]?.total || 0);

    // Fetch users (never expose password_hash)
    const { rows: users, error } = await dbRaw(
      `SELECT id, email, name, role, phone, avatar_url, status, country, currency,
              email_verified, phone_verified, mfa_enabled, last_login_at, created_at, updated_at
       FROM users
       ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, offset]
    );

    if (error) {
      console.error('Users query error:', error);
      return NextResponse.json({ success: false, error }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      users: users || [],
      data: users || [],
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      dbConnected: true,
    });
  } catch (error) {
    console.error('Users API error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PATCH /api/users — Admin user management
 * Body: { userId, status, role }
 */
export async function PATCH(request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 });
    }

    if (!isDatabaseConnected()) {
      return NextResponse.json({ success: false, error: 'Database not connected' }, { status: 503 });
    }

    const body = await request.json();
    const { userId, status, role } = body;

    if (!userId) return NextResponse.json({ success: false, error: 'User ID required' }, { status: 400 });

    const updates = {};
    if (status && ['active', 'suspended', 'banned'].includes(status)) updates.status = status;
    if (role && ['customer', 'vendor', 'retailer', 'admin'].includes(role)) updates.role = role;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ success: false, error: 'No valid updates provided' }, { status: 400 });
    }

    const { data: updated, error } = await dbUpdate('users', { id: userId }, updates);
    if (error) return NextResponse.json({ success: false, error }, { status: 500 });

    // Audit log
    await dbInsert('audit_logs', {
      user_id: user.id,
      action: `user.${status ? 'status_changed' : 'role_changed'}`,
      entity_type: 'user',
      entity_id: userId,
      new_data: updates,
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, user: updated });
  } catch (error) {
    console.error('User update error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
