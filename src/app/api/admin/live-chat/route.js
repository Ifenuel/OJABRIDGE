import { NextResponse } from 'next/server';
import { dbQuery, dbInsert, dbRaw } from '@/lib/db';

// This route is dynamic because it reads the auth session from cookies.
export const dynamic = 'force-dynamic';

// Check if user has permission (super admin always has all, sub_admin needs specific permission)
import { checkPermission } from '@/lib/permissions';

// GET — Admin views all live chat conversations or messages in a specific conversation
export async function GET(request) {
  try {
    const { allowed, user, error: permError } = await checkPermission(request, 'live-chats');
    if (!allowed) {
      return NextResponse.json({ success: false, error: permError }, { status: 403 });
    }
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversationId');
    const status = searchParams.get('status') || 'all';

    if (conversationId) {
      // Get messages for a specific conversation
      const { data: messages } = await dbQuery('chat_messages', {
        filter: { conversation_id: conversationId },
        order: { column: 'created_at', ascending: true },
        limit: 1000,
      });

      return NextResponse.json({
        success: true,
        messages: (messages || []).map(m => ({
          id: m.id,
          role: m.role,
          content: m.content,
          senderName: m.sender_name,
          senderId: m.sender_id,
          createdAt: m.created_at,
        })),
      });
    }

    // Authorization model (backend-enforced, not UI-only):
    //   - Super Admin: sees ALL live-chat conversations.
    //   - Live Support Sub Admin: sees conversations assigned to them,
    //     plus unassigned/open incoming conversations they can pick up.
    const isSuperAdmin = user.role === 'admin';
    const isLiveSupportSubAdmin = user.role === 'sub_admin'
      && Array.isArray(user.permissions || [])
      && user.permissions.includes('live-chats');

    // Base query with message aggregates and assignment display info.
    const baseSql = `
      SELECT c.*,
        (SELECT ag.name FROM sub_admins ag WHERE ag.id = c.assigned_to LIMIT 1) as assigned_to_name,
        (SELECT content FROM chat_messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message,
        (SELECT sender_name FROM chat_messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_sender,
        (SELECT COUNT(*) FROM chat_messages WHERE conversation_id = c.id) as message_count,
        (SELECT COUNT(*) FROM chat_messages WHERE conversation_id = c.id AND role = 'user' AND created_at > COALESCE(
          (SELECT MAX(created_at) FROM chat_messages WHERE conversation_id = c.id AND role IN ('admin', 'support')), '1970-01-01'
        )) as unread_count
      FROM chat_conversations c
    `;

    let whereClauses = [];
    let params = [];

    if (isSuperAdmin) {
      // Super admin sees everything; only narrow by explicit status filter.
      if (status !== 'all') {
        whereClauses.push(`c.status = $${params.length + 1}`);
        params.push(status);
      }
    } else if (isLiveSupportSubAdmin) {
      // Live Support sub admin sees:
      //   1) conversations assigned to them, and
      //   2) unassigned/open conversations they can pick up.
      whereClauses.push(`(c.assigned_to = $${params.length + 1} OR (c.assigned_to IS NULL AND c.status = 'open'))`);
      params.push(user.id);

      if (status !== 'all') {
        const statusParamIndex = params.length + 1;
        whereClauses.push(`c.status = $${statusParamIndex}`);
        params.push(status);
      }
    } else {
      // Any other authorized user with live-chats permission (defensive) — no conversations.
      whereClauses.push(`FALSE`);
    }

    const whereSql = whereClauses.length > 0 ? ` WHERE ${whereClauses.join(' AND ')}` : '';
    const query = baseSql + whereSql + ` ORDER BY c.updated_at DESC`;

    const { data: conversations, error } = await dbRaw(query, params);
    if (error) {
      // Fallback only for super-admin path so an admin never sees an empty inbox on DB hiccup.
      if (isSuperAdmin) {
        const { data: convs } = await dbQuery('chat_conversations', {
          order: { column: 'updated_at', ascending: false },
          limit: 50,
        });
        return NextResponse.json({ success: true, conversations: convs || [] });
      }
      return NextResponse.json({ success: false, error: 'Failed to load conversations' }, { status: 500 });
    }

    return NextResponse.json({ success: true, conversations: conversations || [] });
  } catch (error) {
    console.error('Admin live chat GET error:', error);
    return NextResponse.json({ success: false, error: 'Failed to load conversations' }, { status: 500 });
  }
}

// POST — Admin sends a reply to a conversation
export const POST = async (request) => {
  try {
    const { allowed, user, error: permError } = await checkPermission(request, 'live-chats');
    if (!allowed) {
      return NextResponse.json({ success: false, error: permError }, { status: 403 });
    }

    const { conversationId, message } = await request.json();
    if (!conversationId || !message?.trim()) {
      return NextResponse.json({ success: false, error: 'Conversation ID and message required' }, { status: 400 });
    }

    const adminId = user.id;
    const adminName = user.name || 'Support Team';

    // Support-side replies use a single canonical support message role ('support')
    // so the polling client and the user widget can treat all staff replies uniformly.
    // This works for customer, vendor, or retailer conversations — no role-based blocking
    // on the support side.
    const { data: msg, error } = await dbInsert('chat_messages', {
      conversation_id: conversationId,
      sender_id: adminId,
      sender_name: adminName,
      role: 'support',
      content: message.trim(),
      created_at: new Date().toISOString(),
    });

    if (error) throw error;

    // Update conversation timestamp
    await dbRaw(`UPDATE chat_conversations SET updated_at = NOW() WHERE id = $1`, [conversationId]);

    return NextResponse.json({ success: true, message: msg });
  } catch (error) {
    console.error('Admin live chat POST error:', error);
    return NextResponse.json({ success: false, error: 'Failed to send message' }, { status: 500 });
  }
}

// PATCH — Update conversation status (assign, close, reopen)
export async function PATCH(request) {
  try {
    const { allowed, user, error: permError } = await checkPermission(request, 'live-chats');
    if (!allowed) {
      return NextResponse.json({ success: false, error: permError }, { status: 403 });
    }

    const { conversationId, status, assignedTo } = await request.json();
    if (!conversationId) {
      return NextResponse.json({ success: false, error: 'Conversation ID required' }, { status: 400 });
    }

    const updates = { updated_at: new Date().toISOString() };
    if (status) updates.status = status;
    if (assignedTo !== undefined) {
      updates.assigned_to = assignedTo;
      // Persist the assigned agent name so the inbox and audit trail stay consistent
      // even if the sub-admin record is later changed or deactivated.
      if (typeof assignedTo === 'string' && assignedTo) {
        try {
          const { data: sa } = await dbQuery('sub_admins', { filter: { id: assignedTo }, limit: 1 });
          if (sa?.length && sa[0]?.name) {
            updates.assigned_to_name = sa[0].name;
          }
        } catch {}
      }
    }

    await dbRaw(
      `UPDATE chat_conversations SET ${Object.keys(updates).map((k, i) => `${k} = $${i + 1}`).join(', ')} WHERE id = $${Object.keys(updates).length + 1}`,
      [...Object.values(updates), conversationId]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin live chat PATCH error:', error);
    return NextResponse.json({ success: false, error: 'Failed to update conversation' }, { status: 500 });
  }
}
