// Force dynamic — this route reads request.url at runtime
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { dbQuery } from '@/lib/db';

// GET — Poll for new messages (non-user messages)
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversationId');
    if (!conversationId) return NextResponse.json({ success: true, messages: [] });

    const afterId = searchParams.get('after') || '';

    // Get only admin/support messages (not user messages)
    const { data: messages } = await dbQuery('chat_messages', {
      filter: { conversation_id: conversationId },
      order: { column: 'created_at', ascending: true },
      limit: 100,
    });

    // Return support/staff replies (either 'admin' or 'support' role) so the user widget
    // receives replies from any staff member, including Super Admins and assigned Sub Admins.
    let supportMessages = (messages || [])
      .filter(m => m.role === 'admin' || m.role === 'support')
      .map(m => ({
        id: m.id,
        role: 'support',
        content: m.content,
        senderName: m.sender_name,
        createdAt: m.created_at,
      }));

    // If client provided last message ID, only return newer messages after it
    if (afterId) {
      const idx = supportMessages.findIndex(m => String(m.id) === String(afterId));
      if (idx >= 0) supportMessages = supportMessages.slice(idx + 1);
    }

    return NextResponse.json({ success: true, messages: supportMessages });
  } catch (error) {
    console.error('Live chat poll error:', error);
    return NextResponse.json({ success: true, messages: [] });
  }
}
