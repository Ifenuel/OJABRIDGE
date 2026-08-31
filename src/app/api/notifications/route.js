import { NextResponse } from 'next/server';
import { dbQuery, dbRaw, isDatabaseConnected } from '@/lib/db';
import { getUserFromRequest, requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * GET /api/notifications — Get user notifications
 * PATCH /api/notifications — Mark notifications as read
 */
export async function GET(request) {
  try {
    const user = await getUserFromRequest(request);
    const auth = requireAuth(user);
    if (!auth.authorized) return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });

    if (!isDatabaseConnected()) {
      return NextResponse.json({ success: true, notifications: [], unreadCount: 0, dbConnected: false });
    }

    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get('unreadOnly') === 'true';

    let filter = { user_id: user.id };
    if (unreadOnly) filter.is_read = false;

    const { data: notifications, error } = await dbQuery('notifications', {
      filter,
      order: { column: 'created_at', ascending: false },
      limit: 50,
    });

    if (error) return NextResponse.json({ success: false, error }, { status: 500 });

    const unreadCount = (notifications || []).filter(n => !n.is_read).length;

    return NextResponse.json({ success: true, notifications: notifications || [], unreadCount, dbConnected: true });
  } catch (error) {
    console.error('Notifications API error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const user = await getUserFromRequest(request);
    const auth = requireAuth(user);
    if (!auth.authorized) return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });

    const body = await request.json();
    const { notificationIds, markAllRead } = body;

    if (!isDatabaseConnected()) {
      return NextResponse.json({ success: true, message: 'No database connected' });
    }

    if (markAllRead) {
      await dbRaw(
        `UPDATE notifications SET is_read = true, read_at = NOW() WHERE user_id = $1 AND is_read = false`,
        [user.id]
      );
    } else if (notificationIds && notificationIds.length > 0) {
      const placeholders = notificationIds.map((_, i) => `$${i + 2}`).join(', ');
      await dbRaw(
        `UPDATE notifications SET is_read = true, read_at = NOW() WHERE user_id = $1 AND id IN (${placeholders})`,
        [user.id, ...notificationIds]
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Notifications update error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
