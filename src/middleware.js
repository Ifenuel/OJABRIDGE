import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

/**
 * ============================================
 * OJABRIDGE SECURITY MIDDLEWARE
 * ============================================
 * 
 * LAYER 1: Request validation (blocked paths, honeypots)
 * LAYER 2: Rate limiting (per IP, per endpoint)
 * LAYER 3: JWT token verification (from HTTP-only cookies)
 * LAYER 4: Role-based access control (admin/vendor/customer)
 * LAYER 5: Security headers
 * LAYER 6: Anomaly detection
 */

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

// ============================================
// RATE LIMITING STORE (In-memory, use Redis in production)
// ============================================
// ============================================
// RATE LIMITING (In-memory in Edge middleware)
// Redis-backed rate limiting is in src/lib/redis.js (used by API routes)
// ============================================
const rateLimitStore = new Map();

function getRateLimitKey(ip, path) {
  return `${ip}:${path}`;
}

function checkRateLimit(key, maxRequests, windowMs) {
  const now = Date.now();
  const windowStart = now - windowMs;

  if (!rateLimitStore.has(key)) {
    rateLimitStore.set(key, []);
  }

  const requests = rateLimitStore.get(key).filter(time => time > windowStart);
  rateLimitStore.set(key, requests);

  if (requests.length >= maxRequests) {
    return false;
  }

  requests.push(now);
  return true;
}

// ============================================
// BLOCKED PATHS (Attack vectors)
// ============================================
const BLOCKED_PATHS = [
  '/wp-admin', '/wp-login', '/wp-content', '/wp-includes',
  '/.env', '/.git', '/.svn', '/.htaccess',
  '/phpmyadmin', '/adminer', '/phpinfo',
  '/xmlrpc.php', '/wp-json', '/wp-cron.php',
  '/cgi-bin', '/scripts', '/includes',
  '/backup', '/database', '/sql',
  '/debug', '/trace', '/status',
  '/actuator', '/swagger', '/api-docs',
];

// ============================================
// HONEYPOT PATHS (Bot traps)
// ============================================
const HONEYPOT_PATHS = [
  '/admin-secret-login',
  '/vendor-backdoor',
  '/debug-console',
  '/api/internal',
  '/api/admin-backup',
];

// ============================================
// RATE LIMIT CONFIGURATIONS
// ============================================
const RATE_LIMITS = {
  general: { max: 200, window: 60000 },       // 200 requests/minute
  auth: { max: 8, window: 900000 },            // 8 attempts/15 min for login
  register: { max: 3, window: 3600000 },       // 3 registrations/hour
  payment: { max: 10, window: 60000 },         // 10 payment attempts/minute
  search: { max: 30, window: 60000 },          // 30 searches/minute
  api: { max: 60, window: 60000 },             // 60 API calls/minute
  upload: { max: 20, window: 60000 },          // 20 uploads/minute
};

// ============================================
// VERIFIED JWT VERIFICATION
// ============================================
async function verifyJWT(token) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, {
      issuer: 'ojabridge',
      audience: 'ojabridge-api',
    });
    return { valid: true, payload };
  } catch (error) {
    return { valid: false, error: error.message };
  }
}

