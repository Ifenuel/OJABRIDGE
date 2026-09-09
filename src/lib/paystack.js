/**
 * ============================================
 * OJABRIDGE PAYSTACK INTEGRATION
 * ============================================
 * 
 * Handles:
 * - Payment initialization
 * - Payment verification
 * - Split payments (10% commission)
 * - Refunds
 * - Vendor payouts/transfers
 * - Webhook signature verification
 */

import crypto from 'crypto';

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_BASE_URL = 'https://api.paystack.co';

// ============================================
// API HELPERS
// ============================================

async function paystackRequest(endpoint, options = {}) {
  if (!PAYSTACK_SECRET_KEY) {
    throw new Error('Paystack not configured. Set PAYSTACK_SECRET_KEY in .env.local');
  }

  const url = `${PAYSTACK_BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    method: options.method || 'GET',
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const data = await response.json();
  return data;
}

// ============================================
// PAYMENT INITIALIZATION
// ============================================

/**
 * Initialize a Paystack transaction
 * @param {Object} params - { email, amount (in Naira), currency, orderId, metadata }
 * @returns {Object} - { authorizationUrl, accessCode, reference }
 */
export async function initializePayment({ email, amount, currency = 'NGN', orderId, metadata = {} }) {
  const reference = `OJB-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

  const data = await paystackRequest('/transaction/initialize', {
    method: 'POST',
    body: {
      amount: Math.round(amount * 100), // Convert to kobo/cents
      email,
      currency,
      reference,
      callback_url: `${process.env.NEXT_PUBLIC_SITE_URL}/checkout?reference=${reference}`,
      metadata: {
        orderId,
        custom_fields: [
          { display_name: 'Order ID', variable_name: 'order_id', value: orderId },
        ],
        ...metadata,
      },
    },
  });

  if (!data.status) {
    throw new Error(data.message || 'Payment initialization failed');
  }

  return {
    authorizationUrl: data.data.authorization_url,
    accessCode: data.data.access_code,
    reference: data.data.reference,
  };
}

// ============================================
// PAYMENT VERIFICATION
// ============================================

/**
 * Verify a Paystack transaction
 * @param {string} reference - Transaction reference
 * @returns {Object} - Verified transaction data
 */
export async function verifyPayment(reference) {
  const data = await paystackRequest(`/transaction/verify/${reference}`);

  if (!data.status) {
    return { verified: false, error: data.message || 'Verification failed' };
  }

  const tx = data.data;

  return {
    verified: tx.status === 'success',
    reference: tx.reference,
    amount: tx.amount / 100, // Convert from kobo to Naira
    currency: tx.currency,
    gateway_response: tx.gateway_response,
    paid_at: tx.paid_at,
    customer: tx.customer,
    metadata: tx.metadata,
    authorization: tx.authorization,
  };
}

// ============================================
// SPLIT PAYMENT (10% Commission)
// ============================================

/**
 * Process split payment after successful transaction
 * - 10% goes to OjaBridge (platform commission)
 * - 90% goes to vendor
 * 
 * @param {Object} params - { orderId, totalAmount, vendorId, currency }
 */
export async function processSplitPayment({ orderId, totalAmount, vendorId, currency = 'NGN' }) {
  const { getCommissionRate } = await import('@/lib/platform-config');
  const commissionRate = await getCommissionRate();
  const commission = Math.round(totalAmount * (commissionRate / 100) * 100) / 100;
  const vendorAmount = Math.round((totalAmount - commission) * 100) / 100;

  return {
    orderId,
    totalAmount,
    commission,
    commissionRate,
    vendorAmount,
    currency,
    vendorId,
    status: 'calculated',
    // In production: create split transaction on Paystack
    // and schedule vendor payout
  };
}

// ============================================
// VENDOR PAYOUT / TRANSFER
// ============================================

/**
 * Initiate a transfer to vendor bank account
 * @param {Object} params - { amount, bankCode, accountNumber, reference, reason }
 */
export async function initiateTransfer({ amount, bankCode, accountNumber, reference, reason }) {
  const data = await paystackRequest('/transfer', {
    method: 'POST',
    body: {
      source: 'balance',
      amount: Math.round(amount * 100), // Convert to kobo
      recipient: await createTransferRecipient({ bankCode, accountNumber, name: reason }),
      reason: reason || 'OjaBridge vendor settlement',
      reference,
    },
  });

  if (!data.status) {
    return { success: false, error: data.message || 'Transfer failed' };
  }

  return {
    success: true,
    transferCode: data.data.transfer_code,
    reference: data.data.reference,
    status: data.data.status,
  };
}

/**
 * Create a transfer recipient (bank account)
 */
async function createTransferRecipient({ bankCode, accountNumber, name }) {
  const data = await paystackRequest('/transferrecipient', {
    method: 'POST',
    body: {
      type: 'nuban',
      name,
      account_number: accountNumber,
      bank_code: bankCode,
      currency: 'NGN',
    },
  });

  if (!data.status) throw new Error(data.message || 'Failed to create transfer recipient');
  return data.data.recipient_code;
}

// ============================================
// REFUND
// ============================================

/**
 * Initiate a refund
 * @param {string} transactionReference - Original transaction reference
 * @param {number} amount - Amount to refund (in Naira, null for full refund)
 */
export async function initiateRefund(transactionReference, amount = null) {
  const body = { transaction: transactionReference };
  if (amount) body.amount = Math.round(amount * 100);

  const data = await paystackRequest('/refund', {
    method: 'POST',
    body,
  });

  if (!data.status) {
    return { success: false, error: data.message || 'Refund failed' };
  }

  return {
    success: true,
    refundId: data.data.id,
    status: data.data.status,
    amount: data.data.amount / 100,
  };
}

