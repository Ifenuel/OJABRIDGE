/**
 * ============================================
 * OJABRIDGE SECURITY AUDIT LOGGING
 * ============================================
 * 
 * Logs every important action for:
 * - Security investigations
 * - Compliance requirements
 * - Fraud detection
 * - Dispute resolution
 * - Account recovery
 */

import { dbInsert, isDatabaseConnected } from './db';

// ============================================
// AUDIT ACTIONS
// ============================================

export const AUDIT_ACTIONS = {
  // Auth events
  LOGIN_SUCCESS: 'auth.login_success',
  LOGIN_FAILED: 'auth.login_failed',
  LOGOUT: 'auth.logout',
  PASSWORD_CHANGED: 'auth.password_changed',
  PASSWORD_RESET_REQUESTED: 'auth.password_reset_requested',
  PASSWORD_RESET_COMPLETED: 'auth.password_reset_completed',
  MFA_ENABLED: 'auth.mfa_enabled',
  MFA_DISABLED: 'auth.mfa_disabled',
  MFA_CHALLENGE_PASSED: 'auth.mfa_challenge_passed',
  MFA_CHALLENGE_FAILED: 'auth.mfa_challenge_failed',
  ACCOUNT_LOCKED: 'auth.account_locked',
  ACCOUNT_UNLOCKED: 'auth.account_unlocked',

  // Registration events
  USER_REGISTERED: 'user.registered',
  EMAIL_VERIFIED: 'user.email_verified',
  PHONE_VERIFIED: 'user.phone_verified',

  // Profile events
  PROFILE_UPDATED: 'user.profile_updated',
  AVATAR_UPLOADED: 'user.avatar_uploaded',

  // Vendor events
  VENDOR_REGISTERED: 'vendor.registered',
  VENDOR_APPROVED: 'vendor.approved',
  VENDOR_SUSPENDED: 'vendor.suspended',
  VENDOR_BANNED: 'vendor.banned',
  VENDOR_REINSTATED: 'vendor.reinstated',
  STORE_UPDATED: 'vendor.store_updated',
  BANK_ACCOUNT_UPDATED: 'vendor.bank_account_updated',
  BANK_ACCOUNT_VERIFIED: 'vendor.bank_account_verified',

  // KYC events
  KYC_DOCUMENT_UPLOADED: 'kyc.document_uploaded',
  KYC_APPROVED: 'kyc.approved',
  KYC_REJECTED: 'kyc.rejected',

  // Product events
  PRODUCT_CREATED: 'product.created',
  PRODUCT_UPDATED: 'product.updated',
  PRODUCT_PUBLISHED: 'product.published',
  PRODUCT_SUSPENDED: 'product.suspended',
  PRODUCT_REMOVED: 'product.removed',
  PRODUCT_VIEWED: 'product.viewed',

  // Order events
  ORDER_CREATED: 'order.created',
  ORDER_PAID: 'order.paid',
  ORDER_CANCELLED: 'order.cancelled',
  ORDER_SHIPPED: 'order.shipped',
  ORDER_DELIVERED: 'order.delivered',
  ORDER_DISPUTED: 'order.disputed',

  // Payment events
  PAYMENT_INITIALIZED: 'payment.initialized',
  PAYMENT_SUCCESS: 'payment.success',
  PAYMENT_FAILED: 'payment.failed',
  PAYMENT_REFUNDED: 'payment.refunded',
  PAYMENT_PARTIAL_REFUND: 'payment.partial_refund',

  // Settlement events
  SETTLEMENT_INITIATED: 'settlement.initiated',
  SETTLEMENT_COMPLETED: 'settlement.completed',
  SETTLEMENT_FAILED: 'settlement.failed',

  // Review events
  REVIEW_CREATED: 'review.created',
  REVIEW_FLAGGED: 'review.flagged',
  REVIEW_REMOVED: 'review.removed',
  VENDOR_REPLIED: 'review.vendor_replied',

  // Dispute events
  DISPUTE_OPENED: 'dispute.opened',
  DISPUTE_RESPONDED: 'dispute.responded',
  DISPUTE_ESCALATED: 'dispute.escalated',
  DISPUTE_RESOLVED: 'dispute.resolved',
  DISPUTE_CLOSED: 'dispute.closed',

  // Inventory events
  STOCK_UPDATED: 'inventory.stock_updated',
  LOW_STOCK_ALERT: 'inventory.low_stock_alert',
  OUT_OF_STOCK: 'inventory.out_of_stock',

  // Security events
  UNAUTHORIZED_ACCESS: 'security.unauthorized_access',
  BRUTE_FORCE_DETECTED: 'security.brute_force_detected',
  SUSPICIOUS_ACTIVITY: 'security.suspicious_activity',
  ADMIN_ACTION: 'security.admin_action',
  ACCOUNT_SUSPENDED: 'security.account_suspended',
  ACCOUNT_BANNED: 'security.account_banned',

  // Admin events
  ADMIN_LOGIN: 'admin.login',
  ADMIN_VENDOR_APPROVED: 'admin.vendor_approved',
  ADMIN_VENDOR_SUSPENDED: 'admin.vendor_suspended',
  ADMIN_PRODUCT_MODERATED: 'admin.product_moderated',
  ADMIN_DISPUTE_RESOLVED: 'admin.dispute_resolved',
  ADMIN_SETTLEMENT_PROCESSED: 'admin.settlement_processed',
  ADMIN_SETTINGS_CHANGED: 'admin.settings_changed',
  ADMIN_ANNOUNCEMENT_SENT: 'admin.announcement_sent',
};

