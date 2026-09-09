import { NextResponse } from 'next/server';
import { hashPassword, validatePasswordStrength, validateEmail, sanitizeInput } from '@/lib/auth';
import { dbInsert, dbQuery, isDatabaseConnected } from '@/lib/db';
import { cacheGet } from '@/lib/redis';

/**
 * POST /api/auth/register
 * Register a new user (Customer, Vendor, or Retailer)
 * Verification code is sent by the /verify-email page, not here.
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { name, email, password, role, phone, storeName, country, currency, businessType, rcNumber, businessAddress, businessCity, businessPhone, businessEmail, productCategories } = body;

    // --- Input Validation ---
    const errors = [];
    const cleanName = sanitizeInput(name);
    const cleanEmail = sanitizeInput(email);

    if (!cleanName || cleanName.length < 2) errors.push('Name must be at least 2 characters');
    if (!cleanEmail || !validateEmail(cleanEmail)) errors.push('Valid email address is required');
    if (!password) errors.push('Password is required');
    if (!phone || phone.trim().length < 7) errors.push('Phone number is required (e.g. +234...)');
    if (!['customer', 'vendor', 'retailer'].includes(role)) errors.push('Role must be customer, vendor, or retailer');

    if (password) {
      const passwordErrors = validatePasswordStrength(password);
      errors.push(...passwordErrors);
    }

    if (errors.length > 0) {
      return NextResponse.json({ success: false, errors }, { status: 400 });
    }

    // --- Database Registration ---
    if (isDatabaseConnected()) {
      // Check if email already exists
      const existing = await dbQuery('users', { filter: { email: cleanEmail.toLowerCase() } });
      if (existing.data && existing.data.length > 0) {
        return NextResponse.json({ success: false, errors: ['An account with this email already exists'] }, { status: 409 });
      }

      // Hash password
      const passwordHash = await hashPassword(password);

      // Check if email was already verified via OTP during registration
      let emailVerified = false;
      try {
        const otpData = await cacheGet(`otp:${cleanEmail.toLowerCase()}`);
        if (otpData?.verified) emailVerified = true;
      } catch {}

      // Create user — status depends on whether email was verified during registration
      const { data: user, error: userError } = await dbInsert('users', {
        email: cleanEmail.toLowerCase(),
        password_hash: passwordHash,
        name: cleanName,
        role,
        phone: phone || null,
        status: emailVerified ? 'active' : 'pending_verification',
        email_verified: emailVerified,
        country: country || 'NG',
        currency: currency || 'NGN',
      });

      if (userError) {
        console.error('User creation error:', userError);
        return NextResponse.json({ success: false, errors: ['Failed to create account. Please try again.'] }, { status: 500 });
      }

      // If vendor or retailer, create vendor profile (needed for KYC)
      if ((role === 'vendor' || role === 'retailer') && user) {
        // Guard: store names must be human-readable, not RC/registration numbers.
        // A previous user typed their CAC number into the store name field and it
        // became their public store identity. Reject that pattern politely.
        const rcPattern = /^(cac|rc)[\s-]?[0-9\s-]{4,}$/i;
        const storeNameLooksLikeRc = storeName && rcPattern.test(storeName.trim());
        if (storeNameLooksLikeRc) {
          return NextResponse.json({ success: false, errors: ['Store name cannot be your RC/CAC registration number. Please use your business or personal name — you will enter the RC number in the KYC section.'] }, { status: 400 });
        }
        const finalStoreName = storeName || `${cleanName}'s Store`;
        const slug = finalStoreName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        const { error: vendorError } = await dbInsert('vendors', {
          user_id: user.id,
          store_name: finalStoreName,
          store_slug: `${slug}-${user.id.slice(0, 6)}`,
          business_name: businessType ? (storeName || `${cleanName} Enterprises`) : null,
          business_type: businessType || null,
          rc_number: rcNumber || null,
          business_address: businessAddress || null,
          business_city: businessCity || null,
          business_country: country || 'NG',
          business_phone: businessPhone || null,
          business_email: businessEmail || null,
          product_categories: productCategories || [],
        });

        if (vendorError) {
          console.error('Vendor profile creation error:', vendorError);
        }
      }

      // Send welcome email only — verification code is sent by /verify-email page
      try {
        const { sendWelcomeEmail } = await import('@/lib/email');
        await sendWelcomeEmail({
          email: cleanEmail.toLowerCase(),
          name: cleanName,
          role,
        });
      } catch (emailErr) {
        console.error('[EMAIL] Welcome email failed:', emailErr.message);
      }

      return NextResponse.json({
        success: true,
        message: 'Account created. Please verify your email.',
        requiresVerification: true,
        user: { id: user.id, name: cleanName, email: cleanEmail.toLowerCase(), role, email_verified: false },
      }, { status: 201 });
    }

    // --- Database not connected ---
    return NextResponse.json({
      success: false,
      errors: ['Database not connected. Please use dev test accounts or configure DATABASE_URL in .env.'],
    }, { status: 503 });

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ success: false, errors: ['Internal server error'] }, { status: 500 });
  }
}
