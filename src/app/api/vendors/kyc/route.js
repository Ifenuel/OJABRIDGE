import { NextResponse } from 'next/server';
import { dbQuery, isDatabaseConnected } from '@/lib/db';
import { getUserFromRequest, requireRole } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * GET /api/vendors/kyc?vendorId=xxx — Admin fetches full KYC details for review
 */
export async function GET(request) {
  try {
    const user = await getUserFromRequest(request);
    const auth = requireRole(user, 'admin');
    if (!auth.authorized) return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });

    const { searchParams } = new URL(request.url);
    const vendorId = searchParams.get('vendorId');
    if (!vendorId) return NextResponse.json({ success: false, error: 'vendorId required' }, { status: 400 });

    if (!isDatabaseConnected()) {
      return NextResponse.json({ success: true, kyc: null, dbConnected: false });
    }

    const { data, error } = await dbQuery('vendors', { filter: { id: vendorId } });
    if (error || !data?.[0]) {
      return NextResponse.json({ success: false, error: 'Vendor not found' }, { status: 404 });
    }

    const v = data[0];

    return NextResponse.json({
      success: true,
      kyc: {
        fullName: v.full_name,
        // date_of_birth is a DATE column; node-postgres parses it to a JS Date
        // which serializes as a full ISO timestamp. Format as YYYY-MM-DD in local
        // time (en-CA locale gives exactly YYYY-MM-DD) so admins see 1997-02-17.
        dateOfBirth: v.date_of_birth ? new Date(v.date_of_birth).toLocaleDateString('en-CA') : null,
        businessName: v.business_name,
        rcNumber: v.rc_number,
        businessType: v.business_type,
        businessAddress: v.business_address,
        bankName: v.bank_name,
        bankAccountNumber: v.bank_account_number,
        bankAccountName: v.bank_account_name,
        bvn: v.bvn,
        nin: v.nin,
        idType: v.id_type,
        idNumber: v.id_number,
        idDocumentUrl: v.id_document_url,
        kycStatus: v.kyc_status,
        kycSubmittedAt: v.kyc_submitted_at,
        kycVerifiedAt: v.kyc_verified_at,
        kycRejectionReason: v.kyc_rejection_reason,
        bankVerificationStatus: v.bank_verification_status,
        idVerificationStatus: v.id_verification_status,
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
