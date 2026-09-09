import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { resolveAccountNumber, getBanks } from '@/lib/paystack';
import { NIGERIAN_BANKS, NIGERIAN_BANK_CODES } from '@/lib/nigerian-banks';

export const dynamic = 'force-dynamic';

/**
 * GET /api/banks                    → full bank list (Paystack live list, offline fallback)
 * GET /api/banks?resolve=1&accountNumber=…&bankCode=…
 *                                   → real Paystack account-name resolution
 *
 * Auth: any logged-in user (customer/vendor/retailer/admin).
 *
 * Why resolve server-side: the Paystack secret key must never reach the
 * browser, and resolution results must come from the bank — not from the
 * client — before we trust a vendor's payout account.
 */
export async function GET(request) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const accountNumber = searchParams.get('accountNumber');
  const bankCode = searchParams.get('bankCode');

  // --- Account resolution mode ---
  if (accountNumber && bankCode) {
    const acct = String(accountNumber).replace(/\s/g, '');
    if (!/^\d{10}$/.test(acct)) {
      return NextResponse.json({ success: false, error: 'Nigerian account numbers are exactly 10 digits' }, { status: 400 });
    }
    try {
      const result = await resolveAccountNumber(acct, bankCode);
      if (!result.resolved) {
        return NextResponse.json({
          success: false,
          error: result.error || 'We could not verify this account number. Please double-check the number and bank.',
        }, { status: 422 });
      }
      return NextResponse.json({
        success: true,
        accountName: result.accountName,
        accountNumber: result.accountNumber,
      });
    } catch (e) {
      // Paystack unreachable / not configured — fail soft so the form still works
      return NextResponse.json({
        success: false,
        unavailable: true,
        error: 'Bank verification is temporarily unavailable. You can still submit — our team will confirm the account name during review.',
      }, { status: 503 });
    }
  }

  // --- Bank list mode ---
  try {
    const banks = await getBanks('NGN');
    if (banks && banks.length > 0) {
      return NextResponse.json({ success: true, source: 'paystack', banks });
    }
  } catch {}
  // Offline fallback
  return NextResponse.json({
    success: true,
    source: 'fallback',
    banks: NIGERIAN_BANKS.map(name => ({ name, code: NIGERIAN_BANK_CODES[name] || null })),
  });
}
