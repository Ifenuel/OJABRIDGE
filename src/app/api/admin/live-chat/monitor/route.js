import { NextResponse } from 'next/server';
import { runLiveChatMonitorPass } from '@/lib/live-chat-monitor';
import { checkPermission } from '@/lib/permissions';

// This route must be dynamic because it reads the auth session from cookies.
export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/live-chat/monitor
 *
 * Trigger one live-chat monitoring pass and return what it saw.
 * Super admin only.
 */
export async function POST(request) {
  try {
    const { allowed, user } = await checkPermission(request, 'live-chats');
    if (!allowed) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    // Only super admin should be able to trigger manual monitoring runs.
    if (user.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Admin only' }, { status: 403 });
    }

    const result = await runLiveChatMonitorPass();
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error('[LIVE_CHAT_MONITOR_ROUTE] error:', error);
    return NextResponse.json({ success: false, error: 'Monitor pass failed' }, { status: 500 });
  }
}
