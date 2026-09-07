import { NextResponse } from 'next/server';
import { dbQuery, dbInsert, dbUpdate, dbRaw, isDatabaseConnected } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { buildSystemPrompt } from '@/lib/ai-knowledge';

export const dynamic = 'force-dynamic';

let tablesCreated = false;
const rateLimit = new Map();

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
    await dbRaw(`CREATE INDEX IF NOT EXISTS idx_chat_conv_user ON chat_messages(conversation_id, created_at DESC)`);
    tablesCreated = true;
  } catch { tablesCreated = true; }
}

// ============================================
// SECURITY
// ============================================
function detectPromptInjection(message) {
  return /ignore\s+(your|all|previous|above)\s+(instructions|rules|prompts|guidelines)|you\s+are\s+now\s+(an?\s+)?admin|pretend\s+you\s+are|bypass\s+(your|all|the)\s+(rules|instructions)|system\s+prompt|developer\s+mode|reveal\s+your\s+(instructions|prompt|rules)|show\s+me\s+your\s+(system|instructions|prompt|rules)|override\s+(your|all)\s+(instructions|rules)|forget\s+(your|all|previous)\s+(instructions|rules)|i\s+am\s+the\s+(admin|administrator|developer|owner)|give\s+me\s+(all|every|the)\s+(users?|customers?|passwords?|data|admin)/i.test(message);
}

function detectInappropriate(message) {
  const msg = message.toLowerCase();
  if (/\b(sex|porn|nude|naked|sexy|dirty|nsfw|hookup|erotic|xxx)\b/i.test(msg)) return 'sexual';
  if (/\b(kill|murder|die|suicide|hurt|harm|bomb|shoot|attack|threat|weapon)\b/i.test(msg)) return 'threat';
  if (/\b(stupid|idiot|dumb|fool|shut\s*up|damn|hell|nonsense|useless|trash|garbage|idiotic|moron|f\*ck|fck|fuk|shit|ass|bitch)\b/i.test(msg)) return 'insult';
  return null;
}

function sanitizeInput(message) {
  if (!message) return '';
  return message.trim().substring(0, 2000).replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '').replace(/<[^>]+>/g, '').replace(/javascript:/gi, '').replace(/on\w+\s*=/gi, '');
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
    case 'frustrated': return "I completely understand your frustration. Let me help you resolve this right away.\n\n";
    case 'confused': return "No worries — let me break this down for you clearly!\n\n";
    case 'worried': return "I understand your concern. Let me walk you through this.\n\n";
    case 'happy': return "That is wonderful to hear! 😊\n\n";
    case 'sad': return "I am sorry to hear that. Let me help make things right.\n\n";
    default: return "";
  }
}

// ============================================
// LINKS
// ============================================
const SUPPORT_EMAIL = 'awoyoemmanuel12@gmail.com';
const L = {
  faq: 'https://ojabridge.vercel.app/faq',
  disputes: 'https://ojabridge.vercel.app/account/disputes',
  orders: 'https://ojabridge.vercel.app/account/orders',
  register: 'https://ojabridge.vercel.app/register',
  login: 'https://ojabridge.vercel.app/login',
  shop: 'https://ojabridge.vercel.app/shop',
  contact: 'https://ojabridge.vercel.app/contact',
  howItWorks: 'https://ojabridge.vercel.app/how-it-works',
  vendorDash: 'https://ojabridge.vercel.app/vendor-dashboard',
  retailerDash: 'https://ojabridge.vercel.app/retailer-dashboard',
  kyc: 'https://ojabridge.vercel.app/vendor-dashboard/kyc',
  store: 'https://ojabridge.vercel.app/vendor-dashboard/store',
  products: 'https://ojabridge.vercel.app/vendor-dashboard/products',
  payouts: 'https://ojabridge.vercel.app/vendor-dashboard/payouts',
  settings: 'https://ojabridge.vercel.app/vendor-dashboard/settings',
  customerOrders: 'https://ojabridge.vercel.app/account/orders',
  customerDisputes: 'https://ojabridge.vercel.app/account/disputes',
};

