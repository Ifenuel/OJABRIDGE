import { NextResponse } from 'next/server';
import { dbQuery, dbInsert, dbRaw } from '@/lib/db';

// POST — Send a message from customer
export async function POST(request) {
  try {
    const { message, conversationId, clientUser } = await request.json();
    if (!message?.trim()) return NextResponse.json({ success: false, error: 'Message is required' }, { status: 400 });

    const userId = clientUser?.id;
    const userRole = clientUser?.role || 'customer';
    const userName = clientUser?.name || 'Guest';
    const userEmail = clientUser?.email || '';

    // Ensure tables exist
    await dbRaw(`CREATE TABLE IF NOT EXISTS chat_conversations (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID,
      user_name VARCHAR(255),
      user_email VARCHAR(255),
      user_role VARCHAR(50) DEFAULT 'customer',
      assigned_to UUID,
      status VARCHAR(50) DEFAULT 'open',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )`);

    await dbRaw(`CREATE TABLE IF NOT EXISTS chat_messages (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      conversation_id UUID REFERENCES chat_conversations(id) ON DELETE CASCADE,
      sender_id UUID,
      sender_name VARCHAR(255),
      role VARCHAR(50) NOT NULL,
      content TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )`);

    // Add columns if they don't exist (safe migration)
    try { await dbRaw(`ALTER TABLE chat_conversations ADD COLUMN IF NOT EXISTS user_name VARCHAR(255)`); } catch {}
    try { await dbRaw(`ALTER TABLE chat_conversations ADD COLUMN IF NOT EXISTS user_email VARCHAR(255)`); } catch {}
    try { await dbRaw(`ALTER TABLE chat_conversations ADD COLUMN IF NOT EXISTS user_role VARCHAR(50) DEFAULT 'customer'`); } catch {}
    try { await dbRaw(`ALTER TABLE chat_conversations ADD COLUMN IF NOT EXISTS assigned_to UUID`); } catch {}
    try { await dbRaw(`ALTER TABLE chat_conversations ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'open'`); } catch {}
    try { await dbRaw(`ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS sender_id UUID`); } catch {}
    try { await dbRaw(`ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS sender_name VARCHAR(255)`); } catch {}

    let convId = conversationId;

    // Find or create conversation
    if (!convId && userId) {
      const { data: existing } = await dbQuery('chat_conversations', {
        filter: { user_id: userId, status: 'open' },
        order: { column: 'updated_at', ascending: false },
        limit: 1
      });
      if (existing?.length > 0) convId = existing[0].id;
    }

    if (!convId) {
      const { data: conv } = await dbInsert('chat_conversations', {
        user_id: userId,
        user_name: userName,
        user_email: userEmail,
        user_role: userRole,
        status: 'open',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      if (conv) convId = conv.id;
    }

    if (!convId) return NextResponse.json({ success: false, error: 'Could not create conversation' }, { status: 500 });

    // Save user message
    const userMsg = {
      conversation_id: convId,
      sender_id: userId,
      sender_name: userName,
      role: 'user',
      content: message.trim(),
      created_at: new Date().toISOString(),
    };
    await dbInsert('chat_messages', userMsg);

    // Update conversation timestamp
    await dbRaw(`UPDATE chat_conversations SET updated_at = NOW() WHERE id = $1`, [convId]);

    return NextResponse.json({ success: true, conversationId: convId });
  } catch (error) {
    console.error('Live chat POST error:', error);
    return NextResponse.json({ success: false, error: 'Failed to send message' }, { status: 500 });
  }
}

// GET — Load conversation history
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const clientUserId = searchParams.get('clientUserId');

    if (!clientUserId) return NextResponse.json({ success: true, messages: [], conversationId: null });

    // Find user's open conversation
    const { data: convs } = await dbQuery('chat_conversations', {
      filter: { user_id: clientUserId },
      order: { column: 'updated_at', ascending: false },
      limit: 1,
    });

    if (!convs?.length) return NextResponse.json({ success: true, messages: [], conversationId: null });

    const convId = convs[0].id;

    // Load messages
    const { data: messages } = await dbQuery('chat_messages', {
      filter: { conversation_id: convId },
      order: { column: 'created_at', ascending: true },
      limit: 50,
    });

    const formatted = (messages || []).map(m => ({
      id: m.id,
      role: m.role === 'admin' || m.role === 'support' ? 'support' : m.role,
      content: m.content,
      senderName: m.sender_name,
      createdAt: m.created_at,
    }));

    return NextResponse.json({ success: true, messages: formatted, conversationId: convId });
  } catch (error) {
    console.error('Live chat GET error:', error);
    return NextResponse.json({ success: false, error: 'Failed to load messages' }, { status: 500 });
  }
}
