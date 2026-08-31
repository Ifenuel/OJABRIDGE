import { NextResponse } from 'next/server';
import { dbInsert, isDatabaseConnected } from '@/lib/db';
import { sanitizeInput } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * POST /api/contact — Submit a contact form message
 * Stores in database and sends email notification to awoyoemmanuel12@gmail.com
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { name, email, subject, message, userType } = body;

    // Validation
    const errors = [];
    if (!name || name.trim().length < 2) errors.push('Name is required');
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push('Valid email is required');
    if (!subject || subject.trim().length < 3) errors.push('Subject is required');
    if (!message || message.trim().length < 10) errors.push('Message must be at least 10 characters');
    if (errors.length > 0) {
      return NextResponse.json({ success: false, errors }, { status: 400 });
    }

    // Store in database if connected
    if (isDatabaseConnected()) {
      try {
        const fullMessage = `[${userType || 'customer'}] From: ${name} (${email})\n\n${message}`;
        await dbInsert('support_tickets', {
          subject: `[Contact Form] ${sanitizeInput(subject)}`,
          message: sanitizeInput(fullMessage),
          category: 'contact_form',
          status: 'open',
          priority: 'normal',
        });
      } catch (dbErr) {
        console.error('Failed to store contact message:', dbErr);
        // Continue anyway — try to send email even if DB fails
      }
    }

    // Send email notification via Brevo
    try {
      const { sendEmail } = await import('@/lib/email');
      await sendEmail({
        to: process.env.BREVO_SENDER_EMAIL || 'support@ojabridge.com',
        subject: `[OjaBridge Contact] ${subject}`,
        htmlContent: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #1a1a2e; padding: 20px; text-align: center;">
              <h1 style="color: white; font-size: 20px;">New Contact Message</h1>
            </div>
            <div style="padding: 20px; background: #f9fafb;">
              <p><strong>From:</strong> ${name}</p>
              <p><strong>Email:</strong> ${email}</p>
              <p><strong>User Type:</strong> ${userType || 'customer'}</p>
              <p><strong>Subject:</strong> ${subject}</p>
              <hr style="border: 1px solid #e5e7eb; margin: 16px 0;">
              <p><strong>Message:</strong></p>
              <p style="color: #374151; line-height: 1.6;">${message}</p>
            </div>
            <div style="padding: 12px; text-align: center; color: #9ca3af; font-size: 12px;">
              OjaBridge — Shop • Connect • Grow
            </div>
          </div>
        `,
      });
    } catch (emailErr) {
      console.error('Email notification failed (message still saved):', emailErr.message);
      // Not fatal — message is saved in DB
    }

    return NextResponse.json({
      success: true,
      message: 'Your message has been received. We will respond as soon as possible.',
    });
  } catch (error) {
    console.error('Contact form error:', error);
    return NextResponse.json({ success: false, error: 'Failed to send message. Please try again.' }, { status: 500 });
  }
}
