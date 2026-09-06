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

/**
 * Smart fallback responses for common greetings and questions
 * These work even when OpenAI is unavailable
 */
function getSmartFallback(message) {
  const msg = message.toLowerCase().trim();
  
  // Greetings
  if (/^(hi|hello|hey|howdy|good\s*(morning|afternoon|evening)|yo|sup|greetings)/i.test(msg)) {
    const greetings = [
      "Hello there! 👋 Welcome to OjaBridge! I am your AI assistant and I am super excited to help you today! 😊\n\nWhat is your name? And how can I assist you with OjaBridge?",
      "Hey! 👋 Great to see you here! Welcome to OjaBridge! 🎉\n\nI am here to help with anything you need — whether it is about shopping, selling, payments, or anything else on the platform!\n\nWhat can I help you with today? 😊",
      "Hi there! 😊 Welcome to OjaBridge — Nigeria's trusted marketplace!\n\nI am your friendly AI assistant. Feel free to ask me anything about the platform!\n\nWhat brings you here today? 🛍️",
    ];
    return greetings[Math.floor(Math.random() * greetings.length)];
  }

  // Name response
  if (/^(my name is|i'm |i am |call me )/i.test(msg)) {
    const name = msg.replace(/^(my name is|i'm |i am |call me )/i, '').trim();
    const firstName = name.split(' ')[0];
    return `Nice to meet you, ${firstName}! 😊 Great name!\n\nNow, how can I help you on OjaBridge? Are you looking to:\n\n🛍️ **Shop** for products?\n🏪 **Become a vendor** and start selling?\n📦 **Source products** as a retailer?\n❓ Or do you have a **question** about the platform?\n\nJust let me know! 💪`;
  }

  // How are you
  if (/how are you|how('s| is) it going|how do you do|what('s| is) up/i.test(msg)) {
    return "I am doing great, thank you for asking! 😊 I am always happy and ready to help!\n\nNow, how can I assist you with OjaBridge today? Are you looking to shop, sell, or do you have any questions about the platform? 💪";
  }

  // What is ojabridge
  if (/what is ojabridge|what('s| is) ojabridge|tell me about ojabridge|about ojabridge/i.test(msg)) {
    return "Great question! ✨\n\n**OjaBridge** is Nigeria's trusted e-commerce marketplace — think of it as the bridge between sellers and buyers! 🌉\n\nThe name comes from \"Oja\" (market in Yoruba) + \"Bridge\" — we connect:\n\n🛒 **Customers** — who browse and buy products\n🏪 **Vendors** — who list and sell products\n📦 **Retailers** — who source products at wholesale prices\n\nAll payments are secure through Paystack, and every vendor is verified before they can sell. It is safe, transparent, and built for Nigeria! 🇳🇬\n\nWould you like to know more about anything specific? 😊";
  }

  // Register / Sign up
  if (/register|sign up|create account|new account|join/i.test(msg)) {
    return "Awesome, welcome aboard! 🎉\n\nSigning up on OjaBridge is super easy! Here is how:\n\n1️⃣ Go to **ojabridge.vercel.app/register**\n2️⃣ Choose your role — Customer, Vendor, or Retailer\n3️⃣ Fill in your details (name, email, phone, password)\n4️⃣ Verify your email with the code we send you\n5️⃣ You are all set! 🎉\n\n**Tip:** If you want to sell products, choose **Vendor**. If you want to source wholesale products, choose **Retailer**. If you just want to buy, choose **Customer**!\n\nNeed help with anything else? 😊";
  }

  // Login
  if (/login|log in|sign in|already have account|existing account/i.test(msg)) {
    return "No problem! Here is how to log in:\n\n1️⃣ Go to **ojabridge.vercel.app/login**\n2️⃣ Enter your email and password\n3️⃣ If your email is not verified, enter the verification code we send you\n4️⃣ You are in! 🎉\n\n**Forgot your password?** Click \"Forgot Password\" on the login page and follow the steps.\n\nNeed help with anything else? 😊";
  }

  // Payment / Pay
  if (/payment|pay|checkout|buy|purchase|how much|price/i.test(msg)) {
    return "Great question about payments! 💳\n\nHere is how payments work on OjaBridge:\n\n1️⃣ Add products to your cart\n2️⃣ Go to checkout\n3️⃣ Pay securely via **Paystack** (card, bank transfer, or USSD)\n4️⃣ Your payment is confirmed instantly!\n\n**Security:** Your money is held safely by OjaBridge until you confirm delivery. If anything goes wrong, you are protected by our **Buyer Protection** policy! 🛡️\n\nPlatform commission is 10% — this is deducted before the vendor gets paid.\n\nAny other questions about payments? 😊";
  }

  // Shipping / Delivery
  if (/shipping|delivery|deliver|track|when will|how long/i.test(msg)) {
    return "Here is everything about shipping! 🚚\n\n**Delivery times:**\n• Lagos: 1-3 business days\n• Other states: 3-7 business days\n\n**How to track:**\n1️⃣ Go to your dashboard → My Orders\n2️⃣ Click on the order\n3️⃣ You will see the tracking status\n\n**Shipping rates** are set by each vendor, so they vary by store.\n\nNeed help with a specific order? 😊";
  }

  // KYC / Verification
  if (/kyc|verification|verify|verify.*vendor|verify.*retailer|bvn|nin|identity/i.test(msg) && !/login/i.test(msg)) {
    return "KYC verification is important for vendors and retailers! 📋\n\nHere is what you need:\n\n**Step 1:** Personal Info — Full name, date of birth\n**Step 2:** Identity — Both **BVN** (dial *565*0#) and **NIN** (dial *346#)\n**Step 3:** Bank Account — Select your bank, account number, account name\n**Step 4:** Business Info — Business name and RC number (from CAC)\n\nAfter you submit, our admin team reviews within **1-3 business days**. You will get a notification and email once approved! ✅\n\nNeed help with any specific step? 😊";
  }

  // Vendor / Sell
  if (/vendor|sell|sell.*product|start.*sell|become.*vendor|store/i.test(msg)) {
    return "Want to become a vendor? That is awesome! 🏪💪\n\nHere is how to get started:\n\n1️⃣ **Register** at ojabridge.vercel.app/register → Choose \"Vendor\"\n2️⃣ **Complete KYC** — BVN, NIN, bank account, RC number\n3️⃣ **Wait for approval** — Our team reviews within 1-3 days\n4️⃣ **Set up your store** — Name, description, logo\n5️⃣ **Add products** — Upload images, set prices, add descriptions\n6️⃣ **Start selling!** 🎉\n\nYou will receive payouts after each completed order (minus 10% platform commission).\n\nReady to start? Visit ojabridge.vercel.app/register now! 😊";
  }

  // Refund
  if (/refund|money back|return|cancel.*order/i.test(msg)) {
    return "We have got you covered with our refund policy! 💰\n\n**You can get a full refund if:**\n• Your order is not delivered within the estimated time\n• The item significantly differs from the description\n\n**Partial refund may apply for:**\n• Minor issues with the product\n\n**How to request:**\n1️⃣ Go to your dashboard → Disputes\n2️⃣ Create a dispute and select the order\n3️⃣ Describe the issue\n4️⃣ Our team resolves within 3-5 business days\n\nRefunds go back to your original payment method within 5-10 business days. 🔄\n\nNeed help with a specific refund? 😊";
  }

  // Dispute / Complaint
  if (/dispute|complaint|issue|problem|not.*working|broken/i.test(msg)) {
    return "Sorry to hear you are having an issue! 😔 We are here to help!\n\n**To create a dispute:**\n1️⃣ Go to your dashboard → Disputes\n2️⃣ Click \"Create Dispute\"\n3️⃣ Select the order and describe the issue\n4️⃣ Our admin team will review and resolve within 3-5 business days\n\n**For urgent issues**, you can also email us directly at **awoyoemmanuel12@gmail.com** and we will get back to you quickly! 📧\n\nWhat specific issue are you facing? I can guide you through the steps! 😊";
  }

  // Thanks / Thank you
  if (/thank|thanks|thx|appreciate|helpful/i.test(msg)) {
    return "You are very welcome! 😊🎉\n\nIt was my pleasure helping you! If you ever have more questions about OjaBridge, I am always here.\n\nHappy shopping/selling! 💪🛍️";
  }

  // Bye / Goodbye
  if (/^(bye|goodbye|see you|later|cya|take care)/i.test(msg)) {
    return "Goodbye! 👋😊 It was great chatting with you!\n\nCome back anytime you need help with OjaBridge. We are always here for you! 💪\n\nHave a wonderful day! ✨";
  }

  // Help
  if (/^(help|what can you do|what do you know|capabilities|features)/i.test(msg) && msg.length < 30) {
    return "I am happy to help! 😊 Here is what I can do:\n\n🛍️ **Shopping** — Help you find products, place orders, track deliveries\n🏪 **Selling** — Guide you through becoming a vendor\n📋 **KYC** — Help with verification process\n💳 **Payments** — Explain how payments and refunds work\n🚚 **Shipping** — Delivery times and tracking\n📦 **Disputes** — How to create and resolve disputes\n❓ **General** — Any question about OjaBridge!\n\nJust ask me anything! 💪";
  }

  return null; // No fallback match — will use OpenAI
}

export async function POST(request) {
  try {
    await ensureChatTables();

    const body = await request.json();
    const { message, conversationId } = body;

    if (!message || !message.trim()) {
      return NextResponse.json({ success: false, error: 'Message is required' }, { status: 400 });
    }

    const trimmedMessage = message.trim();

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
          content: trimmedMessage,
          created_at: new Date().toISOString(),
        });
      }
    }

    // Try smart fallback first for common patterns
    const fallbackReply = getSmartFallback(trimmedMessage);

    // Try OpenAI
    const apiKey = process.env.OPENAI_API_KEY;
    let aiReply = fallbackReply;

    if (!fallbackReply && apiKey) {
      try {
        const messages = [
          { role: 'system', content: OJABRIDGE_KB },
          ...history,
          { role: 'user', content: trimmedMessage },
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
          aiReply = data.choices?.[0]?.message?.content;
        } else {
          console.error('OpenAI error:', response.status);
          // Fall through to generic response below
        }
      } catch (err) {
        console.error('OpenAI fetch error:', err.message);
      }
    }

    // Final fallback if nothing worked
    if (!aiReply) {
      aiReply = "Thank you for your message! 😊\n\nI am having a small technical hiccup right now, but I do not want to leave you waiting!\n\nHere is what I can tell you:\n• **For general questions:** Visit ojabridge.vercel.app/faq\n• **For support:** Email us at awoyoemmanuel12@gmail.com\n• **To register:** Go to ojabridge.vercel.app/register\n\nIs there anything specific I can help you with? 💪";
    }

    // Save AI response
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
