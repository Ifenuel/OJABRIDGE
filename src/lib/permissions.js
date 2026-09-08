import { getUserFromRequest } from '@/lib/auth';
import { dbQuery } from '@/lib/db';

/**
 * checkPermission — Shared server-side authorization for admin APIs.
 *
 * - admin (super admin): allowed for everything
 * - sub_admin: allowed only when their stored permission list includes
 *   the required permission (loaded from the sub_admins table, never from
 *   client-sent data)
 * - everyone else (or anonymous): denied
 *
 * Usage:
 *   const { allowed, user, error } = await checkPermission(request, 'vendors');
 *   if (!allowed) return NextResponse.json({ success: false, error }, { status: 403 });
 */
export async function checkPermission(request, requiredPermission) {
  const user = await getUserFromRequest(request);
  if (!user) return { allowed: false, error: 'Authentication required' };
  if (user.role === 'admin') return { allowed: true, user };
  if (user.role === 'sub_admin') {
    // Load permissions from sub_admins table — the client can never grant itself access
    const { data } = await dbQuery('sub_admins', { filter: { user_id: user.id }, limit: 1 });
    const perms = data?.[0]?.permissions || [];
    const permList = typeof perms === 'string' ? JSON.parse(perms) : perms;
    if (permList.includes(requiredPermission)) return { allowed: true, user };
    return { allowed: false, error: 'Permission denied' };
  }
  return { allowed: false, error: 'Admin access required' };
}
