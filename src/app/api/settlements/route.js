import { NextResponse } from 'next/server';
import { dbQuery, dbInsert, dbUpdate, isDatabaseConnected } from '@/lib/db';
import { getUserFromRequest, requireRole } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * GET /api/settlements — List settlements
 * POST /api/settlements — Trigger a settlement payout (admin)
 */
export async function GET(request) {
  try {
    const user = await getUserFromRequest(request);
    const auth = requireRole(user, 'vendor', 'admin');
    if (!auth.authorized) return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });

    if (!isDatabaseConnected()) {
      return NextResponse.json({ success: true, settlements: [], dbConnected: false });
    }

    let filter = {};
    if (user.role === 'vendor') {
      const vendorProfile = await dbQuery('vendors', { filter: { user_id: user.id } });
      if (vendorProfile.data?.[0]) filter.vendor_id = vendorProfile.data[0].id;
    }

    const { data: settlements, error } = await dbQuery('settlements', {
      filter,
      order: { column: 'created_at', ascending: false },
    });

    if (error) return NextResponse.json({ success: false, error }, { status: 500 });
    return NextResponse.json({ success: true, settlements: settlements || [] });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = await getUserFromRequest(request);
    const auth = requireRole(user, 'admin');
    if (!auth.authorized) return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });

    const body = await request.json();
    const { vendorId, orderId, amount, currency } = body;

    if (!vendorId || !amount) {
      return NextResponse.json({ success: false, error: 'Vendor ID and amount required' }, { status: 400 });
    }

    if (!isDatabaseConnected()) {
      return NextResponse.json({ success: false, error: 'Database not connected' }, { status: 503 });
    }

    // Check vendor exists
    const vendor = await dbQuery('vendors', { filter: { id: vendorId } });
    if (!vendor.data || vendor.data.length === 0) {
      return NextResponse.json({ success: false, error: 'Vendor not found' }, { status: 404 });
    }

    // Create settlement record
    const { data: settlement, error } = await dbInsert('settlements', {
      vendor_id: vendorId,
      order_id: orderId || null,
      amount,
      currency: currency || 'NGN',
      status: 'pending',
      created_at: new Date().toISOString(),
    });

    if (error) return NextResponse.json({ success: false, error }, { status: 500 });

    // Audit log
    await dbInsert('audit_logs', {
      user_id: user.id,
      action: 'settlement.created',
      entity_type: 'settlement',
      entity_id: settlement.id,
      new_data: { vendor_id: vendorId, amount, currency: currency || 'NGN' },
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, settlement }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
