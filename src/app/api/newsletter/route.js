import { NextResponse } from 'next/server';
import { dbQuery, dbRaw, dbInsert, isDatabaseConnected } from '@/lib/db';
import { getUserFromRequest, requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * GET /api/newsletter — List subscribers (admin only)
 * POST /api/newsletter — Send newsletter to all active subscribers (admin only)
 */
export async function GET(request) {
  try {
    const user = await getUserFromRequest(request);
    const auth = requireAuth(user);
    if (!auth.authorized) return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    if (user.role !== 'admin') return NextResponse.json({ success: false, error: 'Admin only' }, { status: 403 });

    if (!isDatabaseConnected()) {
      return NextResponse.json({ success: true, subscribers: [], count: 0, campaigns: [] });
    }

    // Ensure table exists
    try {
      await dbRaw(`CREATE TABLE IF NOT EXISTS newsletter_subscribers (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        email VARCHAR(255) UNIQUE NOT NULL,
        is_active BOOLEAN DEFAULT true,
        subscribed_at TIMESTAMPTZ DEFAULT NOW(),
        unsubscribed_at TIMESTAMPTZ
      )`);
      await dbRaw(`CREATE TABLE IF NOT EXISTS newsletter_campaigns (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        subject VARCHAR(500) NOT NULL,
        content TEXT NOT NULL,
        recipient_count INT DEFAULT 0,
        sent_at TIMESTAMPTZ DEFAULT NOW(),
        sent_by UUID REFERENCES users(id),
        status VARCHAR(50) DEFAULT 'sent'
      )`);
    } catch (e) { /* tables may already exist */ }

    // Get subscribers
    const subscribers = await dbQuery('newsletter_subscribers', {});
    const activeSubscribers = (subscribers.data || []).filter(s => s.is_active);

    // Get campaigns
    let campaigns = [];
    try {
      const campResult = await dbRaw(`SELECT * FROM newsletter_campaigns ORDER BY sent_at DESC LIMIT 20`);
      campaigns = campResult.rows || [];
    } catch { /* table may not exist yet */ }

    return NextResponse.json({
      success: true,
      subscribers: activeSubscribers,
      count: activeSubscribers.length,
      campaigns,
    });
  } catch (error) {
    console.error('Newsletter GET error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = await getUserFromRequest(request);
    const auth = requireAuth(user);
    if (!auth.authorized) return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    if (user.role !== 'admin') return NextResponse.json({ success: false, error: 'Admin only' }, { status: 403 });

    const body = await request.json();
    const { subject, content } = body;

    if (!subject || subject.trim().length < 3) {
      return NextResponse.json({ success: false, error: 'Subject is required (min 3 characters)' }, { status: 400 });
    }
    if (!content || content.trim().length < 10) {
      return NextResponse.json({ success: false, error: 'Content is required (min 10 characters)' }, { status: 400 });
    }

    if (!isDatabaseConnected()) {
      return NextResponse.json({ success: false, error: 'Database not connected' }, { status: 503 });
    }

    // Ensure tables exist
    try {
      await dbRaw(`CREATE TABLE IF NOT EXISTS newsletter_subscribers (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        email VARCHAR(255) UNIQUE NOT NULL,
        is_active BOOLEAN DEFAULT true,
        subscribed_at TIMESTAMPTZ DEFAULT NOW(),
        unsubscribed_at TIMESTAMPTZ
      )`);
      await dbRaw(`CREATE TABLE IF NOT EXISTS newsletter_campaigns (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        subject VARCHAR(500) NOT NULL,
        content TEXT NOT NULL,
        recipient_count INT DEFAULT 0,
        sent_at TIMESTAMPTZ DEFAULT NOW(),
        sent_by UUID REFERENCES users(id),
        status VARCHAR(50) DEFAULT 'sent'
      )`);
    } catch (e) { /* tables may already exist */ }

    // Get active subscribers
    const subscribers = await dbQuery('newsletter_subscribers', {});
    const activeEmails = (subscribers.data || []).filter(s => s.is_active).map(s => s.email);

    if (activeEmails.length === 0) {
      return NextResponse.json({ success: false, error: 'No active subscribers to send to' }, { status: 400 });
    }

    // Send via Brevo
    let sentCount = 0;
    try {
      const { sendEmail } = await import('@/lib/email');

      // Brevo supports bulk sending via their API, but for simplicity we send individually
      // For production with many subscribers, use Brevo's contact list + campaign API
      for (const email of activeEmails) {
        try {
          await sendEmail({
            to: email,
            subject: subject,
            htmlContent: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #1a1a2e, #16213e); padding: 30px; text-align: center;">
                  <h1 style="color: white; font-size: 22px; margin: 0;">OjaBridge</h1>
                  <p style="color: rgba(255,255,255,0.7); font-size: 12px; margin: 5px 0 0;">Shop · Connect · Grow</p>
                </div>
                <div style="padding: 30px; background: #f9fafb;">
                  <h2 style="color: #1a1a2e; font-size: 20px; margin-top: 0;">${subject}</h2>
                  <div style="color: #374151; line-height: 1.8; font-size: 15px;">
                    ${content.replace(/\n/g, '<br>')}
                  </div>
                </div>
                <div style="padding: 20px; text-align: center; background: #1a1a2e;">
                  <p style="color: rgba(255,255,255,0.5); font-size: 12px; margin: 0;">
                    OjaBridge — Shop · Connect · Grow<br>
                    You are receiving this because you subscribed to OjaBridge updates.
                  </p>
                </div>
              </div>
            `,
          });
          sentCount++;
        } catch (emailErr) {
          console.error(`Failed to send to ${email}:`, emailErr.message);
        }
      }
    } catch (emailErr) {
      console.error('Newsletter send error:', emailErr.message);
    }

    // Save campaign record
    try {
      await dbInsert('newsletter_campaigns', {
        subject,
        content,
        recipient_count: sentCount,
        sent_by: user.id,
        sent_at: new Date().toISOString(),
        status: sentCount > 0 ? 'sent' : 'failed',
      });
    } catch (e) { /* non-fatal */ }

    return NextResponse.json({
      success: true,
      message: `Newsletter sent to ${sentCount} of ${activeEmails.length} subscribers`,
      sentCount,
      totalSubscribers: activeEmails.length,
    });
  } catch (error) {
    console.error('Newsletter POST error:', error);
    return NextResponse.json({ success: false, error: 'Failed to send newsletter' }, { status: 500 });
  }
}
