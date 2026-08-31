'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

function PasswordField({ label, value, onChange, required = true, minLength }) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-ob-purple outline-none pr-12"
          required={required}
          minLength={minLength}
        />
        <button type="button" onClick={() => setShow(!show)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
          {show ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
          )}
        </button>
      </div>
    </div>
  );
}

export default function AccountSecurityPage() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const [message, setMessage] = useState({ type: '', text: '' });
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNew, setConfirmNew] = useState('');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.replace('/login');
  }, [isAuthenticated, authLoading, router]);

  if (authLoading || !isAuthenticated) return <div className="min-h-screen bg-ob-light flex items-center justify-center"><div className="w-12 h-12 border-4 border-ob-purple border-t-transparent rounded-full animate-spin" /></div>;

  const handlePasswordChange = (e) => {
    e.preventDefault();
    if (newPassword !== confirmNew) {
      setMessage({ type: 'error', text: 'New passwords do not match.' });
      return;
    }
    if (newPassword.length < 8) {
      setMessage({ type: 'error', text: 'New password must be at least 8 characters.' });
      return;
    }
    setMessage({ type: 'success', text: 'Password updated successfully.' });
    setCurrentPassword('');
    setNewPassword('');
    setConfirmNew('');
  };

  return (
    <>
      <section className="bg-ob-navy text-white py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold">Security Settings</h1>
          <p className="text-gray-300 text-sm mt-1">Manage your password, multi-factor authentication and active sessions.</p>
        </div>
      </section>
      <section className="section-padding bg-ob-light">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="bg-white p-6 rounded-xl border border-gray-100">
            <h3 className="font-bold text-ob-navy mb-4">Change Password</h3>
            <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
              <PasswordField label="Current Password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} />
              <PasswordField label="New Password" value={newPassword} onChange={e => setNewPassword(e.target.value)} minLength={8} />
              <PasswordField label="Confirm New Password" value={confirmNew} onChange={e => setConfirmNew(e.target.value)} minLength={8} />
              {confirmNew && newPassword !== confirmNew && <p className="text-xs text-red-500">Passwords do not match</p>}
              <button type="submit" className="btn-primary px-6 py-2.5">Update Password</button>
            </form>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-ob-navy">Multi-Factor Authentication (MFA)</h3>
                <p className="text-gray-500 text-sm mt-1">Add an extra layer of security to your account.</p>
              </div>
              <span className="bg-gray-100 text-gray-500 text-xs px-3 py-1 rounded-full">Not Enabled</span>
            </div>
            <p className="text-gray-600 text-sm mb-4">When MFA is enabled, you will need to enter a verification code from your authenticator app in addition to your password when signing in.</p>
            <button className="border border-ob-purple text-ob-purple text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-ob-purple hover:text-white transition-colors">
              Enable MFA
            </button>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-100">
            <h3 className="font-bold text-ob-navy mb-4">Active Sessions</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-3 border-b border-gray-50">
                <div>
                  <p className="text-sm font-medium text-ob-navy">Current Session</p>
                  <p className="text-xs text-gray-400">This device</p>
                </div>
                <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">Active</span>
              </div>
            </div>
            <button className="text-red-500 text-sm font-medium mt-4 hover:underline">Sign out of all other sessions</button>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-100">
            <h3 className="font-bold text-ob-navy mb-4">Account Status</h3>
            <div className="flex items-center gap-3 p-4 bg-green-50 rounded-xl">
              <span className="text-xl">✅</span>
              <div>
                <p className="text-sm font-medium text-green-700">Account Active</p>
                <p className="text-xs text-green-600">Your account is in good standing.</p>
              </div>
            </div>
          </div>

          {message.text && <div className={`p-4 rounded-xl text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>{message.text}</div>}
        </div>
      </section>
    </>
  );
}
