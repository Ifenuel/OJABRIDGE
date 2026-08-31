import { NextResponse } from 'next/server';
import { clearAuthCookies } from '@/lib/auth';

/**
 * POST /api/auth/logout
 * Securely logout: clear cookies
 */
export async function POST() {
  try {
    const response = NextResponse.json({ success: true, message: 'Logged out successfully' });
    clearAuthCookies(response);
    return response;
  } catch (error) {
    console.error('Logout error:', error);
    const response = NextResponse.json({ success: true });
    clearAuthCookies(response);
    return response;
  }
}
