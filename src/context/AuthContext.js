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

  // Initialize — restore session from localStorage
  useEffect(() => {
    const stored = getStoredSession();
    if (stored) {
      setUser(stored);
    }
    setLoading(false);
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
        const safeUser = { ...data.user, source: 'database' };
        setUser(safeUser);
        saveSession(safeUser);
        setLoading(false);
        return { success: true, user: safeUser };
      }

      setLoading(false);
      return { success: false, error: data.error || 'Login failed', requiresVerification: data.requiresVerification, email: data.email };
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
