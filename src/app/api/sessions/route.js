import { NextResponse } from 'next/server';
import { getUserFromRequest, requireAuth } from '@/lib/auth';
import { dbQuery, dbUpdate, dbInsert, isDatabaseConnected } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/sessions — Get active sessions for current user
 * DELETE /api/sessions — Invalidate all other sessions (sign out everywhere else)
 */

export async function GET(request) {
  try {
    const user = await getUserFromRequest(request);
    const auth = requireAuth(user);
    if (!auth.authorized) return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });

    if (!isDatabaseConnected()) {
      return NextResponse.json({ success: true, sessions: [], dbConnected: false });
    }

    // Get user's session data from the users table metadata
    const { data: users } = await dbQuery('users', { filter: { id: user.id } });
    const dbUser = users?.[0];
    
    if (!dbUser) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    // Parse sessions from metadata
    const sessions = dbUser.metadata?.sessions || [];
    const currentFingerprint = generateSimpleFingerprint(request);
    
    // Format sessions for display
    const formattedSessions = sessions.map((s, idx) => ({
      id: s.fingerprint || `session-${idx}`,
      ip: s.ip || 'Unknown',
      userAgent: s.userAgent || 'Unknown device',
      isCurrent: s.fingerprint === currentFingerprint,
      lastActive: s.lastActive ? new Date(s.lastActive).toISOString() : null,
      createdAt: s.createdAt ? new Date(s.createdAt).toISOString() : null,
    }));

    // Sort: current session first, then by lastActive descending
    formattedSessions.sort((a, b) => {
      if (a.isCurrent) return -1;
      if (b.isCurrent) return 1;
      return new Date(b.lastActive || 0) - new Date(a.lastActive || 0);
    });

    return NextResponse.json({ success: true, sessions: formattedSessions });
  } catch (error) {
    console.error('Sessions GET error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const user = await getUserFromRequest(request);
    const auth = requireAuth(user);
    if (!auth.authorized) return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });

    if (!isDatabaseConnected()) {
      return NextResponse.json({ success: false, error: 'Database not connected' }, { status: 503 });
    }

    // Get current session fingerprint
    const currentFingerprint = generateSimpleFingerprint(request);

    // Get user's current sessions
    const { data: users } = await dbQuery('users', { filter: { id: user.id } });
    const dbUser = users?.[0];
    
    if (!dbUser) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    const sessions = dbUser.metadata?.sessions || [];
    
    // Keep only the current session, remove all others
    const currentSession = sessions.find(s => s.fingerprint === currentFingerprint);
    const updatedSessions = currentSession ? [currentSession] : [];

    // Update in database
    await dbUpdate('users', { id: user.id }, {
      metadata: {
        ...dbUser.metadata,
        sessions: updatedSessions,
        sessionRevokedAt: new Date().toISOString(),
      },
    });

    // Audit log
    await dbInsert('audit_logs', {
      user_id: user.id,
      action: 'sessions.revoked_all',
      ip_address: request.headers.get('x-forwarded-for') || null,
      user_agent: request.headers.get('user-agent') || null,
      created_at: new Date().toISOString(),
    }).catch(() => {});

    return NextResponse.json({ success: true, message: 'All other sessions have been signed out' });
  } catch (error) {
    console.error('Sessions DELETE error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * Generate a simple fingerprint from request headers
 */
function generateSimpleFingerprint(request) {
  const components = [
    request.headers.get('user-agent') || '',
    request.headers.get('accept-language') || '',
    request.headers.get('x-forwarded-for') || '',
  ];
  
  let hash = 0;
  const str = components.join('|');
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return hash.toString(36);
}
