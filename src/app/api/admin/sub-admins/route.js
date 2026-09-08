import { NextResponse } from 'next/server';
import { dbQuery, dbInsert, dbRaw } from '@/lib/db';
import { getUserFromRequest, hashPassword } from '@/lib/auth';

// Available permissions sub-admins can be assigned
const AVAILABLE_PERMISSIONS = [
  { key: 'live-chats', label: 'Live Chat Support', description: 'Respond to customer live chats' },
  { key: 'orders', label: 'Orders', description: 'View and manage customer orders' },
  { key: 'disputes', label: 'Disputes', description: 'Review and resolve customer disputes' },
  { key: 'users', label: 'Users', description: 'View customer and user accounts' },
  { key: 'vendors', label: 'Vendors', description: 'View and manage vendor accounts' },
  { key: 'retailers', label: 'Retailers', description: 'View and manage retailer accounts' },
  { key: 'products', label: 'Products', description: 'View and manage products' },
  { key: 'payments', label: 'Payments', description: 'View payment records' },
  { key: 'reports', label: 'Reports', description: 'View reports and analytics' },
  { key: 'content', label: 'Content', description: 'Manage blog, press, careers content' },
  { key: 'newsletter', label: 'Newsletter', description: 'Manage newsletter subscribers and sends' },
];

// GET — List all sub-admins or get permissions list
export async function GET(request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Super admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    if (searchParams.get('permissions') === 'true') {
      return NextResponse.json({ success: true, permissions: AVAILABLE_PERMISSIONS });
    }

    // Ensure sub_admins table exists
    await dbRaw(`CREATE TABLE IF NOT EXISTS sub_admins (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      email VARCHAR(255) NOT NULL,
      name VARCHAR(255) NOT NULL,
      permissions JSONB DEFAULT '[]',
      status VARCHAR(50) DEFAULT 'active',
      created_by UUID,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )`);

    // Add columns if missing
    try { await dbRaw(`ALTER TABLE sub_admins ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '[]'`); } catch {}
    try { await dbRaw(`ALTER TABLE sub_admins ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active'`); } catch {}

    const { data: subAdmins, error } = await dbQuery('sub_admins', {
      order: { column: 'created_at', ascending: false },
      limit: 50,
    });

    if (error) throw error;

    return NextResponse.json({ success: true, subAdmins: subAdmins || [], permissions: AVAILABLE_PERMISSIONS });
  } catch (error) {
    console.error('Sub-admins GET error:', error);
    return NextResponse.json({ success: false, error: 'Failed to load sub-admins' }, { status: 500 });
  }
}

// POST — Create a new sub-admin
export async function POST(request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Super admin access required' }, { status: 403 });
    }

    const { email, name, password, permissions } = await request.json();

    if (!email || !name || !password) {
      return NextResponse.json({ success: false, error: 'Email, name, and password are required' }, { status: 400 });
    }

    if (!permissions || permissions.length === 0) {
      return NextResponse.json({ success: false, error: 'At least one permission must be assigned' }, { status: 400 });
    }

    // Validate permissions
    const validKeys = AVAILABLE_PERMISSIONS.map(p => p.key);
    const invalidPerms = permissions.filter(p => !validKeys.includes(p));
    if (invalidPerms.length > 0) {
      return NextResponse.json({ success: false, error: `Invalid permissions: ${invalidPerms.join(', ')}` }, { status: 400 });
    }

    // Check if email already exists
    const { data: existing } = await dbQuery('users', { filter: { email: email.toLowerCase().trim() }, limit: 1 });
    if (existing?.length > 0) {
      return NextResponse.json({ success: false, error: 'An account with this email already exists' }, { status: 409 });
    }

    // Create user account with sub_admin role
    const passwordHash = await hashPassword(password);
    const { data: newUser, error: userError } = await dbInsert('users', {
      email: email.toLowerCase().trim(),
      name: name.trim(),
      password_hash: passwordHash,
      role: 'sub_admin',
      status: 'active',
      email_verified: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    if (userError) throw userError;

    // Create sub_admin record with permissions
    const { data: subAdmin, error: saError } = await dbInsert('sub_admins', {
      user_id: newUser.id,
      email: email.toLowerCase().trim(),
      name: name.trim(),
      permissions: JSON.stringify(permissions),
      status: 'active',
      created_by: user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    if (saError) throw saError;

    return NextResponse.json({ success: true, subAdmin });
  } catch (error) {
    console.error('Sub-admins POST error:', error);
    return NextResponse.json({ success: false, error: 'Failed to create sub-admin' }, { status: 500 });
  }
}

// PATCH — Update sub-admin permissions or status
export async function PATCH(request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Super admin access required' }, { status: 403 });
    }

    const { subAdminId, permissions, status } = await request.json();
    if (!subAdminId) {
      return NextResponse.json({ success: false, error: 'Sub-admin ID required' }, { status: 400 });
    }

    const updates = { updated_at: new Date().toISOString() };
    if (permissions) updates.permissions = JSON.stringify(permissions);
    if (status) updates.status = status;

    await dbRaw(
      `UPDATE sub_admins SET ${Object.keys(updates).map((k, i) => `${k} = $${i + 1}`).join(', ')} WHERE id = $${Object.keys(updates).length + 1}`,
      [...Object.values(updates), subAdminId]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Sub-admins PATCH error:', error);
    return NextResponse.json({ success: false, error: 'Failed to update sub-admin' }, { status: 500 });
  }
}

// DELETE — Remove a sub-admin
export async function DELETE(request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Super admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const subAdminId = searchParams.get('id');
    if (!subAdminId) {
      return NextResponse.json({ success: false, error: 'Sub-admin ID required' }, { status: 400 });
    }

    // Get sub-admin info to also deactivate user account
    const { data: subAdmin } = await dbQuery('sub_admins', { filter: { id: subAdminId }, limit: 1 });
    if (subAdmin?.length > 0 && subAdmin[0].user_id) {
      await dbRaw(`UPDATE users SET status = 'suspended' WHERE id = $1`, [subAdmin[0].user_id]);
    }

    await dbRaw(`DELETE FROM sub_admins WHERE id = $1`, [subAdminId]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Sub-admins DELETE error:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete sub-admin' }, { status: 500 });
  }
}
