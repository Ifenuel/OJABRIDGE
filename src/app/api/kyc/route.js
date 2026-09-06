import { NextResponse } from 'next/server';
import { dbQuery, dbInsert, dbUpdate, isDatabaseConnected } from '@/lib/db';
import { getUserFromRequest, requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * GET /api/kyc — Get KYC status
 * POST /api/kyc — Submit KYC information (requires both BVN and NIN)
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
      return NextResponse.json({
        success: true,
        kyc: {
          status: 'not_started',
          submittedAt: null, verifiedAt: null,
          bankVerificationStatus: 'not_started',
          businessName: null, rcNumber: null, bankName: null,
          bankAccountNumber: null, bvn: null, nin: null,
          idType: null, idNumber: null, dateOfBirth: null,
          fullName: user.name || null,
          businessType: null, businessAddress: null,
          accountName: null, idVerificationStatus: 'not_started',
        },
      });
    }

    const v = vendorProfile.data[0];

    return NextResponse.json({
      success: true,
      kyc: {
        status: (v.kyc_status || 'NOT_STARTED').toLowerCase(),
        submittedAt: v.kyc_submitted_at,
        verifiedAt: v.kyc_verified_at,
        rejectionReason: v.kyc_rejection_reason || null,
        bankVerificationStatus: (v.bank_verification_status || 'NOT_STARTED').toLowerCase(),
        fullName: v.full_name || user.name || null,
        dateOfBirth: v.date_of_birth,
        businessName: v.business_name,
        rcNumber: v.rc_number,
        businessType: v.business_type,
        businessAddress: v.business_address,
        bankName: v.bank_name,
        bankAccountNumber: v.bank_account_number ? v.bank_account_number.slice(-4).padStart(v.bank_account_number.length, '*') : null,
        bankAccountName: v.bank_account_name || null,
        bvn: v.bvn ? v.bvn.slice(-4).padStart(v.bvn.length, '*') : null,
        nin: v.nin ? v.nin.slice(-4).padStart(v.nin.length, '*') : null,
        idType: v.id_type,
        idNumber: v.id_number ? v.id_number.slice(-4).padStart(v.id_number.length, '*') : null,
        idDocumentUrl: v.id_document_url,
        idVerificationStatus: (v.id_verification_status || 'NOT_STARTED').toLowerCase(),
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

    if (user.role !== 'vendor' && user.role !== 'retailer') {
      return NextResponse.json({ success: false, error: 'Only vendors and retailers can submit KYC' }, { status: 403 });
    }

    const body = await request.json();
    const {
      businessName, rcNumber, businessType, businessAddress,
      bankName, bankAccountNumber, bankCode, bankAccountName,
      bvn, nin, idType, idNumber, idDocumentUrl, dateOfBirth,
      fullName,
    } = body;

    // Validate both BVN and NIN are required
    const errors = [];
    if (!bvn || bvn.length !== 11 || !/^\d{11}$/.test(bvn)) errors.push('BVN must be exactly 11 digits');
    if (!nin || nin.length !== 11 || !/^\d{11}$/.test(nin)) errors.push('NIN must be exactly 11 digits');
    if (!bankName) errors.push('Bank name is required');
    if (!bankAccountNumber) errors.push('Account number is required');
    if (!bankAccountName) errors.push('Account name is required');
    if (!businessName) errors.push('Business name is required');
    if (!rcNumber) errors.push('RC number is required');
    
    if (errors.length > 0) {
      return NextResponse.json({ success: false, error: errors[0], errors }, { status: 400 });
    }

    if (!isDatabaseConnected()) {
      return NextResponse.json({ success: false, error: 'Database not connected' }, { status: 503 });
    }

    let vendorProfile = await dbQuery('vendors', { filter: { user_id: user.id } });
    let vendorId;

    if (!vendorProfile.data?.[0]) {
      const slug = (user.name || 'user').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const { data: newProfile, error: createError } = await dbInsert('vendors', {
        user_id: user.id,
        store_name: user.name || 'Store',
        store_slug: `${slug}-${Date.now().toString(36)}`,
        business_name: businessName || user.name,
      });
      if (createError) return NextResponse.json({ success: false, error: createError }, { status: 500 });
      vendorId = newProfile.id;
    } else {
      vendorId = vendorProfile.data[0].id;
    }

    const updates = {
      kyc_status: 'SUBMITTED',
      kyc_submitted_at: new Date().toISOString(),
    };

    // Personal info
    if (fullName) updates.full_name = fullName;
    if (dateOfBirth) updates.date_of_birth = dateOfBirth;

    // Identity verification — always save both
    updates.bvn = bvn;
    updates.nin = nin;
    if (idType) updates.id_type = idType;
    if (idNumber) updates.id_number = idNumber;
    if (idDocumentUrl) updates.id_document_url = idDocumentUrl;
    updates.id_verification_status = 'SUBMITTED';

    // Business info
    if (businessName) updates.business_name = businessName;
    if (rcNumber) updates.rc_number = rcNumber;
    if (businessType) updates.business_type = businessType;
    if (businessAddress) updates.business_address = businessAddress;

    // Bank info — always save all bank details
    updates.bank_name = bankName;
    updates.bank_account_number = bankAccountNumber;
    if (bankCode) updates.bank_code = bankCode;
    updates.bank_account_name = bankAccountName;
    updates.bank_verification_status = 'IN_PROGRESS';

    const { data, error } = await dbUpdate('vendors', { id: vendorId }, updates);
    if (error) return NextResponse.json({ success: false, error }, { status: 500 });

    // Audit log
    await dbInsert('audit_logs', {
      user_id: user.id,
      action: 'kyc.submitted',
      entity_type: user.role,
      entity_id: vendorId,
      details: `KYC/KYB submitted by ${user.name}`,
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, kyc: { status: 'submitted' } }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
