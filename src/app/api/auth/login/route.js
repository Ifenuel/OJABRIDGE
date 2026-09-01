import { NextResponse } from 'next/server';
import { verifyPassword, generateAccessToken, generateRefreshToken, setAuthCookies, validateEmail } from '@/lib/auth';
import { dbQuery, dbUpdate, dbInsert, isDatabaseConnected } from '@/lib/db';

/**
 * POST /api/auth/login
 * Authenticate user, return JWT tokens, set HTTP-only cookies
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ success: false, error: 'Email and password are required' }, { status: 400 });
    }

    if (!validateEmail(email)) {
      return NextResponse.json({ success: false, error: 'Invalid email format' }, { status: 400 });
    }

    if (isDatabaseConnected()) {
      // Find user by email
      const { data: users, error: findError, dbConnected } = await dbQuery('users', { filter: { email: email.toLowerCase().trim() } });

      if (findError) {
        console.error('[LOGIN] Query error:', findError);
        return NextResponse.json({ success: false, error: 'Database query failed', details: findError }, { status: 500 });
      }
      if (!dbConnected) {
        return NextResponse.json({ success: false, error: 'Database not connected' }, { status: 503 });
      }

      const user = users && users[0];

      if (!user) {
        // Don't reveal whether email exists
        return NextResponse.json({ success: false, error: 'Invalid email or password' }, { status: 401 });
      }

      // Check account status
      if (user.status === 'suspended') {
        return NextResponse.json({ success: false, error: 'Account suspended. Contact support.' }, { status: 403 });
      }
      if (user.status === 'banned') {
        return NextResponse.json({ success: false, error: 'Account has been permanently disabled' }, { status: 403 });
      }
      if (user.status === 'pending_verification') {
        return NextResponse.json({ success: false, error: 'Please verify your email before signing in.' }, { status: 403 });
      }
      if (!user.email_verified && user.status === 'active') {
        return NextResponse.json({ success: false, error: 'Please verify your email before signing in. Check your inbox for the verification code.', requiresVerification: true }, { status: 403 });
      }

      // Check if locked
      if (user.locked_until && new Date(user.locked_until) > new Date()) {
        const minutesLeft = Math.ceil((new Date(user.locked_until) - new Date()) / 60000);
        return NextResponse.json({ success: false, error: `Account temporarily locked. Try again in ${minutesLeft} minutes.` }, { status: 423 });
      }

      // Verify password
      const isValid = await verifyPassword(password, user.password_hash);

      if (!isValid) {
        // Increment login attempts
        const attempts = (user.failed_login_attempts || 0) + 1;
        const lockUpdate = attempts >= 5 ? { locked_until: new Date(Date.now() + 15 * 60 * 1000) } : {};
        
        await dbUpdate('users', { id: user.id }, { failed_login_attempts: attempts, ...lockUpdate });

        // Log failed attempt (non-blocking)
        dbInsert('audit_logs', {
          user_id: user.id,
          action: 'login_failed',
          ip_address: request.headers.get('x-forwarded-for') || null,
          user_agent: request.headers.get('user-agent') || null,
        }).catch(() => {});

        return NextResponse.json({ success: false, error: 'Invalid email or password' }, { status: 401 });
      }

      // Check MFA (scaffold — set up mfa_enabled in DB to activate)
      if (user.mfa_enabled) {
        // In production: generate MFA challenge token, require TOTP
        return NextResponse.json({
          success: false,
          requiresMFA: true,
          error: 'MFA verification required',
        }, { status: 200 });
      }

      // Generate tokens
      const accessToken = await generateAccessToken(user);
      const refreshToken = await generateRefreshToken(user);

      // Update login info (non-blocking)
      dbUpdate('users', { id: user.id }, {
        last_login_at: new Date().toISOString(),
        last_login_ip: request.headers.get('x-forwarded-for') || null,
        failed_login_attempts: 0,
        locked_until: null,
      }).catch(() => {});

      // Log successful login (non-blocking)
      dbInsert('audit_logs', {
        user_id: user.id,
        action: 'login_success',
        ip_address: request.headers.get('x-forwarded-for') || null,
        user_agent: request.headers.get('user-agent') || null,
      }).catch(() => {});

      // Build response with cookies
      const response = NextResponse.json({
        success: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar_url,
        },
      });

      return setAuthCookies(response, accessToken, refreshToken);
    }

    // --- Database not connected ---
    return NextResponse.json({
      success: false,
      error: 'Database not connected. Use dev test credentials on the login page.',
    }, { status: 503 });

  } catch (error) {
    console.error('[LOGIN] Error:', error.message, error.stack?.substring(0, 200));
    return NextResponse.json({ success: false, error: 'Internal server error', details: error.message }, { status: 500 });
  }
}
