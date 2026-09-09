'use client';

import { useRef, useState } from 'react';

/**
 * AvatarUpload — Reusable profile picture upload component.
 * Uploads via /api/upload (base64) and saves via /api/users/profile PATCH.
 *
 * Props:
 *  - currentUrl: existing avatar_url (may be null)
 *  - name: user's name for the initial letter fallback
 *  - size: 'sm' | 'md' | 'lg'
 *  - onSaved: callback(updatedUser) after successful save
 */
export default function AvatarUpload({ currentUrl, name = 'U', size = 'lg', onSaved }) {
  const [preview, setPreview] = useState(currentUrl || null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef(null);

  const sizeClasses = {
    sm: 'w-14 h-14 text-lg',
    md: 'w-20 h-20 text-2xl',
    lg: 'w-28 h-28 text-4xl',
  };

  const handlePick = () => fileRef.current?.click();

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');

    // Client-side validation
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowed.includes(file.type)) {
      setError('Only JPG, PNG, WebP or GIF images are allowed');
      e.target.value = '';
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      setError('Image must be under 4MB');
      e.target.value = '';
      return;
    }

    // Instant local preview
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target.result);
    reader.readAsDataURL(file);

    setUploading(true);
    try {
      // Step 1: upload to /api/upload (stores the file, returns a short /api/files/... URL)
      const fd = new FormData();
      fd.append('file', file);
      fd.append('folder', 'avatars');
      fd.append('public', 'true');
      const upRes = await fetch('/api/upload', { method: 'POST', credentials: 'include', body: fd });
      const upData = await upRes.json();
      if (!upData.success) throw new Error(upData.error || 'Upload failed');

      // Step 2: save avatar_url to user profile
      const profRes = await fetch('/api/users/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ avatar_url: upData.url }),
      });
      const profData = await profRes.json();
      if (!profData.success) throw new Error(profData.error || 'Failed to save picture');

      // Step 3: keep session in sync
      try {
        const session = JSON.parse(localStorage.getItem('ojabridge_session') || '{}');
        const updated = { ...session, avatar_url: upData.url };
        localStorage.setItem('ojabridge_session', JSON.stringify(updated));
      } catch {}

      if (onSaved) onSaved(profData.user || { avatar_url: upData.url });
    } catch (err) {
      setError(err.message || 'Upload failed');
      setPreview(currentUrl || null);
    }
    setUploading(false);
  };

  const removeAvatar = async () => {
    setUploading(true);
    setError('');
    try {
      const res = await fetch('/api/users/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ avatar_url: null }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to remove picture');
      setPreview(null);
      try {
        const session = JSON.parse(localStorage.getItem('ojabridge_session') || '{}');
        const updated = { ...session, avatar_url: null };
        localStorage.setItem('ojabridge_session', JSON.stringify(updated));
      } catch {}
      if (onSaved) onSaved({ avatar_url: null });
    } catch (err) {
      setError(err.message || 'Failed to remove');
    }
    setUploading(false);
  };

  return (
    <div className="flex items-center gap-4">
      <div className="relative">
        <div className={`${sizeClasses[size]} rounded-full overflow-hidden bg-ob-purple/10 flex items-center justify-center border-2 border-gray-100`}>
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            <span className="text-ob-purple font-bold">{(name || 'U').charAt(0).toUpperCase()}</span>
          )}
        </div>
        {uploading && (
          <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        <button type="button" onClick={handlePick}
          className="absolute -bottom-1 -right-1 w-8 h-8 bg-ob-purple hover:bg-ob-purple-dark text-white rounded-full flex items-center justify-center shadow-md transition-colors"
          title="Change profile picture"
          disabled={uploading}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </div>

      <div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={handlePick} disabled={uploading}
            className="text-sm font-medium text-ob-purple hover:text-ob-purple-dark disabled:opacity-50">
            {uploading ? 'Uploading...' : preview ? 'Change picture' : 'Upload picture'}
          </button>
          {preview && (
            <span className="text-gray-300">|</span>
          )}
          {preview && (
            <button type="button" onClick={removeAvatar} disabled={uploading}
              className="text-sm text-red-500 hover:text-red-600 disabled:opacity-50">
              Remove
            </button>
          )}
        </div>
        <p className="text-xs text-gray-400 mt-0.5">JPG, PNG, WebP or GIF · max 4MB</p>
        {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      </div>

      <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleFile} className="hidden" />
    </div>
  );
}
