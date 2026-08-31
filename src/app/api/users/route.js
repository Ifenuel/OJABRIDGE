import { NextResponse } from 'next/server';
import { dbQuery, dbRaw, isDatabaseConnected } from '@/lib/db';
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
