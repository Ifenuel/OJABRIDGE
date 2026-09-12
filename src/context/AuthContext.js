'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);

function getStoredSession() {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem('ojabridge_session');
    return stored ? JSON.parse(stored) : null;
  } catch (e) {
    localStorage.removeItem('ojabridge_session');
    return null;
  }
}

function saveSession(user) {
  try { localStorage.setItem('ojabridge_session', JSON.stringify(user)); } catch (e) {}
}

function clearSession() {
  try { localStorage.removeItem('ojabridge_session'); } catch (e) {}
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize — restore session from localStorage, then VALIDATE it server-side.
  // The HTTP-only auth cookie may have expired (24h) even though localStorage
  // still has the user — without this check, dashboards render but every API
  // call 401s, which looks like "dashboard shows nothing".
  useEffect(() => {
    let cancelled = false;
    const stored = getStoredSession();
    if (stored) {
      setUser(stored);
    }

    (async () => {
      try {
        // Timeout guard: if /api/auth/me hangs (e.g. transient DB timeout),
        // don't leave the dashboard spinning forever — fall back to the
        // stored session after 8s so the UI can render.
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);
        const res = await fetch('/api/auth/me', { credentials: 'include', signal: controller.signal });
        clearTimeout(timeoutId);
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.user && !cancelled) {
            const merged = { ...stored, ...data.user, source: 'database' };
            setUser(merged);
            saveSession(merged);
            // If server role differs from stored role, force update (e.g. sub_admin created from admin role)
            if (stored && stored.role !== data.user.role) {
              console.warn('[Auth] Role changed from', stored.role, 'to', data.user.role, '— updating session');
            }
          }
        } else if (res.status === 401 || res.status === 403) {
          // Cookie expired/invalid — clear stale session so the user re-authenticates
          // instead of seeing dashboards full of empty data.
          if (!cancelled) {
            setUser(null);
            clearSession();
          }
        }
        // On network error or timeout: keep the stored session (if any) and proceed.
        // The user can still browse; individual APIs will surface auth errors if
        // the cookie really is invalid.
      } catch {
        // Network error or abort (timeout): proceed with stored session
      }
      if (!cancelled) setLoading(false);
    })();

    return () => { cancelled = true; };
  }, []);

  // ============================================
  // LOGIN — calls real API
  // ============================================
  const login = useCallback(async (email, password) => {
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (data.success && data.user) {
        let safeUser = { ...data.user, source: 'database' };

        // Note: sub-admin permissions are now returned directly from login API and /api/auth/me

        setUser(safeUser);
        saveSession(safeUser);
        setLoading(false);
        return { success: true, user: safeUser };
      }

      setLoading(false);
      return { success: false, error: data.error || 'Login failed', requiresVerification: data.requiresVerification, email: data.email, emailNotFound: data.emailNotFound };
    } catch (err) {
      setLoading(false);
      return { success: false, error: 'Network error. Please try again.' };
    }
  }, []);

  // ============================================
  // REGISTER — calls real API
  // ============================================
  const register = useCallback(async (userData) => {
    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });
      const data = await res.json();

      if (data.success && data.user) {
        const safeUser = { ...data.user, source: 'database' };
        setUser(safeUser);
        saveSession(safeUser);
        setLoading(false);
        return { success: true, user: safeUser };
      }

      setLoading(false);
      return { success: false, error: data.error || data.errors?.[0] || 'Registration failed' };
    } catch (err) {
      setLoading(false);
      return { success: false, error: 'Network error. Please try again.' };
    }
  }, []);

  // ============================================
  // LOGOUT
  // ============================================
  const logout = useCallback(() => {
    setUser(null);
    clearSession();
    // Call logout API to clear server-side session
    fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }).catch(() => {});
  }, []);

  // ============================================
  // UPDATE PROFILE
  // ============================================
  const updateProfile = useCallback((updates) => {
    setUser(prev => {
      if (!prev) return null;
      const updated = { ...prev, ...updates };
      saveSession(updated);
      return updated;
    });
  }, []);

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    isVendor: user?.role === 'vendor',
    isCustomer: user?.role === 'customer',
    isRetailer: user?.role === 'retailer',
    isDevMode: false,
    login,
    register,
    logout,
    updateProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
