import { NextResponse } from 'next/server';
import { dbQuery, dbInsert, dbUpdate, isDatabaseConnected } from '@/lib/db';
import { getUserFromRequest, requireAuth, requireRole } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_TRANSFER_URL = 'https://api.paystack.co/transfer';

/**
 * Helper: Create a Paystack transfer recipient for a vendor
 */
async function createTransferRecipient({ name, account_number, bank_code }) {
  const res = await fetch('https://api.paystack.co/transferrecipient', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      type: 'nuban',
      name,
      account_number,
      bank_code,
      currency: 'NGN',
    }),
  });
  return res.json();
}

/**
 * Helper: Initiate a Paystack transfer
 */
async function initiateTransfer({ recipient, amount, reason, reference }) {
  const res = await fetch(PAYSTACK_TRANSFER_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      source: 'balance',
      recipient,
      amount: amount * 100, // Paystack uses kobo
      reason,
      reference,
    }),
  });
  return res.json();
}

/**
 * GET /api/settlements
 * - Vendor: returns their wallet entries (vendor_wallets table)
 * - Admin: returns all settlements
 */
export async function GET(request) {
  try {
    const user = await getUserFromRequest(request);
    const auth = requireAuth(user);
    if (!auth.authorized) return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });

    if (!isDatabaseConnected()) {
      return NextResponse.json({ success: true, settlements: [], dbConnected: false });
    }

    if (user.role === 'vendor') {
      // Get vendor profile
      const vendorProfile = await dbQuery('vendors', { filter: { user_id: user.id } });
      const vendorId = vendorProfile.data?.[0]?.id;
      if (!vendorId) return NextResponse.json({ success: true, settlements: [] });

      // Get wallet entries with order info
      const { data: wallets, error } = await dbRaw(
        `SELECT vw.*, o.order_number
         FROM vendor_wallets vw
         LEFT JOIN orders o ON vw.order_id = o.id
         WHERE vw.vendor_id = $1
         ORDER BY vw.created_at DESC`,
        [vendorId]
      );

      if (error) return NextResponse.json({ success: false, error }, { status: 500 });
      return NextResponse.json({ success: true, settlements: wallets || [], wallet: wallets || [] });
    }

    // Admin: get all settlements
    const { data: settlements, error } = await dbQuery('settlements', {
      order: { column: 'created_at', ascending: false },
    });
    if (error) return NextResponse.json({ success: false, error }, { status: 500 });
    return NextResponse.json({ success: true, settlements: settlements || [] });
  } catch (error) {
    console.error('Settlements GET error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/settlements
 * - Vendor: request withdrawal
 * - Admin: trigger payout for a vendor
 */
export async function POST(request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });

    if (!isDatabaseConnected()) {
      return NextResponse.json({ success: false, error: 'Database not connected' }, { status: 503 });
    }

    const body = await request.json();
    const { amount, currency, vendorId: adminVendorId } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json({ success: false, error: 'Valid amount required' }, { status: 400 });
    }

    // Determine which vendor this is for
    let targetVendorId;
    if (user.role === 'admin' && adminVendorId) {
      targetVendorId = adminVendorId;
    } else if (user.role === 'vendor') {
      const vendorProfile = await dbQuery('vendors', { filter: { user_id: user.id } });
      targetVendorId = vendorProfile.data?.[0]?.id;
      if (!targetVendorId) {
        return NextResponse.json({ success: false, error: 'Vendor profile not found' }, { status: 404 });
      }
    } else {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    // Get vendor details including bank info
    const vendorResult = await dbQuery('vendors', { filter: { id: targetVendorId } });
    const vendor = vendorResult.data?.[0];
    if (!vendor) {
      return NextResponse.json({ success: false, error: 'Vendor not found' }, { status: 404 });
    }

    // Check bank details exist
    if (!vendor.bank_account_number || !vendor.bank_code) {
      return NextResponse.json({
        success: false,
        error: 'Bank account not configured. Please add bank details in KYC settings.',
      }, { status: 400 });
    }

    // Check available balance from vendor_wallets
    const walletResult = await dbQuery('vendor_wallets', {
      filter: { vendor_id: targetVendorId, status: 'pending' },
    });
    const pendingWallets = walletResult.data || [];
    const availableBalance = pendingWallets.reduce((sum, w) => sum + Number(w.amount || 0), 0);

    if (amount > availableBalance) {
      return NextResponse.json({
        success: false,
        error: `Insufficient balance. Available: ₦${Math.round(availableBalance).toLocaleString()}`,
      }, { status: 400 });
    }

    // Create settlement record
    const reference = `OB-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    const { data: settlement, error: settleError } = await dbInsert('settlements', {
      vendor_id: targetVendorId,
      amount,
      currency: currency || 'NGN',
      status: 'processing',
      transfer_reference: reference,
      created_at: new Date().toISOString(),
    });

    if (settleError) {
      return NextResponse.json({ success: false, error: settleError }, { status: 500 });
    }

    // Attempt Paystack transfer (if configured)
    let transferResult = null;
    if (PAYSTACK_SECRET) {
      try {
        // Create or get transfer recipient
        const recipientRes = await createTransferRecipient({
          name: vendor.bank_account_name || vendor.store_name,
          account_number: vendor.bank_account_number,
          bank_code: vendor.bank_code,
        });

        if (recipientRes.status && recipientRes.data?.recipient_code) {
          // Initiate transfer
          transferResult = await initiateTransfer({
            recipient: recipientRes.data.recipient_code,
            amount,
            reason: `OjaBridge settlement - ${vendor.store_name}`,
            reference,
          });

          if (transferResult.status) {
            // Transfer initiated successfully
            await dbUpdate('settlements', { id: settlement.id }, {
              status: 'processing',
              paystack_transfer_id: transferResult.data?.transfer_code,
            });

            // Mark wallet entries as settled
            let remaining = amount;
            for (const wallet of pendingWallets) {
              if (remaining <= 0) break;
              const walletAmount = Number(wallet.amount || 0);
              const settleAmount = Math.min(walletAmount, remaining);
              await dbUpdate('vendor_wallets', { id: wallet.id }, {
                status: settleAmount >= walletAmount ? 'settled' : 'partial',
                settled_at: new Date().toISOString(),
                settlement_reference: reference,
              });
              remaining -= settleAmount;
            }

            // Update vendor earnings
            await dbUpdate('vendors', { id: targetVendorId }, {
              pending_earnings: Math.max(0, availableBalance - amount),
              settled_earnings: Number(vendor.settled_earnings || 0) + amount,
            });
          } else {
            // Transfer failed
            await dbUpdate('settlements', { id: settlement.id }, {
              status: 'failed',
              failure_reason: transferResult.message || 'Transfer failed',
            });
          }
        } else {
          // Recipient creation failed
          await dbUpdate('settlements', { id: settlement.id }, {
            status: 'failed',
            failure_reason: recipientRes.message || 'Could not create transfer recipient',
          });
        }
      } catch (transferErr) {
        console.error('Transfer error:', transferErr);
        await dbUpdate('settlements', { id: settlement.id }, {
          status: 'failed',
          failure_reason: transferErr.message,
        });
      }
    } else {
      // No Paystack key — mark as pending for manual processing
      await dbUpdate('settlements', { id: settlement.id }, {
        status: 'pending',
        failure_reason: 'Paystack not configured — manual processing required',
      });
    }

    // Audit log
    await dbInsert('audit_logs', {
      user_id: user.id,
      action: 'settlement.requested',
      entity_type: 'settlement',
      entity_id: settlement.id,
      new_data: { vendor_id: targetVendorId, amount, currency: currency || 'NGN', reference },
      created_at: new Date().toISOString(),
    });

    const finalStatus = transferResult?.status ? 'processing' : settlement.status;

    return NextResponse.json({
      success: true,
      settlement: { ...settlement, status: finalStatus },
      message: finalStatus === 'processing'
        ? `Withdrawal of ₦${amount.toLocaleString()} initiated. Funds will arrive in 1-2 business days.`
        : finalStatus === 'failed'
          ? 'Transfer failed. Please contact support.'
          : 'Withdrawal request submitted for manual processing.',
    }, { status: 201 });

  } catch (error) {
    console.error('Settlements POST error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// Import dbRaw for raw queries
import { dbRaw } from '@/lib/db';
