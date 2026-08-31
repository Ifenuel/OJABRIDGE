/**
 * ============================================
 * OJABRIDGE AUTHENTICATION UTILITIES
 * ============================================
 * 
 * JWT token generation/verification
 * Password hashing with bcrypt
 * Session management via HTTP-only cookies
 * Role-based access control
 */

import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);
const JWT_EXPIRY = process.env.JWT_EXPIRY || '24h';
const REFRESH_EXPIRY = 60 * 60 * 24 * 7; // 7 days in seconds

// ============================================
// PASSWORD UTILITIES
// ============================================

/**
 * Hash a password with bcrypt (12 rounds)
 */
export async function hashPassword(password) {
  const rounds = parseInt(process.env.BCRYPT_ROUNDS || '12');
  return bcrypt.hash(password, rounds);
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

/**
 * Validate password strength
 */
export function validatePasswordStrength(password) {
  const errors = [];
  if (password.length < 8) errors.push('Password must be at least 8 characters');
  if (!/[A-Z]/.test(password)) errors.push('Password must include an uppercase letter');
  if (!/[a-z]/.test(password)) errors.push('Password must include a lowercase letter');
  if (!/\d/.test(password)) errors.push('Password must include a number');
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) errors.push('Password must include a special character');
  return errors;
}

// ============================================
// JWT TOKEN UTILITIES
// ============================================

/**
 * Generate an access token
 */
export async function generateAccessToken(user) {
  return new SignJWT({
    sub: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRY)
    .setIssuer('ojabridge')
    .setAudience('ojabridge-api')
    .sign(JWT_SECRET);
}

/**
 * Generate a refresh token
 */
export async function generateRefreshToken(user) {
  return new SignJWT({
    sub: user.id,
    type: 'refresh',
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(REFRESH_EXPIRY)
    .setIssuer('ojabridge')
    .sign(JWT_SECRET);
}

/**
 * Verify and decode a JWT token
 */
export async function verifyToken(token) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, {
      issuer: 'ojabridge',
    });
    return { valid: true, payload };
  } catch (error) {
    return { valid: false, error: error.message };
  }
}

// ============================================
// SESSION UTILITIES
// ============================================

/**
 * Set auth cookies on a NextResponse
 */
export function setAuthCookies(response, accessToken, refreshToken) {
  // Access token — HTTP-only, secure, same-site
  response.cookies.set('ob_access_token', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24, // 24 hours
  });

  // Refresh token
  response.cookies.set('ob_refresh_token', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });

  return response;
}

/**
 * Clear auth cookies
 */
export function clearAuthCookies(response) {
  response.cookies.set('ob_access_token', '', { httpOnly: true, maxAge: 0, path: '/' });
  response.cookies.set('ob_refresh_token', '', { httpOnly: true, maxAge: 0, path: '/' });
  return response;
}

/**
 * Extract user from request cookies (for middleware/server components)
 */
export async function getUserFromRequest(request) {
  const token = request.cookies.get('ob_access_token')?.value;
  if (!token) return null;

  const { valid, payload } = await verifyToken(token);
  if (!valid) return null;

  return {
    id: payload.sub,
    email: payload.email,
    role: payload.role,
    name: payload.name,
  };
}

// ============================================
// ACCESS CONTROL
// ============================================

/**
 * Require a specific role — returns error response if unauthorized
 */
export function requireRole(user, ...allowedRoles) {
  if (!user) {
    return { authorized: false, error: 'Authentication required', status: 401 };
  }
  if (!allowedRoles.includes(user.role)) {
    return { authorized: false, error: 'Insufficient permissions', status: 403 };
  }
  return { authorized: true };
}

/**
 * Require authentication
 */
export function requireAuth(user) {
  if (!user) {
    return { authorized: false, error: 'Authentication required', status: 401 };
  }
  return { authorized: true };
}

// ============================================
// INPUT VALIDATION
// ============================================

export function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validatePhone(phone) {
  if (!phone) return true; // optional
  return /^\+?[1-9]\d{1,14}$/.test(phone.replace(/\s/g, ''));
}

export function sanitizeInput(input) {
  if (typeof input !== 'string') return input;
  return input.trim().replace(/[<>]/g, '');
}

export function generateOrderId() {
  const date = new Date();
  const dateStr = date.getFullYear().toString() +
    String(date.getMonth() + 1).padStart(2, '0') +
    String(date.getDate()).padStart(2, '0');
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `OBJ-${dateStr}-${random}`;
}
