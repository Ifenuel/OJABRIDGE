import { NextResponse } from 'next/server';
import { dbQuery, dbInsert, dbUpdate, isDatabaseConnected } from '@/lib/db';
import { getUserFromRequest, requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * GET /api/kyc — Get KYC status (vendor)
 * POST /api/kyc — Submit KYC information including BVN, NIN, government ID
 */
export async function GET(request) {
  try {
    const user = await getUserFromRequest(request);
    const auth = requireAuth(user);
    if (!auth.authorized) return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });

    if (!isDatabaseConnected()) {
      return NextResponse.json({ success: true, kyc: { status: 'not_started' }, dbConnected: false });
    }

    const vendorProfile = await dbQuery('vendors', { filter: { user_id: user.id } });
    if (!vendorProfile.data?.[0]) {
      return NextResponse.json({ success: false, error: 'Vendor profile not found' }, { status: 404 });
    }

    const v = vendorProfile.data[0];

    return NextResponse.json({
      success: true,
      kyc: {
        status: v.kyc_status || 'not_started',
        submittedAt: v.kyc_submitted_at,
        verifiedAt: v.kyc_verified_at,
        bankVerificationStatus: v.bank_verification_status || 'not_started',
        businessName: v.business_name,
        rcNumber: v.rc_number,
        bankName: v.bank_name,
        bankAccountNumber: v.bank_account_number ? '****' + v.bank_account_number.slice(-4) : null,
        bvn: v.bvn ? '****' + v.bvn.slice(-4) : null,
        nin: v.nin ? '****' + v.nin.slice(-4) : null,
        idType: v.id_type,
        idNumber: v.id_number ? '****' + v.id_number.slice(-4) : null,
        dateOfBirth: v.date_of_birth,
        idVerificationStatus: v.id_verification_status || 'not_started',
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = await getUserFromRequest(request);
    const auth = requireAuth(user);
    if (!auth.authorized) return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });

    if (user.role !== 'vendor') {
      return NextResponse.json({ success: false, error: 'Only vendors can submit KYC' }, { status: 403 });
    }

    const body = await request.json();
    const {
      businessName, rcNumber, businessType, businessAddress,
      bankName, bankAccountNumber, bankCode, bankAccountName,
      bvn, nin, idType, idNumber, idDocumentUrl, dateOfBirth,
      fullName,
    } = body;

    if (!isDatabaseConnected()) {
      return NextResponse.json({ success: false, error: 'Database not connected' }, { status: 503 });
    }

    const vendorProfile = await dbQuery('vendors', { filter: { user_id: user.id } });
    if (!vendorProfile.data?.[0]) {
      return NextResponse.json({ success: false, error: 'Vendor profile not found' }, { status: 404 });
    }

    const updates = {
      kyc_status: 'submitted',
      kyc_submitted_at: new Date().toISOString(),
    };

    // Personal info
    if (fullName) updates.name = fullName;
    if (dateOfBirth) updates.date_of_birth = dateOfBirth;

    // Identity verification (BVN, NIN, Government ID)
    if (bvn) updates.bvn = bvn;
    if (nin) updates.nin = nin;
    if (idType) updates.id_type = idType;
    if (idNumber) updates.id_number = idNumber;
    if (idDocumentUrl) updates.id_document_url = idDocumentUrl;
    if (bvn || nin || idNumber) {
      updates.id_verification_status = 'submitted';
    }

    // Business info
    if (businessName) updates.business_name = businessName;
    if (rcNumber) updates.rc_number = rcNumber;
    if (businessType) updates.business_type = businessType;
    if (businessAddress) updates.business_address = businessAddress;

    // Bank info
    if (bankName) updates.bank_name = bankName;
    if (bankAccountNumber) updates.bank_account_number = bankAccountNumber;
    if (bankCode) updates.bank_code = bankCode;
    if (bankAccountName) updates.bank_account_name = bankAccountName;

    if (bankAccountNumber && bankCode) {
      updates.bank_verification_status = 'submitted';
    }

    const { data, error } = await dbUpdate('vendors', { id: vendorProfile.data[0].id }, updates);
    if (error) return NextResponse.json({ success: false, error }, { status: 500 });

    // Audit log
    await dbInsert('audit_logs', {
      user_id: user.id,
      action: 'kyc.submitted',
      entity_type: 'vendor',
      entity_id: vendorProfile.data[0].id,
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, kyc: { status: 'submitted' } }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
