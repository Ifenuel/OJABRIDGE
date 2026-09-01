import { NextResponse } from 'next/server';
import { hashPassword, sanitizeInput, validateEmail, validatePasswordStrength } from '@/lib/auth';
import { dbInsert, dbQuery, dbRaw, isDatabaseConnected } from '@/lib/db';
import { getUserFromRequest, requireRole } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/create-admin
 * Super admin creates a sub-admin account directly (no registration needed).
 * Body: { name, email, phone, password, permissions: string[] }
 */
export async function POST(request) {
  try {
    const user = await getUserFromRequest(request);
    const auth = requireRole(user, 'admin');
    if (!auth.authorized) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    if (!isDatabaseConnected()) {
      return NextResponse.json({ success: false, error: 'Database not connected' }, { status: 503 });
    }

    // Check if requester is super admin
    const superCheck = await dbQuery('admin_roles', { filter: { admin_id: user.id, is_super_admin: true } });
    const isSuperAdmin = superCheck.data && superCheck.data.length > 0;
    // The original admin account is also super admin
    const originalAdmin = user.email === 'admin@ojabridge.dev';

    if (!isSuperAdmin && !originalAdmin) {
      return NextResponse.json({ success: false, error: 'Only super admins can create sub-admin accounts' }, { status: 403 });
    }

    const body = await request.json();
    const { name, email, phone, password, permissions } = body;

    // Validation
    const errors = [];
    const cleanName = sanitizeInput(name);
    const cleanEmail = sanitizeInput(email);

    if (!cleanName || cleanName.length < 2) errors.push('Name must be at least 2 characters');
    if (!cleanEmail || !validateEmail(cleanEmail)) errors.push('Valid email is required');
    if (!password || password.length < 8) errors.push('Password must be at least 8 characters');
    if (!Array.isArray(permissions)) errors.push('Permissions must be an array');

    if (errors.length > 0) {
      return NextResponse.json({ success: false, errors }, { status: 400 });
    }

    // Check if email already exists
    const existing = await dbQuery('users', { filter: { email: cleanEmail.toLowerCase() } });
    if (existing.data && existing.data.length > 0) {
      return NextResponse.json({ success: false, errors: ['An account with this email already exists'] }, { status: 409 });
    }

    // Create the admin user
    const passwordHash = await hashPassword(password);
    const { data: newUser, error: userError } = await dbInsert('users', {
      email: cleanEmail.toLowerCase(),
      password_hash: passwordHash,
      name: cleanName,
      role: 'admin',
      phone: phone || null,
      status: 'active',
      email_verified: true,
      country: 'NG',
      currency: 'NGN',
    });

    if (userError) {
      console.error('Admin user creation error:', userError);
      return NextResponse.json({ success: false, errors: ['Failed to create admin account'] }, { status: 500 });
    }

    // Assign permissions — permissions is TEXT[] in the schema
    const { error: roleError } = await dbInsert('admin_roles', {
      admin_id: newUser.id,
      permissions: Array.isArray(permissions) ? permissions : [],
      is_super_admin: false,
      granted_by: user.id,
    });

    if (roleError) {
      console.error('Admin role creation error:', roleError);
      // User created but role failed — still success
    }

    // Audit log
    await dbInsert('audit_logs', {
      user_id: user.id,
      action: 'admin.created',
      entity_type: 'user',
      entity_id: newUser.id,
      new_data: { name: cleanName, email: cleanEmail, permissions: permissions || [] },
      created_at: new Date().toISOString(),
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      message: `Sub-admin account created for ${cleanEmail}`,
      user: { id: newUser.id, name: cleanName, email: cleanEmail, permissions },
    }, { status: 201 });

  } catch (error) {
    console.error('Create admin error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
