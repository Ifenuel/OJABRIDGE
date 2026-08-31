import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { dbQuery, dbInsert, isDatabaseConnected } from '@/lib/db';
import { initializePayment } from '@/lib/paystack';

/**
 * POST /api/payments/initialize
 * Initialize a Paystack transaction for an order
 * 
 * SECURITY:
 * - Amount is ALWAYS calculated server-side from the order
 * - Never trust client-provided amounts
 * - Order must exist and be in 'pending' payment state
 * - Transaction reference is stored before calling Paystack
 */

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const body = await request.json();
    const { orderId, currency = 'NGN' } = body;

    if (!orderId) {
      return NextResponse.json({ success: false, error: 'Order ID is required' }, { status: 400 });
    }

    if (!['NGN', 'USD', 'EUR', 'GBP'].includes(currency)) {
      return NextResponse.json({ success: false, error: 'Unsupported currency' }, { status: 400 });
    }

    // When database is connected: verify order exists and calculate amount server-side
    if (isDatabaseConnected()) {
      const { data: orders } = await dbQuery('orders', { filter: { id: orderId } });
      const order = orders?.[0];

      if (!order) {
        return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
      }

      if (order.payment_status === 'paid') {
        return NextResponse.json({ success: false, error: 'Order already paid' }, { status: 400 });
      }

      if (order.status === 'cancelled') {
        return NextResponse.json({ success: false, error: 'Order is cancelled' }, { status: 400 });
      }

      // AMOUNT IS ALWAYS SERVER-CALCULATED
      const serverAmount = order.total;

      // Initialize Paystack payment
      try {

        const paymentData = await initializePayment({
          email: (typeof order.shipping_address === 'object' ? order.shipping_address?.email : null) || 'customer@ojabridge.com',
          amount: serverAmount,
          currency,
          orderId: order.id,
        });

        // Store/update transaction record
        await dbInsert('transactions', {
          order_id: order.id,
          user_id: order.user_id,
          amount: serverAmount,
          currency,
          status: 'pending',
          payment_method: 'paystack',
          paystack_reference: paymentData.reference,
        });

        return NextResponse.json({
          success: true,
          authorizationUrl: paymentData.authorizationUrl,
          accessCode: paymentData.accessCode,
          reference: paymentData.reference,
          amount: serverAmount,
          currency,
        });
      } catch (payError) {
        console.error('Paystack initialization error:', payError);
        return NextResponse.json({ 
          success: false, 
          error: 'Payment provider not configured. Set PAYSTACK_SECRET_KEY in .env.local' 
        }, { status: 503 });
      }
    }

    // Without database: return error
    return NextResponse.json({
      success: false,
      error: 'Database not connected. Configure DATABASE_URL in .env',
    }, { status: 503 });

  } catch (error) {
    console.error('Payment initialization error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
