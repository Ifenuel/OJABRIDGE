/**
 * ============================================
 * OJABRIDGE CSRF PROTECTION
 * ============================================
 * 
 * Prevents Cross-Site Request Forgery attacks.
 * Uses the Double Submit Cookie pattern.
 */

import crypto from 'crypto';

const CSRF_SECRET = process.env.JWT_SECRET;

/**
 * Generate a CSRF token
 * Called when rendering forms on the server
 */
export function generateCsrfToken(sessionId) {
  const timestamp = Date.now();
  const payload = `${sessionId}:${timestamp}`;
  const signature = crypto.createHmac('sha256', CSRF_SECRET).update(payload).digest('hex');
  return Buffer.from(`${payload}:${signature}`).toString('base64url');
}

/**
 * Validate a CSRF token
 * Called on every POST/PUT/DELETE request
 */
export function validateCsrfToken(token, sessionId) {
  if (!token || !sessionId) return false;

  try {
    const decoded = Buffer.from(token, 'base64url').toString();
    const parts = decoded.split(':');
    if (parts.length !== 3) return false;

    const [tokenSessionId, timestamp, signature] = parts;

    // Verify session matches
    if (tokenSessionId !== sessionId) return false;

    // Verify signature
    const expectedPayload = `${tokenSessionId}:${timestamp}`;
    const expectedSignature = crypto.createHmac('sha256', CSRF_SECRET).update(expectedPayload).digest('hex');
    if (signature !== expectedSignature) return false;

    // Token expires after 1 hour
    const age = Date.now() - parseInt(timestamp);
    if (age > 3600000) return false;

    return true;
  } catch {
    return false;
  }
}

/**
 * Middleware helper: Check CSRF for state-changing requests
 */
export function checkCsrf(request) {
  // Only check state-changing methods
  const method = request.method;
  if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    return { valid: true };
  }

  // Check Origin header
  const origin = request.headers.get('origin');
  const host = request.headers.get('host');

  if (origin && host) {
    try {
      const originUrl = new URL(origin);
      if (originUrl.host !== host) {
        return { valid: false, error: 'CSRF: Origin mismatch' };
      }
    } catch {
      return { valid: false, error: 'CSRF: Invalid origin' };
    }
  }

  // Check Referer header as fallback
  const referer = request.headers.get('referer');
  if (referer && host) {
    try {
      const refererUrl = new URL(referer);
      if (refererUrl.host !== host) {
        return { valid: false, error: 'CSRF: Referer mismatch' };
      }
    } catch {
      // Referer might be missing or malformed — allow if Origin check passed
    }
  }

  return { valid: true };
}
