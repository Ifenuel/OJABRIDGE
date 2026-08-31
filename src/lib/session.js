/**
 * ============================================
 * OJABRIDGE SESSION MANAGEMENT
 * ============================================
 * 
 * Handles:
 * - Token rotation (refresh tokens)
 * - Concurrent session limits
 * - Session fingerprinting
 * - Anomaly detection (impossible travel, device change)
 * - Session invalidation
 */

import { generateAccessToken, generateRefreshToken, verifyToken, setAuthCookies, clearAuthCookies } from './auth';
import { dbUpdate, dbQuery, dbInsert, isDatabaseConnected } from './db';

// ============================================
// CONFIGURATION
// ============================================

const MAX_CONCURRENT_SESSIONS = 3; // Max devices per user
const TOKEN_ROTATION_INTERVAL = 60 * 60 * 1000; // 1 hour
const REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days

// ============================================
// SESSION FINGERPRINTING
// ============================================

/**
 * Generate a session fingerprint from request headers
 */
export function generateSessionFingerprint(request) {
  const components = [
    request.headers.get('user-agent') || '',
    request.headers.get('accept-language') || '',
    request.headers.get('x-forwarded-for') || '',
  ];
  
  // Simple hash
  let hash = 0;
  const str = components.join('|');
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return hash.toString(36);
}

// ============================================
// TOKEN REFRESH
// ============================================

/**
 * Refresh an expired access token using the refresh token
 */
export async function refreshAccessToken(request) {
  const refreshToken = request.cookies.get('ob_refresh_token')?.value;
  
  if (!refreshToken) {
    return { success: false, error: 'No refresh token' };
  }

  const { valid, payload } = await verifyToken(refreshToken);
  
  if (!valid || payload.type !== 'refresh') {
    return { success: false, error: 'Invalid refresh token' };
  }

  if (!isDatabaseConnected()) {
    return { success: false, error: 'Database not connected' };
  }

  // Check if user still exists and is active
  const { data: users } = await dbQuery('users', { filter: { id: payload.sub } });
  const user = users?.[0];

  if (!user || user.status !== 'active') {
    return { success: false, error: 'Account not found or inactive' };
  }

  // Generate new tokens (rotation)
  const newAccessToken = await generateAccessToken(user);
  const newRefreshToken = await generateRefreshToken(user);

  return {
    success: true,
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar_url,
    },
  };
}

/**
 * Rotate tokens and set new cookies on response
 */
export async function rotateTokens(request, response) {
  const result = await refreshAccessToken(request);
  
  if (result.success) {
    setAuthCookies(response, result.accessToken, result.refreshToken);
    return { success: true, user: result.user };
  }

  return result;
}

// ============================================
// SESSION VALIDATION
// ============================================

/**
 * Validate that a session is still valid
 * Checks: token validity, user status, session not revoked
 */
export async function validateSession(request) {
  const token = request.cookies.get('ob_access_token')?.value;
  
  if (!token) {
    return { valid: false, reason: 'no_token' };
  }

  const { valid, payload } = await verifyToken(token);
  
  if (!valid) {
    return { valid: false, reason: 'invalid_token' };
  }

  // Check user exists and is active
  if (isDatabaseConnected()) {
    const { data: users } = await dbQuery('users', { filter: { id: payload.sub } });
    const user = users?.[0];

    if (!user) {
      return { valid: false, reason: 'user_not_found' };
    }
    if (user.status === 'suspended') {
      return { valid: false, reason: 'account_suspended' };
    }
    if (user.status === 'banned') {
      return { valid: false, reason: 'account_banned' };
    }
  }

  return {
    valid: true,
    user: {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
      name: payload.name,
    },
  };
}

// ============================================
// CONCURRENT SESSION MANAGEMENT
// ============================================

/**
 * Track active sessions per user
 * Enforce maximum concurrent sessions
 */
