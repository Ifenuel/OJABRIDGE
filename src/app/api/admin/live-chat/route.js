import { NextResponse } from 'next/server';
import { dbQuery, dbInsert, dbRaw } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

// Check if user has permission (super admin always has all, sub_admin needs specific permission)
async function checkPermission(request, requiredPermission) {
  const user = await getUserFromRequest(request);
  if (!user) return { allowed: false, error: 'Authentication required' };
  if (user.role === 'admin') return { allowed: true, user };
  if (user.role === 'sub_admin') {
    // Load permissions from sub_admins table
    const { data } = await dbQuery('sub_admins', { filter: { user_id: user.id }, limit: 1 });
    const perms = data?.[0]?.permissions || [];
    const permList = typeof perms === 'string' ? JSON.parse(perms) : perms;
    if (permList.includes(requiredPermission)) return { allowed: true, user };
    return { allowed: false, error: 'Permission denied' };
  }
  return { allowed: false, error: 'Admin access required' };
}

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
        limit: 100,
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

    // List all conversations with last message
    let query = `
      SELECT c.*, 
        (SELECT content FROM chat_messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message,
        (SELECT sender_name FROM chat_messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_sender,
        (SELECT COUNT(*) FROM chat_messages WHERE conversation_id = c.id) as message_count,
        (SELECT COUNT(*) FROM chat_messages WHERE conversation_id = c.id AND role = 'user' AND created_at > COALESCE(
          (SELECT MAX(created_at) FROM chat_messages WHERE conversation_id = c.id AND role IN ('admin', 'support')), '1970-01-01'
        )) as unread_count
      FROM chat_conversations c
    `;

    const params = [];
    if (status !== 'all') {
      query += ` WHERE c.status = $1`;
      params.push(status);
    }

    query += ` ORDER BY c.updated_at DESC`;

    const { data: conversations, error } = await dbRaw(query, params);
    if (error) {
      // Fallback: try without advanced query
      const { data: convs } = await dbQuery('chat_conversations', {
        order: { column: 'updated_at', ascending: false },
        limit: 50,
      });
      return NextResponse.json({ success: true, conversations: convs || [] });
    }

    return NextResponse.json({ success: true, conversations: conversations || [] });
  } catch (error) {
    console.error('Admin live chat GET error:', error);
    return NextResponse.json({ success: false, error: 'Failed to load conversations' }, { status: 500 });
  }
}

// POST — Admin sends a reply to a conversation
export async function POST(request) {
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

    // Save admin message
    const { data: msg, error } = await dbInsert('chat_messages', {
      conversation_id: conversationId,
      sender_id: adminId,
      sender_name: adminName,
      role: 'admin',
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
    if (assignedTo !== undefined) updates.assigned_to = assignedTo;

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
