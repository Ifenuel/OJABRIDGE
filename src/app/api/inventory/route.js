import { NextResponse } from 'next/server';
import { dbQuery, dbUpdate, dbInsert, isDatabaseConnected } from '@/lib/db';
import { getUserFromRequest, requireRole } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * GET /api/inventory — Get vendor inventory
 * PATCH /api/inventory — Update stock levels
 */
export async function GET(request) {
  try {
    const user = await getUserFromRequest(request);
    const auth = requireRole(user, 'vendor', 'admin');
    if (!auth.authorized) return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });

    if (!isDatabaseConnected()) {
      return NextResponse.json({ success: true, products: [], dbConnected: false });
    }

    const vendorProfile = await dbQuery('vendors', { filter: { user_id: user.id } });
    const vendorId = user.role === 'admin' ? null : vendorProfile.data?.[0]?.id;

    const filter = vendorId ? { vendor_id: vendorId } : {};
    const { data: products, error } = await dbQuery('products', {
      filter,
      order: { column: 'updated_at', ascending: false },
    });

    if (error) return NextResponse.json({ success: false, error }, { status: 500 });
    return NextResponse.json({ success: true, products: products || [] });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const user = await getUserFromRequest(request);
    const auth = requireRole(user, 'vendor');
    if (!auth.authorized) return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });

    const body = await request.json();
    const { productId, stock, lowStockThreshold } = body;

    if (!productId) return NextResponse.json({ success: false, error: 'Product ID required' }, { status: 400 });

    if (!isDatabaseConnected()) {
      return NextResponse.json({ success: false, error: 'Database not connected' }, { status: 503 });
    }

    // Verify vendor owns this product
    const product = await dbQuery('products', { filter: { id: productId } });
    if (!product.data || product.data.length === 0) {
      return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 });
    }

    const vendorProfile = await dbQuery('vendors', { filter: { user_id: user.id } });
    if (product.data[0].vendor_id !== vendorProfile.data?.[0]?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const updates = {};
    if (stock !== undefined) updates.stock_quantity = stock;

    const { data, error } = await dbUpdate('products', { id: productId }, updates);
    if (error) return NextResponse.json({ success: false, error }, { status: 500 });

    // Log inventory change
    if (stock !== undefined) {
      await dbInsert('audit_logs', {
        user_id: user.id,
        action: 'inventory.adjusted',
        entity_type: 'product',
        entity_id: productId,
        new_data: { stock_quantity: stock },
        created_at: new Date().toISOString(),
      });
    }

    return NextResponse.json({ success: true, product: data });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