// ============================================
// AUDIT LOG FUNCTION
// ============================================

/**
 * Log an audit event
 * 
 * @param {Object} params
 * @param {string} params.action - The action being logged (use AUDIT_ACTIONS)
 * @param {string} params.userId - The user performing the action
 * @param {string} params.entityType - Entity type (user, product, order, etc.)
 * @param {string} params.entityId - Entity ID
 * @param {Object} params.oldData - Previous state (for updates)
 * @param {Object} params.newData - New state (for creates/updates)
 * @param {Object} params.request - Next.js request object (for IP/user-agent)
 * @param {Object} params.metadata - Additional context
 */
export async function auditLog({
  action,
  userId = null,
  entityType = null,
  entityId = null,
  oldData = null,
  newData = null,
  request = null,
  metadata = null,
}) {
  const logEntry = {
    action,
    user_id: userId,
    entity_type: entityType,
    entity_id: entityId,
    old_data: oldData,
    new_data: newData,
    ip_address: request?.headers?.get('x-forwarded-for') || request?.headers?.get('x-real-ip') || null,
    user_agent: request?.headers?.get('user-agent')?.substring(0, 200) || null,
    metadata,
    created_at: new Date().toISOString(),
  };

  // Always log to console in development
  if (process.env.NODE_ENV === 'development') {
    const colors = {
      auth: '\x1b[36m',    // cyan
      security: '\x1b[31m', // red
      admin: '\x1b[35m',    // magenta
      payment: '\x1b[32m',  // green
      order: '\x1b[33m',    // yellow
    };
    const color = Object.entries(colors).find(([key]) => action.startsWith(key))?.[1] || '\x1b[0m';
    console.log(`${color}[AUDIT] ${action}\x1b[0m`, userId ? `User: ${userId}` : '', entityType ? `Entity: ${entityType}/${entityId}` : '');
  }

  // Save to database
  if (isDatabaseConnected()) {
    try {
      await dbInsert('audit_logs', logEntry);
    } catch (error) {
      console.error('[AUDIT] Failed to save audit log:', error);
    }
  }

  return logEntry;
}

/**
 * Get audit logs (admin only)
 */
export async function getAuditLogs({
  userId = null,
  action = null,
  entityType = null,
  startDate = null,
  endDate = null,
  page = 1,
  limit = 50,
} = {}) {
  if (!isDatabaseConnected()) {
    return { logs: [], total: 0 };
  }

  const { dbQuery } = await import('./db');
  const filter = {};
  if (userId) filter.user_id = userId;
  if (action) filter.action = action;
  if (entityType) filter.entity_type = entityType;

  const { data: logs, error } = await dbQuery('audit_logs', {
    filter,
    order: { column: 'created_at', ascending: false },
    limit,
    offset: (page - 1) * limit,
  });

  if (error) {
    console.error('[AUDIT] Query error:', error);
    return { logs: [], total: 0, error };
  }

  return { logs: logs || [], total: logs?.length || 0 };
}
