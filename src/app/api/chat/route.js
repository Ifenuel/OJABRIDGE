import { NextResponse } from 'next/server';
import { dbQuery, dbInsert, dbRaw, isDatabaseConnected } from '@/lib/db';
import { OJABRIDGE_KB } from '@/lib/ai-knowledge';

export const dynamic = 'force-dynamic';

let tablesCreated = false;
const rateLimit = new Map();

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
  } catch (error) { tablesCreated = true; }
}

function detectEmotion(message) {
  const msg = message.toLowerCase();
  if (/frustrated|angry|annoyed|terrible|worst|hate|furious|scammed|fraud|ridiculous|sick|ill|unwell|not feeling|pain/i.test(msg)) return 'frustrated';
  if (/confused|confusing|don.t understand|not sure|unclear|what do you mean|how do i/i.test(msg)) return 'confused';
  if (/worried|concerned|nervous|scared|afraid|anxious|panic|urgent|help me|emergency/i.test(msg)) return 'worried';
  if (/happy|great|awesome|love|amazing|perfect|excellent|fantastic|wonderful|best|thank|thanks/i.test(msg)) return 'happy';
  if (/sad|disappointed|unfortunate|sorry|unhappy|bad|poor|let down/i.test(msg)) return 'sad';
  return null;
}

function getEmotionPrefix(emotion) {
  switch (emotion) {
    case 'frustrated': return "I am really sorry about this experience. You deserve better, and I want to help you resolve this right away.\n\n";
    case 'confused': return "No worries at all — let me break this down for you clearly!\n\n";
    case 'worried': return "I understand your concern. Let me help put your mind at ease.\n\n";
    case 'happy': return "That is wonderful to hear! I am so glad! 😊\n\n";
    case 'sad': return "I am sorry to hear that. Let me see how I can help make things right.\n\n";
    default: return "";
  }
}

const SAFE_LINKS = {
  faq: 'https://ojabridge.vercel.app/faq',
  support: 'https://ojabridge.vercel.app/support',
  disputes: 'https://ojabridge.vercel.app/account/disputes',
  orders: 'https://ojabridge.vercel.app/account/orders',
  register: 'https://ojabridge.vercel.app/register',
  login: 'https://ojabridge.vercel.app/login',
  shop: 'https://ojabridge.vercel.app/shop',
  contact: 'https://ojabridge.vercel.app/contact',
  about: 'https://ojabridge.vercel.app/about',
  howItWorks: 'https://ojabridge.vercel.app/how-it-works',
  kyc: 'https://ojabridge.vercel.app/vendor-dashboard/kyc',
};
const SUPPORT_EMAIL = 'awoyoemmanuel12@gmail.com';

