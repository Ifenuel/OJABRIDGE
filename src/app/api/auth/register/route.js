import { NextResponse } from 'next/server';
import { hashPassword, validatePasswordStrength, validateEmail, sanitizeInput } from '@/lib/auth';
import { dbInsert, dbQuery, isDatabaseConnected } from '@/lib/db';

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

      // Create user — email_verified: false, status: pending_verification
      const { data: user, error: userError } = await dbInsert('users', {
        email: cleanEmail.toLowerCase(),
        password_hash: passwordHash,
        name: cleanName,
        role,
        phone: phone || null,
        status: 'pending_verification',
        email_verified: false,
        country: country || 'NG',
        currency: currency || 'NGN',
      });

      if (userError) {
        console.error('User creation error:', userError);
        return NextResponse.json({ success: false, errors: ['Failed to create account. Please try again.'] }, { status: 500 });
      }

      // If vendor or retailer, create vendor profile (needed for KYC)
      if ((role === 'vendor' || role === 'retailer') && user) {
        const slug = (storeName || cleanName).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        const { error: vendorError } = await dbInsert('vendors', {
          user_id: user.id,
          store_name: storeName || `${cleanName}'s Store`,
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
