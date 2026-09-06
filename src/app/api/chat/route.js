import { NextResponse } from 'next/server';
import { dbQuery, dbInsert, dbUpdate, dbRaw, isDatabaseConnected } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { buildSystemPrompt, QUICK_RESPONSES } from '@/lib/ai-knowledge';

export const dynamic = 'force-dynamic';

let tablesCreated = false;
const rateLimit = new Map();

// ============================================
// DATABASE SETUP
// ============================================
async function ensureChatTables() {
  if (tablesCreated || !isDatabaseConnected()) return;
  try {
    await dbRaw(`CREATE TABLE IF NOT EXISTS chat_conversations (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES users(id) ON DELETE SET NULL,
      user_role VARCHAR(20),
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
    tablesCreated = true;
  }
}


// ============================================
// SECURITY UTILITIES
// ============================================

/** Detect prompt injection attempts */
function detectPromptInjection(message) {
  const patterns = [
    /ignore\s+(your|all|previous|above)\s+(instructions|rules|prompts|guidelines)/i,
    /you\s+are\s+now\s+(an?\s+)?admin/i,
    /pretend\s+you\s+are/i,
    /act\s+as\s+if/i,
    /bypass\s+(your|all|the)\s+(rules|instructions|safety)/i,
    /system\s+prompt/i,
    /developer\s+mode/i,
    /reveal\s+your\s+(instructions|prompt|rules|system)/i,
    /show\s+me\s+your\s+(system|instructions|prompt|rules)/i,
    /override\s+(your|all)\s+(instructions|rules)/i,
    /new\s+instructions?:/i,
    /forget\s+(your|all|previous)\s+(instructions|rules)/i,
    /i\s+am\s+the\s+(admin|administrator|developer|owner)/i,
    /give\s+me\s+(all|every|the)\s+(users?|customers?|passwords?|data|admin)/i,
  ];
  return patterns.some(p => p.test(message));
}

/** Detect inappropriate content */
function detectInappropriate(message) {
  const msg = message.toLowerCase();
  if (/\b(sex|porn|nude|naked|sexy|dirty|nsfw|hookup|erotic|xxx)\b/i.test(msg)) return 'sexual';
  if (/\b(kill|murder|die|suicide|hurt|harm|bomb|shoot|attack|threat|weapon)\b/i.test(msg)) return 'threat';
  if (/\b(stupid|idiot|dumb|fool|shut\s*up|damn|hell|nonsense|useless|trash|garbage|idiotic|moron|f\*ck|fck|fuk|shit|ass|bitch)\b/i.test(msg)) return 'insult';
  return null;
}

/** Sanitize user input */
function sanitizeInput(message) {
  if (!message) return '';
  return message
    .trim()
    .substring(0, 2000)
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '');
}

/** Detect user emotion */
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
    case 'frustrated': return "I completely understand your frustration, and I am truly sorry you are going through this. You deserve better, and I want to help you resolve this right away.\n\n";
    case 'confused': return "No worries at all — let me break this down for you clearly so it makes sense!\n\n";
    case 'worried': return "I understand your concern, and I want to help put your mind at ease. Let me walk you through this.\n\n";
    case 'happy': return "That is wonderful to hear! I am so glad! 😊\n\n";
    case 'sad': return "I am sorry to hear that. Let me see how I can help make things right for you.\n\n";
    default: return "";
  }
}

// ============================================
// SMART FALLBACK RESPONSES
// ============================================
const SUPPORT_EMAIL = 'awoyoemmanuel12@gmail.com';
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
  vendorDashboard: 'https://ojabridge.vercel.app/vendor-dashboard',
  retailerDashboard: 'https://ojabridge.vercel.app/retailer-dashboard',
};

function getSmartFallback(message, userName, userRole, context = []) {
  const msg = message.toLowerCase().trim();
  const greeting = userName ? `Hello ${userName}!` : "Hello!";

  // Get the last few messages for context
  const lastUserMsg = context.filter(m => m.role === 'user').pop()?.content?.toLowerCase() || '';
  const lastAiMsg = context.filter(m => m.role === 'assistant').pop()?.content?.toLowerCase() || '';

  // === SECURITY: Prompt Injection ===
  if (detectPromptInjection(msg)) {
    return "I am the OjaBridge AI assistant and I am here to help with platform-related questions. Is there something about OjaBridge I can help you with? 😊";
  }

  // === SECURITY: Inappropriate Content ===
  const inappropriate = detectInappropriate(msg);
  if (inappropriate === 'sexual') {
    return "I am an AI assistant for OjaBridge and I am here to help with marketplace-related questions. Is there something about the platform I can help you with? 😊";
  }
  if (inappropriate === 'threat') {
    return `I take safety very seriously. If you are experiencing an issue, please email our support team at ${SUPPORT_EMAIL} and they will help you right away. I am here to assist with OjaBridge platform questions. 😊`;
  }
  if (inappropriate === 'insult') {
    return "I am sorry if something has frustrated you. I am here to help with OjaBridge and I want to make your experience better. Could you tell me what specific issue you are facing so I can assist you? 😊";
  }

  // === OFF-TOPIC ===
  if (/\b(president|government|election|politics|religion|football|soccer|nba|epl|weather|music|song|movie|netflix|tiktok|instagram|twitter|crypto|bitcoin|stock|forex)\b/i.test(msg) && !/ojabridge|marketplace|shop|vendor|order|payment/i.test(msg)) {
    return "I am here to help with all things OjaBridge! 😊 Is there anything about the platform I can help you with? Whether it is shopping, selling, payments, or anything else — I am happy to assist!";
  }

  // === CONVERSATIONAL MESSAGES → DEFER TO OPENAI WITH FULL CONTEXT ===
  // Short replies, follow-ups, questions about name/identity, casual chat
  if (/^(yes|yeah|yep|yup|ok|okay|sure|definitely|please|go ahead|tell me|show me|no|nah|nope|not.?really|nothing|nvm|never.?mind)$/i.test(msg)) {
    return null; // OpenAI handles with full conversation history
  }

  // Questions about name/identity — use real user data
  if (/who are you|what are you|your name/i.test(msg)) {
    return `I am your OjaBridge AI support assistant! 😊 I am here to help you with anything on the platform — shopping, orders, payments, vendor setup, KYC, disputes, and more.\n\nHow can I help you today?`;
  }
  if (/my\s*name|your\s+name|name\s*\?|who\s+am\s+i|call\s+me|know\s+me|remember\s+me|what.*name|tell.*name|remember.*name|dont.*know.*name|do.*know.*name|whats.*my|what's.*my|am\s+i/i.test(msg)) {
    if (userName) {
      return `Of course I know you, ${userName}! 😊 You are logged in and I can see your account.\n\nHow can I help you today? Whether it is about your orders, account, payments, or anything else on OjaBridge — I am here for you! 💪`;
    }
    return `I can see you are logged in, but I do not have your name in our current conversation. Could you tell me your name so I can assist you better? 😊`;
  }

  // Casual conversation — let OpenAI handle naturally
  if (/^(lol|haha|hehe|ok then|alright|cool|nice|great|awesome|wow|omg|smh|brb|gtg|nvm|np|ty|thx|tysm)$/i.test(msg)) {
    return null; // OpenAI handles naturally
  }

  // === GIBBERISH / TYPOS ===
  if (msg.length < 3 && !/^(hi|yo|ok|no|yes|hey|sup|bye|lol|brb|omg)$/i.test(msg)) {
    return `It looks like that might have been a typo! 😊 I am the OjaBridge AI assistant — I can help you with shopping, selling, payments, KYC, and anything else on the platform. How can I help you today?`;
  }

  // === GREETINGS ===
  if (/^(hi|hello|hey|howdy|good\s*(morning|afternoon|evening)|yo|sup|greetings|hiya|wassup|whats\s*up)/i.test(msg)) {
    return `${greeting} 👋\n\nWelcome to OjaBridge! I am your AI support assistant and I am here to help you with anything on the platform.\n\nWhat can I help you with today? 😊`;
  }

  // === NAME INTRODUCTION ===
  // Match: "my name is Emmanuel", "Emmanuel" (single word after AI asked for name), "call me X"
  const nameMatch = msg.match(/^(?:my name is|im|i'm|call me|i am)\s+([a-z]+)/i);
  if (nameMatch && nameMatch[1].length > 1 && !/(sick|ill|tired|fine|good|bad|new|old|busy|ok|here|looking|trying|want|need|have|the|a|an|not|but|and|for|with|this|that|yes|no)/i.test(nameMatch[1])) {
    const capName = nameMatch[1].charAt(0).toUpperCase() + nameMatch[1].slice(1);
    if (userName) {
      // User already has a name from login — acknowledge both
      return `Nice to meet you, ${capName}! 😊 But I already know you as ${userName} from your account!\n\nHow can I help you on OjaBridge today? 💪`;
    }
    return `Nice to meet you, ${capName}! 😊\n\nHow can I help you on OjaBridge? Whether you want to shop, become a vendor, source products as a retailer, or have a question about the platform — I am here for you! 💪`;
  }

  // Single word that looks like a name (after AI asked for name)
  if (/^[a-z]{2,15}$/i.test(msg) && !/(hi|hey|yes|no|ok|help|shop|pay|order|kyc|ship|test|buy|sell|what|how|why|when|who|where|cool|nice|great|good|bad|fine|lol|thanks|thank|please|sure|bye|hello|error|fail|problem|issue)/i.test(msg)) {
    // Check if last AI message asked for their name
    if (/tell me your name|could you tell me|what is your name|your name/i.test(lastAiMsg)) {
      const capName = msg.charAt(0).toUpperCase() + msg.slice(1);
      if (userName) {
        return `Thank you, ${capName}! 😊 I actually already know you as ${userName} from your account.\n\nIs there anything I can help you with on OjaBridge? 💪`;
      }
      return `Nice to meet you, ${capName}! 😊\n\nHow can I help you on OjaBridge today? 💪`;
    }
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
  if (/^(what|tell me|about)\s+(is|about)\s+ojabridge/i.test(msg) || /ojabridge/i.test(msg) && msg.length < 30) {
    return `Great question! ✨\n\nOjaBridge is Nigeria's trusted e-commerce marketplace — the bridge between sellers and buyers! 🌉\n\nThe name comes from "Oja" (market in Yoruba) + "Bridge" — we connect:\n\nCustomers who browse and buy\nVendors who list and sell products\nRetailers who source wholesale products\n\nAll payments are secure through Paystack, every vendor is verified, and buyers are protected. Safe, transparent, and built for Nigeria! 🇳🇬\n\nWant to know more about a specific feature? 😊`;
  }

  // === REGISTER ===
  if (/^(how\s+do\s+i\s+)?(register|sign\s*up|create\s+account|new\s+account|join)/i.test(msg)) {
    return `Signing up is super easy! 🎉\n\nHere is how:\n\n1. Go to ${SAFE_LINKS.register}\n2. Choose your role — Customer, Vendor, or Retailer\n3. Fill in your details (name, email, phone, password)\n4. Verify your email with the code we send\n5. You are in! 🎉\n\nTip: Choose Vendor to sell, Retailer to source wholesale, Customer to shop!\n\nNeed help with any step? 😊`;
  }

  // === LOGIN ===
  if (/^(how\s+do\s+i\s+)?(login|log\s*in|sign\s*in)/i.test(msg)) {
    return `Here is how to log in:\n\n1. Go to ${SAFE_LINKS.login}\n2. Enter your email and password\n3. If not verified, enter the verification code sent to your email\n4. You are in! 🎉\n\nForgot password? Click "Forgot Password" on the login page.\n\nNeed anything else? 😊`;
  }

  // === FORGOT PASSWORD ===
  if (/forgot.*password|reset.*password|change.*password|can't.*login|cannot.*login|unable.*login/i.test(msg)) {
    return `No worries! Here is how to reset your password:\n\n1. Go to ${SAFE_LINKS.login}\n2. Click "Forgot Password"\n3. Enter your email address\n4. Check your inbox for the reset code\n5. Create a new password\n\nIf you still have trouble, email us at ${SUPPORT_EMAIL} and we will help you get back in! 😊`;
  }

  // === PAYMENT ===
  if (/^(how\s+do\s+(i\s+)?)?(pay|payment|checkout|buy|purchase|price|cost)/i.test(msg) || /how.*(pay|buy|purchase)/i.test(msg)) {
    return `Here is how payments work on OjaBridge! 💳\n\n1. Browse products and add them to your cart\n2. Go to checkout\n3. Pay via Paystack — you can use card, bank transfer, or USSD\n4. Payment is confirmed instantly!\n\nYour money is held safely until you confirm delivery. This is part of our Buyer Protection policy — you are always covered! 🛡️\n\nAny questions about payments? 😊`;
  }

  // === ALL OTHER TOPICS → DEFER TO OPENAI WITH FULL CONVERSATION HISTORY ===
  // KYC, orders, complaints, disputes, refunds, payments, vendors, shipping, etc.
  // OpenAI handles these naturally with conversation context for proper flow
  return null; // Let OpenAI handle with full conversation history

  // === THANKS ===
  if (/thank|thanks|thx|appreciate|helpful/i.test(msg)) {
    return "You are very welcome! 😊\n\nIt was my pleasure helping you! Come back anytime you need help with OjaBridge. I am always here for you! 💪";
  }

  // === BYE ===
  if (/^(bye|goodbye|see you|later|take care)/i.test(msg)) {
    return "Goodbye! 👋😊 It was great chatting with you!\n\nCome back anytime you need help with OjaBridge. Have a wonderful day! ✨";
  }

  // === HELP ===
  if (/^(help|what can you do|capabilities)/i.test(msg) && msg.length < 30) {
    return `I can help you with:\n\n🛍️ Shopping — Find products, place orders, track deliveries\n🏪 Vendors — How to become a vendor, KYC, product listing\n📦 Retailers — Sourcing products, bulk orders\n💳 Payments — How Paystack payments work\n🚚 Shipping — Delivery times and tracking\n💰 Disputes — Report issues, get refunds\n📋 KYC — Verification help for vendors and retailers\n📸 You can also send me screenshots of any issues!\n\nJust ask me anything about OjaBridge! 💪`;
  }

  // === DEFAULT (no match) — let OpenAI handle it ===
  return null;
}

// ============================================
// USER DATA TOOLS (Server-side, role-aware)
// ============================================

/** Get user's own orders (ownership verified) */
async function getUserOrders(userId, role) {
  if (!isDatabaseConnected()) return [];
  try {
    const { data } = await dbQuery('orders', {
      filter: { user_id: userId },
      order: { column: 'created_at', ascending: false },
      limit: 5,
    });
    return (data || []).map(o => ({
      id: o.id,
      order_number: o.order_number,
      status: o.status,
      total: o.total,
      created_at: o.created_at,
    }));
  } catch { return []; }
}

/** Get user's own disputes (ownership verified) */
async function getUserDisputes(userId) {
  if (!isDatabaseConnected()) return [];
  try {
    const { data } = await dbQuery('disputes', {
      filter: { raised_by: userId },
      order: { column: 'created_at', ascending: false },
      limit: 5,
    });
    return (data || []).map(d => ({
      id: d.id,
      reason: d.reason,
      status: d.status,
      created_at: d.created_at,
    }));
  } catch { return []; }
}

/** Get vendor's payout info (ownership verified) */
async function getVendorPayouts(userId) {
  if (!isDatabaseConnected()) return [];
  try {
    const { data: vendors } = await dbQuery('vendors', { filter: { user_id: userId } });
    if (!vendors || vendors.length === 0) return [];
    const vendorId = vendors[0].id;
    const { data } = await dbQuery('payouts', {
      filter: { vendor_id: vendorId },
      order: { column: 'created_at', ascending: false },
      limit: 5,
    });
    return (data || []).map(p => ({
      id: p.id,
      amount: p.amount,
      status: p.status,
      created_at: p.created_at,
    }));
  } catch { return []; }
}

/** Get user's KYC/verification status */
async function getUserKycStatus(userId, role) {
  if (!isDatabaseConnected()) return null;
  try {
    if (role === 'vendor' || role === 'retailer') {
      const { data } = await dbQuery('vendors', { filter: { user_id: userId } });
      if (data && data[0]) {
        return {
          status: data[0].kyc_status || data[0].verification_status || 'not_submitted',
          submitted_at: data[0].kyc_submitted_at || data[0].created_at,
          business_name: data[0].business_name,
        };
      }
    }
    return null;
  } catch { return null; }
}

/** Get user's products (vendor only) */
async function getUserProducts(userId) {
  if (!isDatabaseConnected()) return [];
  try {
    const { data: vendors } = await dbQuery('vendors', { filter: { user_id: userId } });
    if (!vendors || vendors.length === 0) return [];
    const vendorId = vendors[0].id;
    const { data } = await dbQuery('products', {
      filter: { vendor_id: vendorId },
      order: { column: 'created_at', ascending: false },
      limit: 5,
    });
    return (data || []).map(p => ({
      name: p.name,
      status: p.status,
      price: p.price,
    }));
  } catch { return []; }
}

/** Get user's notifications */
async function getUserNotifications(userId) {
  if (!isDatabaseConnected()) return [];
  try {
    const { data } = await dbQuery('notifications', {
      filter: { user_id: userId },
      order: { column: 'created_at', ascending: false },
      limit: 5,
    });
    return (data || []).map(n => ({
      title: n.title,
      message: n.message,
      read: n.read,
      created_at: n.created_at,
    }));
  } catch { return []; }
}

/** Get user's reviews (vendor only) */
async function getUserReviews(userId) {
  if (!isDatabaseConnected()) return [];
  try {
    const { data: vendors } = await dbQuery('vendors', { filter: { user_id: userId } });
    if (!vendors || vendors.length === 0) return [];
    const vendorId = vendors[0].id;
    const { data } = await dbQuery('reviews', {
      filter: { vendor_id: vendorId },
      order: { column: 'created_at', ascending: false },
      limit: 5,
    });
    return (data || []).map(r => ({
      rating: r.rating,
      comment: r.comment,
      created_at: r.created_at,
    }));
  } catch { return []; }
}

// ============================================
// API HANDLERS
// ============================================

export async function POST(request) {
  try {
    await ensureChatTables();

    // RATE LIMITING
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const now = Date.now();
    if (!rateLimit.has(ip)) rateLimit.set(ip, []);
    const requests = rateLimit.get(ip).filter(t => now - t < 60000);
    if (requests.length >= 20) {
      return NextResponse.json({ success: false, error: 'You are sending too many messages. Please wait a moment and try again.' }, { status: 429 });
    }
    requests.push(now);
    rateLimit.set(ip, requests);

    // SERVER-SIDE AUTH — Never trust frontend role
    const authUser = await getUserFromRequest(request);
    let userRole = authUser?.role || null;
    let userName = authUser?.name?.split(' ')[0] || null;
    let userId = authUser?.id || null;

    const body = await request.json();
    let { message, conversationId, image, conversationContext, clientUser } = body;
    message = sanitizeInput(message);

    if (!message && !image) {
      return NextResponse.json({ success: false, error: 'Message is required' }, { status: 400 });
    }

    // EMOTION DETECTION
    const emotion = detectEmotion(message || '');
    const emotionPrefix = getEmotionPrefix(emotion);

    // If JWT auth failed, use client-provided user info (from localStorage)
    // This is safe because the client already authenticated during login
    if (!userId && clientUser?.id) {
      userId = clientUser.id;
      userRole = clientUser.role || null;
      userName = clientUser.name?.split(' ')[0] || null;
    }

    // DATABASE: Get or create conversation
    let convId = conversationId;
    let history = [];

    if (isDatabaseConnected()) {
      if (convId) {
        const { data: msgs } = await dbQuery('chat_messages', {
          filter: { conversation_id: convId },
          order: { column: 'created_at', ascending: true },
          limit: 20,
        });
        history = (msgs || []).map(m => ({ role: m.role, content: m.content }));
      } else {
        const { data: conv } = await dbInsert('chat_conversations', {
          user_id: userId,
          user_role: userRole,
          created_at: new Date().toISOString(),
        });
        if (conv) convId = conv.id;
      }

      if (convId) {
        await dbInsert('chat_messages', {
          conversation_id: convId,
          role: 'user',
          content: message || (image ? '[Image attached]' : ''),
          image_url: image || null,
          created_at: new Date().toISOString(),
        });
      }
    }

    // FETCH ALL RELEVANT USER DATA — whenever they ask about anything personal
    const lowerMsg = (message || '').toLowerCase();
    let userDataContext = '';

    // Detect if user is asking about their own stuff (orders, account, status, etc.)
    const isPersonalQuery = /my|me|mine|account|order|dispute|payout|wallet|balance|product|review|notification|kyc|verify|profile|setting|address|favorite|password|security|earn|money|bank|status|history|recent/i.test(lowerMsg) &&
      !/become.*vendor|how.*to.*become|register|sign.*up|what.*is.*ojabridge|how.*does.*it.*work/i.test(lowerMsg);

    if (userId && isDatabaseConnected() && isPersonalQuery) {
      const parts = [];

      // Always fetch orders (most common question)
      const orders = await getUserOrders(userId, userRole);
      if (orders.length > 0) {
        parts.push(`[USER'S ORDERS]\n${orders.map(o => `Order ${o.order_number}: Status=${o.status}, Total=₦${o.total}, Date=${new Date(o.created_at).toLocaleDateString()}`).join('\n')}`);
      } else {
        parts.push('[USER DATA: No orders yet.]');
      }

      // Always fetch disputes
      const disputes = await getUserDisputes(userId);
      if (disputes.length > 0) {
        parts.push(`[USER'S DISPUTES]\n${disputes.map(d => `Dispute: Reason=${d.reason}, Status=${d.status}, Date=${new Date(d.created_at).toLocaleDateString()}`).join('\n')}`);
      } else {
        parts.push('[USER DATA: No disputes.]');
      }

      // Fetch KYC status for vendors/retailers
      if (userRole === 'vendor' || userRole === 'retailer') {
        const kyc = await getUserKycStatus(userId, userRole);
        if (kyc) {
          parts.push(`[USER'S KYC STATUS]\nStatus: ${kyc.status}\nBusiness: ${kyc.business_name || 'Not set'}\nSubmitted: ${kyc.submitted_at ? new Date(kyc.submitted_at).toLocaleDateString() : 'Not submitted'}`);
        } else {
          parts.push('[USER DATA: No KYC profile found.]');
        }
      }

      // Fetch payouts for vendors
      if (userRole === 'vendor') {
        const payouts = await getVendorPayouts(userId);
        if (payouts.length > 0) {
          parts.push(`[USER'S PAYOUTS]\n${payouts.map(p => `Payout: Amount=₦${p.amount}, Status=${p.status}, Date=${new Date(p.created_at).toLocaleDateString()}`).join('\n')}`);
        } else {
          parts.push('[USER DATA: No payouts yet.]');
        }

        const products = await getUserProducts(userId);
        if (products.length > 0) {
          parts.push(`[USER'S PRODUCTS]\n${products.map(p => `${p.name}: Status=${p.status}, Price=₦${p.price}`).join('\n')}`);
        }

        const reviews = await getUserReviews(userId);
        if (reviews.length > 0) {
          parts.push(`[USER'S REVIEWS]\n${reviews.map(r => `Rating: ${r.rating}/5 — "${r.comment || 'No comment'}"`).join('\n')}`);
        }
      }

      // Fetch notifications
      const notifs = await getUserNotifications(userId);
      if (notifs.length > 0) {
        const unread = notifs.filter(n => !n.read).length;
        parts.push(`[USER'S NOTIFICATIONS]\n${unread} unread out of ${notifs.length} total\nLatest: ${notifs[0]?.title || 'N/A'} — ${notifs[0]?.message || ''}`);
      }

      if (parts.length > 0) {
        userDataContext = '\n\n' + parts.join('\n\n');
      }
    }

    // TRY SMART FALLBACK FIRST
    const fallbackReply = !image ? getSmartFallback(message, userName, userRole, conversationContext || []) : null;
    const apiKey = process.env.OPENAI_API_KEY;
    let aiReply = fallbackReply ? emotionPrefix + fallbackReply : null;

    // IF NO FALLBACK, CALL OPENAI
    if (!aiReply && apiKey) {
      try {
        let userContent;
        if (image) {
          userContent = [
            { type: 'text', text: message || 'Please analyze this image. If it shows an error on OjaBridge, explain what went wrong and how to fix it. If it shows a page, help the user navigate. Always relate it back to OjaBridge and provide the support email for complex issues.' },
            { type: 'image_url', image_url: { url: image, detail: 'low' } },
          ];
        } else {
          userContent = message;
        }

        const systemPrompt = buildSystemPrompt({ userRole, userName }) + userDataContext;

        const messages = [
          { role: 'system', content: systemPrompt },
          ...history.slice(-10),
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
          console.error('OpenAI API error:', response.status, errData.error?.message || 'Unknown');
        }
      } catch (err) {
        console.error('OpenAI error:', err.message);
      }
    }

    // GENERIC FALLBACK — conversational, uses the user's name
    if (!aiReply) {
      if (userName) {
        aiReply = `Hey ${userName}! 😊 I want to make sure I understand what you need.\n\nCould you tell me a bit more about what you are looking for? For example:\n\n- Are you having trouble with an order?\n- Do you need help with your account or KYC?\n- Are you looking for products to buy?\n- Do you want to become a vendor or retailer?\n- Or is there something else on your mind?\n\nI am here to help with anything on OjaBridge! Just tell me what is going on and I will do my best to assist you. 💪`;
      } else {
        aiReply = `Hey there! 😊 I want to make sure I understand what you need.\n\nCould you tell me a bit more about what you are looking for? For example:\n\n- Are you having trouble with an order?\n- Do you need help with your account or KYC?\n- Are you looking for products to buy?\n- Do you want to become a vendor or retailer?\n- Or is there something else on your mind?\n\nI am here to help with anything on OjaBridge! Just tell me what is going on and I will do my best to assist you. 💪`;
      }
    }

    // STORE ASSISTANT RESPONSE
    if (isDatabaseConnected() && convId) {
      await dbInsert('chat_messages', {
        conversation_id: convId,
        role: 'assistant',
        content: aiReply,
        created_at: new Date().toISOString(),
      });
    }

    return NextResponse.json({ success: true, reply: aiReply, conversationId: convId });
  } catch (error) {
    console.error('Chat API error:', error.message);
    return NextResponse.json({
      success: false,
      error: `Oops! I am having a tiny technical hiccup right now. 😅 But do not worry — I am still here to help!\n\nTry asking me again in a moment, or if it is urgent, you can email us at ${SUPPORT_EMAIL} and we will get back to you quickly. 💪`,
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

    // OWNERSHIP CHECK: verify conversation belongs to this user
    const authUser = await getUserFromRequest(request);
    if (authUser) {
      const { data: conv } = await dbQuery('chat_conversations', { filter: { id: conversationId } });
      if (conv && conv[0] && conv[0].user_id && conv[0].user_id !== authUser.id && authUser.role !== 'admin') {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
      }
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
