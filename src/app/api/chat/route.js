import { NextResponse } from 'next/server';
import { dbQuery, dbInsert, dbRaw, isDatabaseConnected } from '@/lib/db';
import { OJABRIDGE_KB } from '@/lib/ai-knowledge';

export const dynamic = 'force-dynamic';

let tablesCreated = false;

async function ensureChatTables() {
  if (tablesCreated || !isDatabaseConnected()) return;
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
      role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
      content TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )`);
    await dbRaw(`CREATE INDEX IF NOT EXISTS idx_chat_messages_conv ON chat_messages(conversation_id, created_at)`);
    await dbRaw(`CREATE INDEX IF NOT EXISTS idx_chat_conv_user ON chat_conversations(user_id, created_at DESC)`);
    tablesCreated = true;
  } catch (error) {
    console.error('Chat table creation warning:', error.message);
    tablesCreated = true;
  }
}

export async function POST(request) {
  try {
    await ensureChatTables();

    const body = await request.json();
    const { message, conversationId } = body;

    if (!message || !message.trim()) {
      return NextResponse.json({ success: false, error: 'Message is required' }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error('OPENAI_API_KEY is not set');
      return NextResponse.json({ 
        success: false, 
        error: 'Our AI assistant is currently being set up. Please contact our support team at awoyoemmanuel12@gmail.com and we will help you right away!' 
      }, { status: 503 });
    }

    let convId = conversationId;
    let history = [];

    if (isDatabaseConnected()) {
      if (convId) {
        const { data: messages } = await dbQuery('chat_messages', {
          filter: { conversation_id: convId },
          order: { column: 'created_at', ascending: true },
          limit: 20,
        });
        history = (messages || []).map(m => ({ role: m.role, content: m.content }));
      } else {
        const { data: conv } = await dbInsert('chat_conversations', {
          created_at: new Date().toISOString(),
        });
        if (conv) convId = conv.id;
      }

      if (convId) {
        await dbInsert('chat_messages', {
          conversation_id: convId,
          role: 'user',
          content: message.trim(),
          created_at: new Date().toISOString(),
        });
      }
    }

    const messages = [
      { role: 'system', content: OJABRIDGE_KB },
      ...history,
      { role: 'user', content: message.trim() },
    ];

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
      console.error('OpenAI API error:', response.status, JSON.stringify(errorData).substring(0, 200));
      
      // Provide helpful fallback based on error type
      if (response.status === 401) {
        return NextResponse.json({ 
          success: false, 
          error: 'Our AI assistant is temporarily unavailable. Our team has been notified. In the meantime, please email us at awoyoemmanuel12@gmail.com and we will help you immediately!' 
        }, { status: 502 });
      }
      
      return NextResponse.json({ 
        success: false, 
        error: 'Our AI assistant is taking a short break! 😊 Please try again in a moment, or email us directly at awoyoemmanuel12@gmail.com — we are always happy to help!' 
      }, { status: 502 });
    }

    const data = await response.json();
    const aiReply = data.choices?.[0]?.message?.content || "I am here to help! Could you please rephrase your question? You can also reach our support team at awoyoemmanuel12@gmail.com for personalized assistance.";

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
    console.error('Chat API error:', error.message || error);
    return NextResponse.json({ 
      success: false, 
      error: 'Oops! Something went wrong on our end. 😔 Please try again, or email us at awoyoemmanuel12@gmail.com — we will get back to you quickly!' 
    }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    await ensureChatTables();
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversationId');
    if (!conversationId) return NextResponse.json({ success: true, messages: [] });
    if (!isDatabaseConnected()) return NextResponse.json({ success: true, messages: [], dbConnected: false });
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