// ============================================
// IDENTITY VERIFICATION (BVN / NIN)
// ============================================

/**
 * Identity provider adapter — pluggable KYC verification.
 *
 * Today: no provider credentials are configured, so submissions are stored
 * and reviewed by a human admin (safe default — we never pretend a BVN/NIN
 * was machine-verified when it wasn't).
 *
 * To enable machine verification, add env vars for ONE provider:
 *   Dojah:     DOJAH_APP_ID + DOJAH_PUBLIC_KEY + DOJAH_PRIVATE_KEY  (https://dojah.io)
 *   Youverify: YOUVERIFY_TOKEN                                        (https://youverify.co)
 *
 * This function is the single integration point — the KYC route calls it
 * after the number-format check and stores the provider verdict alongside
 * the submission for admin review.
 */
export async function verifyIdentity({ bvn, nin, firstName, lastName, dateOfBirth }) {
  const provider = process.env.DOJAH_APP_ID ? 'dojah'
    : process.env.YOUVERIFY_TOKEN ? 'youverify'
    : null;

  if (!provider) {
    return { performed: false, provider: null, status: 'MANUAL_REVIEW' };
  }

  try {
    if (provider === 'dojah') {
      // Dojah KYC API — /api/v1/kyc/bvn-full (BVN) or /api/v1/kyc/nin (NIN)
      // API-Full docs: https://docs.dojah.io
      const base = 'https://api.dojah.io';
      const endpoint = bvn ? '/api/v1/kyc/bvn' : '/api/v1/kyc/nin';
      const number = (bvn || nin).replace(/\s/g, '');
      const res = await fetch(`${base}${endpoint}?bvn=${number}`, {
        headers: {
          Authorization: process.env.DOJAH_PRIVATE_KEY,
          AppId: process.env.DOJAH_APP_ID,
        },
      });
      const data = await res.json();
      return {
        performed: true,
        provider: 'dojah',
        status: res.ok ? 'VERIFIED' : 'VERIFICATION_FAILED',
        response: data,
      };
    }

    if (provider === 'youverify') {
      // Youverify — POST /api/v2/identity/ng/bvn (or /nin)
      const base = 'https://api.youverify.co';
      const endpoint = bvn ? '/api/v2/identity/ng/bvn' : '/api/v2/identity/ng/nin';
      const res = await fetch(`${base}${endpoint}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.YOUVERIFY_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          idType: bvn ? 'BVN' : 'NIN',
          idNumber: (bvn || nin).replace(/\s/g, ''),
          ...(dateOfBirth ? { dateOfBirth } : {}),
        }),
      });
      const data = await res.json();
      return {
        performed: true,
        provider: 'youverify',
        status: res.ok && data?.statusCode === 200 ? 'VERIFIED' : 'VERIFICATION_FAILED',
        response: data,
      };
    }
  } catch (e) {
    console.error('Identity verification provider error:', e.message);
    // Provider down ≠ user lied. Store as manual review rather than failing the user.
    return { performed: true, provider, status: 'MANUAL_REVIEW', error: e.message };
  }

  return { performed: false, provider: null, status: 'MANUAL_REVIEW' };
}

// ============================================
// BANK LIST
// ============================================

/**
 * Get list of supported banks (for account verification)
 */
export async function getBanks(currency = 'NGN') {
  const data = await paystackRequest(`/bank?currency=${currency}`);
  if (!data.status) return [];
  return data.data.map(bank => ({
    id: bank.id,
    name: bank.name,
    code: bank.code,
    longname: bank.longname,
    currency: bank.currency,
    type: bank.type,
  }));
}

/**
 * Resolve bank account number
 */
export async function resolveAccountNumber(accountNumber, bankCode) {
  const data = await paystackRequest(`/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`);
  if (!data.status) {
    return { resolved: false, error: data.message || 'Account resolution failed' };
  }
  return {
    resolved: true,
    accountName: data.data.account_name,
    accountNumber: data.data.account_number,
    bankId: data.data.bank_id,
  };
}

// ============================================
// WEBHOOK VERIFICATION
// ============================================

/**
 * Verify Paystack webhook signature
 * @param {string} body - Raw request body
 * @param {string} signature - X-Paystack-Signature header
 * @returns {boolean}
 */
export function verifyWebhookSignature(body, signature) {
  const webhookSecret = process.env.PAYSTACK_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('PAYSTACK_WEBHOOK_SECRET not configured');
    return false;
  }

  const expectedSignature = crypto
    .createHmac('sha512', webhookSecret)
    .update(body)
    .digest('hex');

  return signature === expectedSignature;
}

// ============================================
// CURRENCY CONVERSION (Simple)
// ============================================

/**
 * Convert amount between currencies using stored rates
 * In production: use a real exchange rate API
 */
export function convertCurrency(amount, fromCurrency, toCurrency) {
  const rates = {
    NGN: { USD: 0.0012, EUR: 0.0011, GBP: 0.00095, NGN: 1 },
    USD: { NGN: 833.33, EUR: 0.92, GBP: 0.79, USD: 1 },
    EUR: { NGN: 909.09, USD: 1.09, GBP: 0.86, EUR: 1 },
    GBP: { NGN: 1052.63, USD: 1.27, EUR: 1.16, GBP: 1 },
  };

  if (!rates[fromCurrency] || !rates[fromCurrency][toCurrency]) {
    return amount; // Return same amount if conversion not available
  }

  return Math.round(amount * rates[fromCurrency][toCurrency] * 100) / 100;
}
