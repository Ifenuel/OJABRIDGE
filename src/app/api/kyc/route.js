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
        // DATE column → JS Date → would serialize as full ISO timestamp; format as YYYY-MM-DD
        dateOfBirth: v.date_of_birth ? new Date(v.date_of_birth).toLocaleDateString('en-CA') : null,
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

    if (!isDatabaseConnected()) {
      return NextResponse.json({ success: false, error: 'Database not connected' }, { status: 503 });
    }

    // Load existing profile FIRST so masked/unchanged values can be merged.
    // The GET endpoint returns masked BVN/NIN/account number (e.g. ****1234).
    // If the user re-submits without re-typing those (value contains * or is empty),
    // we keep the stored value instead of failing validation — otherwise a verified
    // vendor could never update anything (e.g. bank details) without retyping secrets.
    let vendorProfile = await dbQuery('vendors', { filter: { user_id: user.id } });
    const existing = vendorProfile.data?.[0] || null;

    const mergeValue = (incoming, stored) => {
      const v = typeof incoming === 'string' ? incoming.trim() : incoming;
      if (v && !String(v).includes('*')) return String(v); // fresh value from the user
      return stored || null;                               // masked or empty → keep stored
    };

    const mergedBvn = mergeValue(bvn, existing?.bvn);
    const mergedNin = mergeValue(nin, existing?.nin);
    const mergedAcctNumber = mergeValue(bankAccountNumber, existing?.bank_account_number);
    const mergedAcctName = mergeValue(bankAccountName, existing?.bank_account_name);
    const mergedBankName = bankName || existing?.bank_name || null;
    const mergedBusinessName = businessName || existing?.business_name || null;
    const mergedRcNumber = rcNumber || existing?.rc_number || null;

    // Validate merged values — both BVN and NIN are required
    const errors = [];
    if (!mergedBvn || !/^\d{11}$/.test(mergedBvn)) errors.push('BVN must be exactly 11 digits');
    if (!mergedNin || !/^\d{11}$/.test(mergedNin)) errors.push('NIN must be exactly 11 digits');
    if (!mergedBankName) errors.push('Bank name is required');
    if (!mergedAcctNumber) errors.push('Account number is required');
    if (!mergedAcctName) errors.push('Account name is required');
    if (!mergedBusinessName) errors.push('Business name is required');
    if (!mergedRcNumber) errors.push('RC number is required');
    
    if (errors.length > 0) {
      return NextResponse.json({ success: false, error: errors[0], errors }, { status: 400 });
    }

    let vendorId;

    if (!existing) {
      const slug = (user.name || 'user').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const { data: newProfile, error: createError } = await dbInsert('vendors', {
        user_id: user.id,
        store_name: user.name || 'Store',
        store_slug: `${slug}-${Date.now().toString(36)}`,
        business_name: mergedBusinessName || user.name,
      });
      if (createError) return NextResponse.json({ success: false, error: createError }, { status: 500 });
      vendorId = newProfile.id;
    } else {
      vendorId = existing.id;
    }

    const updates = {
      kyc_status: 'SUBMITTED',
      kyc_submitted_at: new Date().toISOString(),
    };

    // Personal info
    if (fullName) updates.full_name = fullName;
    if (dateOfBirth) updates.date_of_birth = dateOfBirth;

    // Identity verification — always save both (merged values)
    updates.bvn = mergedBvn;
    updates.nin = mergedNin;
    if (idType) updates.id_type = idType;
    if (idNumber) updates.id_number = idNumber;
    if (idDocumentUrl) updates.id_document_url = idDocumentUrl;
    updates.id_verification_status = 'SUBMITTED';

    // Business info (merged with stored values)
    if (mergedBusinessName) updates.business_name = mergedBusinessName;
    if (mergedRcNumber) updates.rc_number = mergedRcNumber;
    if (businessType) updates.business_type = businessType;
    if (businessAddress) updates.business_address = businessAddress;

    // Bank info — always save all bank details (merged with stored values).
    // Bank details count as complete when bank + account number + account name are all present.
    // If complete, mark VERIFIED (server-side); otherwise keep IN_PROGRESS so the user knows to fix it.
    updates.bank_name = mergedBankName;
    updates.bank_account_number = mergedAcctNumber;
    if (bankCode) updates.bank_code = bankCode;
    updates.bank_account_name = mergedAcctName;
    const bankDetailsComplete = !!(mergedBankName && mergedAcctNumber && String(mergedAcctNumber).replace(/\s/g, '').length >= 6 && mergedAcctName);
    updates.bank_verification_status = bankDetailsComplete ? 'VERIFIED' : 'IN_PROGRESS';

    // Identity provider hook — machine-verify BVN/NIN when a provider is
    // configured (Dojah/Youverify env vars); otherwise stays MANUAL_REVIEW
    // and the admin review flow remains the source of truth.
    try {
      const { verifyIdentity } = await import('@/lib/paystack');
      const identityResult = await verifyIdentity({
        bvn: mergedBvn,
        nin: mergedNin,
        fullName,
        dateOfBirth,
      });
      updates.id_verification_status = identityResult.status; // VERIFIED | VERIFICATION_FAILED | MANUAL_REVIEW
    } catch (e) {
      console.error('Identity verification hook failed:', e.message);
      updates.id_verification_status = 'MANUAL_REVIEW';
    }

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
