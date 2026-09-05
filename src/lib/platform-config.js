/**
 * Platform Configuration — reads settings from database with env var fallback
 * Used by payment processing, commission calculation, and other backend services.
 */

import { dbQuery, isDatabaseConnected } from '@/lib/db';

// In-memory cache for platform settings (5 minute TTL)
let cachedSettings = null;
let cacheTimestamp = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Get platform settings from database (cached) or environment variables
 */
export async function getPlatformSettings() {
  // Return cached if fresh
  if (cachedSettings && Date.now() - cacheTimestamp < CACHE_TTL) {
    return cachedSettings;
  }

  const defaults = {
    platform_commission: parseFloat(process.env.COMMISSION_RATE || '10'),
    free_shipping_threshold: 50000,
    min_withdrawal: 5000,
    payout_schedule: 'weekly',
    platform_name: 'OjaBridge',
    support_email: 'support@ojabridge.com',
  };

  if (!isDatabaseConnected()) {
    cachedSettings = defaults;
    cacheTimestamp = Date.now();
    return defaults;
  }

  try {
    // Try platform_settings table
    const { data } = await dbQuery('platform_settings', { filter: { key: 'platform_config' } });
    if (data && data.length > 0 && data[0].value) {
      const settings = typeof data[0].value === 'string' ? JSON.parse(data[0].value) : data[0].value;
      cachedSettings = { ...defaults, ...settings };
      cacheTimestamp = Date.now();
      return cachedSettings;
    }
  } catch {
    // Table might not exist
  }

  try {
    // Try vendors table fallback
    const { data: vendorConfig } = await dbQuery('vendors', { filter: { store_slug: 'platform-config' } });
    if (vendorConfig && vendorConfig.length > 0 && vendorConfig[0].product_categories) {
      const cats = vendorConfig[0].product_categories;
      const settingsStr = Array.isArray(cats) ? cats[0] : cats;
      const settings = typeof settingsStr === 'string' ? JSON.parse(settingsStr) : settingsStr;
      cachedSettings = { ...defaults, ...settings };
      cacheTimestamp = Date.now();
      return cachedSettings;
    }
  } catch {}

  cachedSettings = defaults;
  cacheTimestamp = Date.now();
  return defaults;
}

/**
 * Get the current commission rate (percentage)
 */
export async function getCommissionRate() {
  const settings = await getPlatformSettings();
  return settings.platform_commission || 10;
}

/**
 * Calculate commission for a given amount
 */
export async function calculateCommission(amount) {
  const rate = await getCommissionRate();
  const commission = Math.round(amount * (rate / 100) * 100) / 100;
  const vendorAmount = Math.round((amount - commission) * 100) / 100;
  return { commission, vendorAmount, rate };
}

/**
 * Invalidate the settings cache (call after admin updates settings)
 */
export function invalidateSettingsCache() {
  cachedSettings = null;
  cacheTimestamp = 0;
}
