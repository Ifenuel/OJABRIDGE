'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

/**
 * SubAdminGuard — Enforces permission-based access for sub-admins on admin pages.
 * 
 * For admin (super admin) users: always allowed.
 * For sub_admin users: checks if they have the required permission.
 * If not authorized, redirects to admin dashboard with an error.
 * 
 * Usage:
 * <SubAdminGuard permission="live-chats">
 *   <LiveChatsPage />
 * </SubAdminGuard>
 */
export default function SubAdminGuard({ children, permission }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace('/login');
      return;
    }

    // Super admins always have access
    if (user.role === 'admin') {
      setAllowed(true);
      setChecking(false);
      return;
    }

    // Sub admins need the specific permission
    if (user.role === 'sub_admin') {
      const perms = user.permissions || [];
      if (perms.includes(permission)) {
        setAllowed(true);
      } else {
        setAllowed(false);
        router.replace('/admin-dashboard?error=permission_denied');
      }
      setChecking(false);
      return;
    }

    // Other roles: deny
    setAllowed(false);
    router.replace('/');
    setChecking(false);
  }, [user, loading, permission, router]);

  if (loading || checking) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-3 border-ob-purple border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Verifying permissions...</p>
        </div>
      </div>
    );
  }

  if (!allowed) return null;

  return <>{children}</>;
}
