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
      image_url TEXT,
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

/**
 * Detect user emotion from message text
 */
function detectEmotion(message) {
  const msg = message.toLowerCase();
  if (/frustrated|angry|annoyed|terrible|worst|hate|furious|disgusted|scammed|stolen|fraud|ridiculous|unacceptable|waste|useless/i.test(msg)) return 'frustrated';
  if (/confused|confusing|don.t understand|not sure|unclear|what do you mean|how do i|i don.t get|lost/i.test(msg)) return 'confused';
  if (/worried|concerned|nervous|scared|afraid|anxious|panic|urgent|help me|emergency/i.test(msg)) return 'worried';
  if (/happy|great|awesome|love|amazing|perfect|excellent|fantastic|wonderful|best|thank|thanks/i.test(msg)) return 'happy';
  if (/sad|disappointed|unfortunate|sorry|unhappy|bad|poor|let down/i.test(msg)) return 'sad';
  return null;
}

/**
 * Get emotion-aware prefix for AI response
 */
function getEmotionPrefix(emotion) {
  switch (emotion) {
    case 'frustrated': return "I completely understand your frustration, and I sincerely apologize for the inconvenience. Let me help you resolve this right away.\n\n";
    case 'confused': return "No worries at all — let me clarify that for you in a simple way!\n\n";
    case 'worried': return "I understand your concern, and I want to help put your mind at ease. Let me walk you through this step by step.\n\n";
    case 'happy': return "That is wonderful to hear! 😊 I am so glad you are having a great experience!\n\n";
    case 'sad': return "I am sorry to hear that. 😔 Let me see how I can help make things better for you.\n\n";
    default: return "";
  }
}

/**
 * Smart fallback responses
 */
