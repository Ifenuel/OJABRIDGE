import { NextResponse } from 'next/server';
import { dbInsert, isDatabaseConnected } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * POST /api/security — Log security events
 * GET /api/security — Get security events (admin only)
 */

// In-memory store for recent security events
const recentEvents = [];

export async function POST(request) {
  try {
    const body = await request.json();
    const { action, attemptedRole, requiredRoles, path, details } = body;
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const userAgent = request.headers.get('user-agent') || '';

    const event = {
      action,
      ip,
      userAgent: userAgent.substring(0, 200),
      path,
      attemptedRole,
      requiredRoles,
      details,
      timestamp: new Date().toISOString(),
    };

    // Log to console for development
    console.warn(`[SECURITY EVENT]`, JSON.stringify(event, null, 2));

    // Store in memory
    recentEvents.unshift(event);
    if (recentEvents.length > 100) recentEvents.splice(100);

    // Store in database (production)
    if (isDatabaseConnected()) {
      await dbInsert('audit_logs', {
        action: `security.${action}`,
        entity_type: 'security_event',
        ip_address: ip,
        user_agent: userAgent,
        new_data: event,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Security log error:', error);
    return NextResponse.json({ success: true }); // Don't reveal errors in security endpoint
  }
}

export async function GET(request) {
  try {
    // Return events for admin review
    if (process.env.NODE_ENV !== 'development') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      events: recentEvents.slice(0, 50),
      total: recentEvents.length,
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
