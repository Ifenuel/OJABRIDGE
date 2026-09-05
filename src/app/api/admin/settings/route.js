import { NextResponse } from 'next/server';
import { dbQuery, dbInsert, dbUpdate, isDatabaseConnected } from '@/lib/db';
import { getUserFromRequest, requireRole } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * Platform settings stored in the database.
 * Uses the vendors table as a singleton settings store via a special 'platform_config' user_id,
 * OR a dedicated platform_settings table if it exists.
 * 
 * Fallback: in-memory defaults if DB is not connected.
 */

const DEFAULT_SETTINGS = {
  platform_commission: 10,          // percentage
  free_shipping_threshold: 50000,   // in NGN
  min_withdrawal: 5000,             // minimum vendor withdrawal
  payout_schedule: 'weekly',        // automatic payout schedule
  platform_name: 'OjaBridge',
  support_email: 'support@ojabridge.com',
  support_phone: '+234 800 OJABRIDGE',
};

/**
 * GET /api/admin/settings — Get platform settings (admin only)
 */
export async function GET(request) {
  try {
    const user = await getUserFromRequest(request);
    const auth = requireRole(user, 'admin');
    if (!auth.authorized) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    if (!isDatabaseConnected()) {
      return NextResponse.json({ success: true, settings: DEFAULT_SETTINGS });
    }

    // Try to read from platform_settings table, then vendors fallback
    try {
      const { data } = await dbQuery('platform_settings', { filter: { key: 'platform_config' } });
      if (data && data.length > 0 && data[0].value) {
        const settings = typeof data[0].value === 'string' ? JSON.parse(data[0].value) : data[0].value;
        return NextResponse.json({ success: true, settings: { ...DEFAULT_SETTINGS, ...settings } });
      }
    } catch {
      // Table might not exist — try vendors fallback
    }

    try {
      const { data: vendorConfig } = await dbQuery('vendors', { filter: { store_slug: 'platform-config' } });
      if (vendorConfig && vendorConfig.length > 0 && vendorConfig[0].product_categories) {
        const cats = vendorConfig[0].product_categories;
        const settingsStr = Array.isArray(cats) ? cats[0] : cats;
        const settings = typeof settingsStr === 'string' ? JSON.parse(settingsStr) : settingsStr;
        return NextResponse.json({ success: true, settings: { ...DEFAULT_SETTINGS, ...settings } });
      }
    } catch {}

    return NextResponse.json({ success: true, settings: DEFAULT_SETTINGS });
  } catch (error) {
    console.error('[ADMIN-SETTINGS] GET error:', error);
    return NextResponse.json({ success: true, settings: DEFAULT_SETTINGS });
  }
}

/**
 * POST /api/admin/settings — Update platform settings (super admin only)
 */
export async function POST(request) {
  try {
    const user = await getUserFromRequest(request);
    const auth = requireRole(user, 'admin');
    if (!auth.authorized) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    const body = await request.json();
    const { settings } = body;

    if (!settings || typeof settings !== 'object') {
      return NextResponse.json({ success: false, error: 'Settings object required' }, { status: 400 });
    }

    // Validate commission rate
    if (settings.platform_commission !== undefined) {
      const rate = Number(settings.platform_commission);
      if (isNaN(rate) || rate < 0 || rate > 50) {
        return NextResponse.json({ success: false, error: 'Commission must be between 0% and 50%' }, { status: 400 });
      }
      settings.platform_commission = rate;
    }

    // Validate free shipping threshold
    if (settings.free_shipping_threshold !== undefined) {
      const threshold = Number(settings.free_shipping_threshold);
      if (isNaN(threshold) || threshold < 0) {
        return NextResponse.json({ success: false, error: 'Free shipping threshold must be a positive number' }, { status: 400 });
      }
      settings.free_shipping_threshold = threshold;
    }

    if (!isDatabaseConnected()) {
      return NextResponse.json({ success: false, error: 'Database not connected' }, { status: 503 });
    }

    // Save to database
    // Try platform_settings table first, then use vendors table as fallback
    let saved = false;
    
    try {
      const { data: existing } = await dbQuery('platform_settings', { filter: { key: 'platform_config' } });
      if (existing && existing.length > 0) {
        await dbUpdate('platform_settings', { key: 'platform_config' }, {
          value: JSON.stringify(settings),
          updated_at: new Date().toISOString(),
          updated_by: user.id,
        });
        saved = true;
      } else {
        await dbInsert('platform_settings', {
          key: 'platform_config',
          value: JSON.stringify(settings),
          updated_at: new Date().toISOString(),
          updated_by: user.id,
        });
        saved = true;
      }
    } catch (tableErr) {
      console.warn('[ADMIN-SETTINGS] platform_settings table not found, using vendors fallback:', tableErr.message);
    }

    if (!saved) {
      // Fallback: store settings in vendors table as a special config entry
      try {
        const { data: existingConfig } = await dbQuery('vendors', { filter: { store_slug: 'platform-config' } });
        const configData = {
          user_id: 'platform_config',
          store_name: 'Platform Configuration',
          store_slug: 'platform-config',
          business_name: 'OjaBridge Platform Settings',
          product_categories: [JSON.stringify(settings)],
        };
        if (existingConfig && existingConfig.length > 0) {
          await dbUpdate('vendors', { store_slug: 'platform-config' }, {
            product_categories: [JSON.stringify(settings)],
          });
        } else {
          await dbInsert('vendors', configData);
        }
        saved = true;
      } catch (fallbackErr) {
        console.error('[ADMIN-SETTINGS] Fallback save also failed:', fallbackErr.message);
      }
    }

    if (!saved) {
      return NextResponse.json({ success: false, error: 'Could not save settings to database' }, { status: 500 });
    }

    // Invalidate the settings cache so changes take effect immediately
    try {
      const { invalidateSettingsCache } = await import('@/lib/platform-config');
      invalidateSettingsCache();
    } catch {}

    // Audit log
    try {
      await dbInsert('audit_logs', {
        action: 'platform.settings_updated',
        entity_type: 'platform',
        entity_id: 'platform_config',
        user_id: user.id,
        user_email: user.email,
        details: `Platform settings updated: ${Object.keys(settings).join(', ')}`,
        level: 'info',
      });
    } catch {}

    return NextResponse.json({ success: true, settings, message: 'Platform settings saved successfully' });
  } catch (error) {
    console.error('[ADMIN-SETTINGS] POST error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
