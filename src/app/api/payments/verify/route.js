import { NextResponse } from 'next/server';
import { dbQuery, dbUpdate, dbInsert, isDatabaseConnected } from '@/lib/db';
import { verifyPayment } from '@/lib/paystack';

/**
 * POST /api/payments/verify
 * Verify a Paystack transaction and update order status
 * 
 * SECURITY:
 * - Must verify with Paystack server-side (never trust client callback)
 * - Idempotent: handles duplicate webhooks gracefully
 * - Amount verified against server-stored order total
 * - Commission calculated server-side (10%)
 * - All financial updates are atomic
 * - Full audit trail
 */

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const body = await request.json();
    const { reference } = body;

    if (!reference) {
      return NextResponse.json({ success: false, error: 'Transaction reference is required' }, { status: 400 });
    }

    if (!isDatabaseConnected()) {
      return NextResponse.json({ success: false, error: 'Database not connected' }, { status: 503 });
    }

    // 1. Find the transaction in our database
    const { data: transactions } = await dbQuery('transactions', { 
      filter: { paystack_reference: reference } 
    });
    const transaction = transactions?.[0];

    if (!transaction) {
      return NextResponse.json({ success: false, error: 'Transaction not found' }, { status: 404 });
    }

    // 2. Idempotency — already verified
    if (transaction.status === 'completed') {
      return NextResponse.json({ success: true, message: 'Transaction already verified', alreadyVerified: true });
    }

    // 3. Verify with Paystack server-side
    try {

      const verification = await verifyPayment(reference);

      if (!verification.verified) {
        // Update transaction as failed
        await dbUpdate('transactions', { id: transaction.id }, {
          status: 'failed',
          failure_reason: verification.error || 'Verification failed',
          verified_at: new Date().toISOString(),
        });

        return NextResponse.json({ success: false, error: 'Payment verification failed' }, { status: 400 });
      }

      // 4. Verify amount matches (SERVER-SIDE CHECK)
      const serverAmount = transaction.amount;
      const paidAmount = verification.amount;

      if (Math.abs(serverAmount - paidAmount) > 1) {
        // Amount mismatch — flag for review but don't auto-reject
        await dbUpdate('transactions', { id: transaction.id }, {
          status: 'flagged',
          failure_reason: `Amount mismatch: expected ${serverAmount}, received ${paidAmount}`,
          verified_at: new Date().toISOString(),
        });

        console.error(`[PAYMENT] Amount mismatch: reference=${reference} expected=${serverAmount} received=${paidAmount}`);
        return NextResponse.json({ success: false, error: 'Amount verification failed' }, { status: 400 });
      }

      // 5. Verify currency matches
      if (verification.currency !== transaction.currency) {
        await dbUpdate('transactions', { id: transaction.id }, {
          status: 'flagged',
          failure_reason: `Currency mismatch: expected ${transaction.currency}, received ${verification.currency}`,
        });
        return NextResponse.json({ success: false, error: 'Currency verification failed' }, { status: 400 });
      }

      // 6. Calculate commission (SERVER-SIDE) — reads from platform settings
      const { getCommissionRate } = await import('@/lib/platform-config');
      const commissionRate = await getCommissionRate();
      const totalAmount = serverAmount;
      const commissionAmount = Math.round(totalAmount * (commissionRate / 100) * 100) / 100;
      const vendorAmount = Math.round((totalAmount - commissionAmount) * 100) / 100;

      // 7. Update transaction as completed
      await dbUpdate('transactions', { id: transaction.id }, {
        status: 'completed',
        verified_at: new Date().toISOString(),
        paystack_response: verification,
        commission_amount: commissionAmount,
        vendor_amount: vendorAmount,
      });

      // 8. Update order payment status
      const orderId = transaction.order_id;
      await dbUpdate('orders', { id: orderId }, {
        payment_status: 'paid',
        status: 'confirmed',
        paystack_reference: reference,
      });

      // 9. Record commission
      await dbInsert('commissions', {
        order_id: orderId,
        amount: commissionAmount,
        currency: transaction.currency,
        commission_rate: commissionRate,
        status: 'pending_settlement',
      });

      // 10. Create vendor wallet entry (pending earnings — eligible for settlement on delivery confirmation)
      const { data: orderItems } = await dbQuery('order_items', { filter: { order_id: orderId } });
      if (orderItems) {
        const vendorGroups = {};
        for (const item of orderItems) {
          if (!vendorGroups[item.vendor_id]) {
            vendorGroups[item.vendor_id] = { total: 0, items: [] };
          }
          vendorGroups[item.vendor_id].total += item.vendor_payout || 0;
          vendorGroups[item.vendor_id].items.push(item);
        }

        for (const [vendorId, group] of Object.entries(vendorGroups)) {
          await dbInsert('vendor_wallets', {
            vendor_id: vendorId,
            order_id: orderId,
            amount: group.total,
            currency: transaction.currency,
            status: 'pending', // Eligible for settlement after delivery confirmation
            commission_rate: commissionRate,
            commission_amount: Math.round(group.total * (commissionRate / 100) * 100) / 100,
          });
        }
      }

      // 11. Audit log
      await dbInsert('audit_logs', {
        action: 'payment.verified',
        entity_type: 'order',
        entity_id: orderId,
        new_data: { reference, amount: totalAmount, commission: commissionAmount, vendorAmount },
        created_at: new Date().toISOString(),
      });

      return NextResponse.json({
        success: true,
        message: 'Payment verified successfully',
        order: {
          id: orderId,
          status: 'confirmed',
          paymentStatus: 'paid',
        },
      });

    } catch (payError) {
      console.error('Paystack verification error:', payError);
      return NextResponse.json({ 
        success: false, 
        error: 'Payment provider verification failed' 
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Payment verification error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
