import { NextResponse } from 'next/server';
import { dbQuery, isDatabaseConnected } from '@/lib/db';
import { getUserFromRequest, requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * GET /api/vendors/me
 * Returns the authenticated vendor's OWN store record, resolved server-side
 * from the session — never from a paginated public list.
 *
 * Vendor dashboard pages (overview, products, payouts, store settings) use this
 * instead of fetching /api/vendors?limit=N and find()-ing by user_id, which
 * silently breaks once the vendor is not in the first page of results.
 */
export async function GET(request) {
  try {
    const user = await getUserFromRequest(request);
    const auth = requireAuth(user);
    if (!auth.authorized) return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });

    if (!isDatabaseConnected()) {
      return NextResponse.json({ success: false, error: 'Database not connected' }, { status: 503 });
    }

    const { data: vendors, error } = await dbQuery('vendors', { filter: { user_id: user.id }, limit: 1 });
    if (error) return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });

    const v = vendors?.[0];
    if (!v) {
      return NextResponse.json({ success: true, vendor: null, hasStore: false });
    }

    // Only include fields the owner is allowed to see for their own store.
    // Bank details are returned masked except what payouts checks need for display.
    return NextResponse.json({
      success: true,
      hasStore: true,
      vendor: {
        id: v.id,
        user_id: v.user_id,
        store_name: v.store_name,
        store_slug: v.store_slug,
        store_description: v.store_description,
        store_logo_url: v.store_logo_url,
        store_banner_url: v.store_banner_url,
        business_name: v.business_name,
        business_type: v.business_type,
        business_phone: v.business_phone,
        business_email: v.business_email,
        product_categories: v.product_categories,
        kyc_status: v.kyc_status,
        bank_verification_status: v.bank_verification_status,
        bank_name: v.bank_name,
        // masked account number — presence checks still work, value stays safe
        bank_account_number: v.bank_account_number
          ? v.bank_account_number.slice(-4).padStart(v.bank_account_number.length, '*')
          : null,
        bank_account_name: v.bank_account_name,
        kyc_rejection_reason: v.kyc_rejection_reason,
        additional_info_request: v.additional_info_request || null,
        total_earnings: v.total_earnings,
        pending_earnings: v.pending_earnings,
        settled_earnings: v.settled_earnings,
        average_rating: v.average_rating,
        total_reviews: v.total_reviews,
        total_orders: v.total_orders,
        store_views: v.store_views,
        is_active: v.is_active,
        created_at: v.created_at,
      },
    });
  } catch (error) {
    console.error('Vendor /me error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
