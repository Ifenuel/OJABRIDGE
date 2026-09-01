import { NextResponse } from 'next/server';
import { dbQuery, dbInsert, dbUpdate, dbRaw, isDatabaseConnected } from '@/lib/db';
import { getUserFromRequest, requireAuth, requireRole, generateOrderId } from '@/lib/auth';
import { initializePayment } from '@/lib/paystack';
import { sendOrderConfirmation, sendVendorNewOrder } from '@/lib/email';

export const dynamic = 'force-dynamic';

/**
 * GET /api/orders — Fetch orders (role-based)
 * POST /api/orders — Create a new order
 */
export async function GET(request) {
  try {
    const user = await getUserFromRequest(request);
    const auth = requireAuth(user);
    if (!auth.authorized) return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });

    if (!isDatabaseConnected()) {
      return NextResponse.json({ success: true, orders: [], dbConnected: false });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    let filter = {};

    if (user.role === 'customer') {
      filter.user_id = user.id;
    } else if (user.role === 'vendor') {
      const vendorProfile = await dbQuery('vendors', { filter: { user_id: user.id } });
      if (vendorProfile.data?.[0]) {
        // Find orders containing this vendor's items
        const orderItemsResult = await dbRaw(
          'SELECT DISTINCT order_id FROM order_items WHERE vendor_id = $1',
          [vendorProfile.data[0].id]
        );
        const orderIds = (orderItemsResult.rows || []).map(i => i.order_id);
        if (orderIds.length > 0) {
          const placeholders = orderIds.map((_, i) => `$${i + 1}`).join(', ');
          let query = `SELECT * FROM orders WHERE id IN (${placeholders})`;
          const params = [...orderIds];
          if (status) {
            query += ` AND status = $${params.length + 1}`;
            params.push(status);
          }
          query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
          params.push(limit, offset);

          const result = await dbRaw(query, params);
          return NextResponse.json({ success: true, orders: result.rows || [] });
        }
        return NextResponse.json({ success: true, orders: [] });
      }
    }
    // Admin sees all (no user filter)

    if (status) filter.status = status;

    const { data: orders, error } = await dbQuery('orders', {
      filter,
      order: { column: 'created_at', ascending: false },
      limit,
      offset,
    });

    if (error) return NextResponse.json({ success: false, error }, { status: 500 });
    return NextResponse.json({ success: true, orders: orders || [] });
  } catch (error) {
    console.error('Orders API error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = await getUserFromRequest(request);
    const auth = requireAuth(user);
    if (!auth.authorized) return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });

    const body = await request.json();
    const { items, shipping, currency, paymentMethod } = body;

    // Validation
    const errors = [];
    if (!items || items.length === 0) errors.push('At least one item is required');
    if (!shipping?.address) errors.push('Delivery address is required');
    if (!shipping?.email) errors.push('Email is required');
    if (errors.length > 0) return NextResponse.json({ success: false, errors }, { status: 400 });

    if (!isDatabaseConnected()) {
      return NextResponse.json({ success: false, error: 'Database not connected' }, { status: 503 });
    }

    // Calculate totals SERVER-SIDE (never trust client amounts)
    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await dbQuery('products', { filter: { id: item.productId } });
      if (!product.data?.[0]) {
        errors.push(`Product ${item.productId} not found`);
        continue;
      }

      const dbProduct = product.data[0];
      if (dbProduct.stock_quantity < item.quantity) {
        errors.push(`Insufficient stock for ${dbProduct.name}`);
        continue;
      }

      const unitPrice = dbProduct.price;
      const totalPrice = unitPrice * item.quantity;
      const commissionRate = parseFloat(process.env.COMMISSION_RATE || '10');
      const commissionAmount = Math.round(totalPrice * (commissionRate / 100) * 100) / 100;

      subtotal += totalPrice;
      orderItems.push({
        product_id: dbProduct.id,
        vendor_id: dbProduct.vendor_id,
        product_name: dbProduct.name,
        product_image: dbProduct.images?.[0] || null,
        quantity: item.quantity,
        unit_price: unitPrice,
        total_price: totalPrice,
        vendor_payout: totalPrice - commissionAmount,
      });
    }

    if (errors.length > 0) return NextResponse.json({ success: false, errors }, { status: 400 });

    const shippingFee = subtotal > 50000 ? 0 : 2500;
    const totalAmount = subtotal + shippingFee;

    // Create order
    const orderNumber = generateOrderId();
    const { data: order, error: orderError } = await dbInsert('orders', {
      order_number: orderNumber,
      user_id: user.id,
      status: 'pending',
      payment_status: 'pending',
      currency: currency || 'NGN',
      subtotal,
      shipping_cost: shippingFee,
      total: totalAmount,
      shipping_address: JSON.stringify({
        name: `${shipping.firstName || ''} ${shipping.lastName || ''}`.trim(),
        email: shipping.email,
        phone: shipping.phone || null,
        address: shipping.address,
        city: shipping.city || null,
        state: shipping.state || null,
        country: shipping.country || 'NG',
      }),
    });

    if (orderError) return NextResponse.json({ success: false, error: orderError }, { status: 500 });

    // Create order items
    for (const item of orderItems) {
      await dbInsert('order_items', { ...item, order_id: order.id });
    }

    // Reduce inventory
    for (const item of orderItems) {
      const product = await dbQuery('products', { filter: { id: item.product_id } });
      if (product.data?.[0]) {
        const newStock = product.data[0].stock_quantity - item.quantity;
        await dbUpdate('products', { id: item.product_id }, { stock_quantity: Math.max(0, newStock) });
      }
    }

    // Initialize Paystack payment
    let paymentData = null;
    if (shipping.email) {
      try {

        paymentData = await initializePayment({
          email: shipping.email,
          amount: totalAmount,
          currency: currency || 'NGN',
          orderId: order.id,
        });

        // Save transaction record
        await dbInsert('transactions', {
          order_id: order.id,
          user_id: user.id,
          amount: totalAmount,
          currency: currency || 'NGN',
          status: 'pending',
          payment_method: paymentMethod || 'card',
          paystack_reference: paymentData?.reference || null,
        });
      } catch (payError) {
        console.error('Payment init error:', payError);
      }
    }

    // Send order confirmation email (non-blocking)
    sendOrderConfirmation({
      email: shipping.email,
      name: `${shipping.firstName || ''} ${shipping.lastName || ''}`.trim(),
      orderNumber,
      items: orderItems,
      total: totalAmount,
      currency: currency || 'NGN',
      shippingAddress: `${shipping.address}, ${shipping.city || ''}, ${shipping.state || ''}`,
      paymentRef: paymentData?.reference,
    }).catch(e => console.error('[EMAIL] Order confirmation failed:', e.message));

    // Notify vendors (non-blocking)
    for (const item of orderItems) {
      try {
        const vendorResult = await dbQuery('vendors', { filter: { id: item.vendor_id } });
        const vendor = vendorResult.data?.[0];
        // Vendor email is on the users table, not vendors
        let vendorEmail = null;
        let vendorName = vendor?.store_name || 'Vendor';
        if (vendor?.user_id) {
          const userResult = await dbQuery('users', { filter: { id: vendor.user_id } });
          vendorEmail = userResult.data?.[0]?.email || null;
        }
        if (vendorEmail) {
          sendVendorNewOrder({
            email: vendorEmail,
            vendorName,
            orderNumber,
            items: orderItems.filter(i => i.vendor_id === item.vendor_id),
            total: orderItems.filter(i => i.vendor_id === item.vendor_id).reduce((sum, i) => sum + parseFloat(i.total_price || 0), 0),
            currency: currency || 'NGN',
            buyerName: `${shipping.firstName || ''} ${shipping.lastName || ''}`.trim(),
          }).catch(e => console.error('[EMAIL] Vendor notification failed:', e.message));
        }
      } catch (e) { /* non-critical */ }
    }

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        orderNumber,
        totalAmount,
        currency: currency || 'NGN',
        items: orderItems,
      },
      payment: paymentData,
    }, { status: 201 });
  } catch (error) {
    console.error('Order creation error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PATCH /api/orders — Update order status (vendor/admin)
 */
export async function PATCH(request) {
  try {
    const user = await getUserFromRequest(request);
    const auth = requireAuth(user);
    if (!auth.authorized) return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });

    if (!isDatabaseConnected()) {
      return NextResponse.json({ success: false, error: 'Database not connected' }, { status: 503 });
    }

    const body = await request.json();
    const { orderId, status, payment_status, tracking_number, carrier } = body;

    if (!orderId) return NextResponse.json({ success: false, error: 'Order ID required' }, { status: 400 });

    // Verify order exists
    const { data: orders } = await dbQuery('orders', { filter: { id: orderId } });
    const order = orders?.[0];
    if (!order) return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });

    // Vendors can only update orders containing their items
    if (user.role === 'vendor') {
      const vendorProfile = await dbQuery('vendors', { filter: { user_id: user.id } });
      const vendorId = vendorProfile.data?.[0]?.id;
      if (!vendorId) return NextResponse.json({ success: false, error: 'Vendor profile not found' }, { status: 404 });

      const { data: items } = await dbQuery('order_items', { filter: { order_id: orderId, vendor_id: vendorId } });
      if (!items || items.length === 0) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const updates = {};
    if (status) updates.status = status;
    if (payment_status) updates.payment_status = payment_status;
    if (tracking_number) updates.tracking_number = tracking_number;
    if (carrier) updates.carrier = carrier;

    const { data: updated, error } = await dbUpdate('orders', { id: orderId }, updates);
    if (error) return NextResponse.json({ success: false, error }, { status: 500 });

    return NextResponse.json({ success: true, order: updated });
  } catch (error) {
    console.error('Order update error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
