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

function detectEmotion(message) {
  const msg = message.toLowerCase();
  if (/frustrated|angry|annoyed|terrible|worst|hate|furious|disgusted|scammed|stolen|fraud|ridiculous|unacceptable|waste|useless|sick|ill|unwell|not feeling|headache|fever|pain/i.test(msg)) return 'frustrated';
  if (/confused|confusing|don.t understand|not sure|unclear|what do you mean|how do i|i don.t get|lost/i.test(msg)) return 'confused';
  if (/worried|concerned|nervous|scared|afraid|anxious|panic|urgent|help me|emergency/i.test(msg)) return 'worried';
  if (/happy|great|awesome|love|amazing|perfect|excellent|fantastic|wonderful|best|thank|thanks/i.test(msg)) return 'happy';
  if (/sad|disappointed|unfortunate|sorry|unhappy|bad|poor|let down/i.test(msg)) return 'sad';
  return null;
}

function getEmotionPrefix(emotion) {
  switch (emotion) {
    case 'frustrated': return "I completely understand your frustration, and I sincerely apologize for the inconvenience. Let me help you resolve this right away.\n\n";
    case 'confused': return "No worries at all — let me explain this in a simple way!\n\n";
    case 'worried': return "I understand your concern, and I want to help put your mind at ease. Let me walk you through this step by step.\n\n";
    case 'happy': return "That is wonderful to hear! I am so glad you are having a great experience!\n\n";
    case 'sad': return "I am sorry to hear that. Let me see how I can help make things better for you.\n\n";
    default: return "";
  }
}

/**
 * Smart fallback — only matches EXACT patterns, no false positives
 */
