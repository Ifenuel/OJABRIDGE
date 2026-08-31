'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';

const FavoritesContext = createContext(null);

export function FavoritesProvider({ children }) {
  const { user, isAuthenticated } = useAuth();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch favorites from API when user is authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchFavorites();
    } else {
      setFavorites([]);
    }
  }, [isAuthenticated, user]);

  const fetchFavorites = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/favorites', { credentials: 'include' });
      const data = await res.json();
      if (data.success) {
        setFavorites(data.favorites || []);
      }
    } catch (err) {
      console.error('Failed to fetch favorites:', err);
    }
    setLoading(false);
  };

  // Accepts either a product object or a product ID string
  const toggleFavorite = useCallback(async (productOrId) => {
    if (!isAuthenticated || !user) {
      return { success: false, error: 'Please sign in to save favorites' };
    }

    const pid = typeof productOrId === 'object' ? productOrId.id : productOrId;

    const isFav = favorites.some(f => f.product_id === pid || f.product_id === String(pid));

    try {
      if (isFav) {
        const res = await fetch(`/api/favorites?productId=${pid}`, {
          method: 'DELETE',
          credentials: 'include',
        });
        const data = await res.json();
        if (data.success) {
          setFavorites(prev => prev.filter(f => f.product_id !== pid && f.product_id !== String(pid)));
          return { success: true, isFavorite: false };
        }
        return { success: false, error: data.error };
      } else {
        const res = await fetch('/api/favorites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ productId: pid }),
        });
        const data = await res.json();
        if (data.success) {
          // Refetch to get full product data
          await fetchFavorites();
          return { success: true, isFavorite: true };
        }
        return { success: false, error: data.error };
      }
    } catch (err) {
      return { success: false, error: 'Network error' };
    }
  }, [isAuthenticated, user, favorites]);

  const isFavorite = useCallback((productId) => {
    return favorites.some(f => f.product_id === productId || f.product_id === String(productId));
  }, [favorites]);

  const favoriteCount = favorites.length;

  return (
    <FavoritesContext.Provider value={{ favorites, loading, toggleFavorite, isFavorite, favoriteCount, refetch: fetchFavorites }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (!context) throw new Error('useFavorites must be used within a FavoritesProvider');
  return context;
}
