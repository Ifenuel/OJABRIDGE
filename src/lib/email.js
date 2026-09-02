/**
 * ============================================
 * OJABRIDGE EMAIL SERVICE (Brevo)
 * ============================================
 * 
 * Professional email templates for OjaBridge marketplace.
 * All emails use a clean, premium design system.
 */

const BREVO_API_KEY = process.env.BREVO_API_KEY;
const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';
const SENDER = {
  name: process.env.BREVO_SENDER_NAME || 'OjaBridge',
  email: process.env.BREVO_SENDER_EMAIL || 'awoyoemmanuel12@gmail.com',
};
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

/**
 * Send a transactional email via Brevo
 */
async function sendEmail({ to, subject, htmlContent, textContent, replyTo }) {
  if (!BREVO_API_KEY) {
    console.warn('[EMAIL] Brevo API key not configured. Email logged to console.');
    console.log(`[EMAIL LOG] To: ${to} | Subject: ${subject}`);
    return { success: true, logged: true, messageId: `log_${Date.now()}` };
  }

  try {
    const recipients = Array.isArray(to)
      ? to.map(addr => typeof addr === 'string' ? { email: addr } : addr)
      : [{ email: typeof to === 'string' ? to : to.email }];

    const payload = {
      sender: SENDER,
      to: recipients,
      subject,
      htmlContent: htmlContent || `<p>${textContent || subject}</p>`,
    };

    if (textContent) payload.textContent = textContent;
    if (replyTo) payload.replyTo = { email: replyTo };

    const response = await fetch(BREVO_API_URL, {
      method: 'POST',
      headers: {
        'api-key': BREVO_API_KEY,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      console.error('[EMAIL] Brevo API error:', response.status, error.message);
      return { success: false, error: error.message, messageId: null };
    }

    const result = await response.json();
    console.log('[EMAIL] Sent successfully:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('[EMAIL] Send failed:', error.message);
    return { success: false, error: error.message, messageId: null };
  }
}

// ============================================
// PROFESSIONAL EMAIL DESIGN SYSTEM
// ============================================

/**
 * Shared email wrapper — clean white design with OjaBridge branding
 * Every email gets: header with logo, content area, professional footer
 */
function wrapEmail({ title, content, preheader }) {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta name="color-scheme" content="light">
      <meta name="supported-color-schemes" content="light">
      <title>${title || 'OjaBridge'}</title>
      ${preheader ? `<meta name="preview" content="${preheader}">` : ''}
      <style>
        /* Reset */
        body, table, td, p, a, li { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
        body { margin: 0; padding: 0; width: 100% !important; }
        img { border: 0; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; }
        
        /* Base */
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f5f7; color: #1a1a2e; }
        
        /* Responsive */
        @media only screen and (max-width: 600px) {
          .email-container { width: 100% !important; }
          .fluid { max-width: 100% !important; height: auto !important; }
          .stack-column { display: block !important; width: 100% !important; }
          .mobile-pad { padding-left: 20px !important; padding-right: 20px !important; }
          .mobile-center { text-align: center !important; }
          .otp-code { font-size: 36px !important; letter-spacing: 8px !important; }
        }
      </style>
    </head>
    <body style="margin:0; padding:0; background-color:#f4f5f7;">
      
      <!-- Preheader (hidden preview text) -->
      ${preheader ? `<div style="display:none; max-height:0; overflow:hidden; mso-hide:all;">${preheader}&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;</div>` : ''}
      
      <!-- Email Wrapper -->
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color:#f4f5f7;">
        <tr>
          <td style="padding: 40px 16px;" align="center">
            
            <!-- Main Container -->
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" class="email-container" style="max-width:600px; width:100%;">
              
              <!-- HEADER — Clean OjaBridge Branding -->
              <tr>
                <td style="padding: 32px 40px; background-color: #ffffff; border-radius: 16px 16px 0 0; border-bottom: 1px solid #f0f0f0;">
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                    <tr>
                      <td style="font-size: 24px; font-weight: 800; color: #0f172a; letter-spacing: -0.5px;">
                        <span style="color: #6b21a8;">Oja</span>Bridge
                      </td>
                      <td align="right" style="font-size: 11px; color: #94a3b8; letter-spacing: 2px; text-transform: uppercase; font-weight: 500;">
                        Shop &bull; Connect &bull; Grow
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- CONTENT -->
              <tr>
                <td style="padding: 40px; background-color: #ffffff;" class="mobile-pad">
                  ${content}
                </td>
              </tr>

              <!-- FOOTER — Professional & Clean -->
              <tr>
                <td style="padding: 32px 40px; background-color: #fafbfc; border-top: 1px solid #f0f0f0; border-radius: 0 0 16px 16px;" class="mobile-pad">
                  
                  <!-- Social Links -->
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                    <tr>
                      <td align="center" style="padding-bottom: 20px;">
                        <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                          <tr>
                            <td style="padding: 0 8px;">
                              <a href="https://facebook.com/ojabridge" style="display:inline-block; width:36px; height:36px; background-color:#e2e8f0; border-radius:50%; text-align:center; line-height:36px; color:#64748b; text-decoration:none; font-size:14px; font-weight:600;">f</a>
                            </td>
                            <td style="padding: 0 8px;">
                              <a href="https://x.com/ojabridge" style="display:inline-block; width:36px; height:36px; background-color:#e2e8f0; border-radius:50%; text-align:center; line-height:36px; color:#64748b; text-decoration:none; font-size:14px; font-weight:600;">X</a>
                            </td>
                            <td style="padding: 0 8px;">
                              <a href="https://linkedin.com/company/ojabridge" style="display:inline-block; width:36px; height:36px; background-color:#e2e8f0; border-radius:50%; text-align:center; line-height:36px; color:#64748b; text-decoration:none; font-size:14px; font-weight:600;">in</a>
                            </td>
                            <td style="padding: 0 8px;">
                              <a href="https://instagram.com/ojabridge" style="display:inline-block; width:36px; height:36px; background-color:#e2e8f0; border-radius:50%; text-align:center; line-height:36px; color:#64748b; text-decoration:none; font-size:14px; font-weight:600;">ig</a>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>

                  <!-- Links -->
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                    <tr>
                      <td align="center" style="padding-bottom: 16px; font-size: 13px;">
                        <a href="${SITE_URL}/support" style="color: #6b21a8; text-decoration: none; margin: 0 12px;">Help Center</a>
                        <span style="color: #d1d5db;">|</span>
                        <a href="${SITE_URL}/privacy" style="color: #6b21a8; text-decoration: none; margin: 0 12px;">Privacy</a>
                        <span style="color: #d1d5db;">|</span>
                        <a href="${SITE_URL}/terms" style="color: #6b21a8; text-decoration: none; margin: 0 12px;">Terms</a>
                      </td>
                    </tr>
                  </table>

                  <!-- Address & Copyright -->
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                    <tr>
                      <td align="center" style="font-size: 12px; color: #94a3b8; line-height: 1.8;">
                        <p style="margin: 0 0 4px; font-weight: 500; color: #64748b;">OjaBridge Marketplace</p>
                        <p style="margin: 0 0 4px;">Connecting verified vendors with customers across Africa</p>
                        <p style="margin: 0 0 4px;">Lagos, Nigeria</p>
                        <p style="margin: 12px 0 0;">
                          <a href="${SITE_URL}" style="color: #6b21a8; text-decoration: none; font-weight: 500;">ojabridge.com</a>
                        </p>
                        <p style="margin: 12px 0 0; font-size: 11px; color: #cbd5e1;">
                          &copy; ${new Date().getFullYear()} OjaBridge. All rights reserved.
                        </p>
                      </td>
                    </tr>
                  </table>

                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

// ============================================
// INDIVIDUAL EMAIL TEMPLATES
// ============================================

/**
 * Welcome Email — Sent after registration
 */
async function sendWelcomeEmail({ email, name, role }) {
  const roleContent = {
    customer: {
      headline: 'Welcome to OjaBridge!',
      body: `Your account is now active. You have access to thousands of products from verified vendors across Africa — all with secure payments and buyer protection.`,
      cta: 'Start Shopping',
      ctaUrl: `${SITE_URL}/shop`,
      tips: [
        { icon: '🔍', text: 'Browse products from verified vendors' },
        { icon: '🔒', text: 'Pay securely with Paystack — your money is protected' },
        { icon: '📦', text: 'Track every order from purchase to delivery' },
        { icon: '💬', text: 'Get support whenever you need it' },
      ],
    },
    vendor: {
      headline: 'Welcome to OjaBridge!',
      body: `Your vendor account has been created. Complete your identity verification (KYC) to start listing products and receiving orders.`,
      cta: 'Complete Verification',
      ctaUrl: `${SITE_URL}/vendor-dashboard/kyc`,
      tips: [
        { icon: '📋', text: 'Complete KYC/KYB to activate your store' },
        { icon: '📸', text: 'Upload quality product images for more sales' },
        { icon: '💳', text: 'Receive payouts directly to your bank account' },
        { icon: '📊', text: 'Track performance with real-time analytics' },
      ],
    },
    retailer: {
      headline: 'Welcome to OjaBridge!',
      body: `Your retailer account is ready. Source products at wholesale prices from verified vendors for your business.`,
      cta: 'Complete Verification',
      ctaUrl: `${SITE_URL}/retailer-dashboard/kyc`,
      tips: [
        { icon: '🔍', text: 'Discover wholesale pricing from verified vendors' },
        { icon: '📋', text: 'Complete KYC to start sourcing products' },
        { icon: '🤝', text: 'Build relationships with reliable suppliers' },
        { icon: '📦', text: 'Manage orders and track deliveries' },
      ],
    },
  };

  const roleInfo = roleContent[role] || roleContent.customer;

  const tipsHtml = roleInfo.tips.map(tip => `
    <tr>
      <td style="padding: 10px 0; font-size: 14px; color: #374151; vertical-align: top; width: 36px;">${tip.icon}</td>
      <td style="padding: 10px 0; font-size: 14px; color: #374151; line-height: 1.5;">${tip.text}</td>
    </tr>
  `).join('');

  const html = wrapEmail({
    title: `Welcome to OjaBridge, ${name || 'there'}!`,
    preheader: `Your ${role || 'customer'} account is ready. Here's how to get started.`,
    content: `
      <!-- Greeting -->
      <h1 style="margin: 0 0 8px; font-size: 26px; font-weight: 700; color: #0f172a; line-height: 1.3;">
        ${roleInfo.headline}
      </h1>
      <p style="margin: 0 0 24px; font-size: 15px; color: #64748b; line-height: 1.5;">
        Hi ${name || 'there'},
      </p>
      
      <p style="margin: 0 0 28px; font-size: 15px; color: #374151; line-height: 1.7;">
        ${roleInfo.body}
      </p>

      <!-- CTA Button -->
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
        <tr>
          <td align="center" style="padding: 8px 0 32px;">
            <a href="${roleInfo.ctaUrl}" style="display: inline-block; background: linear-gradient(135deg, #6b21a8, #7c3aed); color: #ffffff; text-decoration: none; padding: 14px 36px; border-radius: 10px; font-size: 15px; font-weight: 600; letter-spacing: 0.3px;">
              ${roleInfo.cta} &rarr;
            </a>
          </td>
        </tr>
      </table>

      <!-- Divider -->
      <hr style="border: none; border-top: 1px solid #f0f0f0; margin: 8px 0 24px;">

      <!-- Tips Section -->
      <p style="margin: 0 0 12px; font-size: 13px; font-weight: 600; color: #0f172a; text-transform: uppercase; letter-spacing: 1px;">
        Getting Started
      </p>
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
        ${tipsHtml}
      </table>

      <!-- Divider -->
      <hr style="border: none; border-top: 1px solid #f0f0f0; margin: 16px 0 24px;">

      <!-- Help -->
      <p style="margin: 0; font-size: 13px; color: #94a3b8; line-height: 1.6;">
        Questions? Visit our <a href="${SITE_URL}/support" style="color: #6b21a8; text-decoration: none; font-weight: 500;">Help Center</a> or reply to this email.
      </p>
    `,
  });

  return sendEmail({
    to: email,
    subject: `Welcome to OjaBridge, ${name || 'there'}! 🎉`,
    htmlContent: html,
  });
}

/**
 * Verification Code Email — OTP for email verification
 */
async function sendVerificationCode({ email, name, code }) {
  const html = wrapEmail({
    title: 'Verify Your Email',
    preheader: `Your OjaBridge verification code is ${code}`,
    content: `
      <!-- Icon -->
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
        <tr>
          <td align="center" style="padding-bottom: 24px;">
            <div style="width: 64px; height: 64px; background: linear-gradient(135deg, #f3e8ff, #ede9fe); border-radius: 50%; text-align: center; line-height: 64px; font-size: 28px;">
              &#9993;
            </div>
          </td>
        </tr>
      </table>

      <!-- Greeting -->
      <h1 style="margin: 0 0 8px; font-size: 26px; font-weight: 700; color: #0f172a; text-align: center; line-height: 1.3;">
        Verify Your Email
      </h1>
      <p style="margin: 0 0 24px; font-size: 15px; color: #64748b; text-align: center;">
        Hi ${name || 'there'}, enter the code below to verify your email address.
      </p>

      <!-- OTP Code Box -->
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
        <tr>
          <td align="center" style="padding: 8px 0 32px;">
            <div style="background: #fafbfc; border: 2px dashed #e2e8f0; border-radius: 12px; padding: 24px 40px; display: inline-block;">
              <span class="otp-code" style="font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace; font-size: 42px; font-weight: 700; color: #6b21a8; letter-spacing: 10px; line-height: 1;">
                ${code}
              </span>
            </div>
          </td>
        </tr>
      </table>

      <!-- Info Box -->
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
        <tr>
          <td style="padding: 16px 20px; background-color: #fefce8; border-radius: 10px; border-left: 4px solid #eab308;">
            <p style="margin: 0; font-size: 13px; color: #854d0e; line-height: 1.6;">
              This code expires in <strong>10 minutes</strong>. If you didn't request this, you can safely ignore this email — your account is secure.
            </p>
          </td>
        </tr>
      </table>

      <!-- Divider -->
      <hr style="border: none; border-top: 1px solid #f0f0f0; margin: 28px 0 20px;">

      <!-- Help -->
      <p style="margin: 0; font-size: 13px; color: #94a3b8; text-align: center; line-height: 1.6;">
        Having trouble? Contact us at <a href="mailto:support@ojabridge.com" style="color: #6b21a8; text-decoration: none;">support@ojabridge.com</a>
      </p>
    `,
  });

  return sendEmail({
    to: email,
    subject: `Your OjaBridge Verification Code: ${code}`,
    htmlContent: html,
  });
}

/**
 * Order Confirmation Email
 */
async function sendOrderConfirmation({ email, name, orderNumber, items, total, currency, shippingAddress, paymentRef }) {
  const cur = currency || '₦';

  const itemsHtml = items?.length > 0 ? `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 20px 0;">
      <tr style="border-bottom: 2px solid #f0f0f0;">
        <td style="padding: 8px 0; font-size: 11px; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px;">Item</td>
        <td style="padding: 8px 0; font-size: 11px; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; text-align: center;">Qty</td>
        <td style="padding: 8px 0; font-size: 11px; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; text-align: right;">Price</td>
      </tr>
      ${items.map(item => `
        <tr style="border-bottom: 1px solid #f8f8f8;">
          <td style="padding: 14px 0; font-size: 14px; color: #1a1a2e; font-weight: 500;">${item.product_name || item.name || 'Product'}</td>
          <td style="padding: 14px 0; font-size: 14px; color: #64748b; text-align: center;">${item.quantity}</td>
          <td style="padding: 14px 0; font-size: 14px; color: #1a1a2e; font-weight: 600; text-align: right;">${cur}${parseFloat(item.unit_price || item.price || 0).toLocaleString()}</td>
        </tr>
      `).join('')}
      <tr>
        <td colspan="2" style="padding: 16px 0 8px; font-size: 15px; font-weight: 600; color: #0f172a; border-top: 2px solid #f0f0f0;">Total Paid</td>
        <td style="padding: 16px 0 8px; font-size: 18px; font-weight: 700; color: #6b21a8; text-align: right; border-top: 2px solid #f0f0f0;">${cur}${parseFloat(total || 0).toLocaleString()}</td>
      </tr>
    </table>
  ` : `
    <div style="background: #fafbfc; border-radius: 10px; padding: 20px; margin: 20px 0;">
      <p style="margin: 0; font-size: 13px; color: #94a3b8;">Total Paid</p>
      <p style="margin: 4px 0 0; font-size: 24px; font-weight: 700; color: #6b21a8;">${cur}${parseFloat(total || 0).toLocaleString()}</p>
    </div>
  `;

  const html = wrapEmail({
    title: `Order Confirmed — ${orderNumber}`,
    preheader: `Order ${orderNumber} confirmed. Total: ${cur}${parseFloat(total || 0).toLocaleString()}`,
    content: `
      <!-- Success Badge -->
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
        <tr>
          <td align="center" style="padding-bottom: 24px;">
            <div style="display: inline-block; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 50px; padding: 8px 20px;">
              <span style="font-size: 14px; color: #16a34a; font-weight: 600;">&#10003; Payment Confirmed</span>
            </div>
          </td>
        </tr>
      </table>

      <h1 style="margin: 0 0 8px; font-size: 26px; font-weight: 700; color: #0f172a; text-align: center; line-height: 1.3;">
        Order Confirmed!
      </h1>
      <p style="margin: 0 0 24px; font-size: 15px; color: #64748b; text-align: center;">
        Hi ${name || 'Customer'}, your order has been placed successfully.
      </p>

      <!-- Order Details Card -->
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
        <tr>
          <td style="padding: 20px 24px; background: #fafbfc; border-radius: 12px; border: 1px solid #f0f0f0;">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
              <tr>
                <td style="padding: 4px 0; font-size: 12px; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px;">Order Number</td>
                <td style="padding: 4px 0; font-size: 15px; color: #0f172a; font-weight: 600; text-align: right;">${orderNumber}</td>
              </tr>
              ${paymentRef ? `
              <tr>
                <td style="padding: 4px 0; font-size: 12px; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px;">Payment Reference</td>
                <td style="padding: 4px 0; font-size: 13px; color: #64748b; text-align: right; font-family: monospace;">${paymentRef}</td>
              </tr>
              ` : ''}
              <tr>
                <td style="padding: 4px 0; font-size: 12px; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px;">Date</td>
                <td style="padding: 4px 0; font-size: 13px; color: #64748b; text-align: right;">${new Date().toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' })}</td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <!-- Items -->
      ${itemsHtml}

      ${shippingAddress ? `
      <div style="margin: 20px 0;">
        <p style="margin: 0 0 4px; font-size: 12px; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px;">Shipping To</p>
        <p style="margin: 0; font-size: 14px; color: #374151; line-height: 1.5;">${shippingAddress}</p>
      </div>
      ` : ''}

      <!-- CTA -->
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
        <tr>
          <td align="center" style="padding: 24px 0 8px;">
            <a href="${SITE_URL}/account/orders" style="display: inline-block; background: linear-gradient(135deg, #6b21a8, #7c3aed); color: #ffffff; text-decoration: none; padding: 14px 36px; border-radius: 10px; font-size: 15px; font-weight: 600;">
              Track Your Order &rarr;
            </a>
          </td>
        </tr>
      </table>

      <p style="margin: 20px 0 0; font-size: 13px; color: #94a3b8; text-align: center;">
        We'll send you updates as your order progresses.
      </p>
    `,
  });

  return sendEmail({
    to: email,
    subject: `Order Confirmed — ${orderNumber} | OjaBridge`,
    htmlContent: html,
  });
}

/**
 * Shipping Update Email
 */
async function sendShippingUpdate({ email, name, orderNumber, status, trackingNumber, carrier }) {
  const statusMessages = {
    processing: { text: 'Your order is being prepared', icon: '&#128230;', color: '#f59e0b', bg: '#fefce8', border: '#fde68a' },
    packed: { text: 'Your order has been packed', icon: '&#128203;', color: '#3b82f6', bg: '#eff6ff', border: '#bfdbfe' },
    shipped: { text: 'Your order is on its way!', icon: '&#128666;', color: '#8b5cf6', bg: '#f5f3ff', border: '#ddd6fe' },
    in_transit: { text: 'Your order is in transit', icon: '&#9992;', color: '#3b82f6', bg: '#eff6ff', border: '#bfdbfe' },
    delivered: { text: 'Your order has been delivered!', icon: '&#10003;', color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
  };

  const info = statusMessages[status] || { text: `Status: ${status}`, icon: '&#128230;', color: '#64748b', bg: '#f8fafc', border: '#e2e8f0' };

  const html = wrapEmail({
    title: `${info.text} — ${orderNumber}`,
    preheader: `${info.text}. Order ${orderNumber}${trackingNumber ? ` | Tracking: ${trackingNumber}` : ''}`,
    content: `
      <!-- Status Badge -->
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
        <tr>
          <td align="center" style="padding-bottom: 24px;">
            <div style="display: inline-block; background: ${info.bg}; border: 1px solid ${info.border}; border-radius: 50px; padding: 10px 24px;">
              <span style="font-size: 15px; color: ${info.color}; font-weight: 600;">${info.icon} ${info.text}</span>
            </div>
          </td>
        </tr>
      </table>

      <p style="margin: 0 0 24px; font-size: 15px; color: #64748b; text-align: center;">
        Hi ${name || 'Customer'}, here's the latest update on your order.
      </p>

      <!-- Order Card -->
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
        <tr>
          <td style="padding: 24px; background: #fafbfc; border-radius: 12px; border: 1px solid #f0f0f0;">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
              <tr>
                <td style="padding: 6px 0; font-size: 12px; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px;">Order Number</td>
                <td style="padding: 6px 0; font-size: 15px; color: #0f172a; font-weight: 600; text-align: right;">${orderNumber}</td>
              </tr>
              ${trackingNumber ? `
              <tr>
                <td style="padding: 6px 0; font-size: 12px; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px;">Tracking Number</td>
                <td style="padding: 6px 0; font-size: 14px; color: #64748b; text-align: right; font-family: monospace;">${trackingNumber}</td>
              </tr>
              ` : ''}
              ${carrier ? `
              <tr>
                <td style="padding: 6px 0; font-size: 12px; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px;">Carrier</td>
                <td style="padding: 6px 0; font-size: 14px; color: #64748b; text-align: right;">${carrier}</td>
              </tr>
              ` : ''}
            </table>
          </td>
        </tr>
      </table>

      <!-- CTA -->
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
        <tr>
          <td align="center" style="padding: 28px 0 8px;">
            <a href="${SITE_URL}/account/orders" style="display: inline-block; background: linear-gradient(135deg, #6b21a8, #7c3aed); color: #ffffff; text-decoration: none; padding: 14px 36px; border-radius: 10px; font-size: 15px; font-weight: 600;">
              View Order Details &rarr;
            </a>
          </td>
        </tr>
      </table>
    `,
  });

  return sendEmail({
    to: email,
    subject: `${info.text} — ${orderNumber} | OjaBridge`,
    htmlContent: html,
  });
}

/**
 * Password Reset Email
 */
async function sendPasswordReset({ email, name, resetUrl }) {
  const html = wrapEmail({
    title: 'Reset Your Password',
    preheader: `Reset your OjaBridge password. This link expires in 1 hour.`,
    content: `
      <!-- Icon -->
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
        <tr>
          <td align="center" style="padding-bottom: 24px;">
            <div style="width: 64px; height: 64px; background: linear-gradient(135deg, #fef3c7, #fde68a); border-radius: 50%; text-align: center; line-height: 64px; font-size: 28px;">
              &#128274;
            </div>
          </td>
        </tr>
      </table>

      <h1 style="margin: 0 0 8px; font-size: 26px; font-weight: 700; color: #0f172a; text-align: center; line-height: 1.3;">
        Reset Your Password
      </h1>
      <p style="margin: 0 0 24px; font-size: 15px; color: #64748b; text-align: center;">
        Hi ${name || 'there'}, we received a request to reset your password.
      </p>

      <!-- CTA -->
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
        <tr>
          <td align="center" style="padding: 8px 0 28px;">
            <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(135deg, #6b21a8, #7c3aed); color: #ffffff; text-decoration: none; padding: 14px 36px; border-radius: 10px; font-size: 15px; font-weight: 600;">
              Reset Password &rarr;
            </a>
          </td>
        </tr>
      </table>

      <!-- Info Box -->
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
        <tr>
          <td style="padding: 16px 20px; background-color: #fefce8; border-radius: 10px; border-left: 4px solid #eab308;">
            <p style="margin: 0; font-size: 13px; color: #854d0e; line-height: 1.6;">
              This link expires in <strong>1 hour</strong>. If you didn't request a password reset, ignore this email — your password will remain unchanged.
            </p>
          </td>
        </tr>
      </table>
    `,
  });

  return sendEmail({
    to: email,
    subject: 'Reset Your OjaBridge Password',
    htmlContent: html,
  });
}

/**
 * KYC Status Update Email
 */
async function sendKYCUpdate({ email, name, status }) {
  const statusMessages = {
    verified: {
      title: 'Verification Approved!',
      message: 'Your identity has been verified. You can now start listing products and receiving orders on OjaBridge.',
      cta: 'Go to Dashboard',
      ctaUrl: `${SITE_URL}/vendor-dashboard`,
      color: '#16a34a',
      bg: '#f0fdf4',
      border: '#bbf7d0',
    },
    rejected: {
      title: 'Verification Needs Attention',
      message: 'Your verification documents were not approved. Please review the feedback and resubmit with the required corrections.',
      cta: 'Review & Resubmit',
      ctaUrl: `${SITE_URL}/vendor-dashboard/kyc`,
      color: '#dc2626',
      bg: '#fef2f2',
      border: '#fecaca',
    },
    submitted: {
      title: 'Verification Under Review',
      message: 'Your documents have been received and are being reviewed by our team. We\'ll notify you once the review is complete (usually within 24-48 hours).',
      cta: 'View Status',
      ctaUrl: `${SITE_URL}/vendor-dashboard/kyc`,
      color: '#2563eb',
      bg: '#eff6ff',
      border: '#bfdbfe',
    },
  };

  const info = statusMessages[status] || statusMessages.submitted;

  const html = wrapEmail({
    title: info.title,
    preheader: info.message,
    content: `
      <!-- Status Badge -->
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
        <tr>
          <td align="center" style="padding-bottom: 24px;">
            <div style="display: inline-block; background: ${info.bg}; border: 1px solid ${info.border}; border-radius: 50px; padding: 10px 24px;">
              <span style="font-size: 15px; color: ${info.color}; font-weight: 600;">${info.title}</span>
            </div>
          </td>
        </tr>
      </table>

      <h1 style="margin: 0 0 8px; font-size: 26px; font-weight: 700; color: #0f172a; text-align: center; line-height: 1.3;">
        ${info.title}
      </h1>
      <p style="margin: 0 0 8px; font-size: 15px; color: #64748b; text-align: center;">
        Hi ${name || 'there'},
      </p>
      <p style="margin: 0 0 28px; font-size: 15px; color: #374151; text-align: center; line-height: 1.7;">
        ${info.message}
      </p>

      <!-- CTA -->
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
        <tr>
          <td align="center" style="padding: 8px 0 24px;">
            <a href="${info.ctaUrl}" style="display: inline-block; background: linear-gradient(135deg, #6b21a8, #7c3aed); color: #ffffff; text-decoration: none; padding: 14px 36px; border-radius: 10px; font-size: 15px; font-weight: 600;">
              ${info.cta} &rarr;
            </a>
          </td>
        </tr>
      </table>

      <p style="margin: 16px 0 0; font-size: 13px; color: #94a3b8; text-align: center;">
        Need help? <a href="${SITE_URL}/support" style="color: #6b21a8; text-decoration: none;">Contact Support</a>
      </p>
    `,
  });

  return sendEmail({
    to: email,
    subject: `${info.title} | OjaBridge`,
    htmlContent: html,
  });
}

/**
 * Vendor New Order Notification
 */
async function sendVendorNewOrder({ email, vendorName, orderNumber, items, total, currency, buyerName }) {
  const cur = currency || '₦';

  const itemsHtml = items?.length > 0 ? `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 16px 0;">
      <tr style="border-bottom: 2px solid #f0f0f0;">
        <td style="padding: 8px 0; font-size: 11px; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px;">Item</td>
        <td style="padding: 8px 0; font-size: 11px; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; text-align: center;">Qty</td>
        <td style="padding: 8px 0; font-size: 11px; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; text-align: right;">Amount</td>
      </tr>
      ${items.map(item => `
        <tr style="border-bottom: 1px solid #f8f8f8;">
          <td style="padding: 12px 0; font-size: 14px; color: #1a1a2e; font-weight: 500;">${item.product_name || 'Product'}</td>
          <td style="padding: 12px 0; font-size: 14px; color: #64748b; text-align: center;">${item.quantity}</td>
          <td style="padding: 12px 0; font-size: 14px; color: #1a1a2e; font-weight: 600; text-align: right;">${cur}${parseFloat(item.total_price || 0).toLocaleString()}</td>
        </tr>
      `).join('')}
      <tr>
        <td colspan="2" style="padding: 16px 0 8px; font-size: 15px; font-weight: 600; color: #0f172a; border-top: 2px solid #f0f0f0;">Total</td>
        <td style="padding: 16px 0 8px; font-size: 18px; font-weight: 700; color: #6b21a8; text-align: right; border-top: 2px solid #f0f0f0;">${cur}${parseFloat(total || 0).toLocaleString()}</td>
      </tr>
    </table>
  ` : '';

  const html = wrapEmail({
    title: `New Order — ${orderNumber}`,
    preheader: `New order from ${buyerName || 'a customer'}: ${cur}${parseFloat(total || 0).toLocaleString()}`,
    content: `
      <!-- New Order Badge -->
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
        <tr>
          <td align="center" style="padding-bottom: 24px;">
            <div style="display: inline-block; background: #f5f3ff; border: 1px solid #ddd6fe; border-radius: 50px; padding: 10px 24px;">
              <span style="font-size: 15px; color: #7c3aed; font-weight: 600;">&#128722; New Order Received</span>
            </div>
          </td>
        </tr>
      </table>

      <h1 style="margin: 0 0 8px; font-size: 26px; font-weight: 700; color: #0f172a; text-align: center; line-height: 1.3;">
        New Order!
      </h1>
      <p style="margin: 0 0 24px; font-size: 15px; color: #64748b; text-align: center;">
        Hi ${vendorName || 'Vendor'}, you have a new order from <strong style="color: #374151;">${buyerName || 'a customer'}</strong>.
      </p>

      <!-- Order Card -->
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
        <tr>
          <td style="padding: 20px 24px; background: #fafbfc; border-radius: 12px; border: 1px solid #f0f0f0;">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
              <tr>
                <td style="padding: 4px 0; font-size: 12px; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px;">Order Number</td>
                <td style="padding: 4px 0; font-size: 15px; color: #0f172a; font-weight: 600; text-align: right;">${orderNumber}</td>
              </tr>
              <tr>
                <td style="padding: 4px 0; font-size: 12px; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px;">Order Total</td>
                <td style="padding: 4px 0; font-size: 18px; color: #6b21a8; font-weight: 700; text-align: right;">${cur}${parseFloat(total || 0).toLocaleString()}</td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <!-- Items -->
      ${itemsHtml}

      <!-- CTA -->
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
        <tr>
          <td align="center" style="padding: 24px 0 8px;">
            <a href="${SITE_URL}/vendor-dashboard/orders" style="display: inline-block; background: linear-gradient(135deg, #6b21a8, #7c3aed); color: #ffffff; text-decoration: none; padding: 14px 36px; border-radius: 10px; font-size: 15px; font-weight: 600;">
              View Order &rarr;
            </a>
          </td>
        </tr>
      </table>

      <p style="margin: 20px 0 0; font-size: 13px; color: #94a3b8; text-align: center;">
        Please process this order promptly to maintain your vendor rating.
      </p>
    `,
  });

  return sendEmail({
    to: email,
    subject: `&#128722; New Order ${orderNumber} — ${cur}${parseFloat(total || 0).toLocaleString()} | OjaBridge`,
    htmlContent: html,
  });
}

/**
 * Order Cancelled Email
 */
async function sendOrderCancelled({ email, name, orderNumber, reason }) {
  const html = wrapEmail({
    title: `Order Cancelled — ${orderNumber}`,
    preheader: `Your order ${orderNumber} has been cancelled.`,
    content: `
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
        <tr>
          <td align="center" style="padding-bottom: 24px;">
            <div style="display: inline-block; background: #fef2f2; border: 1px solid #fecaca; border-radius: 50px; padding: 10px 24px;">
              <span style="font-size: 15px; color: #dc2626; font-weight: 600;">Order Cancelled</span>
            </div>
          </td>
        </tr>
      </table>

      <h1 style="margin: 0 0 8px; font-size: 26px; font-weight: 700; color: #0f172a; text-align: center;">Order Cancelled</h1>
      <p style="margin: 0 0 24px; font-size: 15px; color: #64748b; text-align: center;">
        Hi ${name || 'there'}, your order <strong>${orderNumber}</strong> has been cancelled.
      </p>

      ${reason ? `
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
        <tr>
          <td style="padding: 16px 20px; background: #fafbfc; border-radius: 10px; border: 1px solid #f0f0f0;">
            <p style="margin: 0 0 4px; font-size: 12px; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px;">Reason</p>
            <p style="margin: 0; font-size: 14px; color: #374151; line-height: 1.5;">${reason}</p>
          </td>
        </tr>
      </table>
      ` : ''}

      <p style="margin: 24px 0 0; font-size: 13px; color: #94a3b8; text-align: center;">
        If you have questions, contact us at <a href="mailto:support@ojabridge.com" style="color: #6b21a8; text-decoration: none;">support@ojabridge.com</a>
      </p>
    `,
  });

  return sendEmail({
    to: email,
    subject: `Order Cancelled — ${orderNumber} | OjaBridge`,
    htmlContent: html,
  });
}

export {
  sendEmail,
  sendOrderConfirmation,
  sendShippingUpdate,
  sendPasswordReset,
  sendWelcomeEmail,
  sendVerificationCode,
  sendKYCUpdate,
  sendVendorNewOrder,
  sendOrderCancelled,
};
