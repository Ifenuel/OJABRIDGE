import { NextResponse } from 'next/server';
import { hashPassword, validatePasswordStrength, validateEmail, sanitizeInput } from '@/lib/auth';
import { dbInsert, dbQuery, isDatabaseConnected } from '@/lib/db';

/**
 * POST /api/auth/register
 * Register a new user (Customer, Vendor, or Retailer)
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
    if (!phone || phone.trim().length < 7) errors.push('Phone number is required');
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

      // Create user
      const { data: user, error: userError } = await dbInsert('users', {
        email: cleanEmail.toLowerCase(),
        password_hash: passwordHash,
        name: cleanName,
        role,
        phone: phone || null,
        status: 'active',
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

      // Send welcome email + verification code
      try {
        const { sendWelcomeEmail, sendEmail } = await import('@/lib/email');
        
        // Send welcome email
        await sendWelcomeEmail({
          email: cleanEmail.toLowerCase(),
          name: cleanName,
          role,
        });

        // Generate and send verification code
        const verifyCode = Math.floor(100000 + Math.random() * 900000).toString();
        const { cacheSet } = await import('@/lib/redis');
        await cacheSet(`verify:${cleanEmail.toLowerCase()}`, {
          code: verifyCode,
          expiresAt: Date.now() + 10 * 60 * 1000,
          attempts: 0,
          sentCount: 1,
          firstSentAt: Date.now(),
        }, 600);

        await sendEmail({
          to: cleanEmail.toLowerCase(),
          subject: `Verify Your OjaBridge Email — Code: ${verifyCode}`,
          htmlContent: `
            <!DOCTYPE html>
            <html>
            <head>
              <style>
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background: #f8f9fa; }
                .container { max-width: 600px; margin: 0 auto; background: #ffffff; }
                .header { background: linear-gradient(135deg, #0f172a 0%, #6b21a8 100%); padding: 32px; text-align: center; }
                .header h1 { color: #ffffff; margin: 0; font-size: 28px; letter-spacing: 2px; }
                .content { padding: 32px; color: #1e293b; line-height: 1.6; text-align: center; }
                .otp-code { font-size: 48px; font-weight: bold; color: #6b21a8; letter-spacing: 12px; margin: 24px 0; padding: 20px; background: #f8f9fa; border-radius: 12px; border: 2px dashed #e2e8f0; }
                .footer { background: #0f172a; padding: 24px; text-align: center; color: #94a3b8; font-size: 12px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header"><h1>OJABRIDGE</h1></div>
                <div class="content">
                  <h2>Welcome to OjaBridge!</h2>
                  <p>Hi ${cleanName}, use the code below to verify your email and activate your account.</p>
                  <div class="otp-code">${verifyCode}</div>
                  <p style="color:#64748b;font-size:13px;">This code expires in 10 minutes. If you didn't create this account, ignore this email.</p>
                </div>
                <div class="footer"><p>OjaBridge — Shop • Connect • Grow</p></div>
              </div>
            </body>
            </html>
          `,
        });
      } catch (emailErr) {
        console.error('[EMAIL] Welcome/verification email failed:', emailErr.message);
      }

      return NextResponse.json({
        success: true,
        message: 'Account created successfully. Please verify your email.',
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