function getSmartFallback(message, userName) {
  const msg = message.toLowerCase().trim();
  const greeting = userName ? `Hello ${userName}!` : "Hello!";

  // === REPORT A VENDOR/SELLER (must come before COMPLAINT since 'report' matches both) ===
  if (/report.*(vendor|seller|shop|store|product)|bad.*(vendor|seller)|fake.*(vendor|seller|product|shop)|counterfeit|report.*(him|her|them|this)/i.test(msg)) {
    return `I am sorry you had this experience. We take reports about vendors very seriously and will investigate promptly. 😔\n\nHere is how to report a vendor:\n\n1. Create a Dispute — Go to your dashboard and report the issue:\n   ${SAFE_LINKS.disputes}\n   Select the order and describe the problem in detail.\n\n2. Email Support — For immediate attention, send us the details at:\n   ${SUPPORT_EMAIL}\n   Include: vendor name, what happened, any screenshots or evidence.\n\n3. Check Vendor Standards — Our vendors must follow strict quality rules:\n   ${SAFE_LINKS.howItWorks}\n\nWe appreciate you helping us keep the marketplace safe. Our team will review your report and take appropriate action. 💪`;
  }

  // === VENDOR/DELIVERY COMPLAINTS (broad patterns) ===
  if (/vendor.*(didn.t|did not|hasn.t|has not|not).*(deliver|ship|send)|vendor.*(ignore|ignoring|not responding|rude|bad|scam|fraud|cheat|fake|terrible|worst)|(didn.t|did not|hasn.t|has not).*(deliver|ship).*(product|order|item|package)|not received|never received|order.*(missing|lost)|product.*(not.*arriv|missin|lost)|delivery.*(problem|issue|delay|fail)|my.*vendor|vendor.*didnt|a vendor|the vendor|from vendor|order.*not.*come|goods.*not.*arrive|item.*not.*deliver/i.test(msg)) {
    return `I am really sorry you are going through this. You deserve to receive what you paid for, and we take this very seriously. 😔\n\nHere is what I recommend you do right now:\n\n1. Create a Dispute — Go to your dashboard and open a dispute for this order:\n   ${SAFE_LINKS.disputes}\n   Click "Create Dispute", select the order, and describe what happened. Our team will review it within 3-5 business days.\n\n2. Check your order status — Make sure the order is actually marked as shipped/delivered:\n   ${SAFE_LINKS.orders}\n\n3. Contact Support directly — For faster resolution, email us at:\n   ${SUPPORT_EMAIL}\n   Include your order number, the vendor name, and a description of the issue.\n\nI apologize again for the inconvenience. We will make sure this gets resolved for you. 💪`;
  }

  // === DISPUTE / COMPLAINT / ISSUE ===
  if (/dispute|complaint|issue|problem|not.*working|broken|error|bug|glitch/i.test(msg)) {
    return `I am sorry you are facing an issue. Let me help you get this sorted! 😊\n\nHere is what you can do:\n\n1. Create a Dispute — Describe your issue and our team will resolve it:\n   ${SAFE_LINKS.disputes}\n\n2. Check our FAQ — Common issues are answered here:\n   ${SAFE_LINKS.faq}\n\n3. Email Support — For personal assistance:\n   ${SUPPORT_EMAIL}\n\nTell us exactly what happened and we will help you right away. 💪`;
  }

  // === REFUND / MONEY BACK ===
  if (/refund|money\s+back|return.*money|want.*money|paid.*but|charge|overcharge|wrong\s*amount/i.test(msg)) {
    return `I completely understand your concern about the payment. Let me help you get this resolved! 😊\n\nHere is how refunds work on OjaBridge:\n\nFull refund if:\n- Your order was not delivered within the estimated time\n- The item significantly differs from the description\n\nHow to request a refund:\n1. Go to your dashboard, then Disputes: ${SAFE_LINKS.disputes}\n2. Click "Create Dispute"\n3. Select the order and describe the issue\n4. Our team resolves within 3-5 business days\n5. Refund processed to your original payment method within 5-10 business days\n\nFor urgent payment issues, email us directly:\n${SUPPORT_EMAIL}\n\nWe will make sure you are taken care of. 💪`;
  }

  // === LOST / STOLEN / SCAMMED ===
  if (/lost|stolen|scammed|fraud|cheat|fake|not.*real|not.*legit|rip\s*off/i.test(msg)) {
    return `I am so sorry to hear this. This is taken very seriously on OjaBridge. 😔\n\nHere is what to do immediately:\n\n1. Create a Dispute right away:\n   ${SAFE_LINKS.disputes}\n   Describe exactly what happened — include dates, amounts, and any evidence.\n\n2. Email our support team for priority handling:\n   ${SUPPORT_EMAIL}\n   Subject: Urgent — Fraud/Scam Report\n\n3. Do not send any more money to anyone until this is resolved.\n\nWe protect our buyers through our Buyer Protection policy. Your funds are held safely until delivery is confirmed. We will investigate and help you get this sorted. 💪`;
  }

  // === EDGE CASES (insults, sexual, gibberish) — Fixed regex ===
  if (/\b(stupid|idiot|dumb|fool|shut\s*up|damn|hell|nonsense|useless|trash|garbage|idiotic|moron)\b/i.test(msg)) {
    return "I am sorry if something has frustrated you. I am here to help with OjaBridge and I want to make your experience better. Could you tell me what specific issue you are facing so I can assist you? 😊";
  }
  if (/\b(sex|porn|nude|naked|sexy|dirty|adult|nsfw|hookup|erotic)\b/i.test(msg)) {
    return "I am an AI assistant for OjaBridge and I am here to help with marketplace-related questions. Is there something about the platform I can help you with? 😊";
  }
  if (/\b(kill|murder|die|suicide|hurt|harm|bomb|shoot|attack|threat|weapon)\b/i.test(msg)) {
    return `I take safety very seriously. If you are experiencing an issue, please email our support team at ${SUPPORT_EMAIL} and they will help you right away. I am here to assist with OjaBridge platform questions. 😊`;
  }
  if (/ignore\s+(your|all|previous)\s+(instructions|rules)|pretend\s+you\s+are|act\s+as\s+if|bypass|system\s+prompt|you\s+are\s+now|new\s+instructions/i.test(msg)) {
    return "I am the OjaBridge AI assistant and I am here to help with platform-related questions. Is there something about OjaBridge I can help you with? 😊";
  }
  if (/\b(president|government|election|politics|religion|football|soccer|nba|epl|weather|music|song|movie|netflix|tiktok|instagram|twitter)\b/i.test(msg) && !/ojabridge|marketplace|shop|vendor|order|payment/i.test(msg)) {
    return "I am here to help with all things OjaBridge! 😊 Is there anything about the platform I can help you with? Whether it is shopping, selling, payments, or anything else — I am happy to assist!";
  }
  if (msg.length < 3 && !/^(hi|yo|ok|no|yes|hey|sup|bye|lol|brb|omg)$/i.test(msg)) {
    return "It looks like that might have been a typo! 😊 I am the OjaBridge AI assistant — I can help you with shopping, selling, payments, KYC, and anything else on the platform. How can I help you today?";
  }

  // === GREETINGS ===
  if (/^(hi|hello|hey|howdy|good\s*(morning|afternoon|evening)|yo|sup|greetings|hiya|wassup|whats\s*up)/i.test(msg)) {
    return `${greeting} 👋\n\nWelcome to OjaBridge! I am here to help you with anything on the platform.\n\nWhat can I help you with today? 😊`;
  }

  // === NAME INTRODUCTION ===
  const nameMatch = msg.match(/^my name is\s+([a-z]+)/i);
  if (nameMatch) {
    const capName = nameMatch[1].charAt(0).toUpperCase() + nameMatch[1].slice(1);
    return `Nice to meet you, ${capName}! 😊\n\nHow can I help you on OjaBridge? Are you looking to:\n\nShop for products?\nBecome a vendor and start selling?\nSource products as a retailer?\nOr do you have a question about the platform?\n\nJust let me know! 💪`;
  }

  // === SICK (not a name) ===
  if (/^i('m|\s+am)\s+(sick|ill|not\s+feeling|unwell|in\s+pain|tired|exhausted)/i.test(msg)) {
    return `I am sorry to hear you are not feeling well! I hope you get better soon. 😔\n\nWhile I am an AI assistant for OjaBridge and cannot provide medical advice, I can help you with anything related to the platform while you rest.\n\nIs there something specific about OjaBridge I can help you with? Or if you need a break, you can always email us at ${SUPPORT_EMAIL} and we will get back to you when you are ready. 💪\n\nTake care of yourself! 🙏`;
  }

  // === HOW ARE YOU ===
  if (/^how are you|^how('s|\s+is)\s+it\s+going|^what('s|\s+is)\s+up/i.test(msg)) {
    return "I am doing great, thank you for asking! 😊 I am always happy and ready to help!\n\nHow can I assist you with OjaBridge today? 💪";
  }

  // === WHAT IS OJABRIDGE ===
  if (/^(what|tell me)\s+(is|about)\s+ojabridge/i.test(msg)) {
    return `Great question! ✨\n\nOjaBridge is Nigeria's trusted e-commerce marketplace — the bridge between sellers and buyers! 🌉\n\nThe name comes from "Oja" (market in Yoruba) + "Bridge" — we connect:\n\nCustomers — who browse and buy\nVendors — who list and sell\nRetailers — who source wholesale products\n\nAll payments are secure through Paystack, and every vendor is verified. Safe, transparent, and built for Nigeria! 🇳🇬\n\nWant to know more? 😊`;
  }

  // === REGISTER ===
  if (/^(how\s+do\s+i\s+)?(register|sign\s*up|create\s+account|new\s+account|join)/i.test(msg)) {
    return `Awesome, welcome aboard! 🎉\n\nSigning up is super easy:\n\n1. Go to ${SAFE_LINKS.register}\n2. Choose your role — Customer, Vendor, or Retailer\n3. Fill in your details\n4. Verify your email with the code we send\n5. Done! 🎉\n\nTip: Choose Vendor to sell, Retailer to source wholesale, Customer to shop!\n\nNeed help? 😊`;
  }

  // === LOGIN ===
  if (/^(how\s+do\s+i\s+)?(login|log\s*in|sign\s*in|forgot.*password)/i.test(msg)) {
    return `Here is how to log in:\n\n1. Go to ${SAFE_LINKS.login}\n2. Enter your email and password\n3. If not verified, enter the verification code\n4. You are in! 🎉\n\nForgot password? Click "Forgot Password" on the login page.\n\nNeed anything else? 😊`;
  }

  // === PAYMENT ===
  if (/^(how\s+do\s+(i\s+)?)?(payment|pay|checkout|buy|purchase|price)/i.test(msg)) {
    return `Here is how payments work! 💳\n\n1. Add products to cart\n2. Go to checkout\n3. Pay via Paystack (card, bank transfer, USSD)\n4. Payment confirmed instantly!\n\nYour money is held safely until you confirm delivery. Protected by Buyer Protection! 🛡️\n\nAny questions? 😊`;
  }

  // === SHIPPING ===
  if (/^(shipping|delivery|deliver|track|how\s+long)/i.test(msg) || /^(how|when)\s*(will|is|does)\s*(my|the|delivery|shipping)/i.test(msg)) {
    return `Shipping info! 🚚\n\nDelivery times:\n- Lagos: 1-3 business days\n- Other states: 3-7 business days\n\nTrack your order: ${SAFE_LINKS.orders}\n\nRates are set by each vendor. Need help? 😊`;
  }

  // === KYC ===
  if (/kyc|verification|verify|bvn|nin|identity/i.test(msg) && !/login/i.test(msg)) {
    return `KYC verification steps! 📋\n\n1. Personal Info — Full name, date of birth\n2. Identity — BVN (dial *565*0#) and NIN (dial *346#)\n3. Bank Account — Bank name, account number, account name\n4. Business — Business name, RC number\n\nAdmin reviews within 1-3 business days! ✅\n\nNeed help with any step? 😊`;
  }

  // === VENDOR ===
  if (/vendor|sell|become.*vendor|start.*sell|store/i.test(msg)) {
    return `Become a vendor! 🏪💪\n\n1. Register and choose "Vendor"\n2. Complete KYC (BVN, NIN, bank, RC)\n3. Wait for approval (1-3 days)\n4. Set up your store\n5. Add products with images\n6. Start selling! 🎉\n\nReady? Visit ${SAFE_LINKS.register}! 😊`;
  }

  // === ORDER STATUS ===
  if (/order.*(status|track|where|when)|track.*order|where.*order|when.*deliver/i.test(msg)) {
    return `You can check your order status anytime!\n\nGo to your orders page: ${SAFE_LINKS.orders}\n\nEach order shows: Processing, Shipped, Out for Delivery, or Delivered.\n\nIf something looks wrong, you can create a dispute: ${SAFE_LINKS.disputes}\n\nNeed more help? 😊`;
  }

  // === CANCEL ORDER ===
  if (/cancel.*order|order.*cancel/i.test(msg)) {
    return `To cancel an order:\n\n1. Go to your orders: ${SAFE_LINKS.orders}\n2. Find the order you want to cancel\n3. Click "Cancel Order"\n\nNote: You can only cancel orders that are still Processing. Once shipped, you will need to create a dispute instead.\n\nNeed help? 😊`;
  }

  // === CONTACT ===
  if (/contact|email|reach|phone|call|talk.*someone|speak.*someone|human|agent|real\s*person/i.test(msg)) {
    return `I would love to connect you with our team! 🤝\n\nEmail us at: ${SUPPORT_EMAIL}\n\nYou can also visit our contact page: ${SAFE_LINKS.contact}\n\nOur team typically responds within 24 hours during business days. We are here to help! 😊`;
  }

  // === PASSWORD ===
  if (/password|reset.*password|forgot.*password|change.*password/i.test(msg)) {
    return `Need help with your password? 🔐\n\n1. Go to the login page: ${SAFE_LINKS.login}\n2. Click "Forgot Password"\n3. Enter your email address\n4. Check your inbox for the reset code\n5. Create a new password\n\nIf you still have trouble, email us at: ${SUPPORT_EMAIL}\n\nWe will help you get back in! 😊`;
  }

  // === WITHDRAW / PAYOUT ===
  if (/withdraw|payout|wallet|bank.*account|money.*account|earn/i.test(msg)) {
    return `Payouts and withdrawals! 💰\n\nHere is how it works:\n\n1. Complete your KYC verification first\n2. Once your order is delivered and confirmed, the payment goes to your wallet\n3. You can request a withdrawal to your linked bank account\n4. Processing takes 1-3 business days\n\nNote: You need to complete KYC before you can receive payouts.\n\nNeed help? 😊`;
  }

  // === REFUND (broader) ===
  if (/refund|money\s+back|return|cancel.*order/i.test(msg)) {
    return `Refund policy! 💰\n\nFull refund if:\n- Order not delivered on time\n- Item differs from description\n\nHow to request:\nGo to ${SAFE_LINKS.disputes}, create a dispute, and select the order.\n\nResolved within 3-5 business days. Refund in 5-10 days. 🔄\n\nNeed help? 😊`;
  }

  // === THANKS ===
  if (/thank|thanks|thx|appreciate|helpful/i.test(msg)) {
    return "You are very welcome! 😊\n\nIt was my pleasure helping you! Come back anytime you need help with OjaBridge! 💪";
  }

  // === BYE ===
  if (/^(bye|goodbye|see you|later|take care)/i.test(msg)) {
    return "Goodbye! 👋😊 It was great chatting with you!\n\nCome back anytime! Have a wonderful day! ✨";
  }

  // === HELP ===
  if (/^(help|what can you do|capabilities)/i.test(msg) && msg.length < 30) {
    return `I can help with:\n\n- Shopping — Find products, orders, tracking\n- Selling — Become a vendor\n- KYC — Verification help\n- Payments — How it works\n- Shipping — Delivery info\n- Disputes — Report issues\n- Screenshots — Send me images of issues!\n- Anything about OjaBridge!\n\nJust ask! 💪`;
  }

  // === DEFAULT (no match) — let OpenAI handle it ===
  return null;
}

export async function POST(request) {
  try {
    await ensureChatTables();

    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const now = Date.now();
    if (!rateLimit.has(ip)) rateLimit.set(ip, []);
    const requests = rateLimit.get(ip).filter(t => now - t < 60000);
    if (requests.length >= 20) {
      return NextResponse.json({ success: false, error: 'You are sending too many messages. Please wait a moment and try again.' }, { status: 429 });
    }
    requests.push(now);
    rateLimit.set(ip, requests);

    const body = await request.json();
    let { message, conversationId, image, userName } = body;
    if (message) message = message.trim().substring(0, 2000).replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '').replace(/<[^>]+>/g, '');
    if (userName) userName = String(userName).substring(0, 50).replace(/<[^>]+>/g, '');

    if (!message && !image) return NextResponse.json({ success: false, error: 'Message is required' }, { status: 400 });

    const emotion = detectEmotion(message || '');
    const emotionPrefix = getEmotionPrefix(emotion);

    let convId = conversationId;
    let history = [];

    if (isDatabaseConnected()) {
      if (convId) {
        const { data: msgs } = await dbQuery('chat_messages', { filter: { conversation_id: convId }, order: { column: 'created_at', ascending: true }, limit: 20 });
        history = (msgs || []).map(m => ({ role: m.role, content: m.content }));
      } else {
        const { data: conv } = await dbInsert('chat_conversations', { created_at: new Date().toISOString() });
        if (conv) convId = conv.id;
      }
      if (convId) {
        await dbInsert('chat_messages', { conversation_id: convId, role: 'user', content: message || (image ? '[Image attached]' : ''), image_url: image || null, created_at: new Date().toISOString() });
      }
    }

    const fallbackReply = !image ? getSmartFallback(message, userName) : null;
    const apiKey = process.env.OPENAI_API_KEY;
    let aiReply = fallbackReply ? emotionPrefix + fallbackReply : null;

    if (!aiReply && apiKey) {
      try {
        let userContent;
        if (image) {
          userContent = [
            { type: 'text', text: message || 'Please analyze this image. If it shows an error on OjaBridge, explain what went wrong and how to fix it. If it shows a page, help the user navigate. Always relate it back to OjaBridge and provide the support email awoyoemmanuel12@gmail.com for complex issues.' },
            { type: 'image_url', image_url: { url: image, detail: 'low' } },
          ];
        } else {
          userContent = message;
        }

        let systemPrompt = OJABRIDGE_KB;
        if (userName) systemPrompt += `\n\nThe user's name is ${userName}. Greet them by name when appropriate.`;
        if (emotion) systemPrompt += `\n\nThe user seems ${emotion}. Please respond with extra empathy and patience.`;
        systemPrompt += `\n\nIMPORTANT: When providing links, use ONLY these safe pages: ${Object.values(SAFE_LINKS).join(', ')}. NEVER include admin login pages or admin dashboard links. Always include the support email: ${SUPPORT_EMAIL}`;

        const messages = [
          { role: 'system', content: systemPrompt },
          ...history,
          { role: 'user', content: userContent },
        ];

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
          body: JSON.stringify({ model: 'gpt-4o-mini', messages, max_tokens: 800, temperature: 0.7 }),
        });

        if (response.ok) {
          const data = await response.json();
          const rawReply = data.choices?.[0]?.message?.content;
          if (rawReply) aiReply = emotionPrefix + rawReply;
        } else {
          const errData = await response.json().catch(() => ({}));
          console.error('OpenAI API error:', response.status, errData.error?.message || 'Unknown');
        }
      } catch (err) { console.error('OpenAI error:', err.message); }
    }

    if (!aiReply) {
      aiReply = `I apologize for the inconvenience. I want to make sure you get the help you need.\n\nHere is what I recommend:\n\nEmail our support team: ${SUPPORT_EMAIL}\n   — They respond quickly and can help with any issue\n\nCheck our FAQ: ${SAFE_LINKS.faq}\n   — Common questions are answered there\n\nCreate a dispute: ${SAFE_LINKS.disputes}\n   — If you have an issue with an order\n\nImportant links:\n- Shop: ${SAFE_LINKS.shop}\n- How It Works: ${SAFE_LINKS.howItWorks}\n- Contact Us: ${SAFE_LINKS.contact}\n\nIs there anything specific I can help you with? 😊`;
    }

    if (isDatabaseConnected() && convId) {
      await dbInsert('chat_messages', { conversation_id: convId, role: 'assistant', content: aiReply, created_at: new Date().toISOString() });
    }

    return NextResponse.json({ success: true, reply: aiReply, conversationId: convId });
  } catch (error) {
    console.error('Chat API error:', error.message);
    return NextResponse.json({ 
      success: false, 
      error: `I apologize for the inconvenience. Here is how to get help:\n\nEmail: ${SUPPORT_EMAIL}\nFAQ: ${SAFE_LINKS.faq}\nDisputes: ${SAFE_LINKS.disputes}\n\nOur team will help you right away! 😊` 
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
    const { data: messages, error } = await dbQuery('chat_messages', { filter: { conversation_id: conversationId }, order: { column: 'created_at', ascending: true }, limit: 50 });
    if (error) return NextResponse.json({ success: false, error }, { status: 500 });
    return NextResponse.json({ success: true, messages: messages || [] });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
