import { NextResponse } from 'next/server';
import { dbQuery, dbInsert, dbRaw, isDatabaseConnected } from '@/lib/db';
import { OJABRIDGE_KB } from '@/lib/ai-knowledge';

export const dynamic = 'force-dynamic';

// Simple in-memory conversation cache (per-request, resets on cold start)
const conversationCache = new Map();

/**
 * POST /api/chat — Send a message and get AI response
 * Body: { message, conversationId? }
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { message, conversationId } = body;

    if (!message || !message.trim()) {
      return NextResponse.json({ success: false, error: 'Message is required' }, { status: 400 });
    }

    const trimmedMessage = message.trim();

    // Validate OpenAI key exists
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ 
        success: false, 
        error: 'AI service is not configured. Please contact support at awoyoemmanuel12@gmail.com' 
      }, { status: 503 });
    }

    // Get or create conversation
    let convId = conversationId;
    let history = [];

    if (isDatabaseConnected()) {
      if (convId) {
        // Load existing conversation history
        const { data: messages } = await dbQuery('chat_messages', {
          filter: { conversation_id: convId },
          order: { column: 'created_at', ascending: true },
          limit: 20,
        });
        history = (messages || []).map(m => ({
          role: m.role,
          content: m.content,
        }));
      } else {
        // Create new conversation
        const { data: conv } = await dbInsert('chat_conversations', {
          created_at: new Date().toISOString(),
        });
        if (conv) convId = conv.id;
      }

      // Save user message
      if (convId) {
        await dbInsert('chat_messages', {
          conversation_id: convId,
          role: 'user',
          content: trimmedMessage,
          created_at: new Date().toISOString(),
        });
      }
    }

    // Build messages for OpenAI
    const messages = [
      { role: 'system', content: OJABRIDGE_KB },
      ...history,
      { role: 'user', content: trimmedMessage },
    ];

    // Call OpenAI
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages,
        max_tokens: 800,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('OpenAI error:', response.status, errorData);
      return NextResponse.json({ 
        success: false, 
        error: 'AI service is temporarily unavailable. Please try again or contact support at awoyoemmanuel12@gmail.com' 
      }, { status: 502 });
    }

    const data = await response.json();
    const aiReply = data.choices?.[0]?.message?.content || 'I apologize, but I could not generate a response. Please try again or contact support at awoyoemmanuel12@gmail.com';

    // Save AI response to database
    if (isDatabaseConnected() && convId) {
      await dbInsert('chat_messages', {
        conversation_id: convId,
        role: 'assistant',
        content: aiReply,
        created_at: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      success: true,
      reply: aiReply,
      conversationId: convId,
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Something went wrong. Please try again or contact support at awoyoemmanuel12@gmail.com' 
    }, { status: 500 });
  }
}

/**
 * GET /api/chat?conversationId=xxx — Get conversation history
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversationId');

    if (!conversationId) {
      return NextResponse.json({ success: true, messages: [] });
    }

    if (!isDatabaseConnected()) {
      return NextResponse.json({ success: true, messages: [], dbConnected: false });
    }

    const { data: messages, error } = await dbQuery('chat_messages', {
      filter: { conversation_id: conversationId },
      order: { column: 'created_at', ascending: true },
      limit: 50,
    });

    if (error) return NextResponse.json({ success: false, error }, { status: 500 });

    return NextResponse.json({ success: true, messages: messages || [] });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
