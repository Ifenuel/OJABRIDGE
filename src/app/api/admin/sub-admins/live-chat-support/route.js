import { NextResponse } from 'next/server';
import { dbQuery } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

// GET /api/admin/sub-admins/live-chat-support — Active sub-admins with live-chats permission
// Used by the Admin Live Chat Assign-to control.
export async function GET(request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Super admin access required' }, { status: 403 });
    }

    const { data: saList, error } = await dbQuery('sub_admins', {
      filter: { status: 'active' },
      order: { column: 'name', ascending: true },
    });

    if (error) throw error;

    const liveChatSupport = (saList || [])
      .filter(sa => {
        try {
          const perms = Array.isArray(sa.permissions) ? sa.permissions : (typeof sa.permissions === 'string' ? JSON.parse(sa.permissions) : []);
          return Array.isArray(perms) && perms.includes('live-chats');
        } catch {
          return false;
        }
      })
      .map(sa => ({
        id: sa.id,
        userId: sa.user_id,
        name: sa.name,
        email: sa.email,
      }));

    return NextResponse.json({ success: true, subAdmins: liveChatSupport });
  } catch (error) {
    console.error('Sub-admins live-chat-support GET error:', error);
    return NextResponse.json({ success: false, error: 'Failed to load live chat support agents' }, { status: 500 });
  }
}
