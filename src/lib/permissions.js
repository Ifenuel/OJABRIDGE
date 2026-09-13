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
    // Live chat is an admin-support feature. Sub-admins can only use it when
    // a super admin has explicitly assigned them to live support.
    if (requiredPermission === 'live-chats') {
      const { data } = await dbQuery('sub_admins', { filter: { user_id: user.id }, limit: 1 });
      const perms = data?.[0]?.permissions || [];
      const permList = typeof perms === 'string' ? JSON.parse(perms) : perms;
      if (permList.includes('live-chats')) {
        return { allowed: true, user: { ...user, permissions: permList } };
      }
      return { allowed: false, error: 'Live support access not assigned' };
    }

    // Other admin permissions are still loaded from the sub_admins table.
    const { data: otherData } = await dbQuery('sub_admins', { filter: { user_id: user.id }, limit: 1 });
    const perms = otherData?.[0]?.permissions || [];
    const permList = typeof perms === 'string' ? JSON.parse(perms) : perms;
    if (permList.includes(requiredPermission)) return { allowed: true, user };
    return { allowed: false, error: 'Permission denied' };
  }
  return { allowed: false, error: 'Admin access required' };
}
