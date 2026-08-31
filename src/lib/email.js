/**
 * ============================================
 * OJABRIDGE EMAIL SERVICE (Brevo)
 * ============================================
 * 
 * Sends transactional emails via Brevo API.
 * Handles order confirmations, shipping updates, 
 * password resets, and notification emails.
 */

const BREVO_API_KEY = process.env.BREVO_API_KEY;
const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';
const SENDER = {
  name: process.env.BREVO_SENDER_NAME || 'OjaBridge',
  email: process.env.BREVO_SENDER_EMAIL || 'awoyoemmanuel12@gmail.com',
};

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
      // Don't throw — email failure shouldn't break order flow
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
// EMAIL TEMPLATES
// ============================================

const emailStyles = `
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background: #f8f9fa; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; }
    .header { background: linear-gradient(135deg, #0f172a 0%, #6b21a8 100%); padding: 32px; text-align: center; }
    .header h1 { color: #ffffff; margin: 0; font-size: 28px; letter-spacing: 2px; }
    .header .tagline { color: #a3e635; font-size: 12px; letter-spacing: 4px; margin-top: 4px; }
    .content { padding: 32px; color: #1e293b; line-height: 1.6; }
    .content h2 { color: #0f172a; margin-top: 0; }
    .order-box { background: #f8f9fa; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0; }
    .order-box .label { color: #64748b; font-size: 13px; text-transform: uppercase; letter-spacing: 1px; }
    .order-box .value { color: #0f172a; font-size: 18px; font-weight: 600; margin: 4px 0 16px; }
    .btn { display: inline-block; background: linear-gradient(135deg, #6b21a8, #7c3aed); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; margin: 16px 0; }
    .footer { background: #0f172a; padding: 24px; text-align: center; color: #94a3b8; font-size: 12px; }
    .footer a { color: #a3e635; text-decoration: none; }
    .status-badge { display: inline-block; padding: 6px 16px; border-radius: 20px; font-size: 14px; font-weight: 600; }
    .status-paid { background: #dcfce7; color: #16a34a; }
    .status-shipped { background: #dbeafe; color: #2563eb; }
    .status-delivered { background: #f3e8ff; color: #7c3aed; }
  </style>
`;

/**
 * Order Confirmation Email
 */
