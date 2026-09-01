'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

/**
 * ============================================
 * SECURE ROUTE GUARD
 * ============================================
 * 
 * Wraps dashboard pages with client-side role verification.
 * Even if someone bypasses middleware, this catches them.
 * 
 * Usage:
 * <SecureRouteGuard allowedRoles={['admin']}>
 *   <AdminDashboard />
 * </SecureRouteGuard>
 */
export default function SecureRouteGuard({ children, allowedRoles = [], redirectPath = '/' }) {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [showBlocked, setShowBlocked] = useState(false);

  useEffect(() => {
    // Wait for auth to finish loading
    if (loading) return;

    // Not logged in at all
    if (!isAuthenticated || !user) {
      router.push(`/login?returnTo=${window.location.pathname}&reason=auth_required`);
      return;
    }

    // Logged in but wrong role — BLOCK
    if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
      console.warn(`[SECURITY] Client-side block: User role "${user.role}" not in allowed roles:`, allowedRoles);
      setShowBlocked(true);
      setAuthorized(false);

      // Log the attempt
      fetch('/api/security', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'unauthorized_dashboard_access',
          attemptedRole: user.role,
          requiredRoles: allowedRoles,
          path: window.location.pathname,
        }),
      }).catch(() => {});

      return;
    }

    // Authorized
    setAuthorized(true);
  }, [user, isAuthenticated, loading, allowedRoles, router]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-ob-light flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-ob-purple border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 text-sm">Verifying access...</p>
        </div>
      </div>
    );
  }

  // Blocked state — shows a generic 403 page
  if (showBlocked) {
    return (
      <div className="min-h-screen bg-ob-light flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-ob-navy mb-3">Access Denied</h1>
          <p className="text-gray-500 mb-6">You don&apos;t have permission to access this area. This incident has been logged.</p>
          <button
            onClick={() => router.push('/')}
            className="btn-primary"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  // Authorized — render the children
  if (!authorized) return null;

  return <>{children}</>;
}
