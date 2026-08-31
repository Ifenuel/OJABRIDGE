'use client';

import { useAuth } from '@/context/AuthContext';
import { useFavorites } from '@/context/FavoritesContext';

/**
 * HeartButton — Toggle favorite/wishlist state for a product.
 * Requires authentication — prompts login if not authenticated.
 * Uses FavoritesContext for state management.
 */
export default function HeartButton({ productId, className = '', size = 'default', onToggle }) {
  const { isAuthenticated } = useAuth();
  const { isFavorited, toggleFavorite } = useFavorites();
  const favorited = isFavorited(productId);

  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      // Redirect to login
      if (typeof window !== 'undefined') {
        window.location.href = `/login?returnTo=${encodeURIComponent(window.location.pathname)}`;
      }
      return;
    }

    toggleFavorite(productId);
    if (onToggle) onToggle(!favorited);
  };

  const sizes = {
    small: 'w-7 h-7',
    default: 'w-9 h-9',
    large: 'w-11 h-11',
  };

  return (
    <button
      onClick={handleClick}
      className={`${sizes[size]} rounded-full flex items-center justify-center transition-all duration-300 ${
        favorited
          ? 'bg-red-50 text-red-500 scale-110'
          : 'bg-white/80 text-gray-400 hover:text-red-400 hover:bg-red-50'
      } shadow-sm ${className}`}
      aria-label={favorited ? 'Remove from favorites' : 'Add to favorites'}
    >
      <svg
        className={`${size === 'small' ? 'w-4 h-4' : size === 'large' ? 'w-6 h-6' : 'w-5 h-5'} transition-transform duration-300 ${favorited ? 'scale-110' : ''}`}
        fill={favorited ? 'currentColor' : 'none'}
        stroke="currentColor"
        viewBox="0 0 24 24"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
        />
      </svg>
    </button>
  );
}