async function sendOrderConfirmation({ email, name, orderNumber, items, total, currency, shippingAddress, paymentRef }) {
  const itemsHtml = items?.map(item => `
    <tr>
      <td style="padding:12px 0;border-bottom:1px solid #e2e8f0;">${item.product_name || item.name || 'Product'}</td>
      <td style="padding:12px 0;border-bottom:1px solid #e2e8f0;text-align:center;">${item.quantity}</td>
      <td style="padding:12px 0;border-bottom:1px solid #e2e8f0;text-align:right;">${currency || '₦'}${parseFloat(item.unit_price || item.price || 0).toLocaleString()}</td>
    </tr>
  `).join('') || '';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>${emailStyles}</head>
    <body>
      <div class="container">
        <div class="header">
          <h1>OJABRIDGE</h1>
          <div class="tagline">SHOP • CONNECT • GROW</div>
        </div>
        <div class="content">
          <h2>Order Confirmed! 🎉</h2>
          <p>Hi ${name || 'Customer'},</p>
          <p>Thank you for your order. Your payment has been confirmed and your order is being processed.</p>
          
          <div class="order-box">
            <div class="label">Order Number</div>
            <div class="value">${orderNumber}</div>
            ${paymentRef ? `<div class="label">Payment Reference</div><div class="value" style="font-size:14px;">${paymentRef}</div>` : ''}
          </div>

          ${itemsHtml ? `
          <table style="width:100%;border-collapse:collapse;margin:16px 0;">
            <thead>
              <tr style="border-bottom:2px solid #0f172a;">
                <th style="text-align:left;padding:8px 0;color:#64748b;font-size:13px;">ITEM</th>
                <th style="text-align:center;padding:8px 0;color:#64748b;font-size:13px;">QTY</th>
                <th style="text-align:right;padding:8px 0;color:#64748b;font-size:13px;">PRICE</th>
              </tr>
            </thead>
            <tbody>${itemsHtml}</tbody>
          </table>
          ` : ''}

          <div class="order-box">
            <div class="label">Total Paid</div>
            <div class="value" style="color:#7c3aed;font-size:24px;">${currency || '₦'}${parseFloat(total || 0).toLocaleString()}</div>
          </div>

          ${shippingAddress ? `
          <div class="order-box">
            <div class="label">Shipping To</div>
            <div class="value" style="font-size:14px;">${shippingAddress}</div>
          </div>
          ` : ''}

          <p style="margin-top:24px;">You can track your order from your account dashboard. We'll also send you updates as your order progresses.</p>

          <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/account/orders" class="btn">Track Your Order</a>
        </div>
        <div class="footer">
          <p>OjaBridge — Africa's Leading Multi-Vendor Marketplace</p>
          <p><a href="${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}">ojabridge.com</a></p>
        </div>
      </div>
    </body>
    </html>
  `;

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
    processing: { text: 'Your order is being prepared', icon: '📦' },
    packed: { text: 'Your order has been packed and is ready for pickup', icon: '📋' },
    shipped: { text: 'Your order is on its way!', icon: '🚚' },
    in_transit: { text: 'Your order is in transit', icon: '✈️' },
    delivered: { text: 'Your order has been delivered!', icon: '✅' },
  };

  const statusInfo = statusMessages[status] || { text: `Order status: ${status}`, icon: '📦' };

  const html = `
    <!DOCTYPE html>
    <html>
    <head>${emailStyles}</head>
    <body>
      <div class="container">
        <div class="header">
          <h1>OJABRIDGE</h1>
          <div class="tagline">SHOP • CONNECT • GROW</div>
        </div>
        <div class="content">
          <h2>${statusInfo.icon} Shipping Update</h2>
          <p>Hi ${name || 'Customer'},</p>
          <p><strong>${statusInfo.text}</strong></p>
          
          <div class="order-box">
            <div class="label">Order Number</div>
            <div class="value">${orderNumber}</div>
            <div class="label">Status</div>
            <div class="value"><span class="status-badge status-${status === 'delivered' ? 'delivered' : status === 'shipped' ? 'shipped' : 'paid'}">${status?.toUpperCase()}</span></div>
            ${trackingNumber ? `<div class="label">Tracking Number</div><div class="value" style="font-size:14px;">${trackingNumber}</div>` : ''}
            ${carrier ? `<div class="label">Carrier</div><div class="value" style="font-size:14px;">${carrier}</div>` : ''}
          </div>

          <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/account/orders" class="btn">Track Your Order</a>
        </div>
        <div class="footer">
          <p>OjaBridge — Africa's Leading Multi-Vendor Marketplace</p>
          <p><a href="${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}">ojabridge.com</a></p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: `${statusInfo.icon} ${statusInfo.text} — ${orderNumber} | OjaBridge`,
    htmlContent: html,
  });
}

/**
 * Password Reset Email
 */
async function sendPasswordReset({ email, name, resetUrl }) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>${emailStyles}</head>
    <body>
      <div class="container">
        <div class="header">
          <h1>OJABRIDGE</h1>
          <div class="tagline">SHOP • CONNECT • GROW</div>
        </div>
        <div class="content">
          <h2>Reset Your Password 🔐</h2>
          <p>Hi ${name || 'there'},</p>
          <p>We received a request to reset your OjaBridge account password. Click the button below to create a new password.</p>
          
          <div style="text-align:center;margin:32px 0;">
            <a href="${resetUrl}" class="btn">Reset Password</a>
          </div>

          <p style="color:#64748b;font-size:13px;">This link expires in 1 hour. If you didn't request a password reset, you can safely ignore this email.</p>
        </div>
        <div class="footer">
          <p>OjaBridge — Africa's Leading Multi-Vendor Marketplace</p>
          <p><a href="${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}">ojabridge.com</a></p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: 'Reset Your OjaBridge Password',
    htmlContent: html,
  });
}

/**
 * Welcome / Registration Confirmation Email
 */
