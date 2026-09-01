import { NextResponse } from 'next/server';
import { dbQuery, dbInsert, isDatabaseConnected } from '@/lib/db';
import { getUserFromRequest, requireAuth, sanitizeInput } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * POST /api/reports — Report a vendor or product for fraud/fake products
 * GET /api/reports — Get reports (admin only)
 */
export async function POST(request) {
  try {
    const user = await getUserFromRequest(request);
    const auth = requireAuth(user);
    if (!auth.authorized) return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });

    if (!isDatabaseConnected()) {
      return NextResponse.json({ success: false, error: 'Database not connected' }, { status: 503 });
    }

    const body = await request.json();
    const { targetType, targetId, reason, description, evidence } = body;

    // Validation
    const errors = [];
    if (!targetType || !['vendor', 'product'].includes(targetType)) errors.push('targetType must be vendor or product');
    if (!targetId) errors.push('Target ID is required');
    if (!reason || reason.trim().length < 3) errors.push('Reason is required');
    if (!description || description.trim().length < 10) errors.push('Description must be at least 10 characters');
    if (errors.length > 0) return NextResponse.json({ success: false, errors }, { status: 400 });

    // Find vendor_id (either directly or through product)
    let vendorId = null;
    let orderId = null;

    if (targetType === 'product') {
      const product = await dbQuery('products', { filter: { id: targetId } });
      if (product.data?.[0]) vendorId = product.data[0].vendor_id;
    } else {
      vendorId = targetId;
    }

    // Create dispute (reusing disputes table for reports)
    const { data: dispute, error } = await dbInsert('disputes', {
      order_id: orderId,
      raised_by: user.id,
      vendor_id: vendorId,
      reason: `Report: ${sanitizeInput(reason)}`,
      description: `[${targetType.toUpperCase()} REPORT] ${sanitizeInput(description)}\n\nTarget ID: ${targetId}`,
      evidence: evidence ? JSON.stringify(evidence) : null,
      status: 'open',
    });

    if (error) return NextResponse.json({ success: false, error }, { status: 500 });

    // Audit log
    await dbInsert('audit_logs', {
      user_id: user.id,
      action: 'report.submitted',
      entity_type: targetType,
      entity_id: targetId,
      new_data: { reason, description: description.substring(0, 500), targetType },
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: 'Report submitted. Our team will review it and take appropriate action.',
      reportId: dispute.id,
    }, { status: 201 });
  } catch (error) {
    console.error('Report error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 });
    }

    if (!isDatabaseConnected()) {
      return NextResponse.json({ success: true, reports: [], dbConnected: false });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    let filter = {};
    if (status) filter.status = status;

    const { data: reports, error } = await dbQuery('disputes', {
      filter: { ...filter, reason: 'Report%' },
      order: { column: 'created_at', ascending: false },
      limit: 50,
    });

    if (error) return NextResponse.json({ success: false, error }, { status: 500 });
    return NextResponse.json({ success: true, reports: reports || [] });
  } catch (error) {
    console.error('Reports list error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
