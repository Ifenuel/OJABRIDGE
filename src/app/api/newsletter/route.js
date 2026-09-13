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
      const { sendEmail, buildNewsletterEmail } = await import('@/lib/email');

      // Build the email HTML once and reuse for all subscribers
      const htmlContent = buildNewsletterEmail({ subject, content, preheader: null });

      // Log the content for debugging (first 500 chars)
      console.log('[NEWSLETTER] Built email HTML, length:', htmlContent.length);
      console.log('[NEWSLETTER] Content preview:', htmlContent.substring(0, 500));
      console.log('[NEWSLETTER] Subject:', subject);
      console.log('[NEWSLETTER] Content from form:', content);
      console.log('[NEWSLETTER] Active subscribers:', activeEmails.length);

      // Brevo supports bulk sending via their API, but for simplicity we send individually.
      // For production with many subscribers, use Brevo's contact list + campaign API.
      for (const email of activeEmails) {
        try {
          const result = await sendEmail({
            to: email,
            subject,
            htmlContent,
          });
          console.log(`[NEWSLETTER] Sent to ${email}:`, result);
          sentCount++;
        } catch (emailErr) {
          console.error(`[NEWSLETTER] Failed to send to ${email}:`, emailErr.message);
        }
      }
    } catch (emailErr) {
      console.error('[NEWSLETTER] Send error:', emailErr.message);
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

/**
 * DELETE /api/newsletter — Delete campaign history (admin only)
 * Query params:
 *   campaignId=<uuid>  — delete a single campaign
 *   all=true           — delete ALL campaign history
 */
export async function DELETE(request) {
  try {
    const user = await getUserFromRequest(request);
    const auth = requireAuth(user);
    if (!auth.authorized) return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    if (user.role !== 'admin') return NextResponse.json({ success: false, error: 'Admin only' }, { status: 403 });

    if (!isDatabaseConnected()) {
      return NextResponse.json({ success: false, error: 'Database not connected' }, { status: 503 });
    }

    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get('campaignId');
    const clearAll = searchParams.get('all') === 'true';

    if (clearAll) {
      const result = await dbRaw(`DELETE FROM newsletter_campaigns`);
      if (result?.error) throw new Error(result.error);
      return NextResponse.json({ success: true, message: 'Campaign history cleared', deleted: result?.rowCount ?? 0 });
    }

    if (!campaignId) {
      return NextResponse.json({ success: false, error: 'campaignId or all=true is required' }, { status: 400 });
    }

    const result = await dbRaw(`DELETE FROM newsletter_campaigns WHERE id = $1`, [campaignId]);
    if (result?.error) throw new Error(result.error);
    if (!result?.rowCount) {
      return NextResponse.json({ success: false, error: 'Campaign not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Campaign deleted', deleted: result.rowCount });
  } catch (error) {
    console.error('Newsletter DELETE error:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete campaign history' }, { status: 500 });
  }
}