function getSmartFallback(message) {
  const msg = message.toLowerCase().trim();
  
  if (/^(hi|hello|hey|howdy|good\s*(morning|afternoon|evening)|yo|sup|greetings)/i.test(msg)) {
    const greetings = [
      "Hello there! 👋 Welcome to OjaBridge! I am your AI assistant and I am super excited to help you today! 😊\n\nWhat is your name? And how can I assist you with OjaBridge?",
      "Hey! 👋 Great to see you here! Welcome to OjaBridge! 🎉\n\nI am here to help with anything you need — whether it is about shopping, selling, payments, or anything else!\n\nWhat can I help you with today? 😊",
      "Hi there! 😊 Welcome to OjaBridge — Nigeria's trusted marketplace!\n\nI am your friendly AI assistant. Feel free to ask me anything!\n\nWhat brings you here today? 🛍️",
    ];
    return greetings[Math.floor(Math.random() * greetings.length)];
  }

  if (/^(my name is|i'm |i am |call me )/i.test(msg)) {
    const name = msg.replace(/^(my name is|i'm |i am |call me )/i, '').trim().split(' ')[0];
    const capName = name.charAt(0).toUpperCase() + name.slice(1);
    return `Nice to meet you, ${capName}! 😊 Great name!\n\nNow, how can I help you on OjaBridge? Are you looking to:\n\n🛍️ **Shop** for products?\n🏪 **Become a vendor** and start selling?\n📦 **Source products** as a retailer?\n❓ Or do you have a **question** about the platform?\n\nJust let me know! 💪`;
  }

  if (/how are you|how('s| is) it going/i.test(msg)) {
    return "I am doing great, thank you for asking! 😊 I am always happy and ready to help!\n\nHow can I assist you with OjaBridge today? 💪";
  }

  if (/what is ojabridge|tell me about ojabridge/i.test(msg)) {
    return "Great question! ✨\n\n**OjaBridge** is Nigeria's trusted e-commerce marketplace — the bridge between sellers and buyers! 🌉\n\nThe name comes from \"Oja\" (market in Yoruba) + \"Bridge\" — we connect:\n\n🛒 **Customers** — who browse and buy\n🏪 **Vendors** — who list and sell\n📦 **Retailers** — who source wholesale products\n\nAll payments are secure through Paystack, and every vendor is verified. Safe, transparent, and built for Nigeria! 🇳🇬\n\nWant to know more? 😊";
  }

  if (/register|sign up|create account|new account|join/i.test(msg)) {
    return "Awesome, welcome aboard! 🎉\n\nSigning up is super easy:\n\n1️⃣ Go to **ojabridge.vercel.app/register**\n2️⃣ Choose your role — Customer, Vendor, or Retailer\n3️⃣ Fill in your details\n4️⃣ Verify your email with the code we send\n5️⃣ Done! 🎉\n\n**Tip:** Choose **Vendor** to sell, **Retailer** to source wholesale, **Customer** to shop!\n\nNeed help? 😊";
  }

  if (/login|log in|sign in|forgot.*password/i.test(msg)) {
    return "Here is how to log in:\n\n1️⃣ Go to **ojabridge.vercel.app/login**\n2️⃣ Enter your email and password\n3️⃣ If not verified, enter the verification code\n4️⃣ You are in! 🎉\n\n**Forgot password?** Click \"Forgot Password\" on the login page.\n\nNeed anything else? 😊";
  }

  if (/payment|pay|checkout|buy|purchase|price/i.test(msg)) {
    return "Here is how payments work! 💳\n\n1️⃣ Add products to cart\n2️⃣ Go to checkout\n3️⃣ Pay via **Paystack** (card, bank transfer, USSD)\n4️⃣ Payment confirmed instantly!\n\nYour money is held safely until you confirm delivery. Protected by **Buyer Protection**! 🛡️\n\nAny questions? 😊";
  }

  if (/shipping|delivery|deliver|track|how long/i.test(msg)) {
    return "Shipping info! 🚚\n\n**Delivery times:**\n• Lagos: 1-3 business days\n• Other states: 3-7 business days\n\n**Track your order:**\nDashboard → My Orders → Click the order\n\nRates are set by each vendor. Need help? 😊";
  }

  if (/kyc|verification|verify|bvn|nin/i.test(msg) && !/login/i.test(msg)) {
    return "KYC verification steps! 📋\n\n1️⃣ **Personal Info** — Full name, date of birth\n2️⃣ **Identity** — BVN (*565*0#) and NIN (*346#)\n3️⃣ **Bank Account** — Bank name, account number, account name\n4️⃣ **Business** — Business name, RC number\n\nAdmin reviews within **1-3 business days**! ✅\n\nNeed help with any step? 😊";
  }

  if (/vendor|sell|become.*vendor|store/i.test(msg)) {
    return "Become a vendor! 🏪💪\n\n1️⃣ Register → Choose \"Vendor\"\n2️⃣ Complete KYC (BVN, NIN, bank, RC)\n3️⃣ Wait for approval (1-3 days)\n4️⃣ Set up your store\n5️⃣ Add products with images\n6️⃣ Start selling! 🎉\n\nReady? Visit ojabridge.vercel.app/register! 😊";
  }

  if (/refund|money back|return|cancel.*order/i.test(msg)) {
    return "Refund policy! 💰\n\n**Full refund if:**\n• Order not delivered on time\n• Item differs from description\n\n**How to request:**\nDashboard → Disputes → Create Dispute → Select order\n\nResolved within 3-5 business days. Refund in 5-10 days. 🔄\n\nNeed help? 😊";
  }

  if (/dispute|complaint|issue|problem|not.*working|broken|error/i.test(msg)) {
    return "Sorry about that! 😔 Let me help!\n\n**Create a dispute:**\n1️⃣ Dashboard → Disputes\n2️⃣ Click \"Create Dispute\"\n3️⃣ Select order + describe issue\n4️⃣ Resolved in 3-5 business days\n\n**Urgent?** Email **awoyoemmanuel12@gmail.com** 📧\n\nWhat issue are you facing? 😊";
  }

  if (/thank|thanks|thx|appreciate/i.test(msg)) {
    return "You are very welcome! 😊🎉\n\nIt was my pleasure helping you! Come back anytime you need help with OjaBridge! 💪🛍️";
  }

  if (/^(bye|goodbye|see you|later|take care)/i.test(msg)) {
    return "Goodbye! 👋😊 It was great chatting with you!\n\nCome back anytime! Have a wonderful day! ✨";
  }

  if (/^(help|what can you do|capabilities)/i.test(msg) && msg.length < 30) {
    return "I can help with! 😊\n\n🛍️ **Shopping** — Find products, orders, tracking\n🏪 **Selling** — Become a vendor\n📋 **KYC** — Verification help\n💳 **Payments** — How it works\n🚚 **Shipping** — Delivery info\n📸 **Screenshots** — Send me images of issues!\n❓ **Anything** about OjaBridge!\n\nJust ask! 💪";
  }

  return null;
}

export async function POST(request) {
  try {
    await ensureChatTables();

    const body = await request.json();
    const { message, conversationId, image } = body;

    if (!message && !image) {
      return NextResponse.json({ success: false, error: 'Message is required' }, { status: 400 });
    }

    const trimmedMessage = (message || '').trim();
    const emotion = detectEmotion(trimmedMessage);
    const emotionPrefix = getEmotionPrefix(emotion);

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
          content: trimmedMessage || (image ? '[Image attached]' : ''),
          image_url: image || null,
          created_at: new Date().toISOString(),
        });
      }
    }

    // Smart fallback for common patterns (only if no image)
    const fallbackReply = !image ? getSmartFallback(trimmedMessage) : null;

    // Try OpenAI
    const apiKey = process.env.OPENAI_API_KEY;
    let aiReply = fallbackReply ? emotionPrefix + fallbackReply : null;

    if (!aiReply && apiKey) {
      try {
        // Build message content — support both text and images
        let userContent;
        if (image) {
          // Image message — use OpenAI Vision
          userContent = [
            { type: 'text', text: trimmedMessage || 'Please analyze this image and tell me what you see. If it is a screenshot of an error, explain what went wrong and how to fix it. If it is related to OjaBridge, provide helpful guidance.' },
            { type: 'image_url', image_url: { url: image, detail: 'low' } },
          ];
        } else {
          userContent = trimmedMessage;
        }

        const messages = [
          { role: 'system', content: OJABRIDGE_KB + (emotion ? `\n\nThe user seems ${emotion}. Please respond with extra empathy and patience.` : '') },
          ...history,
          { role: 'user', content: userContent },
        ];

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: image ? 'gpt-4o-mini' : 'gpt-4o-mini',
            messages,
            max_tokens: 800,
            temperature: 0.7,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const rawReply = data.choices?.[0]?.message?.content;
          if (rawReply) {
            aiReply = emotionPrefix + rawReply;
          }
        } else {
          const errData = await response.json().catch(() => ({}));
          console.error('OpenAI error:', response.status, errData.error?.message || '');
        }
      } catch (err) {
        console.error('OpenAI fetch error:', err.message);
      }
    }

    // Final fallback
    if (!aiReply) {
      if (image) {
        aiReply = "I received your image! 📸 Unfortunately, I am having a small technical issue analyzing it right now.\n\nHere is what I suggest:\n• **Email the screenshot** to awoyoemmanuel12@gmail.com — our team will help immediately\n• **Describe the issue** in text and I will do my best to help!\n\nWhat is happening? I am here to help! 😊";
      } else {
        aiReply = "Thank you for your message! 😊\n\nI am having a small hiccup right now, but I do not want to leave you waiting!\n\n• **General questions:** Visit ojabridge.vercel.app/faq\n• **Support:** Email awoyoemmanuel12@gmail.com\n• **Register:** Go to ojabridge.vercel.app/register\n\nIs there anything specific I can help with? 💪";
      }
    }

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
      error: "Oops! Something went wrong on our end 😔 Please try again or email us at awoyoemmanuel12@gmail.com — we will help you right away!" 
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