// ============================================
// INTELLIGENT CLASSIFIER
// Detects topic AND intent from ANY phrasing
// ============================================
function classify(msg) {
  const m = msg.toLowerCase().trim();

  // === SECURITY (must catch first) ===
  if (detectPromptInjection(m)) return { t: 'security', i: 'injection' };
  const inap = detectInappropriate(m);
  if (inap === 'sexual') return { t: 'security', i: 'sexual' };
  if (inap === 'threat') return { t: 'security', i: 'threat' };
  if (inap === 'insult') return { t: 'security', i: 'insult' };

  // === OFF-TOPIC ===
  if (/\b(president|government|election|politics|religion|football|soccer|nba|epl|weather|music|song|movie|netflix|crypto|bitcoin|stock|forex|tiktok|instagram)\b/i.test(m) && !/ojabridge|vendor|order|pay|deliver/i.test(m)) {
    return { t: 'off-topic' };
  }

  // === GREETINGS ===
  if (/^(hi|hello|hey|howdy|good\s*(morning|afternoon|evening)|yo|sup|greetings|hiya|wassup|whats?\s*up)/i.test(m)) return { t: 'greeting' };

  // === THANKS ===
  if (/^(thank|thanks|thx|appreciate|helpful)/i.test(m)) return { t: 'thanks' };

  // === BYE ===
  if (/^(bye|goodbye|see you|later|take care)/i.test(m)) return { t: 'bye' };

  // === NAME ===
  if (/who are you|what are you|your name/i.test(m)) return { t: 'identity', i: 'who' };
  if (/my\s*name|name\s*\?|who\s+am\s+i|call\s+me|know\s+me|remember\s+me|what.*name|tell.*name|whats.*my|what's.*my/i.test(m)) return { t: 'identity', i: 'my-name' };

  // === FOLLOW-UPS ===
  if (/^(yes|yeah|yep|yup|ok|okay|sure|definitely|please|go ahead|tell me|show me)$/i.test(m)) return { t: 'followup', i: 'yes' };
  if (/^(no|nah|nope|not.?really|nothing|nvm|never.?mind)$/i.test(m)) return { t: 'followup', i: 'no' };

  // === CASUAL ===
  if (/^(lol|haha|hehe|ok then|alright|cool|nice|great|awesome|wow|omg|smh|brb|gtg|nvm|np|ty|thx|tysm)$/i.test(m)) return { t: 'casual' };

  // === SICK ===
  if (/^i('m|\s+am)\s+(sick|ill|not\s+feeling|unwell|in\s+pain|tired|exhausted)/i.test(m)) return { t: 'sick' };

  // === HOW ARE YOU ===
  if (/^how are you|^how('s|\s+is)\s+it\s+going|^what('s|\s+is)\s+up/i.test(m)) return { t: 'smalltalk' };

  // === WHAT IS OJABRIDGE ===
  if (/^(what|tell me|about)\s+(is|about)\s+ojabridge/i.test(m) || (/ojabridge/i.test(m) && m.length < 30)) return { t: 'about' };

  // ============================================
  // TOPIC DETECTION — Broad keyword matching
  // Multiple topics can match, highest score wins
  // ============================================
  const topics = [];

  // --- DELIVERY COMPLAINT (highest priority) ---
  if (/vendor.*not.*(deliver|send|ship|respond|reply|answer)|vendor.*never|vendor.*ignore|vendor.*no\s+dey|order.*not.*(deliver|come|reach|arrive)|order.*no.*reach|order.*delay|order.*late|wetin.*happen.*order|e.*no.*dey.*move|nothing.*happen|vendor.*take.*money|scam|cheat|fraud|stolen|not.*receive|no.*receive|e.*collect|e.*vanish|e.*disappear|wetin.*dey|my.*money.*go|where.*my.*money|no.*see.*my.*order|my.*order.*no.*dey/i.test(m)) {
    topics.push({ t: 'delivery-complaint', s: 20 });
  }

  // --- BANKING / PAYOUT (before payment) ---
  if (/(payout|withdraw|wallet|earn|balance|settlement|bank.*account|bank.*name|bank.*number|send.*money.*bank|my.*bank|account.*number|how.*i.*get.*my.*money|how.*i.*collect.*my.*money|money.*dey.*where)/i.test(m)) {
    topics.push({ t: 'banking', s: 8 });
  }

  // --- REFUND (before payment) ---
  if (/(refund|return.*money|money.*back|get.*back.*money|cancel.*order.*refund|eYEYE.*back.*my.*money)/i.test(m)) {
    topics.push({ t: 'refund', s: 8 });
  }

  // --- PAYMENT ---
  if (/(pay|payment|checkout|buy|purchase|price|cost|cart|paystack|card|bank\s*transfer|ussd|how.*i.*pay|how.*i.*go.*pay|how.*i.*wan.*pay|wetin.*i.*go.*pay|pay.*for.*order|order.*pay|pay.*order|how.*pay|make.*payment|complete.*payment|pay.*via)/i.test(m)) {
    topics.push({ t: 'payment', s: 6 });
  }

  // --- ORDER ---
  if (/(order|orders|bought|purchased|my.*order|where.*order|track.*order|order.*status|order.*update|show.*order|see.*order|view.*order|order.*number|order.*detail)/i.test(m)) {
    topics.push({ t: 'order', s: 5 });
  }

  // --- KYC / VERIFICATION ---
  if (/(kyc|kyb|verif|bvn|nin|identity|document|submit.*verif|verify.*account|verif.*status|pending.*verif|verif.*process|how.*verify|how.*i.*verify|verify.*my.*account|my.*verif|verif.*fail|verif.*error|verif.*reject|verif.*approve|verif.*pending)/i.test(m)) {
    topics.push({ t: 'kyc', s: 6 });
  }

  // --- DISPUTE ---
  if (/(dispute|complaint|report.*vendor|report.*seller|issue.*order|problem.*order|wrong.*item|damaged|not.*received|missing.*item|bad.*product|fake.*product|not.*as.*described|open.*dispute|create.*dispute|file.*complaint|make.*complaint|how.*dispute|dispute.*process)/i.test(m)) {
    topics.push({ t: 'dispute', s: 6 });
  }

  // --- VENDOR SETUP ---
  if (/(become.*vendor|how.*sell|start.*sell|vendor.*register|register.*vendor|sell.*on|vendor.*account|set.*up.*store|add.*product|list.*product|upload.*product|product.*image|product.*photo|my.*store|store.*setup|how.*i.*sell|vendor.*how)/i.test(m)) {
    topics.push({ t: 'vendor-setup', s: 6 });
  }

  // --- RETAILER ---
  if (/(become.*retailer|how.*source|retailer.*register|register.*retailer|source.*product|wholesale|bulk.*order|retailer.*how|how.*i.*source)/i.test(m)) {
    topics.push({ t: 'retailer-setup', s: 6 });
  }

  // --- DELIVERY / SHIPPING ---
  if (/(deliver|shipping|ship|dispatch|delivery|courier|track.*package|tracking|delivery.*time|delivery.*date|when.*deliver|how.*long.*deliver|shipping.*rate|shipping.*cost|lagos.*deliver|state.*deliver|how.*does.*shipping.*work|how.*shipping.*work|how.*delivery.*work|shipping.*work)/i.test(m)) {
    topics.push({ t: 'delivery', s: 7 });
  }

  // --- REGISTRATION ---
  if (/(register|sign\s*up|create.*account|new.*account|join|create.*profile|how.*register|register.*how|sign.*up.*how|create.*account.*how|join.*ojabridge)/i.test(m)) {
    topics.push({ t: 'registration', s: 5 });
  }

  // --- LOGIN ---
  if (/(login|log\s*in|sign\s*in|password|forgot.*password|reset.*password|can't.*login|cannot.*login|unable.*login|login.*error|login.*fail|not.*login|sign.*in.*error|change.*password|update.*password)/i.test(m)) {
    topics.push({ t: 'login', s: 5 });
  }

  // --- NOTIFICATION ---
  if (/(notification|alert|message|inbox|bell|notify|notification.*setting)/i.test(m)) {
    topics.push({ t: 'notification', s: 4 });
  }

  // --- SETTINGS / ACCOUNT ---
  if (/(setting|account|profile|email|phone|address|update.*info|change.*info|edit.*profile|personal.*info|my.*account|account.*setting|profile.*setting|change.*email|change.*phone)/i.test(m)) {
    topics.push({ t: 'settings', s: 4 });
  }

  // --- SHOP / BROWSE ---
  if (/(categor|shop|browse|search|find.*product|what.*sell|product.*available|product.*list|all.*product|product.*category)/i.test(m)) {
    topics.push({ t: 'shop', s: 4 });
  }

  // --- CONTACT / SUPPORT ---
  if (/(contact|support|help.*me|reach.*you|speak.*someone|talk.*someone|customer.*service|customer.*care|phone.*number|email.*support|how.*contact|how.*reach|how.*speak)/i.test(m)) {
    topics.push({ t: 'contact', s: 4 });
  }

  // --- STORE ---
  if (/(store|shop.*name|brand|logo|store.*setup|setup.*store|store.*setting|my.*store|store.*name|store.*description)/i.test(m)) {
    topics.push({ t: 'store', s: 4 });
  }

  // --- IMAGE / UPLOAD ---
  if (/(image|photo|picture|screenshot|upload|gallery|camera|file|attach)/i.test(m)) {
    topics.push({ t: 'upload', s: 3 });
  }

  // --- REVIEW ---
  if (/(review|rating|star|feedback|comment.*product|rate.*product|write.*review)/i.test(m)) {
    topics.push({ t: 'review', s: 4 });
  }

  // --- HOW IT WORKS (lowest priority, only when no other topic) ---
  if (/(how.*it.*work|how.*does.*work|how.*ojabridge.*work|how.*platform.*work|explain.*platform|what.*is.*ojabridge|about.*ojabridge|ojabridge.*about|ojabridge.*work)/i.test(m)) {
    topics.push({ t: 'how-it-works', s: 2 });
  }

  // --- HELP ---
  if (/^(help|what can you do|capabilities|features|what.*do.*you.*do)/i.test(m) && m.length < 40) {
    topics.push({ t: 'help', s: 3 });
  }

  // Sort by score, return highest
  if (topics.length > 0) {
    topics.sort((a, b) => b.s - a.s);
    return topics[0];
  }

  // No topic detected
  return null;
}

// ============================================
// RESPONSE GENERATOR
// ============================================
function respond(topic, intent, userName) {
  const n = userName || '';

  switch (topic) {
    case 'security':
      if (intent === 'injection') return "I am the OjaBridge AI assistant and I am here to help with platform-related questions. Is there something about OjaBridge I can help you with? 😊";
      if (intent === 'sexual') return "I am an AI assistant for OjaBridge and I am here to help with marketplace-related questions. 😊";
      if (intent === 'threat') return `I take safety very seriously. Please email our support team at ${SUPPORT_EMAIL} and they will help you right away. 😊`;
      if (intent === 'insult') return "I am sorry if something has frustrated you. I want to help make your experience better. Could you tell me what specific issue you are facing? 😊";
      return "I am here to help with OjaBridge platform questions. 😊";

    case 'off-topic':
      return "I am here to help with all things OjaBridge! 😊 Is there anything about the platform I can assist you with?";

    case 'greeting':
      return `${n ? `Hello ${n}!` : 'Hello!'} 👋\n\nWelcome to OjaBridge! I am your AI support assistant and I can help you with shopping, orders, payments, vendor setup, KYC, disputes, and anything else on the platform.\n\nWhat can I help you with today? 😊`;

    case 'thanks': return "You are very welcome! 😊 Come back anytime you need help with OjaBridge. I am always here for you! 💪";
    case 'bye': return "Goodbye! 👋😊 It was great chatting with you! Come back anytime you need help with OjaBridge. Have a wonderful day! ✨";

    case 'identity':
      if (intent === 'who') return "I am your OjaBridge AI support assistant! 😊 I am here to help you with anything on the platform.\n\nHow can I help you today?";
      if (intent === 'my-name' && n) return `Of course I know you, ${n}! 😊 You are logged in and I can see your account.\n\nHow can I help you today? 💪`;
      if (intent === 'my-name') return "I can see you are logged in, but I do not have your name. Could you tell me your name so I can assist you better? 😊";
      return "I am your OjaBridge AI support assistant! 😊";

    case 'followup':
      return intent === 'no'
        ? "No worries! I am here whenever you need help with OjaBridge. Just ask me anything! 😊"
        : "Of course! Could you tell me a bit more about what you need help with? 😊";

    case 'casual': return `Glad you think so! 😊 Is there anything else I can help you with on OjaBridge? 💪`;

    case 'sick': return `I am sorry to hear you are not feeling well! I hope you get better soon. 😔\n\nI am an AI assistant for OjaBridge. You can always email us at ${SUPPORT_EMAIL} and we will get back to you when you are ready. 💪\n\nTake care of yourself! 🙏`;

    case 'smalltalk': return "I am doing great, thank you for asking! 😊 How can I assist you with OjaBridge today? 💪";

    case 'about': return `Great question! ✨\n\nOjaBridge is Nigeria's trusted e-commerce marketplace — the bridge between sellers and buyers! 🌉\n\nThe name comes from "Oja" (market in Yoruba) + "Bridge" — we connect:\n\nCustomers who browse and buy\nVendors who list and sell products\nRetailers who source wholesale products\n\nAll payments are secure through Paystack, every vendor is verified, and buyers are protected. Safe, transparent, and built for Nigeria! 🇳🇬\n\nWant to know more about a specific feature? 😊`;

    case 'delivery-complaint':
      return `I am really sorry you are experiencing this. You deserve to receive what you paid for, and we take delivery issues very seriously.\n\nHere is what I recommend:\n\n1. Check your order status first — visit your dashboard at ${L.orders} to see the current status.\n\n2. Create a Dispute — If the order shows a problem, open a dispute:\n   Go to ${L.disputes}\n   Select the order and describe exactly what happened.\n\n3. Contact Support — For faster resolution, email us at ${SUPPORT_EMAIL}\n   Include your order number, vendor name, and a description of the issue.\n\nWe will investigate and make sure this gets resolved for you. 💪`;

    case 'banking':
      return `Here is how payouts work on OjaBridge:\n\nOnce your order is delivered and confirmed by the customer, the payment goes to your wallet. You can then request a withdrawal to your linked bank account.\n\nThe process is:\n1. Customer confirms delivery\n2. Payment moves to your wallet (after 10% platform commission)\n3. You request a withdrawal\n4. Funds arrive in your bank account within 1-3 business days\n\nMake sure your KYC is fully verified and your bank details are correct in your Store Settings.\n\nIf you have issues, email us at ${SUPPORT_EMAIL} 😊`;

    case 'refund':
      return `Here is how refunds work on OjaBridge:\n\n• Full refund if order not delivered on time\n• Full refund if item significantly differs from description\n• Refund processed in 5-10 business days to original payment method\n\nTo request a refund, open a dispute at ${L.disputes} and describe the issue. Our team will review and process it.\n\nFor immediate help, email us at ${SUPPORT_EMAIL} 😊`;

    case 'payment':
      return `Here is how payments work on OjaBridge! 💳\n\n1. Browse products at ${L.shop} and add them to your cart\n2. Go to checkout\n3. Pay via Paystack — you can use card, bank transfer, or USSD\n4. Payment is confirmed instantly!\n\nYour money is held safely until you confirm delivery. This is our Buyer Protection policy — you are always covered! 🛡️\n\nThe platform charges a 10% commission on successful transactions. Vendor payouts happen after delivery confirmation.\n\nAny specific questions about payments? 😊`;

    case 'order':
      return `You can check your order status anytime from your dashboard:\n\n${L.orders}\n\nEach order shows its current status — from Processing through Shipped to Delivered.\n\nIf something looks wrong with your order, you can open a dispute from there, and our team will look into it right away.\n\nNeed help with anything specific about your order? 😊`;

    case 'kyc':
      return `KYC/KYB verification is required before you can start selling or sourcing on OjaBridge.\n\nHere are the steps:\n\nStep 1 — Personal Information: Full legal name and date of birth\n\nStep 2 — Identity Verification:\n• BVN (dial *565*0# on your phone to get it)\n• NIN (dial *346# on your NIMC app to get it)\n• Both BVN and NIN are required\n\nStep 3 — Bank Account: Bank name, account number, and account name (must match your registered name)\n\nStep 4 — Business Information: Business name and RC number from CAC (Corporate Affairs Commission)\n\nAfter submission, admin reviews within 1-3 business days. You will be notified once approved.\n\nNeed help with any step? 😊`;

    case 'dispute':
      return `Here is how to create a dispute on OjaBridge:\n\n1. Go to ${L.disputes}\n2. Click "Open New Dispute"\n3. Select the order you have an issue with\n4. Choose a reason (product not received, damaged, wrong item, etc.)\n5. Describe the issue in detail\n6. Submit\n\nOur team reviews disputes within 3-5 business days. You will be notified of the resolution.\n\nIf you need immediate help, email us at ${SUPPORT_EMAIL} with your order details. 😊`;

    case 'vendor-setup':
      return `Great choice! Here is how to become a vendor on OjaBridge:\n\n1. Register at ${L.register} — choose "Vendor" as your role\n2. Verify your email with the code we send\n3. Complete your KYC/KYB verification:\n   • Personal info (name, date of birth)\n   • Identity (BVN and NIN — both required)\n   • Bank account details\n   • Business info (business name, RC number from CAC)\n4. Admin reviews within 1-3 business days\n5. Once approved, set up your store and add products\n\nStart selling and earning! 🚀\n\nNeed help with any step? 😊`;

    case 'retailer-setup':
      return `Here is how to become a retailer on OjaBridge:\n\n1. Register at ${L.register} — choose "Retailer" as your role\n2. Verify your email\n3. Complete KYC/KYB (same steps as vendor)\n4. Browse wholesale products from verified vendors\n5. Place bulk orders and source products\n\nStart sourcing and selling! 🚀\n\nNeed help with any step? 😊`;

    case 'delivery':
      return `Here is how delivery works on OjaBridge:\n\nLagos: 1-3 business days\nOther states: 3-7 business days\n\nShipping rates are set by each vendor. You will receive tracking information once your order is shipped.\n\nIf your order is delayed or not delivered on time, you can open a dispute from your dashboard or email us at ${SUPPORT_EMAIL}.\n\nNeed help with a specific order? 😊`;

    case 'registration':
      return `Signing up on OjaBridge is super easy! 🎉\n\n1. Go to ${L.register}\n2. Choose your role — Customer, Vendor, or Retailer\n3. Fill in your details (name, email, phone, password)\n4. Verify your email with the code we send\n5. You are in! 🎉\n\nTip: Choose Vendor to sell, Retailer to source wholesale, Customer to shop!\n\nNeed help with any step? 😊`;

    case 'login':
      return `Here is how to log in:\n\n1. Go to ${L.login}\n2. Enter your email and password\n3. If not verified, enter the verification code sent to your email\n4. You are in! 🎉\n\nForgot password? Click "Forgot Password" on the login page.\n\nNeed anything else? 😊`;

    case 'notification':
      return `You can view your notifications from your dashboard. Notifications include:\n\n• Order updates (confirmed, shipped, delivered)\n• Dispute updates (status changes, resolutions)\n• Account updates (KYC approval, settings changes)\n• Platform announcements\n\nIf you are not receiving notifications, check your email settings or email us at ${SUPPORT_EMAIL} 😊`;

    case 'settings':
      return `You can manage your account settings from your dashboard:\n\n• Update your profile information\n• Change your password\n• Manage delivery addresses (customers)\n• Update store settings (vendors)\n• View and update KYC status\n\nGo to your dashboard and look for the Settings or Profile section. Need help with a specific setting? 😊`;

    case 'shop':
      return `You can browse products on OjaBridge at ${L.shop}\n\nProducts are organized by categories to help you find what you need. You can also search for specific products using the search bar.\n\nWant to know about a specific category? 😊`;

    case 'contact':
      return `You can reach our support team through:\n\nEmail: ${SUPPORT_EMAIL}\nContact page: ${L.contact}\nFAQ: ${L.faq}\n\nWe typically respond within 24 hours. For urgent issues, please include your order number and a clear description of the problem.\n\nI am also here to help with any OjaBridge questions! 😊`;

    case 'store':
      return `To set up your store on OjaBridge:\n\n1. Go to your Vendor Dashboard → Store Settings\n2. Add your store name and description\n3. Upload your store logo\n4. Set your shipping rates and policies\n5. Save your settings\n\nYour store information will be visible to customers when they browse your products.\n\nNeed help with any step? 😊`;

    case 'upload':
      return `You can upload images directly from your phone or laptop when:\n\n• Adding products (Vendor Dashboard → Products → Add Product)\n• Submitting KYC documents\n• Creating disputes (attach evidence)\n\nJust click the image icon or upload button and select the file from your device.\n\nNeed help with a specific upload? 😊`;

    case 'review':
      return `You can leave reviews for products you have purchased on OjaBridge:\n\n1. Go to your Orders dashboard\n2. Find the delivered order\n3. Click "Write a Review"\n4. Rate the product and share your experience\n\nYour review helps other customers make informed decisions.\n\nNeed help with anything else? 😊`;

    case 'how-it-works':
      return `Here is how OjaBridge works:\n\n1. Customers browse and buy products from verified vendors\n2. Payments are processed securely through Paystack\n3. Money is held safely until delivery is confirmed\n4. Vendors prepare and ship the order\n5. Customer receives and confirms delivery\n6. Vendor gets paid after confirmation\n\nIf there is any issue, customers can open a dispute and our team will resolve it.\n\nWant to know more about a specific part? 😊`;

    case 'help':
      return `I can help you with:\n\n• Shopping — Find products, place orders, track deliveries\n• Vendors — How to become a vendor, KYC, product listing\n• Retailers — Sourcing products, bulk orders\n• Payments — How Paystack payments work\n• Shipping — Delivery times and tracking\n• Disputes — Report issues, get refunds\n• KYC — Verification help for vendors and retailers\n• Account — Settings, password, profile\n\nYou can also send me screenshots of any issues!\n\nJust ask me anything about OjaBridge! 💪`;

    default:
      return `Hey${n ? ' ' + n : ''}! 😊 I want to make sure I understand what you need.\n\nCould you tell me a bit more about what you are looking for?\n\nI am here to help with anything on OjaBridge — shopping, orders, payments, vendor setup, KYC, disputes, and more! Just tell me what is going on and I will do my best to assist you. 💪\n\nIf it is urgent, you can also email us at ${SUPPORT_EMAIL} and we will get back to you quickly!`;
  }
}

// ============================================
// SMART FALLBACK — Only catches security/greetings/simple
// Everything else goes to OpenAI (or last-resort classify)
// ============================================
function getSmartFallback(message, userName, userRole, context = []) {
  const msg = message.toLowerCase().trim();
  const lastAiMsg = context.filter(m => m.role === 'assistant').pop()?.content?.toLowerCase() || '';

  // SECURITY
  if (detectPromptInjection(msg)) return "I am the OjaBridge AI assistant and I am here to help with platform-related questions. 😊";
  const inap = detectInappropriate(msg);
  if (inap === 'sexual') return "I am an AI assistant for OjaBridge. Is there something about the platform I can help you with? 😊";
  if (inap === 'threat') return `I take safety very seriously. Please email our support team at ${SUPPORT_EMAIL} and they will help you right away. 😊`;
  if (inap === 'insult') return "I am sorry if something has frustrated you. I want to help make your experience better. Could you tell me what specific issue you are facing? 😊";

  // OFF-TOPIC
  if (/\b(president|government|election|politics|religion|football|soccer|nba|epl|weather|music|song|movie|netflix|crypto|bitcoin|stock|forex|tiktok|instagram)\b/i.test(msg) && !/ojabridge|vendor|order|pay|deliver/i.test(msg)) {
    return "I am here to help with all things OjaBridge! 😊 Is there anything about the platform I can assist you with?";
  }

  // GREETINGS
  if (/^(hi|hello|hey|howdy|good\s*(morning|afternoon|evening)|yo|sup|greetings|hiya|wassup|whats?\s*up)/i.test(msg)) {
    return `${userName ? `Hello ${userName}!` : 'Hello!'} 👋\n\nWelcome to OjaBridge! I am your AI support assistant and I can help you with shopping, orders, payments, vendor setup, KYC, disputes, and anything else on the platform.\n\nWhat can I help you with today? 😊`;
  }

  // THANKS
  if (/^thank|thanks|thx|appreciate/i.test(msg)) return "You are very welcome! 😊 Come back anytime you need help with OjaBridge. I am always here for you! 💪";

  // BYE
  if (/^(bye|goodbye|see you|later|take care)/i.test(msg)) return "Goodbye! 👋😊 It was great chatting with you! Come back anytime you need help with OjaBridge. Have a wonderful day! ✨";

  // NAME
  if (/who are you|what are you|your name/i.test(msg)) return "I am your OjaBridge AI support assistant! 😊 I am here to help you with anything on the platform.\n\nHow can I help you today?";
  if (/my\s*name|name\s*\?|who\s+am\s+i|call\s+me|know\s+me|remember\s+me|what.*name|tell.*name|whats.*my|what's.*my/i.test(msg)) {
    if (userName) return `Of course I know you, ${userName}! 😊 You are logged in and I can see your account.\n\nHow can I help you today? 💪`;
    return "I can see you are logged in, but I do not have your name. Could you tell me your name so I can assist you better? 😊";
  }

  // FOLLOW-UPS
  if (/^(yes|yeah|yep|yup|ok|okay|sure|definitely|please|go ahead|tell me|show me)$/i.test(msg)) return null;
  if (/^(no|nah|nope|not.?really|nothing|nvm|never.?mind)$/i.test(msg)) return null;

  // CASUAL
  if (/^(lol|haha|hehe|ok then|alright|cool|nice|great|awesome|wow|omg|smh|brb|gtg|nvm|np|ty|thx|tysm)$/i.test(msg)) return null;

  // EVERYTHING ELSE → OpenAI handles it
  return null;
}

// ============================================
// USER DATA TOOLS
// ============================================
async function getUserOrders(userId) {
  if (!isDatabaseConnected()) return [];
  try { const { data } = await dbQuery('orders', { filter: { user_id: userId }, order: { column: 'created_at', ascending: false }, limit: 10 }); return (data || []).map(o => ({ id: o.id, order_number: o.order_number, status: o.status, total: o.total, created_at: o.created_at })); } catch { return []; }
}
async function getUserDisputes(userId) {
  if (!isDatabaseConnected()) return [];
  try { const { data } = await dbQuery('disputes', { filter: { raised_by: userId }, order: { column: 'created_at', ascending: false }, limit: 5 }); return (data || []).map(d => ({ id: d.id, reason: d.reason, status: d.status, created_at: d.created_at })); } catch { return []; }
}
async function getVendorPayouts(userId) {
  if (!isDatabaseConnected()) return [];
  try { const { data: v } = await dbQuery('vendors', { filter: { user_id: userId } }); if (!v?.length) return []; const { data } = await dbQuery('payouts', { filter: { vendor_id: v[0].id }, order: { column: 'created_at', ascending: false }, limit: 5 }); return (data || []).map(p => ({ id: p.id, amount: p.amount, status: p.status, created_at: p.created_at })); } catch { return []; }
}
async function getUserKycStatus(userId, role) {
  if (!isDatabaseConnected()) return null;
  try { if (role === 'vendor' || role === 'retailer') { const { data } = await dbQuery('vendors', { filter: { user_id: userId } }); if (data?.[0]) return { status: data[0].kyc_status || data[0].verification_status || 'not_submitted', submitted_at: data[0].kyc_submitted_at || data[0].created_at, business_name: data[0].business_name }; } return null; } catch { return null; }
}
async function getUserProducts(userId) {
  if (!isDatabaseConnected()) return [];
  try { const { data: v } = await dbQuery('vendors', { filter: { user_id: userId } }); if (!v?.length) return []; const { data } = await dbQuery('products', { filter: { vendor_id: v[0].id }, order: { column: 'created_at', ascending: false }, limit: 10 }); return (data || []).map(p => ({ name: p.name, status: p.status, price: p.price })); } catch { return []; }
}
async function getUserNotifications(userId) {
  if (!isDatabaseConnected()) return [];
  try { const { data } = await dbQuery('notifications', { filter: { user_id: userId }, order: { column: 'created_at', ascending: false }, limit: 5 }); return (data || []).map(n => ({ title: n.title, message: n.message, read: n.read, created_at: n.created_at })); } catch { return []; }
}
async function getUserReviews(userId) {
  if (!isDatabaseConnected()) return [];
  try { const { data: v } = await dbQuery('vendors', { filter: { user_id: userId } }); if (!v?.length) return []; const { data } = await dbQuery('reviews', { filter: { vendor_id: v[0].id }, order: { column: 'created_at', ascending: false }, limit: 5 }); return (data || []).map(r => ({ rating: r.rating, comment: r.comment, created_at: r.created_at })); } catch { return []; }
}
async function fetchAllUserData(userId, userRole) {
  if (!userId || !isDatabaseConnected()) return '';
  const parts = [];
  const orders = await getUserOrders(userId); if (orders.length > 0) parts.push(`[USER'S ORDERS]\n${orders.map(o => `Order ${o.order_number || o.id}: Status=${o.status}, Total=N${o.total}, Date=${new Date(o.created_at).toLocaleDateString()}`).join('\n')}`);
  const disputes = await getUserDisputes(userId); if (disputes.length > 0) parts.push(`[USER'S DISPUTES]\n${disputes.map(d => `Dispute: Reason=${d.reason}, Status=${d.status}, Date=${new Date(d.created_at).toLocaleDateString()}`).join('\n')}`);
  if (userRole === 'vendor' || userRole === 'retailer') { const kyc = await getUserKycStatus(userId, userRole); if (kyc) parts.push(`[USER'S KYC STATUS]\nStatus: ${kyc.status}\nBusiness: ${kyc.business_name || 'Not set'}`); }
  if (userRole === 'vendor') {
    const payouts = await getVendorPayouts(userId); if (payouts.length > 0) parts.push(`[USER'S PAYOUTS]\n${payouts.map(p => `Payout: Amount=N${p.amount}, Status=${p.status}`).join('\n')}`);
    const products = await getUserProducts(userId); if (products.length > 0) parts.push(`[USER'S PRODUCTS]\n${products.map(p => `${p.name}: Status=${p.status}, Price=N${p.price}`).join('\n')}`);
    const reviews = await getUserReviews(userId); if (reviews.length > 0) parts.push(`[USER'S REVIEWS]\n${reviews.map(r => `Rating: ${r.rating}/5 — "${r.comment || 'No comment'}"`).join('\n')}`);
  }
  const notifs = await getUserNotifications(userId); if (notifs.length > 0) { const unread = notifs.filter(n => !n.read).length; parts.push(`[USER'S NOTIFICATIONS]\n${unread} unread out of ${notifs.length} total\nLatest: ${notifs[0]?.title || 'N/A'}`); }
  return parts.length > 0 ? '\n\n' + parts.join('\n\n') : '';
}

// ============================================
// API HANDLERS
// ============================================
export async function POST(request) {
  try {
    await ensureChatTables();
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const now = Date.now();
    if (!rateLimit.has(ip)) rateLimit.set(ip, []);
    const requests = rateLimit.get(ip).filter(t => now - t < 60000);
    if (requests.length >= 20) return NextResponse.json({ success: false, error: 'You are sending too many messages. Please wait a moment and try again.' }, { status: 429 });
    requests.push(now); rateLimit.set(ip, requests);

    const authUser = await getUserFromRequest(request);
    let userRole = authUser?.role || null;
    let userName = authUser?.name?.split(' ')[0] || null;
    let userId = authUser?.id || null;

    const body = await request.json();
    let { message, conversationId, image, conversationContext, clientUser } = body;
    message = sanitizeInput(message);
    if (!message && !image) return NextResponse.json({ success: false, error: 'Message is required' }, { status: 400 });

    const emotion = detectEmotion(message || '');
    const emotionPrefix = getEmotionPrefix(emotion);

    if (!userId && clientUser?.id) { userId = clientUser.id; userRole = clientUser.role || null; userName = clientUser.name?.split(' ')[0] || null; }

    if (userName && /^(ojabridge|admin|user|test|vendor|retailer|customer)$/i.test(userName)) userName = null;
    if (!userName && userId && isDatabaseConnected()) { try { const { data: ud } = await dbQuery('users', { filter: { id: userId }, limit: 1 }); if (ud?.[0]?.name && !/^(ojabridge|admin|user|test|vendor|retailer|customer)$/i.test(ud[0].name)) userName = ud[0].name.split(' ')[0]; } catch {} }
    if (!userName && authUser?.email) userName = authUser.email.split('@')[0];
    if (!userName && clientUser?.email) userName = clientUser.email.split('@')[0];

    let convId = conversationId; let history = [];
    if (isDatabaseConnected()) {
      if (convId) { const { data: msgs } = await dbQuery('chat_messages', { filter: { conversation_id: convId }, order: { column: 'created_at', ascending: true }, limit: 30 }); history = (msgs || []).map(m => ({ role: m.role, content: m.content })); }
      else { const { data: conv } = await dbInsert('chat_conversations', { user_id: userId, user_role: userRole, created_at: new Date().toISOString() }); if (conv) convId = conv.id; }
      if (convId) await dbInsert('chat_messages', { conversation_id: convId, role: 'user', content: message || (image ? '[Image attached]' : ''), image_url: image || null, created_at: new Date().toISOString() });
    }

    const lowerMsg = (message || '').toLowerCase();
    const isPersonalQuery = /my|me|mine|account|order|dispute|payout|wallet|balance|product|review|notification|kyc|verify|profile|setting|address|favorite|password|security|earn|money|bank|status|history|recent/i.test(lowerMsg) && !/become.*vendor|how.*to.*become|register|sign.*up|what.*is.*ojabridge|how.*does.*it.*work/i.test(lowerMsg);
    let userDataContext = '';
    if (userId && isDatabaseConnected() && isPersonalQuery) userDataContext = await fetchAllUserData(userId, userRole);

    // LAYER 1: Smart fallback (security/greetings only)
    const fallbackReply = !image ? getSmartFallback(message, userName, userRole, conversationContext || []) : null;
    const apiKey = process.env.OPENAI_API_KEY;
    let aiReply = fallbackReply ? emotionPrefix + fallbackReply : null;

    // LAYER 2: OpenAI (if API key exists and no fallback matched)
    if (!aiReply && apiKey) {
      try {
        let userContent = image ? [{ type: 'text', text: message || 'Analyze this image.' }, { type: 'image_url', image_url: { url: image, detail: 'low' } }] : message;
        const systemPrompt = buildSystemPrompt({ userRole, userName }) + userDataContext;
        const messages = [{ role: 'system', content: systemPrompt }, ...history.slice(-15), { role: 'user', content: userContent }];
        const response = await fetch('https://api.openai.com/v1/chat/completions', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` }, body: JSON.stringify({ model: 'gpt-4o-mini', messages, max_tokens: 800, temperature: 0.7 }) });
        if (response.ok) { const data = await response.json(); const rawReply = data.choices?.[0]?.message?.content; if (rawReply) aiReply = emotionPrefix + rawReply; }
        else { const errData = await response.json().catch(() => ({})); console.error('OpenAI error:', response.status, errData.error?.type || '', errData.error?.message || ''); }
      } catch (err) { console.error('OpenAI connection error:', err.message); }
    }

    // LAYER 3: Rule-based fallback (when OpenAI is unavailable)
    if (!aiReply) {
      const c = classify(lowerMsg);
      if (c) aiReply = emotionPrefix + respond(c.t, c.i, userName);
      else { const nm = userName ? ' ' + userName : ''; aiReply = `Hey${nm}! 😊 I want to make sure I understand what you need.\n\nCould you tell me a bit more about what you are looking for?\n\nI am here to help with anything on OjaBridge — shopping, orders, payments, vendor setup, KYC, disputes, and more! Just tell me what is going on and I will do my best to assist you. 💪\n\nIf it is urgent, you can also email us at ${SUPPORT_EMAIL} and we will get back to you quickly!`; }
    }

    if (isDatabaseConnected() && convId) await dbInsert('chat_messages', { conversation_id: convId, role: 'assistant', content: aiReply, created_at: new Date().toISOString() });

    return NextResponse.json({ success: true, reply: aiReply, conversationId: convId });
  } catch (error) {
    console.error('Chat API error:', error.message);
    return NextResponse.json({ success: false, error: `Oops! I am having a tiny technical hiccup right now. 😅 Try again in a moment, or email us at ${SUPPORT_EMAIL} and we will get back to you quickly. 💪` }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    await ensureChatTables();
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversationId');
    if (!conversationId) {
      if (!isDatabaseConnected()) return NextResponse.json({ success: true, messages: [] });
      const authUser = await getUserFromRequest(request); let userId = authUser?.id || null;
      if (!userId) { try { const c = searchParams.get('clientUserId'); if (c) userId = c; } catch {} }
      if (!userId) return NextResponse.json({ success: true, messages: [] });
      const { data: convs } = await dbQuery('chat_conversations', { filter: { user_id: userId }, order: { column: 'updated_at', ascending: false }, limit: 1 });
      if (!convs?.length) return NextResponse.json({ success: true, messages: [] });
      const { data: messages } = await dbQuery('chat_messages', { filter: { conversation_id: convs[0].id }, order: { column: 'created_at', ascending: true }, limit: 50 });
      return NextResponse.json({ success: true, messages: messages || [], conversationId: convs[0].id });
    }
    if (!isDatabaseConnected()) return NextResponse.json({ success: true, messages: [], dbConnected: false });
    const authUser = await getUserFromRequest(request);
    if (authUser) { const { data: conv } = await dbQuery('chat_conversations', { filter: { id: conversationId } }); if (conv?.[0]?.user_id && conv[0].user_id !== authUser.id && authUser.role !== 'admin') return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 }); }
    const { data: messages, error } = await dbQuery('chat_messages', { filter: { conversation_id: conversationId }, order: { column: 'created_at', ascending: true }, limit: 50 });
    if (error) return NextResponse.json({ success: false, error }, { status: 500 });
    return NextResponse.json({ success: true, messages: messages || [] });
  } catch { return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 }); }
}
