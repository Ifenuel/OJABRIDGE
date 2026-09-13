import { NextResponse } from 'next/server';
import { getUserFromRequest, requireAuth } from '@/lib/auth';
import { dbQuery, dbInsert, dbRaw, isDatabaseConnected } from '@/lib/db';
import { initializePayment } from '@/lib/paystack';

/**
 * POST /api/payments/initialize
 * Initialize a Paystack transaction for an order
 * 
 * SECURITY:
 * - Requires an authenticated session; only the order owner (or admin) may pay
 * - Amount is ALWAYS calculated server-side from the order
 * - Never trust client-provided amounts
 * - Order must exist and be in 'pending' payment state
 * - Idempotent: reuses the existing pending transaction reference for the order
 *   instead of minting a new Paystack charge on every retry (double-payment guard)
 */

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const user = await getUserFromRequest(request);
    const auth = requireAuth(user);
    if (!auth.authorized) return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });

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

      // SECURITY: only the buyer (or an admin) may initialize payment for an order
      if (order.user_id !== user.id && user.role !== 'admin') {
        return NextResponse.json({ success: false, error: 'Not authorized to pay this order' }, { status: 403 });
      }

      if (order.payment_status === 'paid') {
        return NextResponse.json({ success: false, error: 'Order already paid' }, { status: 400 });
      }

      if (order.status === 'cancelled') {
        return NextResponse.json({ success: false, error: 'Order is cancelled' }, { status: 400 });
      }

      // AMOUNT IS ALWAYS SERVER-CALCULATED
      const serverAmount = order.total;

      // DOUBLE-PAYMENT GUARD: if a pending transaction already exists for this
      // order, reuse its reference instead of creating another Paystack charge.
      const existingTxnResult = await dbRaw(
        `SELECT id, paystack_reference FROM transactions
         WHERE order_id = $1 AND status = 'pending' AND paystack_reference IS NOT NULL
         ORDER BY created_at DESC LIMIT 1`,
        [order.id]
      );
      const existingTxn = existingTxnResult?.rows?.[0];

      // Initialize Paystack payment
      try {

        let paymentData;
        if (existingTxn?.paystack_reference) {
          // Retry: same reference, so verification still maps 1:1 to this charge
          paymentData = { reference: existingTxn.paystack_reference, authorizationUrl: null, accessCode: null };
          try {
            const fresh = await initializePayment({
              email: (typeof order.shipping_address === 'object' ? order.shipping_address?.email : null) || user.email || 'customer@ojabridge.com',
              amount: serverAmount,
              currency,
              orderId: order.id,
              reference: existingTxn.paystack_reference,
            });
            if (fresh?.reference) paymentData = fresh;
          } catch {
            // Paystack rejected the reused reference (e.g. already used) — fall back
            // to letting the user retry verification on the original reference.
          }
        } else {
          paymentData = await initializePayment({
            email: (typeof order.shipping_address === 'object' ? order.shipping_address?.email : null) || user.email || 'customer@ojabridge.com',
            amount: serverAmount,
            currency,
            orderId: order.id,
          });
        }

        // Store/update transaction record (only when we have a new reference)
        if (!existingTxn) {
          await dbInsert('transactions', {
            order_id: order.id,
            user_id: order.user_id,
            amount: serverAmount,
            currency,
            status: 'pending',
            payment_method: 'paystack',
            paystack_reference: paymentData.reference,
          });
        }

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