export async function trackSession(userId, request) {
  if (!isDatabaseConnected()) return { allowed: true };

  const fingerprint = generateSessionFingerprint(request);
  
  // Get current active sessions
  const { data: users } = await dbQuery('users', { filter: { id: userId } });
  const user = users?.[0];

  if (!user) return { allowed: false };

  // Parse existing sessions from metadata
  const sessions = user.metadata?.sessions || [];
  
  // Clean up expired sessions
  const now = Date.now();
  const activeSessions = sessions.filter(s => now - s.createdAt < REFRESH_TOKEN_MAX_AGE);

  // Check if this device already has a session
  const existingSession = activeSessions.find(s => s.fingerprint === fingerprint);
  
  if (existingSession) {
    // Update last active time
    existingSession.lastActive = now;
  } else {
    // New device — check limit
    if (activeSessions.length >= MAX_CONCURRENT_SESSIONS) {
      // Remove oldest session
      activeSessions.sort((a, b) => a.lastActive - b.lastActive);
      activeSessions.shift();
    }

    activeSessions.push({
      fingerprint,
      ip: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent')?.substring(0, 100) || '',
      createdAt: now,
      lastActive: now,
    });
  }

  // Save sessions
  await dbUpdate('users', { id: userId }, {
    metadata: { ...user.metadata, sessions: activeSessions },
  });

  return { allowed: true, sessionCount: activeSessions.length };
}

/**
 * Invalidate all sessions for a user (logout everywhere)
 */
export async function invalidateAllSessions(userId) {
  if (!isDatabaseConnected()) return;

  const { data: users } = await dbQuery('users', { filter: { id: userId } });
  const user = users?.[0];
  
  if (user) {
    await dbUpdate('users', { id: userId }, {
      metadata: { ...user.metadata, sessions: [], sessionRevokedAt: new Date().toISOString() },
    });
  }
}

// ============================================
// ANOMALY DETECTION
// ============================================

/**
 * Check for suspicious session activity
 */
export async function detectAnomalies(userId, request) {
  if (!isDatabaseConnected()) return { anomalies: [] };

  const anomalies = [];
  const currentIp = request.headers.get('x-forwarded-for') || 'unknown';
  const currentFingerprint = generateSessionFingerprint(request);

  const { data: users } = await dbQuery('users', { filter: { id: userId } });
  const user = users?.[0];
  const sessions = user?.metadata?.sessions || [];

  // Check for new IP (possible account sharing or compromise)
  const knownIps = [...new Set(sessions.map(s => s.ip))];
  if (knownIps.length > 0 && !knownIps.includes(currentIp)) {
    anomalies.push({
      type: 'new_ip',
      severity: 'medium',
      details: `Login from new IP: ${currentIp} (known: ${knownIps.join(', ')})`,
    });
  }

  // Check for new device
  const knownFingerprints = sessions.map(s => s.fingerprint);
  if (knownFingerprints.length > 0 && !knownFingerprints.includes(currentFingerprint)) {
    anomalies.push({
      type: 'new_device',
      severity: 'low',
      details: 'Login from new device',
    });
  }

  // Check for concurrent sessions from different countries (impossible travel)
  // This is simplified — in production, use IP geolocation
  if (sessions.length > 0) {
    const recentSessions = sessions.filter(s => Date.now() - s.createdAt < 3600000); // Last hour
    const uniqueIps = [...new Set(recentSessions.map(s => s.ip))];
    if (uniqueIps.length > 2) {
      anomalies.push({
        type: 'multiple_locations',
        severity: 'high',
        details: `Multiple locations in short time: ${uniqueIps.join(', ')}`,
      });
    }
  }

  // Log anomalies
  if (anomalies.length > 0) {
    const { auditLog, AUDIT_ACTIONS } = await import('./audit');
    await auditLog({
      action: AUDIT_ACTIONS.SUSPICIOUS_ACTIVITY,
      userId,
      metadata: { anomalies, currentIp, currentFingerprint },
      request,
    });
  }

  return { anomalies };
}

// ============================================
// LOGOUT
// ============================================

/**
 * Secure logout — invalidate session and clear cookies
 */
export async function secureLogout(request, response, userId) {
  // Remove session from tracking
  if (userId && isDatabaseConnected()) {
    const fingerprint = generateSessionFingerprint(request);
    const { data: users } = await dbQuery('users', { filter: { id: userId } });
    const user = users?.[0];
    
    if (user?.metadata?.sessions) {
      const updatedSessions = user.metadata.sessions.filter(s => s.fingerprint !== fingerprint);
      await dbUpdate('users', { id: userId }, {
        metadata: { ...user.metadata, sessions: updatedSessions },
      });
    }

    // Log logout
    const { auditLog, AUDIT_ACTIONS } = await import('./audit');
    await auditLog({
      action: AUDIT_ACTIONS.LOGOUT,
      userId,
      request,
    });
  }

  // Clear cookies
  clearAuthCookies(response);
  
  return response;
}
