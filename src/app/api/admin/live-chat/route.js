import { NextResponse } from 'next/server';
import { dbQuery, dbInsert, dbRaw } from '@/lib/db';

// This route must be dynamic because it reads the auth session from cookies.
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
      // Get messages for a specific conversation.
      // Defend against DB hiccups here too so opening a conversation does not 500 the page.
      try {
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
      } catch (msgErr) {
        console.error('Admin live chat messages load error:', msgErr);
        return NextResponse.json({ success: false, error: 'Failed to load messages' }, { status: 500 });
      }
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
        (SELECT content FROM chat_messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message_direct,
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
      // The assigned_to column may contain either a sub_admins.id or a users.id,
      // so we resolve the authenticated user's user_id against both.
      whereClauses.push(`(c.assigned_to = $${params.length + 1} OR c.assigned_to = $${params.length + 2} OR (c.assigned_to IS NULL AND c.status = 'open'))`);
      params.push(user.id);
      params.push(user.id); // same user_id used for both lookups

      // When the UI asks for the 'unassigned' tab, narrow server-side to unassigned/open
      // so the inbox list is focused, but never exclude conversations that belong to this
      // role just because the UI tab key does not match their assignment state.
      if (status === 'unassigned') {
        whereClauses.push(`c.assigned_to IS NULL`);
      }
    } else {
      // Any other authorized user with live-chats permission (defensive) — no conversations.
      whereClauses.push(`FALSE`);
    }

    const whereSql = whereClauses.length > 0 ? ` WHERE ${whereClauses.join(' AND ')}` : '';
    const query = baseSql + whereSql + ` ORDER BY c.updated_at DESC`;

    let conversations = null;
    let dbError = null;
    try {
      const raw = await dbRaw(query, params);
      conversations = raw.data || raw || [];
      dbError = raw.error;
    } catch (e) {
      dbError = e;
    }

    if (dbError) {
      // Fallback only for super-admin path so an admin never sees an empty inbox on DB hiccup.
      if (isSuperAdmin) {
        try {
          const { data: convs } = await dbQuery('chat_conversations', {
            order: { column: 'updated_at', ascending: false },
            limit: 50,
          });
          return NextResponse.json({ success: true, conversations: convs || [] });
        } catch {}
      }
      return NextResponse.json({ success: false, error: 'Failed to load conversations' }, { status: 500 });
    }

    // Normalize the inbox payload so the client never throws on missing fields.
    // Resolve assigned_to_name if the SQL subquery did not catch it (e.g. when
    // assigned_to is stored as a users.id instead of a sub_admins.id).
    let normalized = (Array.isArray(conversations) ? conversations : [])
      .map(c => ({
        id: c.id,
        user_id: c.user_id,
        user_name: c.user_name || c.user_email || 'User',
        user_email: c.user_email || '',
        user_role: c.user_role || 'user',
        status: c.status || 'open',
        assigned_to: c.assigned_to || null,
        assigned_to_name: c.assigned_to_name || null,
        last_message: c.last_message || c.last_message_direct || null,
        last_sender: c.last_sender || null,
        message_count: typeof c.message_count === 'number' ? c.message_count : null,
        unread_count: typeof c.unread_count === 'number' ? c.unread_count : null,
        created_at: c.created_at || null,
        updated_at: c.updated_at || null,
      }));

    // Resolve assigned_to_name for any rows where the SQL subquery missed it
    for (const c of normalized) {
      if (!c.assigned_to_name && c.assigned_to) {
        try {
          const { data: sa } = await dbQuery('sub_admins', { filter: { id: c.assigned_to }, limit: 1 });
          if (sa?.length) { c.assigned_to_name = sa[0].name || null; continue; }
        } catch {}
        try {
          const { data: u } = await dbQuery('users', { filter: { id: c.assigned_to }, limit: 1 });
          if (u?.length) { c.assigned_to_name = u[0].name || null; }
        } catch {}
      }
    }

    return NextResponse.json({ success: true, conversations: normalized });
  } catch (error) {
    console.error('Admin live chat GET error:', error);
    return NextResponse.json({ success: false, error: 'Failed to load conversations' }, { status: 500 });
  }
}

// Small client-safe helper so the page does not crash when the inbox API throws.
// Kept here to avoid adding another file for a narrow defensive concern.


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
    if (assignedTo !== undefined && assignedTo !== null) {
      // Accept either a sub_admins.id or a users.id for assignment.
      // Normalize to the users.id so the inbox filter (which uses the
      // authenticated user's JWT user_id) matches correctly.
      let resolvedUserId = assignedTo;
      let assignedToName = null;

      // If it looks like a sub_admins.id, resolve to the user_id.
      try {
        const { data: sa } = await dbQuery('sub_admins', { filter: { id: assignedTo }, limit: 1 });
        if (sa?.length) {
          resolvedUserId = sa[0].user_id || sa[0].id;
          assignedToName = sa[0].name || null;
        }
      } catch {
        // Not a sub_admins.id — treat as a user_id directly.
      }

      // If we still have a name to fetch (user_id path), try the users table.
      if (!assignedToName && resolvedUserId) {
        try {
          const { data: u } = await dbQuery('users', { filter: { id: resolvedUserId }, limit: 1 });
          if (u?.length) {
            assignedToName = u[0].name || null;
          }
        } catch {}
      }

      updates.assigned_to = resolvedUserId;
      if (assignedToName) updates.assigned_to_name = assignedToName;
    } else if (assignedTo === null) {
      updates.assigned_to = null;
      updates.assigned_to_name = null;
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
