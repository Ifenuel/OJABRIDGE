import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { dbQuery, dbUpdate, dbInsert, dbRaw, isDatabaseConnected } from '@/lib/db';
import { sendOrderConfirmation, sendShippingUpdate, sendVendorNewOrder } from '@/lib/email';

/**
 * POST /api/webhooks/paystack
 * Handle Paystack webhook events
 * 
 * SECURITY:
 * - MUST verify webhook signature (HMAC-SHA512)
 * - MUST be idempotent (handle duplicate webhooks)
 * - MUST log all events for audit
 * - MUST use database transactions for atomic updates
 */

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-paystack-signature');

    // 1. Verify webhook signature
    if (!signature) {
      console.error('Paystack webhook: Missing signature');
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    const webhookSecret = process.env.PAYSTACK_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error('Paystack webhook: PAYSTACK_WEBHOOK_SECRET not configured');
      return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 });
    }

    const expectedSignature = crypto
      .createHmac('sha512', webhookSecret)
      .update(body)
      .digest('hex');

    if (signature !== expectedSignature) {
      console.error('Paystack webhook: Invalid signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // 2. Parse event
    const event = JSON.parse(body);
    const { event: eventType, data } = event;

    console.log(`[WEBHOOK] Received: ${eventType} — Ref: ${data?.reference || 'N/A'}`);

    // 3. Check idempotency — has this event been processed?
    if (isDatabaseConnected() && data?.reference) {
      const { data: existing } = await dbQuery('webhook_events', {
        filter: { paystack_reference: data.reference, event_type: eventType }
      });
      if (existing && existing.length > 0) {
        console.log(`[WEBHOOK] Already processed: ${eventType} — ${data.reference}`);
        return NextResponse.json({ received: true, duplicate: true });
      }
    }

    // 4. Store webhook event for idempotency
    if (isDatabaseConnected()) {
      await dbInsert('webhook_events', {
        event_type: eventType,
        paystack_reference: data?.reference || null,
        payload: event,
        processed_at: new Date().toISOString(),
      });
    }

    // 5. Handle event types
    switch (eventType) {
      case 'charge.success':
        await handleChargeSuccess(data);
        break;
      case 'charge.failed':
        await handleChargeFailed(data);
        break;
      case 'transfer.success':
        await handleTransferSuccess(data);
        break;
      case 'transfer.failed':
        await handleTransferFailed(data);
        break;
      default:
        console.log(`[WEBHOOK] Unhandled event: ${eventType}`);
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('[WEBHOOK] Error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

/**
 * Handle successful charge
 * Verifies payment, updates order, calculates commission, records pending vendor earnings
 */
async function handleChargeSuccess(data) {
  const { reference, amount, currency, metadata } = data;

  if (!isDatabaseConnected()) {
    console.log(`[WEBHOOK] DB not connected — charge success: ${reference}`);
    return;
  }

  // Find transaction
  const { data: transactions } = await dbQuery('transactions', {
    filter: { paystack_reference: reference }
  });
  const transaction = transactions?.[0];

  if (!transaction) {
    console.error(`[WEBHOOK] Transaction not found: ${reference}`);
    return;
  }

  // Idempotency
  if (transaction.status === 'completed') {
    console.log(`[WEBHOOK] Already processed: ${reference}`);
    return;
  }

  // Verify amount server-side
  const paidAmountKobo = amount;
  const expectedAmountKobo = Math.round(transaction.amount * 100);

  if (Math.abs(paidAmountKobo - expectedAmountKobo) > 1) {
    console.error(`[WEBHOOK] Amount mismatch: ${reference} — expected ${expectedAmountKobo}, got ${paidAmountKobo}`);
    await dbUpdate('transactions', { id: transaction.id }, {
      status: 'flagged',
      failure_reason: `Webhook amount mismatch: expected ${expectedAmountKobo}, received ${paidAmountKobo}`,
    });
    return;
  }

  // Calculate commission (SERVER-SIDE) — reads from platform settings
  const { getCommissionRate } = await import('@/lib/platform-config');
  const commissionRate = await getCommissionRate();
  const totalAmount = transaction.amount;
  const commissionAmount = Math.round(totalAmount * (commissionRate / 100) * 100) / 100;
  const vendorAmount = Math.round((totalAmount - commissionAmount) * 100) / 100;

  // Update transaction
  await dbUpdate('transactions', { id: transaction.id }, {
    status: 'completed',
    verified_at: new Date().toISOString(),
    commission_amount: commissionAmount,
    vendor_amount: vendorAmount,
  });

  // Update order
  const orderId = transaction.order_id;
  await dbUpdate('orders', { id: orderId }, {
    payment_status: 'paid',
    status: 'confirmed',
  });

  // Record commission
  await dbInsert('commissions', {
    order_id: orderId,
    amount: commissionAmount,
    currency: currency || 'NGN',
    commission_rate: commissionRate,
    status: 'pending_settlement',
  });

  // Record pending vendor earnings (eligible for settlement after delivery confirmation)
  const { data: orderItems } = await dbQuery('order_items', { filter: { order_id: orderId } });
  if (orderItems) {
    const vendorGroups = {};
    for (const item of orderItems) {
      if (!vendorGroups[item.vendor_id]) {
        vendorGroups[item.vendor_id] = 0;
      }
      vendorGroups[item.vendor_id] += item.vendor_payout || 0;
    }

    for (const [vendorId, payout] of Object.entries(vendorGroups)) {
      await dbInsert('vendor_wallets', {
        vendor_id: vendorId,
        order_id: orderId,
        amount: payout,
        currency: currency || 'NGN',
        status: 'pending',
      });
    }
  }

  // Send payment confirmation email (non-blocking)
  try {
    const { data: orderData } = await dbQuery('orders', { filter: { id: orderId } });
    if (orderData?.[0]) {
      const shippingAddr = JSON.parse(orderData[0].shipping_address || '{}');
      if (shippingAddr.email) {
        sendOrderConfirmation({
          email: shippingAddr.email,
          name: shippingAddr.name,
          orderNumber: orderData[0].order_number,
          items: orderItems || [],
          total: totalAmount,
          currency: currency || 'NGN',
          shippingAddress: `${shippingAddr.address || ''}, ${shippingAddr.city || ''}, ${shippingAddr.state || ''}`,
          paymentRef: reference,
        }).catch(e => console.error('[EMAIL] Payment confirmation email failed:', e.message));
      }
    }
  } catch (e) { /* non-critical */ }

  // Audit log
  await dbInsert('audit_logs', {
    action: 'payment.success',
    entity_type: 'order',
    entity_id: orderId,
    new_data: { reference, amount: totalAmount, commission: commissionAmount, vendorAmount },
    created_at: new Date().toISOString(),
  });

  console.log(`[WEBHOOK] Charge success processed: ${reference} — Amount: ${totalAmount} — Commission: ${commissionAmount}`);
}

/**
 * Handle failed charge
 */
async function handleChargeFailed(data) {
  if (!isDatabaseConnected()) return;

  const { data: transactions } = await dbQuery('transactions', {
    filter: { paystack_reference: data.reference }
  });
  const transaction = transactions?.[0];

  if (transaction) {
    await dbUpdate('transactions', { id: transaction.id }, {
      status: 'failed',
      failure_reason: data.gateway_response || 'Payment failed',
      verified_at: new Date().toISOString(),
    });

    // Update order payment status
    if (transaction.order_id) {
      await dbUpdate('orders', { id: transaction.order_id }, {
        payment_status: 'failed',
      });
    }
  }

  console.log(`[WEBHOOK] Charge failed: ${data.reference} — ${data.gateway_response}`);
}

/**
 * Handle successful transfer (vendor settlement)
 */
async function handleTransferSuccess(data) {
  if (!isDatabaseConnected()) return;

  const { data: settlements } = await dbQuery('settlements', {
    filter: { transfer_reference: data.reference }
  });
  const settlement = settlements?.[0];

  if (settlement) {
    await dbUpdate('settlements', { id: settlement.id }, {
      status: 'completed',
      completed_at: new Date().toISOString(),
    });      // Mark vendor wallet entries as settled
      await dbRaw(
        'UPDATE vendor_wallets SET status = $1, settled_at = $2 WHERE order_id = $3 AND vendor_id = $4',
        ['settled', new Date().toISOString(), settlement.order_id, settlement.vendor_id]
      );
  }

  console.log(`[WEBHOOK] Transfer success: ${data.reference}`);
}

/**
 * Handle failed transfer
 */
async function handleTransferFailed(data) {
  if (!isDatabaseConnected()) return;

  const { data: settlements } = await dbQuery('settlements', {
    filter: { transfer_reference: data.reference }
  });
  const settlement = settlements?.[0];

  if (settlement) {
    await dbUpdate('settlements', { id: settlement.id }, {
      status: 'failed',
      failure_reason: data.failure_reason || 'Transfer failed',
    });
  }

  // Log security event for admin review
  await dbInsert('audit_logs', {
    action: 'settlement.failed',
    entity_type: 'settlement',
    entity_id: settlement?.id || null,
    new_data: { reference: data.reference, reason: data.failure_reason },
    created_at: new Date().toISOString(),
  });

  console.log(`[WEBHOOK] Transfer failed: ${data.reference} — ${data.failure_reason}`);
}