function getSmartFallback(message, userName) {
  const msg = message.toLowerCase().trim();
  const greeting = userName ? `Hello ${userName}!` : "Hello!";

  // EDGE CASES — Handle inappropriate/off-topic content FIRST

  // Insults, profanity, rude language
  if (/\b(stupid|idiot|dumb|fool|ugly|shut\s*up|damn|crap|hell|nonsense|useless|trash|garbage|废物|白痴|笨蛋)\b/i.test(msg) || msg.length < 2 && !/^(hi|yo|ok|no|yes|hiya)$/i.test(msg)) {
    return "I am sorry if something has frustrated you. I am here to help with OjaBridge and I want to make your experience better. Could you tell me what specific issue you are facing so I can assist you? 😊";
  }

  // Sexual, explicit, or inappropriate content
  if (/\b(sex|porn|nude|naked|sexy|dirty|adult|nsfw|hookup|onlyfans|fap|dick|pussy|boob|ass|penis|vagina|blowjob|orgasm|horny|lust|erotic)\b/i.test(msg)) {
    return "I am an AI assistant for OjaBridge and I am here to help with marketplace-related questions. Is there something about the platform I can help you with? For other matters, I would recommend speaking with a trusted person. 😊";
  }

  // Threats or harassment
  if (/\b(kill|murder|die|suicide|hurt|harm|bomb|shoot|attack|rape|molest)\b/i.test(msg)) {
    return "I take safety very seriously. If you are experiencing an issue, please email our support team at awoyoemmanuel12@gmail.com and they will help you right away. I am here to assist with OjaBridge platform questions. 😊";
  }

  // Jailbreak attempts
  if (/ignore\s+(your|all|previous|above)\s+(instructions|rules|prompt)|pretend\s+(you\s+are|to\s+be)|act\s+as\s+if|do\s+not\s+follow|bypass|override|system\s+prompt|you\s+are\s+now|forget\s+everything/i.test(msg)) {
    return "I am the OjaBridge AI assistant and I am here to help with platform-related questions. Is there something about OjaBridge I can help you with? 😊";
  }

  // Off-topic: politics, weather, sports, etc.
  if (/\b(president|government|election|politics|religion|god|allah|church|mosque|football|soccer|basketball|nba|epl|world\s+cup|weather|temperature|forecast|music|song|movie|netflix|tiktok|instagram|twitter|x\.com|facebook|whatsapp)\b/i.test(msg) && !/ojabridge|marketplace|shop|vendor|order|payment/i.test(msg)) {
    return "I am here to help with all things OjaBridge! 😊 Is there anything about the platform I can help you with? Whether it is shopping, selling, payments, or anything else — I am happy to assist!";
  }

  // Random gibberish — very short with no real words, or random characters
  if (msg.length < 3 && !/^(hi|yo|ok|no|yes|hey|sup|bye|lol|brb|omg)$/i.test(msg)) {
    return "It looks like that might have been a typo! 😊 I am the OjaBridge AI assistant — I can help you with shopping, selling, payments, KYC, and anything else on the platform. How can I help you today?";
  }

  // Very random long strings (no spaces, no real words)
  if (msg.length > 20 && !/\s/.test(msg) && !/ojabridge|register|login|payment|order|vendor|customer|ship|deliver|refund|kyc|bvn|nin|password|email|account|product|cart|checkout/i.test(msg)) {
    return "It looks like that might have been a typo! 😊 I am the OjaBridge AI assistant — I can help you with shopping, selling, payments, KYC, and anything else on the platform. How can I help you today?";
  }

  // Greetings — must start with a greeting word
  if (/^(hi|hello|hey|howdy|good\s*(morning|afternoon|evening)|yo|sup|greetings|hiya|howdy|wassup|whats up)/i.test(msg)) {
    return `${greeting} 👋 Welcome to OjaBridge!\n\nI am your AI assistant and I am here to help you with anything on the platform.\n\nWhat can I help you with today? 😊`;
  }

  // Name introduction — ONLY match "my name is [name]" pattern, NOT "I am [adjective]"
  const nameMatch = msg.match(/^my name is\s+([a-z]+)/i);
  if (nameMatch) {
    const name = nameMatch[1];
    const capName = name.charAt(0).toUpperCase() + name.slice(1);
    return `Nice to meet you, ${capName}! 😊\n\nHow can I help you on OjaBridge? Are you looking to:\n\n🛍️ **Shop** for products?\n🏪 **Become a vendor** and start selling?\n📦 **Source products** as a retailer?\n❓ Or do you have a **question** about the platform?\n\nJust let me know! 💪`;
  }

  // "I am sick/ill/not feeling well" — NOT a name, this is a health concern
  if (/^i('m|\s+am)\s+(sick|ill|not feeling|unwell|in pain|tired|exhausted)/i.test(msg)) {
    return "I am sorry to hear you are not feeling well! 😔 I hope you get better soon.\n\nWhile I am an AI assistant for OjaBridge and cannot provide medical advice, I can help you with anything related to the platform while you rest.\n\nIs there something specific about OjaBridge I can help you with? Or if you need a break, you can always email us at **awoyoemmanuel12@gmail.com** and we will get back to you when you are ready. 💪\n\nTake care of yourself! 🙏";
  }

  // How are you
  if (/^how are you|^how('s|\s+is)\s+it\s+going|^how\s+do\s+you\s+do|^what('s|\s+is)\s+up/i.test(msg)) {
    return "I am doing great, thank you for asking! 😊 I am always happy and ready to help!\n\nHow can I assist you with OjaBridge today? 💪";
  }

  // What is OjaBridge
  if (/^(what|tell me)\s+(is|about)\s+ojabridge/i.test(msg)) {
    return "Great question! ✨\n\n**OjaBridge** is Nigeria's trusted e-commerce marketplace — the bridge between sellers and buyers! 🌉\n\nThe name comes from \"Oja\" (market in Yoruba) + \"Bridge\" — we connect:\n\n🛒 **Customers** — who browse and buy\n🏪 **Vendors** — who list and sell\n📦 **Retailers** — who source wholesale products\n\nAll payments are secure through Paystack, and every vendor is verified. Safe, transparent, and built for Nigeria! 🇳🇬\n\nWant to know more? 😊";
  }

  // Register
  if (/^(how\s+do\s+i\s+)?(register|sign\s*up|create\s+account|new\s+account|join)/i.test(msg)) {
    return "Awesome, welcome aboard! 🎉\n\nSigning up is super easy:\n\n1️⃣ Go to **ojabridge.vercel.app/register**\n2️⃣ Choose your role — Customer, Vendor, or Retailer\n3️⃣ Fill in your details\n4️⃣ Verify your email with the code we send\n5️⃣ Done! 🎉\n\n**Tip:** Choose **Vendor** to sell, **Retailer** to source wholesale, **Customer** to shop!\n\nNeed help? 😊";
  }

  // Login
  if (/^(how\s+do\s+i\s+)?(login|log\s*in|sign\s*in|forgot.*password)/i.test(msg)) {
    return "Here is how to log in:\n\n1️⃣ Go to **ojabridge.vercel.app/login**\n2️⃣ Enter your email and password\n3️⃣ If not verified, enter the verification code\n4️⃣ You are in! 🎉\n\n**Forgot password?** Click \"Forgot Password\" on the login page.\n\nNeed anything else? 😊";
  }

  // Payment
  if (/^(how\s+do\s+)?(payment|pay|checkout|buy|purchase|price)/i.test(msg)) {
    return "Here is how payments work! 💳\n\n1️⃣ Add products to cart\n2️⃣ Go to checkout\n3️⃣ Pay via **Paystack** (card, bank transfer, USSD)\n4️⃣ Payment confirmed instantly!\n\nYour money is held safely until you confirm delivery. Protected by **Buyer Protection**! 🛡️\n\nAny questions? 😊";
  }

  // Shipping
  if (/^(how|what\s+about|tell\s+me\s+about|when)\s*(will|is|does|do|about)?\s*(my|the|delivery|shipping|track|ship)/i.test(msg) || /^(shipping|delivery|deliver|track|how\s+long)/i.test(msg)) {
    return "Shipping info! 🚚\n\n**Delivery times:**\n• Lagos: 1-3 business days\n• Other states: 3-7 business days\n\n**Track your order:**\nDashboard → My Orders → Click the order\n\nRates are set by each vendor. Need help? 😊";
  }

  // KYC
  if (/kyc|verification|verify|bvn|nin|identity/i.test(msg) && !/login/i.test(msg)) {
    return "KYC verification steps! 📋\n\n1️⃣ **Personal Info** — Full name, date of birth\n2️⃣ **Identity** — BVN (dial *565*0#) and NIN (dial *346#)\n3️⃣ **Bank Account** — Bank name, account number, account name\n4️⃣ **Business** — Business name, RC number\n\nAdmin reviews within **1-3 business days**! ✅\n\nNeed help with any step? 😊";
  }

  // Vendor
  if (/vendor|sell|become.*vendor|start.*sell|store/i.test(msg)) {
    return "Become a vendor! 🏪💪\n\n1️⃣ Register → Choose \"Vendor\"\n2️⃣ Complete KYC (BVN, NIN, bank, RC)\n3️⃣ Wait for approval (1-3 days)\n4️⃣ Set up your store\n5️⃣ Add products with images\n6️⃣ Start selling! 🎉\n\nReady? Visit **ojabridge.vercel.app/register**! 😊";
  }

  // Refund
  if (/refund|money\s+back|return|cancel.*order/i.test(msg)) {
    return "Refund policy! 💰\n\n**Full refund if:**\n• Order not delivered on time\n• Item differs from description\n\n**How to request:**\nDashboard → Disputes → Create Dispute → Select order\n\nResolved within 3-5 business days. Refund in 5-10 days. 🔄\n\nNeed help? 😊";
  }

  // Dispute
  if (/dispute|complaint|issue|problem|not.*working|broken|error/i.test(msg)) {
    return "Sorry about that! 😔 Let me help!\n\n**Create a dispute:**\n1️⃣ Dashboard → Disputes\n2️⃣ Click \"Create Dispute\"\n3️⃣ Select order + describe issue\n4️⃣ Resolved in 3-5 business days\n\n**Urgent?** Email **awoyoemmanuel12@gmail.com** 📧\n\nWhat issue are you facing? 😊";
  }

  // Thanks
  if (/thank|thanks|thx|appreciate|helpful/i.test(msg)) {
    return "You are very welcome! 😊\n\nIt was my pleasure helping you! Come back anytime you need help with OjaBridge! 💪";
  }

  // Bye
  if (/^(bye|goodbye|see you|later|take care)/i.test(msg)) {
    return "Goodbye! 👋😊 It was great chatting with you!\n\nCome back anytime! Have a wonderful day! ✨";
  }

  // Help
  if (/^(help|what can you do|capabilities)/i.test(msg) && msg.length < 30) {
    return "I can help with:\n\n🛍️ **Shopping** — Find products, orders, tracking\n🏪 **Selling** — Become a vendor\n📋 **KYC** — Verification help\n💳 **Payments** — How it works\n🚚 **Shipping** — Delivery info\n📸 **Screenshots** — Send me images of issues!\n❓ **Anything** about OjaBridge!\n\nJust ask! 💪";
  }

  return null;
}

export async function POST(request) {
  try {
    await ensureChatTables();

    const body = await request.json();
    const { message, conversationId, image, userName } = body;

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

    // Smart fallback (only for text, not images)
    const fallbackReply = !image ? getSmartFallback(trimmedMessage, userName) : null;

    // Try OpenAI
    const apiKey = process.env.OPENAI_API_KEY;
    let aiReply = fallbackReply ? emotionPrefix + fallbackReply : null;

    if (!aiReply && apiKey) {
      try {
        let userContent;
        if (image) {
          userContent = [
            { type: 'text', text: trimmedMessage || 'Please analyze this image. If it shows an error on the OjaBridge website, explain what went wrong and how to fix it. If it shows a page, help the user navigate. Always relate it back to OjaBridge.' },
            { type: 'image_url', image_url: { url: image, detail: 'low' } },
          ];
        } else {
          userContent = trimmedMessage;
        }

        // Build system prompt with user context
        let systemPrompt = OJABRIDGE_KB;
        if (userName) systemPrompt += `\n\nThe user's name is ${userName}. Greet them by name when appropriate.`;
        if (emotion) systemPrompt += `\n\nThe user seems ${emotion}. Please respond with extra empathy and patience.`;

        const messages = [
          { role: 'system', content: systemPrompt },
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
            model: 'gpt-4o-mini',
            messages,
            max_tokens: 800,
            temperature: 0.7,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const rawReply = data.choices?.[0]?.message?.content;
          if (rawReply) aiReply = emotionPrefix + rawReply;
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
        aiReply = "I received your image! Unfortunately, I am having a small technical issue analyzing it right now.\n\nHere is what I suggest:\n• **Email the screenshot** to awoyoemmanuel12@gmail.com — our team will help immediately\n• **Describe the issue** in text and I will do my best to help!\n\nWhat is happening? I am here to help! 😊";
      } else {
        aiReply = "Thank you for your message! I am having a small hiccup right now.\n\n• **General questions:** Visit ojabridge.vercel.app/faq\n• **Support:** Email awoyoemmanuel12@gmail.com\n• **Register:** Go to ojabridge.vercel.app/register\n\nIs there anything specific I can help with? 💪";
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
      error: "Oops! Something went wrong on our end. Please try again or email us at awoyoemmanuel12@gmail.com" 
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