async function sendWelcomeEmail({ email, name, role }) {
  const roleMessages = {
    customer: 'Start exploring thousands of products from verified vendors across Africa.',
    vendor: 'Complete your KYC verification to start selling on OjaBridge.',
    retailer: 'Start sourcing products at wholesale prices from verified vendors.',
  };

  const html = `
    <!DOCTYPE html>
    <html>
    <head>${emailStyles}</head>
    <body>
      <div class="container">
        <div class="header">
          <h1>OJABRIDGE</h1>
          <div class="tagline">SHOP • CONNECT • GROW</div>
        </div>
        <div class="content">
          <h2>Welcome to OjaBridge! 🎉</h2>
          <p>Hi ${name || 'there'},</p>
          <p>Your OjaBridge account has been created successfully. You're now part of Africa's most trusted multi-vendor marketplace.</p>
          
          <div class="order-box">
            <div class="label">Account Type</div>
            <div class="value" style="text-transform:capitalize;">${role || 'Customer'}</div>
          </div>

          <p>${roleMessages[role] || roleMessages.customer}</p>

          <div style="text-align:center;margin:32px 0;">
            <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/login" class="btn">Log In to Your Account</a>
          </div>
        </div>
        <div class="footer">
          <p>OjaBridge — Africa's Leading Multi-Vendor Marketplace</p>
          <p><a href="${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}">ojabridge.com</a></p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: `Welcome to OjaBridge, ${name || 'there'}! 🎉`,
    htmlContent: html,
  });
}

/**
 * Vendor KYC Status Update Email
 */
async function sendKYCUpdate({ email, name, status }) {
  const statusMessages = {
    verified: { title: 'KYC Verified! ✅', message: 'Your identity verification has been approved. You can now start listing products on OjaBridge.', color: '#16a34a' },
    rejected: { title: 'KYC Requires Attention ⚠️', message: 'Your verification was not approved. Please review the feedback and resubmit your documents.', color: '#dc2626' },
    submitted: { title: 'KYC Under Review 📋', message: 'Your verification documents have been submitted and are being reviewed. We\'ll notify you once the review is complete.', color: '#2563eb' },
  };

  const info = statusMessages[status] || statusMessages.submitted;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>${emailStyles}</head>
    <body>
      <div class="container">
        <div class="header">
          <h1>OJABRIDGE</h1>
          <div class="tagline">SHOP • CONNECT • GROW</div>
        </div>
        <div class="content">
          <h2>${info.title}</h2>
          <p>Hi ${name || 'Vendor'},</p>
          <p>${info.message}</p>
          
          <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/vendor-dashboard" class="btn">Go to Dashboard</a>
        </div>
        <div class="footer">
          <p>OjaBridge — Africa's Leading Multi-Vendor Marketplace</p>
          <p><a href="${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}">ojabridge.com</a></p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: `${info.title} | OjaBridge`,
    htmlContent: html,
  });
}

/**
 * Vendor New Order Notification Email
 */
async function sendVendorNewOrder({ email, vendorName, orderNumber, items, total, currency, buyerName }) {
  const itemsHtml = items?.map(item => `
    <tr>
      <td style="padding:10px;border-bottom:1px solid #e2e8f0;">${item.product_name || 'Product'}</td>
      <td style="padding:10px;border-bottom:1px solid #e2e8f0;text-align:center;">${item.quantity}</td>
      <td style="padding:10px;border-bottom:1px solid #e2e8f0;text-align:right;">${currency || '₦'}${parseFloat(item.total_price || 0).toLocaleString()}</td>
    </tr>
  `).join('') || '';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>${emailStyles}</head>
    <body>
      <div class="container">
        <div class="header">
          <h1>OJABRIDGE</h1>
          <div class="tagline">SHOP • CONNECT • GROW</div>
        </div>
        <div class="content">
          <h2>New Order Received! 🛒</h2>
          <p>Hi ${vendorName || 'Vendor'},</p>
          <p>You have a new order from ${buyerName || 'a customer'}. Please process it promptly.</p>
          
          <div class="order-box">
            <div class="label">Order Number</div>
            <div class="value">${orderNumber}</div>
            <div class="label">Order Total</div>
            <div class="value" style="color:#7c3aed;">${currency || '₦'}${parseFloat(total || 0).toLocaleString()}</div>
          </div>

          ${itemsHtml ? `
          <table style="width:100%;border-collapse:collapse;margin:16px 0;">
            <thead>
              <tr style="border-bottom:2px solid #0f172a;">
                <th style="text-align:left;padding:8px 0;color:#64748b;font-size:13px;">ITEM</th>
                <th style="text-align:center;padding:8px 0;color:#64748b;font-size:13px;">QTY</th>
                <th style="text-align:right;padding:8px 0;color:#64748b;font-size:13px;">AMOUNT</th>
              </tr>
            </thead>
            <tbody>${itemsHtml}</tbody>
          </table>
          ` : ''}

          <div style="text-align:center;margin:24px 0;">
            <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/vendor-dashboard/orders" class="btn">View Order</a>
          </div>
        </div>
        <div class="footer">
          <p>OjaBridge — Africa's Leading Multi-Vendor Marketplace</p>
          <p><a href="${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}">ojabridge.com</a></p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: `🛒 New Order ${orderNumber} — ${currency || '₦'}${parseFloat(total || 0).toLocaleString()} | OjaBridge`,
    htmlContent: html,
  });
}

export {
  sendEmail,
  sendOrderConfirmation,
  sendShippingUpdate,
  sendPasswordReset,
  sendWelcomeEmail,
  sendKYCUpdate,
  sendVendorNewOrder,
};
