import { NextResponse } from 'next/server';
import { dbQuery, dbRaw, isDatabaseConnected } from '@/lib/db';
import { getUserFromRequest, requireRole } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/chats — Admin views all chat conversations
 * GET /api/admin/chats?conversationId=xxx — View messages in a conversation
 */
export async function GET(request) {
  try {
    const user = await getUserFromRequest(request);
    const auth = requireRole(user, 'admin');
    if (!auth.authorized) return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });

    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversationId');

    if (!isDatabaseConnected()) {
      return NextResponse.json({ success: true, conversations: [], messages: [], dbConnected: false });
    }

    // If conversationId provided, return messages
    if (conversationId) {
      // Ensure tables exist
      try {
        await dbRaw(`CREATE TABLE IF NOT EXISTS chat_conversations (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID REFERENCES users(id) ON DELETE SET NULL,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        )`);
        await dbRaw(`CREATE TABLE IF NOT EXISTS chat_messages (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          conversation_id UUID REFERENCES chat_conversations(id) ON DELETE CASCADE,
          role VARCHAR(20) NOT NULL,
          content TEXT NOT NULL,
          image_url TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW()
        )`);
      } catch {}

      const { data: messages, error } = await dbQuery('chat_messages', {
        filter: { conversation_id: conversationId },
        order: { column: 'created_at', ascending: true },
        limit: 100,
      });
      if (error) return NextResponse.json({ success: false, error }, { status: 500 });
      return NextResponse.json({ success: true, messages: messages || [] });
    }

    // List all conversations with message count
    try {
      await dbRaw(`CREATE TABLE IF NOT EXISTS chat_conversations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )`);
      await dbRaw(`CREATE TABLE IF NOT EXISTS chat_messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        conversation_id UUID REFERENCES chat_conversations(id) ON DELETE CASCADE,
        role VARCHAR(20) NOT NULL,
        content TEXT NOT NULL,
        image_url TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )`);
    } catch {}

    const { data: conversations, error } = await dbRaw(`
      SELECT 
        c.id, c.created_at, c.updated_at,
        COUNT(m.id)::int as message_count,
        MAX(m.created_at) as last_message_at
      FROM chat_conversations c
      LEFT JOIN chat_messages m ON c.id = m.conversation_id
      GROUP BY c.id
      ORDER BY last_message_at DESC NULLS LAST, c.created_at DESC
      LIMIT 100
    `);

    if (error) return NextResponse.json({ success: false, error }, { status: 500 });
    return NextResponse.json({ success: true, conversations: conversations || [] });
  } catch (error) {
    console.error('Admin chats API error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
