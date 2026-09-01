import { NextResponse } from 'next/server';
import { dbQuery, dbInsert, dbUpdate, dbDelete, dbRaw, isDatabaseConnected } from '@/lib/db';
import { getUserFromRequest, requireRole } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/roles — List sub-admins and their permissions
 * POST /api/admin/roles — Create or update a sub-admin role with permissions
 * DELETE /api/admin/roles — Remove a sub-admin role
 */
export async function GET(request) {
  try {
    const user = await getUserFromRequest(request);
    const auth = requireRole(user, 'admin');
    if (!auth.authorized) return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });

    if (!isDatabaseConnected()) {
      return NextResponse.json({ success: true, roles: [], dbConnected: false });
    }

    const { data: roles, error } = await dbRaw(
      `SELECT ar.*, u.name as admin_name, u.email as admin_email 
       FROM admin_roles ar 
       LEFT JOIN users u ON u.id = ar.admin_id 
       ORDER BY ar.created_at DESC`
    );

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
    const existing = await dbQuery('admin_roles', { filter: { admin_id: adminUserId } });

    if (existing.data && existing.data.length > 0) {
      // Update — permissions is TEXT[] in the schema
      const perms = Array.isArray(permissions) ? permissions : [];
      const { data: updated, error } = await dbUpdate('admin_roles', { admin_id: adminUserId }, {
        permissions: perms,
        is_super_admin: isSuperAdmin || false,
        updated_at: new Date().toISOString(),
      });
      if (error) return NextResponse.json({ success: false, error }, { status: 500 });
      return NextResponse.json({ success: true, role: updated });
    } else {
      // Create — permissions is TEXT[] in the schema
      const perms = Array.isArray(permissions) ? permissions : [];
      const { data: created, error } = await dbInsert('admin_roles', {
        admin_id: adminUserId,
        permissions: perms,
        is_super_admin: isSuperAdmin || false,
        granted_by: user.id,
      });
      if (error) return NextResponse.json({ success: false, error }, { status: 500 });
      return NextResponse.json({ success: true, role: created }, { status: 201 });
    }
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/roles — Remove a sub-admin role (demote to regular user)
 */
export async function DELETE(request) {
  try {
    const user = await getUserFromRequest(request);
    const auth = requireRole(user, 'admin');
    if (!auth.authorized) return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });

    if (!isDatabaseConnected()) return NextResponse.json({ success: false, error: 'Database not connected' }, { status: 503 });

    const { searchParams } = new URL(request.url);
    const adminUserId = searchParams.get('userId');
    if (!adminUserId) return NextResponse.json({ success: false, error: 'userId required' }, { status: 400 });

    // Don't allow removing yourself
    if (adminUserId === user.id) {
      return NextResponse.json({ success: false, error: 'Cannot remove your own admin role' }, { status: 400 });
    }

    // Check if target is super admin
    const targetRole = await dbQuery('admin_roles', { filter: { admin_id: adminUserId } });
    if (targetRole.data?.[0]?.is_super_admin) {
      return NextResponse.json({ success: false, error: 'Cannot remove a super admin role' }, { status: 403 });
    }

    await dbDelete('admin_roles', { admin_id: adminUserId });

    // Audit log
    await dbInsert('audit_logs', {
      user_id: user.id,
      action: 'admin.role_removed',
      entity_type: 'user',
      entity_id: adminUserId,
      created_at: new Date().toISOString(),
    }).catch(() => {});

    return NextResponse.json({ success: true, message: 'Admin role removed' });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
