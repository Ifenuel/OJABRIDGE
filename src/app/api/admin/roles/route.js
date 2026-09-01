import { NextResponse } from 'next/server';
import { dbQuery, dbInsert, dbUpdate, dbRaw, isDatabaseConnected } from '@/lib/db';
import { getUserFromRequest, requireRole } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/roles — List sub-admins and their permissions
 * POST /api/admin/roles — Create or update a sub-admin role with permissions
 */
export async function GET(request) {
  try {
    const user = await getUserFromRequest(request);
    const auth = requireRole(user, 'admin');
    if (!auth.authorized) return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });

    if (!isDatabaseConnected()) {
      return NextResponse.json({ success: true, roles: [], dbConnected: false });
    }

    const { data: roles, error } = await dbQuery('admin_roles', {
      order: { column: 'created_at', ascending: false },
    });

    if (error) return NextResponse.json({ success: false, error }, { status: 500 });
    return NextResponse.json({ success: true, roles: roles || [] });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = await getUserFromRequest(request);
    const auth = requireRole(user, 'admin');
    if (!auth.authorized) return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });

    if (!isDatabaseConnected()) return NextResponse.json({ success: false, error: 'Database not connected' }, { status: 503 });

    const body = await request.json();
    const { adminUserId, permissions, isSuperAdmin } = body;

    if (!adminUserId) return NextResponse.json({ success: false, error: 'Admin user ID required' }, { status: 400 });

    // Check if role already exists
    const existing = await dbQuery('admin_roles', { filter: { admin_user_id: adminUserId } });

    if (existing.data && existing.data.length > 0) {
      // Update
      const { data: updated, error } = await dbUpdate('admin_roles', { admin_user_id: adminUserId }, {
        permissions: JSON.stringify(permissions || []),
        is_super_admin: isSuperAdmin || false,
        updated_at: new Date().toISOString(),
      });
      if (error) return NextResponse.json({ success: false, error }, { status: 500 });
      return NextResponse.json({ success: true, role: updated });
    } else {
      // Create
      const { data: created, error } = await dbInsert('admin_roles', {
        admin_user_id: adminUserId,
        permissions: JSON.stringify(permissions || []),
        is_super_admin: isSuperAdmin || false,
        created_by: user.id,
      });
      if (error) return NextResponse.json({ success: false, error }, { status: 500 });
      return NextResponse.json({ success: true, role: created }, { status: 201 });
    }
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
