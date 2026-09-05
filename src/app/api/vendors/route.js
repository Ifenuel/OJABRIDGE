import { NextResponse } from 'next/server';
import { dbQuery, dbInsert, dbUpdate, dbRaw, isDatabaseConnected } from '@/lib/db';
import { getUserFromRequest, requireRole } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * GET /api/vendors — Fetch vendor stores (public or admin)
 * Supports: search, filter by kyc_status, pagination
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const search = searchParams.get('search');
    const kycStatus = searchParams.get('kyc_status');
    const offset = (page - 1) * limit;

    if (!isDatabaseConnected()) {
      return NextResponse.json({
        success: true, vendors: [], pagination: { page, limit, total: 0, pages: 0 }, dbConnected: false,
      });
    }

    // Build query with user info joined
    let conditions = [];
    const params = [];
    let paramIndex = 1;

    if (search && search.trim()) {
      conditions.push(`(v.store_name ILIKE $${paramIndex} OR v.business_name ILIKE $${paramIndex} OR u.email ILIKE $${paramIndex})`);
      params.push(`%${search.trim()}%`);
      paramIndex++;
    }

    if (kycStatus) {
      conditions.push(`v.kyc_status = $${paramIndex}`);
      params.push(kycStatus);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Count total
    const countResult = await dbRaw(
      `SELECT COUNT(*) as total FROM vendors v LEFT JOIN users u ON v.user_id = u.id ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows?.[0]?.total || 0);

    // Fetch vendors with user info
    const { rows: vendors, error } = await dbRaw(
      `SELECT 
        v.id, v.user_id, v.store_name, v.store_slug, v.store_description, v.store_logo_url,
        v.business_name, v.business_type, v.rc_number, v.business_address, v.business_city,
        v.business_country, v.product_categories, v.kyc_status, v.bank_verification_status,
        v.total_earnings, v.pending_earnings, v.settled_earnings, v.total_commission_paid,
        v.average_rating, v.total_reviews, v.total_orders, v.store_views, v.is_active,
        v.kyc_rejection_reason, v.kyc_submitted_at, v.kyc_verified_at,
        v.created_at, v.updated_at,
        u.name as owner_name, u.email as owner_email, u.phone as owner_phone,
        u.status as user_status, u.avatar_url, u.country as user_country
      FROM vendors v
      LEFT JOIN users u ON v.user_id = u.id
      ${whereClause}
      ORDER BY v.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, offset]
    );

    if (error) {
      console.error('Vendors query error:', error);
      return NextResponse.json({ success: false, error }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      vendors: vendors || [],
      data: vendors || [],
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      dbConnected: true,
    });
  } catch (error) {
    console.error('Vendors API error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PATCH /api/vendors — Admin vendor management
 * Body: { vendorId, kyc_status, is_active, bank_verification_status }
 */
export async function PATCH(request) {
  try {
    const user = await getUserFromRequest(request);
    const auth = requireRole(user, 'admin');
    if (!auth.authorized) return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });

    if (!isDatabaseConnected()) {
      return NextResponse.json({ success: false, error: 'Database not connected' }, { status: 503 });
    }

    const body = await request.json();
    const { vendorId, kyc_status, is_active, bank_verification_status, kyc_rejection_reason } = body;

    if (!vendorId) return NextResponse.json({ success: false, error: 'Vendor ID required' }, { status: 400 });

    const updates = {};
    if (kyc_status) updates.kyc_status = kyc_status;
    if (is_active !== undefined) updates.is_active = is_active;
    if (bank_verification_status) updates.bank_verification_status = bank_verification_status;
    if (kyc_rejection_reason !== undefined) updates.kyc_rejection_reason = kyc_rejection_reason;

    if (kyc_status === 'VERIFIED') {
      updates.kyc_verified_at = new Date().toISOString();
      updates.kyc_rejection_reason = null; // Clear rejection reason on approval
    }

    const { data: updated, error } = await dbUpdate('vendors', { id: vendorId }, updates);
    if (error) return NextResponse.json({ success: false, error }, { status: 500 });

    // Get vendor user info for notifications
    let vendorUser = null;
    try {
      const { data: vendorData } = await dbQuery('vendors', { filter: { id: vendorId } });
      if (vendorData?.[0]?.user_id) {
        const { data: userData } = await dbQuery('users', { filter: { id: vendorData[0].user_id } });
        vendorUser = userData?.[0];
      }
    } catch {}

    // Send in-app notification to vendor
    if (vendorUser && kyc_status) {
      const statusMessages = {
        VERIFIED: { title: 'KYC Verified!', message: 'Your identity verification has been approved. You can now start selling on OjaBridge.', type: 'success' },
        SUSPENDED: { title: 'Account Suspended', message: 'Your vendor account has been suspended. Please contact support for more information.', type: 'warning' },
        VERIFICATION_FAILED: { title: 'KYC Rejected', message: kyc_rejection_reason ? `Verification was not approved. Reason: ${kyc_rejection_reason}` : 'Your verification documents were not approved. Please review and resubmit.', type: 'error' },
        NOT_STARTED: { title: 'Account Reinstate', message: 'Your account has been reinstated. Please complete your KYC verification.', type: 'info' },
      };
      const notif = statusMessages[kyc_status];
      if (notif) {
        try {
          await dbInsert('notifications', {
            user_id: vendorUser.id,
            title: notif.title,
            message: notif.message,
            type: notif.type,
            is_read: false,
            created_at: new Date().toISOString(),
          });
        } catch (e) { console.error('Notification insert failed:', e.message); }
      }
    }

    // Send email notification to vendor
    if (vendorUser && kyc_status) {
      try {
        const { sendKYCUpdate } = await import('@/lib/email');
        const emailStatus = kyc_status === 'VERIFIED' ? 'verified' : kyc_status === 'SUSPENDED' ? 'rejected' : 'submitted';
        await sendKYCUpdate({
          email: vendorUser.email,
          name: vendorUser.name,
          status: emailStatus,
        });
      } catch (e) { console.error('KYC email failed:', e.message); }
    }

    // Audit log
    await dbInsert('audit_logs', {
      user_id: user.id,
      action: 'vendor.status_changed',
      entity_type: 'vendor',
      entity_id: vendorId,
      new_data: { kyc_status, is_active, bank_verification_status, rejection_reason: kyc_rejection_reason },
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, vendor: updated });
  } catch (error) {
    console.error('Vendor update error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
