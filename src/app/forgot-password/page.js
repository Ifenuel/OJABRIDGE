'use client';

import { useState } from 'react';
import Link from 'next/link';
import Logo from '@/components/Logo';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [step, setStep] = useState('email'); // email | code | reset | done
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);

  const handleSendCode = async (e) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), action: 'send' }),
      });
      const data = await res.json();
      if (data.success) {
        setStep('code');
        setSuccess('Verification code sent! Check your inbox.');
        setTimer(60);
        setCanResend(false);
        if (data.devOtp) setOtp(data.devOtp);
        // Start countdown
        const interval = setInterval(() => {
          setTimer(prev => {
            if (prev <= 1) { clearInterval(interval); setCanResend(true); return 0; }
            return prev - 1;
          });
        }, 1000);
      } else {
        setError(data.error || 'Failed to send code');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    }
    setLoading(false);
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) { setError('Please enter the 6-digit code'); return; }
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), otp, action: 'verify' }),
      });
      const data = await res.json();
      if (data.success) {
        setStep('reset');
        setSuccess('Email verified! Now set your new password.');
        setError('');
      } else {
        setError(data.error || 'Verification failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    }
    setLoading(false);
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 8) { setError('Password must be at least 8 characters'); return; }
    if (newPassword !== confirmPassword) { setError('Passwords do not match'); return; }
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), newPassword }),
      });
      const data = await res.json();
      if (data.success) {
        setStep('done');
        setSuccess('Password reset successful! You can now sign in with your new password.');
      } else {
        setError(data.error || 'Failed to reset password');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    }
    setLoading(false);
  };

  const handleResend = async () => {
    setCanResend(false);
    setTimer(60);
    setError('');
    try {
      const res = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), action: 'resend' }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess('New code sent! Check your inbox.');
        if (data.devOtp) setOtp(data.devOtp);
      } else {
        setError(data.error || 'Failed to resend');
        setCanResend(true);
      }
    } catch {
      setError('Network error');
      setCanResend(true);
    }
  };

  return (
    <section className="min-h-screen bg-ob-light flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/"><Logo size="large" /></Link>
          <h1 className="text-2xl font-bold text-ob-navy mt-6">
            {step === 'done' ? 'All Done!' : 'Reset Your Password'}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {step === 'email' && 'Enter your email and we\'ll send you a verification code.'}
            {step === 'code' && 'Enter the 6-digit code sent to your email.'}
            {step === 'reset' && 'Create a new secure password for your account.'}
            {step === 'done' && 'Your password has been updated successfully.'}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-8">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-red-700 text-sm">{error}</div>
          )}
          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4 text-green-700 text-sm">{success}</div>
          )}

          {/* Step 1: Enter email */}
          {step === 'email' && (
            <form onSubmit={handleSendCode} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:border-ob-purple focus:ring-2 focus:ring-ob-purple/20 outline-none transition-all" />
              </div>
              <button type="submit" disabled={loading}
                className="w-full bg-ob-purple hover:bg-ob-purple-dark text-white font-semibold py-3 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed">
                {loading ? 'Sending...' : 'Send Verification Code'}
              </button>
            </form>
          )}

          {/* Step 2: Enter code */}
          {step === 'code' && (
            <form onSubmit={handleVerifyCode} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Verification Code</label>
                <input type="text" value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000" maxLength={6}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-center text-2xl font-mono font-bold tracking-[0.5em] focus:border-ob-purple focus:ring-2 focus:ring-ob-purple/20 outline-none transition-all"
                  autoComplete="one-time-code" />
                <p className="text-xs text-gray-400 mt-2 text-center">
                  Code sent to <strong>{email}</strong>
                </p>
              </div>
              <button type="submit" disabled={loading || otp.length !== 6}
                className="w-full bg-ob-purple hover:bg-ob-purple-dark text-white font-semibold py-3 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed">
                {loading ? 'Verifying...' : 'Verify Code'}
              </button>
              <div className="text-center">
                <button type="button" onClick={handleResend} disabled={!canResend}
                  className="text-sm text-ob-purple hover:underline disabled:text-gray-400 disabled:cursor-not-allowed">
                  {canResend ? 'Resend Code' : `Resend in ${timer}s`}
                </button>
              </div>
            </form>
          )}

          {/* Step 3: New password */}
          {step === 'reset' && (
            <form onSubmit={handleResetPassword} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)}
                  placeholder="Min 8 characters, 1 uppercase, 1 number" required minLength={8}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:border-ob-purple focus:ring-2 focus:ring-ob-purple/20 outline-none transition-all" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password" required minLength={8}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:border-ob-purple focus:ring-2 focus:ring-ob-purple/20 outline-none transition-all" />
                {confirmPassword && newPassword !== confirmPassword && (
                  <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
                )}
              </div>
              <button type="submit" disabled={loading || !newPassword || !confirmPassword || newPassword !== confirmPassword}
                className="w-full bg-ob-purple hover:bg-ob-purple-dark text-white font-semibold py-3 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed">
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>
          )}

          {/* Step 4: Done */}
          {step === 'done' && (
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <Link href="/login" className="btn-primary inline-block px-8 py-3 text-sm">Sign In with New Password</Link>
            </div>
          )}

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              Remember your password?{' '}
              <Link href="/login" className="text-ob-purple font-semibold hover:underline">Sign In</Link>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
