'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import Logo from '@/components/Logo';
import { useAuth } from '@/context/AuthContext';
import { Suspense } from 'react';

function VerifyEmailForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, isAuthenticated, updateProfile } = useAuth();

  const emailParam = searchParams.get('email') || user?.email || '';
  const [email, setEmail] = useState(emailParam);
  const fromRegister = searchParams.get('from') === 'register';
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [verified, setVerified] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const inputRef = useRef(null);

  // Focus OTP input on mount
  useEffect(() => {
    if (inputRef.current) inputRef.current.focus();
  }, []);

  // Countdown timer
  useEffect(() => {
    if (timer > 0) {
      const t = setTimeout(() => setTimer(timer - 1), 1000);
      return () => clearTimeout(t);
    } else {
      setCanResend(true);
    }
  }, [timer]);

  // Auto-send on first load
  useEffect(() => {
    if (email && !verified && !otpSent) {
      handleSendCode();
    }
  }, []);

  const handleSendCode = async () => {
    if (!email) return;
    setResending(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, action: 'send' }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess('Verification code sent! Check your inbox.');
        setOtpSent(true);
        setTimer(60);
        setCanResend(false);
        // In dev mode, auto-fill OTP
        if (data.devOtp) setOtp(data.devOtp);
      } else {
        setError(data.error || 'Failed to send code');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    }
    setResending(false);
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) {
      setError('Please enter the 6-digit code');
      return;
    }
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, action: 'verify' }),
      });
      const data = await res.json();
      if (data.success) {
        setVerified(true);
        setSuccess('Email verified successfully!');
        // Update local auth state if logged in
        if (updateProfile) updateProfile({ email_verified: true });
        // Redirect after 2 seconds
        setTimeout(() => {
          if (user?.role === 'vendor') router.push('/vendor-dashboard');
          else if (user?.role === 'retailer') router.push('/retailer-dashboard');
          else if (user?.role === 'admin') router.push('/admin-dashboard');
          else if (user) router.push('/account');
          else router.push('/login'); // No session (just registered) → go to login
        }, 2000);
      } else {
        setError(data.error || 'Verification failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    }
    setLoading(false);
  };

  if (verified) {
    return (
      <div className="text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-ob-navy mb-2">Email Verified!</h2>
        <p className="text-gray-500 text-sm mb-6">Your account is now active. Redirecting you to your dashboard...</p>
        <div className="w-12 h-12 border-4 border-ob-purple border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  return (
    <div>
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-ob-purple/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-ob-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-ob-navy mb-1">Verify Your Email</h2>
        <p className="text-gray-500 text-sm">
          {fromRegister ? 'Your account is ready — ' : ''}We&apos;ve sent a 6-digit code to<br />
          <strong className="text-ob-navy">{email || 'your email'}</strong>
        </p>
        {fromRegister && <p className="text-xs text-ob-purple mt-2">Enter the code below to activate your account and start using OjaBridge.</p>}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-lg mb-4 flex items-start gap-2">
          <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {success && !verified && (
        <div className="bg-green-50 border border-green-200 text-green-700 text-sm p-3 rounded-lg mb-4">
          {success}
        </div>
      )}

      <form onSubmit={handleVerify} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Verification Code</label>
          <input
            ref={inputRef}
            type="text"
            value={otp}
            onChange={e => { setOtp(e.target.value.replace(/\D/g, '').slice(0, 6)); setError(''); }}
            placeholder="000000"
            maxLength={6}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-center text-2xl font-mono font-bold tracking-[0.5em] focus:border-ob-purple focus:ring-2 focus:ring-ob-purple/20 outline-none transition-all"
            autoComplete="one-time-code"
          />
          <p className="text-xs text-gray-400 mt-2 text-center">Enter the 6-digit code sent to your email</p>
        </div>

        <button
          type="submit"
          disabled={loading || otp.length !== 6}
          className="w-full bg-ob-purple hover:bg-ob-purple-dark text-white font-semibold py-3 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Verifying...
            </span>
          ) : 'Verify Email'}
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-500">
          Didn&apos;t receive the code?{' '}
          {canResend ? (
            <button onClick={handleSendCode} disabled={resending} className="text-ob-purple font-semibold hover:underline">
              {resending ? 'Sending...' : 'Resend Code'}
            </button>
          ) : (
            <span className="text-gray-400">Resend in {timer}s</span>
          )}
        </p>
      </div>

      <div className="mt-4 text-center">
        <Link href="/login" className="text-sm text-gray-400 hover:text-ob-purple transition-colors">
          ← Back to Sign In
        </Link>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <section className="min-h-screen bg-ob-light flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/"><Logo size="large" /></Link>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-8">
          <Suspense fallback={
            <div className="text-center py-8">
              <div className="w-12 h-12 border-4 border-ob-purple border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          }>
            <VerifyEmailForm />
          </Suspense>
        </div>
      </div>
    </section>
  );
}
