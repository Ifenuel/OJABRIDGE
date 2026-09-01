import { NextResponse } from 'next/server';
import { dbQuery, dbInsert, dbUpdate, isDatabaseConnected } from '@/lib/db';
import { getUserFromRequest, requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * GET /api/disputes — List disputes (filtered by role)
 * POST /api/disputes — Open a new dispute
 */
export async function GET(request) {
  try {
    const user = await getUserFromRequest(request);
    const authCheck = requireAuth(user);
    if (!authCheck.authorized) {
      return NextResponse.json({ success: false, error: authCheck.error }, { status: authCheck.status });
    }

    if (!isDatabaseConnected()) {
      return NextResponse.json({ success: true, disputes: [], dbConnected: false });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');

    // Role-based filtering
    let filter = {};
    if (user.role === 'customer') {
      filter.raised_by = user.id;
    } else if (user.role === 'vendor') {
      // Get vendor profile ID first
      const vendorProfile = await dbQuery('vendors', { filter: { user_id: user.id } });
      if (vendorProfile.data && vendorProfile.data[0]) {
        filter.vendor_id = vendorProfile.data[0].id;
      }
    }
    // Admin sees all disputes (no filter)

    if (status) filter.status = status;

    const { data: disputes, error } = await dbQuery('disputes', {
      filter,
      order: { column: 'created_at', ascending: false },
      limit: 20,
      offset: (page - 1) * 20,
    });

    if (error) {
      return NextResponse.json({ success: false, error }, { status: 500 });
    }

    return NextResponse.json({ success: true, disputes: disputes || [] });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = await getUserFromRequest(request);
    const authCheck = requireAuth(user);
    if (!authCheck.authorized) {
      return NextResponse.json({ success: false, error: authCheck.error }, { status: authCheck.status });
    }

    if (user.role !== 'customer') {
      return NextResponse.json({ success: false, error: 'Only customers can open disputes' }, { status: 403 });
    }

    const body = await request.json();
    const { orderId, orderItemId, reason, description, evidence } = body;

    const errors = [];
    if (!orderId) errors.push('Order ID is required');
    if (!reason) errors.push('Reason is required');
    if (!description) errors.push('Description is required');

    if (errors.length > 0) {
      return NextResponse.json({ success: false, errors }, { status: 400 });
    }

    if (!isDatabaseConnected()) {
      return NextResponse.json({ success: false, error: 'Database not connected' }, { status: 503 });
    }

    // Get order to find vendor
    const order = await dbQuery('orders', { filter: { id: orderId } });
    if (!order.data || order.data.length === 0) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    // Get order item to find vendor
    let vendorId = null;
    if (orderItemId) {
      const item = await dbQuery('order_items', { filter: { id: orderItemId } });
      if (item.data && item.data[0]) vendorId = item.data[0].vendor_id;
    } else {
      const items = await dbQuery('order_items', { filter: { order_id: orderId } });
      if (items.data && items.data[0]) vendorId = items.data[0].vendor_id;
    }

    const { data: dispute, error } = await dbInsert('disputes', {
      order_id: orderId,
      raised_by: user.id,
      vendor_id: vendorId,
      reason,
      description,
      evidence: evidence ? JSON.stringify(evidence) : null,
      status: 'open',
    });

    if (error) {
      return NextResponse.json({ success: false, error }, { status: 500 });
    }

    // Update order status
    await dbUpdate('orders', { id: orderId }, { status: 'disputed' });

    return NextResponse.json({ success: true, dispute }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PATCH /api/disputes — Admin resolve a dispute
 * Body: { disputeId, status, resolution }
 */
export async function PATCH(request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 });
    }

    if (!isDatabaseConnected()) return NextResponse.json({ success: false, error: 'Database not connected' }, { status: 503 });

    const body = await request.json();
    const { disputeId, status, resolution } = body;

    if (!disputeId) return NextResponse.json({ success: false, error: 'Dispute ID required' }, { status: 400 });

    const validStatuses = ['open', 'under_review', 'vendor_response_required', 'escalated', 'resolved_favor_buyer', 'resolved_favor_vendor', 'closed'];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json({ success: false, error: 'Invalid status' }, { status: 400 });
    }

    const updates = {};
    if (status) {
      updates.status = status;
      updates.resolved_at = ['resolved_favor_buyer', 'resolved_favor_vendor', 'closed'].includes(status) ? new Date().toISOString() : null;
      updates.resolved_by = user.id;
    }
    if (resolution) updates.resolution = resolution;

    const { data: updated, error } = await dbUpdate('disputes', { id: disputeId }, updates);
    if (error) return NextResponse.json({ success: false, error }, { status: 500 });

    // If resolved, update order status back
    if (status && ['resolved_favor_buyer', 'resolved_favor_vendor', 'closed'].includes(status)) {
      const dispute = await dbQuery('disputes', { filter: { id: disputeId } });
      if (dispute.data?.[0]?.order_id) {
        await dbUpdate('orders', { id: dispute.data[0].order_id }, {
          status: status === 'resolved_favor_buyer' ? 'refunded' : 'completed',
        });
      }
    }

    // Audit log
    await dbInsert('audit_logs', {
      user_id: user.id,
      action: 'dispute.resolved',
      entity_type: 'dispute',
      entity_id: disputeId,
      new_data: updates,
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, dispute: updated });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
