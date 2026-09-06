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

  // Get the last AI message for context-aware follow-ups
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

  // === FOLLOW-UP: YES / NO / OK / SHORT REPLIES ===
  // Check if last AI message asked a question — respond contextually
  if (/^(yes|yeah|yep|yup|ok|okay|sure|definitely|please|go ahead|tell me|show me)$/i.test(msg)) {
    if (/kyc|verification|verify|bvn|nin|identity/i.test(lastAiMsg)) {
      return `Absolutely! Let me walk you through it step by step. 😊\n\nHere is what you need for KYC verification:\n\nStep 1 — Personal Info\nFull legal name and date of birth\n\nStep 2 — Identity\nBVN (dial *565*0# on your phone)\nNIN (dial *346# or check NIMC app)\nBoth are required\n\nStep 3 — Bank Account\nYour bank name, account number, and account name\n\nStep 4 — Business Info\nBusiness name and RC number from CAC\n\nAfter you submit, admin reviews within 1-3 business days. Which step are you on? I can help with any specific part! 💪`;
    }
    if (/order|delivery|ship/i.test(lastAiMsg)) {
      return `Great! You can check your order status anytime from your dashboard:\n\n${SAFE_LINKS.orders}\n\nEach order shows its current status. If anything looks wrong, you can open a dispute from there. Need help with anything specific? 😊`;
    }
    if (/dispute|complaint|report/i.test(lastAiMsg)) {
      return `Perfect! Here is how to create a dispute:\n\n1. Go to ${SAFE_LINKS.disputes}\n2. Click "Open New Dispute"\n3. Select the order with the issue\n4. Choose a reason and describe what happened\n5. Submit — our team reviews within 3-5 business days\n\nIf you need faster help, email us at ${SUPPORT_EMAIL}. We are here for you! 💪`;
    }
    if (/register|sign.?up|create.*account/i.test(lastAiMsg)) {
      return `Awesome! Head to ${SAFE_LINKS.register} to get started. 🎉\n\nRemember to verify your email after signing up — check your inbox for the code. Let me know if you get stuck on any step! 😊`;
    }
    if (/payment|pay|checkout/i.test(lastAiMsg)) {
      return `Great! When you are ready to pay, you will see Paystack at checkout. You can use card, bank transfer, or USSD. Your money is held safely until you confirm delivery. 🛡️\n\nNeed help with anything else? 😊`;
    }
    if (/refund/i.test(lastAiMsg)) {
      return `I will help you with that! Go to ${SAFE_LINKS.disputes} and create a dispute for the order you need a refund for. Describe the issue and our team will review it.\n\nIf it is urgent, email us at ${SUPPORT_EMAIL} with your order details. We will make sure you are taken care of! 💪`;
    }
    // Generic yes — ask what they need
    return `Of course! What would you like help with? 😊\n\nI can assist with shopping, orders, payments, vendor setup, KYC, shipping, disputes — anything on OjaBridge!`;
  }

  if (/^(no|nah|nope|not.?really|nothing|nvm|never.?mind)$/i.test(msg)) {
    if (/kyc|verification|verify|bvn|nin/i.test(lastAiMsg)) {
      return `No problem at all! Take your time. When you are ready to complete your KYC, just come back and I will walk you through it. 😊\n\nIf you have any other questions about OjaBridge, I am always here to help! 💪`;
    }
    // Generic no
    return `No worries! Is there anything else I can help you with on OjaBridge? 😊\n\nI am here whenever you need me!`;
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
  const nameMatch = msg.match(/^my name is\s+([a-z]+)/i);
  if (nameMatch && nameMatch[1].length > 1 && !/(sick|ill|tired|fine|good|bad|new|old|busy|ok)/i.test(nameMatch[1])) {
    const capName = nameMatch[1].charAt(0).toUpperCase() + nameMatch[1].slice(1);
    return `Nice to meet you, ${capName}! 😊\n\nHow can I help you on OjaBridge? Whether you want to shop, become a vendor, source products as a retailer, or have a question about the platform — I am here for you! 💪`;
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

  // === DISPUTES / COMPLAINTS / PROBLEMS ===
  if (/dispute|complaint|issue|problem|not\s*working|broken|error|bug|glitch/i.test(msg)) {
    // Check if it sounds like a real complaint (has emotional or specific language)
    const isEmotional = /frustrated|angry|annoyed|terrible|worst|unfair|ridiculous|fed up|sick of/i.test(msg);
    const prefix = isEmotional ? "I completely understand your frustration, and I am truly sorry you are dealing with this. You deserve better. " : "I am sorry you are facing an issue. ";
    return `${prefix}Let me help you get this sorted! 😊\n\nHere is what you can do:\n\n1. Create a Dispute — Describe your issue and our team will review it:\n   ${SAFE_LINKS.disputes}\n\n2. Email Support — For personal assistance:\n   ${SUPPORT_EMAIL}\n\nTell us exactly what happened and we will help you right away. We take every issue seriously. 💪`;
  }

  // === REPORT A VENDOR/SELLER ===
  if (/report.*(vendor|seller|shop|store|product)|bad.*(vendor|seller)|fake.*(vendor|seller|product|shop)|counterfeit|report.*(him|her|them|this)/i.test(msg)) {
    return QUICK_RESPONSES.reportVendor;
  }

  // === VENDOR/DELIVERY COMPLAINTS ===
  if (/vendor.*(didn.t|did not|hasn.t|has not|not).*(deliver|ship|send)|vendor.*(ignore|ignoring|not responding|rude|bad|scam|fraud|cheat|fake|terrible|worst)|(didn.t|did not|hasn.t|has not).*(deliver|ship).*(product|order|item|package)|not received|never received|order.*(missing|lost)|product.*(not.*arriv|missin|lost)|delivery.*(problem|issue|delay|fail)|my.*vendor|order.*not.*come|goods.*not.*arrive|item.*not.*deliver/i.test(msg)) {
    return QUICK_RESPONSES.complaintDelivery;
  }

  // === REFUND ===
  if (/refund|money\s+back|return.*money|want.*money|paid.*but|charge|overcharge|wrong\s*amount/i.test(msg)) {
    return `I completely understand your concern about the payment. Let me help you get this resolved! 😊\n\nHere is how refunds work on OjaBridge:\n\nFull refund if:\n- Your order was not delivered within the estimated time\n- The item significantly differs from the description\n\nHow to request a refund:\n1. Go to your dashboard, then Disputes: ${SAFE_LINKS.disputes}\n2. Click "Open New Dispute"\n3. Select the order and describe the issue\n4. Our team resolves within 3-5 business days\n5. Refund processed to your original payment method within 5-10 business days\n\nFor urgent payment issues, email us directly:\n${SUPPORT_EMAIL}\n\nWe will make sure you are taken care of. 💪`;
  }

  // === LOST / STOLEN / SCAMMED / CHEATED ===
  if (/\b(lost|stolen|scammed|fraud|cheat|fake|not.*real|not.*legit|rip\s*off|cheated)\b/i.test(msg)) {
    return `I am so sorry to hear this. I understand how upsetting this must be, and I want to help you get this resolved immediately. 😔\n\nHere is what to do right away:\n\n1. Create a Dispute immediately:\n   ${SAFE_LINKS.disputes}\n   Describe exactly what happened — include dates, amounts, and any evidence.\n\n2. Email our support team for priority handling:\n   ${SUPPORT_EMAIL}\n   Subject: Urgent — Fraud/Scam Report\n\n3. Do not send any more money to anyone until this is resolved.\n\nWe protect our buyers through our Buyer Protection policy. Your funds are held safely until delivery is confirmed. We will investigate and help you get this sorted. 💪`;
  }

  // === VENDOR ===
  if (/vendor|sell|become.*vendor|start.*sell|store|set.*up.*store/i.test(msg)) {
    return `Becoming a vendor on OjaBridge is straightforward! Here is the journey:\n\n1. Register at ${SAFE_LINKS.register} and choose "Vendor"\n2. Complete your KYC verification (BVN, NIN, bank, RC number)\n3. Wait for admin approval (1-3 business days)\n4. Set up your store — name, description, logo\n5. Add your products with images\n6. Start receiving orders and making sales! 🎉\n\nThe most important step is getting your KYC right. Which part would you like help with? 😊`;
  }

  // === KYC FAILURE / ERROR (must come before generic KYC) ===
  if (/kyc|verification|verify|bvn|nin|identity|verif/i.test(msg) && /fail|error|reject|denied|wrong|invalid|problem|issue|not.*work|stuck|can't|cannot|unable|didn't.*work|doesn't.*work/i.test(msg) && !/login/i.test(msg)) {
    return `I am sorry your verification did not go through. I know how frustrating that can be — let me help you get it sorted! 😔\n\nHere are the most common reasons verification fails and how to fix them:\n\n**BVN Issues:**\n- Make sure your BVN matches the name you registered with on OjaBridge\n- Double-check you entered all 11 digits correctly\n- Dial *565*0# to confirm your BVN if unsure\n\n**NIN Issues:**\n- Ensure your NIN matches your registered name\n- Check all 11 digits are correct\n- Dial *346# to confirm your NIN\n\n**Bank Account Issues:**\n- Account name must match your registered name exactly\n- Make sure the account number is correct for your chosen bank\n\n**General:**\n- All names must match across BVN, NIN, and bank account\n- Try re-submitting with the corrected details\n\nIf it still does not work after checking these, please email us at ${SUPPORT_EMAIL} with a screenshot of the error and we will investigate for you. 💪\n\nWould you like me to walk you through any specific step?`;
  }

  // === KYC (generic — asking about the process) ===
  if (/kyc|verification|verify|bvn|nin|identity|verif/i.test(msg) && !/login/i.test(msg)) {
    return `KYC verification is required before you can start selling or sourcing on OjaBridge. Here is what you need:\n\nStep 1 — Personal Info: Full name and date of birth\nStep 2 — Identity: BVN (dial *565*0#) AND NIN (dial *346#) — both required\nStep 3 — Bank Account: Bank name, account number, account name\nStep 4 — Business: Business name and RC number from CAC\n\nAfter submission, admin reviews within 1-3 business days. You will be notified once approved.\n\nWhich step do you need help with? I can walk you through any part of it! 😊`;
  }

  // === ORDER FAILURE / NOT WORKING ===
  if (/order.*(fail|error|not.*work|broken|problem|issue|stuck)/i.test(msg)) {
    return `I am sorry your order is having issues. Let me help you figure out what is going on. 😔\n\nHere is what you can do:\n\n1. Check your order status first:\n   ${SAFE_LINKS.orders}\n\n2. If something looks wrong, open a dispute:\n   ${SAFE_LINKS.disputes}\n\n3. For immediate help, email us at:\n   ${SUPPORT_EMAIL}\n\nInclude your order number and a description of the issue. We will resolve it quickly! 💪`;
  }

  // === ORDER STATUS ===
  if (/order.*(status|track|where|when)|track.*order|where.*order|when.*deliver|where.*my.*order/i.test(msg)) {
    return `You can check your order status anytime from your dashboard:\n\n${SAFE_LINKS.orders}\n\nEach order shows its current status — from Processing through Shipped to Delivered.\n\nIf something looks wrong with your order, you can open a dispute from there. Need help with anything specific? 😊`;
  }

  // === CANCEL ORDER ===
  if (/cancel.*order|order.*cancel/i.test(msg)) {
    return `To cancel an order:\n\n1. Go to your orders: ${SAFE_LINKS.orders}\n2. Find the order you want to cancel\n3. Click "Cancel Order"\n\nNote: You can only cancel orders that are still Processing. Once shipped, you will need to create a dispute instead.\n\nNeed help? 😊`;
  }

  // === CONTACT ===
  if (/contact|email|reach|phone|call|talk.*someone|speak.*someone|human|agent|real\s*person/i.test(msg)) {
    return `I would love to connect you with our team! 🤝\n\nEmail us at: ${SUPPORT_EMAIL}\n\nYou can also visit our contact page: ${SAFE_LINKS.contact}\n\nOur team typically responds within 24 hours during business days. We are here to help! 😊`;
  }

  // === PAYOUT / WITHDRAW ===
  if (/withdraw|payout|wallet|bank.*account|money.*account|earn|balance/i.test(msg)) {
    return QUICK_RESPONSES.vendorPayout;
  }

  // === HOW IT WORKS ===
  if (/how\s+(it\s+)?works|how\s+does\s+ojabridge|process|flow/i.test(msg) && msg.length < 50) {
    return `Here is how OjaBridge works! 🌉\n\nFor Customers:\n1. Browse products on our Shop\n2. Add items to your cart\n3. Checkout and pay securely via Paystack\n4. Track your order from your dashboard\n5. Receive your order and confirm delivery\n\nFor Vendors:\n1. Register and complete KYC verification\n2. Set up your store\n3. Add products with images\n4. Receive and process orders\n5. Ship and get paid\n\nEverything is secure, transparent, and designed for Nigeria! 🇳🇬\n\nWant to know more about a specific part? 😊`;
  }

  // === SHIPPING ===
  if (/^(shipping|delivery|deliver|track|how\s+long)/i.test(msg) || /^(how|when)\s*(will|is|does)\s*(my|the|delivery|shipping)/i.test(msg)) {
    return `Shipping information! 🚚\n\nDelivery times:\n- Lagos: 1-3 business days\n- Other states: 3-7 business days\n\nTrack your order: ${SAFE_LINKS.orders}\n\nShipping rates are set by each vendor. If you have concerns about a delivery, you can always open a dispute.\n\nNeed help? 😊`;
  }

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
    // First get vendor profile
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
    const userRole = authUser?.role || null;
    const userName = authUser?.name?.split(' ')[0] || null;
    const userId = authUser?.id || null;

    const body = await request.json();
    let { message, conversationId, image, conversationContext } = body;
    message = sanitizeInput(message);

    if (!message && !image) {
      return NextResponse.json({ success: false, error: 'Message is required' }, { status: 400 });
    }

    // EMOTION DETECTION
    const emotion = detectEmotion(message || '');
    const emotionPrefix = getEmotionPrefix(emotion);

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

    // CHECK FOR USER DATA REQUESTS
    const lowerMsg = (message || '').toLowerCase();
    let userDataContext = '';

    if (userId && isDatabaseConnected()) {
      if (/where.*my.*order|my.*order|order.*status|track.*order/i.test(lowerMsg)) {
        const orders = await getUserOrders(userId, userRole);
        if (orders.length > 0) {
          userDataContext = `\n\n[USER'S ORDER DATA — Use this to give specific help]\n${orders.map(o => `Order ${o.order_number}: Status=${o.status}, Total=₦${o.total}, Date=${new Date(o.created_at).toLocaleDateString()}`).join('\n')}`;
        } else {
          userDataContext = '\n\n[USER DATA: This user has no orders yet.]';
        }
      }

      if (/dispute|complaint|report/i.test(lowerMsg)) {
        const disputes = await getUserDisputes(userId);
        if (disputes.length > 0) {
          userDataContext = `\n\n[USER'S DISPUTE DATA]\n${disputes.map(d => `Dispute: Reason=${d.reason}, Status=${d.status}, Date=${new Date(d.created_at).toLocaleDateString()}`).join('\n')}`;
        } else {
          userDataContext = '\n\n[USER DATA: This user has no open disputes.]';
        }
      }

      if (/payout|withdraw|wallet|earn|balance/i.test(lowerMsg) && userRole === 'vendor') {
        const payouts = await getVendorPayouts(userId);
        if (payouts.length > 0) {
          userDataContext = `\n\n[USER'S PAYOUT DATA]\n${payouts.map(p => `Payout: Amount=₦${p.amount}, Status=${p.status}, Date=${new Date(p.created_at).toLocaleDateString()}`).join('\n')}`;
        } else {
          userDataContext = '\n\n[USER DATA: This vendor has no payout records yet.]';
        }
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

    // GENERIC FALLBACK
    if (!aiReply) {
      aiReply = `I want to make sure you get the help you need! 😊\n\nHere are some ways to get support:\n\nEmail our support team: ${SUPPORT_EMAIL}\n   — They respond quickly and can help with any issue\n\nCheck our FAQ: ${SAFE_LINKS.faq}\n   — Common questions are answered there\n\nCreate a dispute: ${SAFE_LINKS.disputes}\n   — If you have an issue with an order\n\nVisit our website: ${SAFE_LINKS.shop}\n\nIs there anything specific I can help you with? 💪`;
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
      error: `I apologize for the inconvenience. Here is how to get help:\n\nEmail: ${SUPPORT_EMAIL}\nFAQ: ${SAFE_LINKS.faq}\nDisputes: ${SAFE_LINKS.disputes}\n\nOur team will help you right away! 😊`,
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