// ============================================
// MAIN MIDDLEWARE
// ============================================
export async function middleware(request) {
  const { pathname } = request.nextUrl;
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
  const userAgent = request.headers.get('user-agent') || '';

  // ==========================================
  // LAYER 1: BLOCKED PATHS & HONEYPOTS
  // ==========================================
  
  // Block common attack paths
  if (BLOCKED_PATHS.some(path => pathname.toLowerCase().startsWith(path))) {
    return new NextResponse(null, { status: 404 });
  }

  // Honeypot — log and block (don't reveal it's a trap)
  if (HONEYPOT_PATHS.some(path => pathname.toLowerCase().startsWith(path))) {
    console.warn(`[SECURITY] Honeypot triggered: IP=${ip} Path=${pathname} UA=${userAgent}`);
    // Return fake 200 to waste bot time
    return new NextResponse('<html><body>Processing...</body></html>', {
      status: 200,
      headers: { 'Content-Type': 'text/html' },
    });
  }

  // Block suspicious user agents
  const suspiciousAgents = ['sqlmap', 'nikto', 'nmap', 'masscan', 'dirbuster', 'gobuster', 'curl/', 'python-requests', 'scrapy', 'bot'];
  if (suspiciousAgents.some(agent => userAgent.toLowerCase().includes(agent))) {
    console.warn(`[SECURITY] Suspicious user agent blocked: IP=${ip} UA=${userAgent}`);
    return new NextResponse(null, { status: 403 });
  }

  // ==========================================
  // LAYER 2: RATE LIMITING
  // ==========================================
  let rateLimitConfig = RATE_LIMITS.general;

  if (pathname.startsWith('/api/auth/login')) {
    rateLimitConfig = RATE_LIMITS.auth;
  } else if (pathname.startsWith('/api/auth/register')) {
    rateLimitConfig = RATE_LIMITS.register;
  } else if (pathname.startsWith('/api/payments')) {
    rateLimitConfig = RATE_LIMITS.payment;
  } else if (pathname.startsWith('/api/search')) {
    rateLimitConfig = RATE_LIMITS.search;
  } else if (pathname.startsWith('/api/upload')) {
    rateLimitConfig = RATE_LIMITS.upload;
  } else if (pathname.startsWith('/api/')) {
    rateLimitConfig = RATE_LIMITS.api;
  }

  const rateLimitKey = getRateLimitKey(ip, pathname.split('/').slice(0, 4).join('/'));
  if (!checkRateLimit(rateLimitKey, rateLimitConfig.max, rateLimitConfig.window)) {
    console.warn(`[SECURITY] Rate limit exceeded: IP=${ip} Path=${pathname}`);
    return NextResponse.json(
      { success: false, error: 'Too many requests. Please try again later.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil(rateLimitConfig.window / 1000)),
          'X-RateLimit-Limit': String(rateLimitConfig.max),
          'X-RateLimit-Remaining': '0',
        },
      }
    );
  }

  // ==========================================
  // LAYER 3: JWT TOKEN VERIFICATION
  // ==========================================
  const accessToken = request.cookies.get('ob_access_token')?.value;
  let user = null;

  if (accessToken) {
    const { valid, payload } = await verifyJWT(accessToken);
    if (valid) {
      user = {
        id: payload.sub,
        email: payload.email,
        role: payload.role,
        name: payload.name,
      };
    }
  }

  // ==========================================
  // LAYER 4: ROLE-BASED ACCESS CONTROL
  // ==========================================

  // Admin Dashboard
  if (pathname.startsWith('/admin-dashboard')) {
    if (!user) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('returnTo', pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (user.role !== 'admin') {
      console.warn(`[SECURITY] Unauthorized admin access: User=${user.email} Role=${user.role} IP=${ip}`);
      return new NextResponse('<html><head><title>403</title></head><body style="font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#f6f7fb;"><div style="text-align:center;"><h1 style="color:#0F172A;font-size:48px;margin:0;">403</h1><p style="color:#6B7280;margin:10px 0;">Access Denied</p><a href="/" style="color:#5B21B6;">Return Home</a></div></body></html>', { status: 403, headers: { 'Content-Type': 'text/html', 'Cache-Control': 'no-store' } });
    }
  }

  // Admin-only API routes
  if (pathname.startsWith('/api/admin')) {
    if (!user) return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    if (user.role !== 'admin') return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
  }

  // Settlements: admin + vendor access
  if (pathname.startsWith('/api/settlements')) {
    if (!user) return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    if (user.role !== 'admin' && user.role !== 'vendor') return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
  }

  // Vendor Dashboard
  if (pathname.startsWith('/vendor-dashboard')) {
    if (!user) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('returnTo', pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (user.role !== 'vendor' && user.role !== 'admin') {
      return new NextResponse('<html><head><title>403</title></head><body style="font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#f6f7fb;"><div style="text-align:center;"><h1 style="color:#0F172A;font-size:48px;margin:0;">403</h1><p style="color:#6B7280;margin:10px 0;">Access Denied</p><a href="/" style="color:#5B21B6;">Return Home</a></div></body></html>', { status: 403, headers: { 'Content-Type': 'text/html', 'Cache-Control': 'no-store' } });
    }
  }

  // Retailer Dashboard
  if (pathname.startsWith('/retailer-dashboard')) {
    if (!user) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('returnTo', pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (user.role !== 'retailer' && user.role !== 'admin') {
      return new NextResponse('<html><head><title>403</title></head><body style="font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#f6f7fb;"><div style="text-align:center;"><h1 style="color:#0F172A;font-size:48px;margin:0;">403</h1><p style="color:#6B7280;margin:10px 0;">Access Denied</p><a href="/" style="color:#5B21B6;">Return Home</a></div></body></html>', { status: 403, headers: { 'Content-Type': 'text/html', 'Cache-Control': 'no-store' } });
    }
  }

  // Vendor API routes
  if (pathname.startsWith('/api/inventory') || pathname.startsWith('/api/kyc')) {
    if (!user) return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    if (user.role !== 'vendor' && user.role !== 'admin') return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
  }

  // Customer Account Dashboard
  if (pathname.startsWith('/account')) {
    if (!user) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('returnTo', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Auth-required pages
  if (['/checkout', '/orders'].some(p => pathname.startsWith(p))) {
    if (!user) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('returnTo', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Auth-required APIs (write operations)
  if (['/api/disputes', '/api/notifications', '/api/reports', '/api/addresses', '/api/vendors/settings', '/api/admin'].some(p => pathname.startsWith(p))) {
    if (!user) return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
  }
  // Reviews: public GET, auth required for POST/PATCH
  if (pathname.startsWith('/api/reviews') && request.method !== 'GET') {
    if (!user) return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
  }
  // CMS: public GET for published, auth required for POST/PATCH/DELETE
  if (pathname.startsWith('/api/cms') && request.method !== 'GET') {
    if (!user) return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
  }

  // ==========================================
  // LAYER 5: SECURITY HEADERS
  // ==========================================
  const response = NextResponse.next();

  // Core security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), interest-cohort=()');
  response.headers.set('X-Permitted-Cross-Domain-Policies', 'none');

  // Prevent caching of sensitive pages
  const sensitivePages = ['/login', '/register', '/checkout', '/vendor-dashboard', '/admin-dashboard'];
  if (sensitivePages.some(p => pathname.startsWith(p))) {
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
  }

  // CSP headers for API routes
  if (pathname.startsWith('/api/')) {
    response.headers.set('Access-Control-Allow-Origin', process.env.NEXT_PUBLIC_SITE_URL || '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-CSRF-Token');
    response.headers.set('Access-Control-Allow-Credentials', 'true');
  }

  // Add user info to headers for downstream use (server components)
  if (user) {
    response.headers.set('X-User-Id', user.id);
    response.headers.set('X-User-Role', user.role);
    response.headers.set('X-User-Email', user.email);
  }

  // ==========================================
  // LAYER 6: ANOMALY DETECTION
  // ==========================================
  
  // Detect path traversal attempts
  if (pathname.includes('..') || pathname.includes('%2e%2e') || pathname.includes('..%2f')) {
    console.warn(`[SECURITY] Path traversal attempt: IP=${ip} Path=${pathname}`);
    return new NextResponse(null, { status: 400 });
  }

  // Detect SQL injection attempts in URL
  const sqlPatterns = ['union+select', 'or+1=1', 'drop+table', 'insert+into', 'delete+from', 'exec(', 'script<'];
  if (sqlPatterns.some(pattern => pathname.toLowerCase().includes(pattern))) {
    console.warn(`[SECURITY] SQL injection attempt: IP=${ip} Path=${pathname}`);
    return new NextResponse(null, { status: 400 });
  }

  // Detect XSS attempts in URL
  if (pathname.includes('<script') || pathname.includes('javascript:') || pathname.includes('onerror=')) {
    console.warn(`[SECURITY] XSS attempt: IP=${ip} Path=${pathname}`);
    return new NextResponse(null, { status: 400 });
  }

  // ==========================================
  // PASSED ALL CHECKS — Allow through
  // ==========================================
  return response;
}

export const config = {
  matcher: [
    // Match everything except static files
    '/((?!_next/static|_next/image|favicon.ico|images/).*)',
  ],
};
