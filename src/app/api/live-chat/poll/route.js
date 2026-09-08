import { NextResponse } from 'next/server';
import { dbQuery } from '@/lib/db';

// GET — Poll for new messages (non-user messages)
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversationId');
    if (!conversationId) return NextResponse.json({ success: true, messages: [] });

    // Get all messages — we'll filter client-side for new ones
    const { data: messages } = await dbQuery('chat_messages', {
      filter: { conversation_id: conversationId },
      order: { column: 'created_at', ascending: true },
      limit: 100,
    });

    // Return messages from support/admin (not from user)
    const supportMessages = (messages || [])
      .filter(m => m.role === 'admin' || m.role === 'support')
      .map(m => ({
        id: m.id,
        role: 'support',
        content: m.content,
        senderName: m.sender_name,
        createdAt: m.created_at,
      }));

    return NextResponse.json({ success: true, messages: supportMessages });
  } catch (error) {
    console.error('Live chat poll error:', error);
    return NextResponse.json({ success: true, messages: [] });
  }
}
