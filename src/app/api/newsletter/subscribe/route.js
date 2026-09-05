import { NextResponse } from 'next/server';
import { dbInsert, dbQuery, dbRaw, isDatabaseConnected } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * POST /api/newsletter/subscribe — Subscribe to OjaBridge newsletter
 * GET /api/newsletter/subscribe — Get subscriber count (public)
 */

export async function POST(request) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ success: false, error: 'Valid email is required' }, { status: 400 });
    }

    if (!isDatabaseConnected()) {
      return NextResponse.json({ success: true, message: 'Thank you for subscribing!' });
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
    } catch (e) {
      // Table might not be creatable — continue anyway
    }

    // Check if already subscribed
    const existing = await dbQuery('newsletter_subscribers', { filter: { email: email.toLowerCase() } });
    if (existing.data?.[0]) {
      if (existing.data[0].is_active) {
        return NextResponse.json({ success: true, message: 'You are already subscribed!' });
      }
      // Reactivate
      await dbRaw(`UPDATE newsletter_subscribers SET is_active = true, unsubscribed_at = NULL WHERE email = '${email.toLowerCase()}'`);
      return NextResponse.json({ success: true, message: 'Welcome back! You have been resubscribed.' });
    }

    // New subscription
    const { error } = await dbInsert('newsletter_subscribers', {
      email: email.toLowerCase(),
      is_active: true,
      subscribed_at: new Date().toISOString(),
    });

    if (error) {
      console.error('Newsletter subscribe error:', error);
      return NextResponse.json({ success: true, message: 'Thank you for subscribing!' });
    }

    return NextResponse.json({ success: true, message: 'Thank you for subscribing to OjaBridge updates!' });
  } catch (error) {
    console.error('Newsletter subscribe error:', error);
    return NextResponse.json({ success: true, message: 'Thank you for subscribing!' });
  }
}

export async function GET() {
  try {
    if (!isDatabaseConnected()) {
      return NextResponse.json({ success: true, count: 0 });
    }

    try {
      const result = await dbRaw(`SELECT COUNT(*) as count FROM newsletter_subscribers WHERE is_active = true`);
      return NextResponse.json({ success: true, count: parseInt(result.rows?.[0]?.count || 0) });
    } catch {
      return NextResponse.json({ success: true, count: 0 });
    }
  } catch {
    return NextResponse.json({ success: true, count: 0 });
  }
}
