'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Logo from '@/components/Logo';
import { useAuth } from '@/context/AuthContext';

const COUNTRIES = [
  { code: 'NG', name: 'Nigeria', currencies: [{ code: 'NGN', active: true }] },
  { code: 'GH', name: 'Ghana', currencies: [{ code: 'GHS', comingSoon: true }] },
  { code: 'KE', name: 'Kenya', currencies: [{ code: 'KES', comingSoon: true }] },
  { code: 'ZA', name: 'South Africa', currencies: [{ code: 'ZAR', comingSoon: true }] },
  { code: 'US', name: 'United States', currencies: [{ code: 'USD', comingSoon: true }] },
  { code: 'GB', name: 'United Kingdom', currencies: [{ code: 'GBP', comingSoon: true }] },
  { code: 'OTHER', name: 'Other', currencies: [{ code: 'USD', comingSoon: true }] },
];

const CURRENCY_SYMBOLS = { NGN: '₦', USD: '$', GBP: '£', EUR: '€', GHS: 'GH₵', KES: 'KSh', ZAR: 'R' };

const BUSINESS_TYPES = [
  'Sole Proprietorship', 'Private Limited Company', 'Public Limited Company',
  'Partnership', 'Limited Liability Partnership', 'Other',
];

export default function RegisterPage() {
  const router = useRouter();
  const { register, isAuthenticated, user } = useAuth();

  // Multi-step state
  const [step, setStep] = useState(1);
  const [role, setRole] = useState('');
  const [country, setCountry] = useState('');
  const [currency, setCurrency] = useState('NGN');
  const [emailOtp, setEmailOtp] = useState('');
  const [phoneOtp, setPhoneOtp] = useState('');
  const [emailVerified, setEmailVerified] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);

  // Account fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreed, setAgreed] = useState(false);

  // Vendor business fields
  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [rcNumber, setRcNumber] = useState('');
  const [businessAddress, setBusinessAddress] = useState('');
  const [businessCity, setBusinessCity] = useState('');
  const [businessPhone, setBusinessPhone] = useState('');
  const [businessEmail, setBusinessEmail] = useState('');
  const [productCategories, setProductCategories] = useState([]);

  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === 'admin') router.replace('/admin-dashboard');
      else if (user.role === 'vendor') router.replace('/vendor-dashboard');
      else if (user.role === 'retailer') router.replace('/retailer-dashboard');
      else router.replace('/account'); // Customer → Customer Dashboard
    }
  }, [isAuthenticated, user, router]);

  // OTP timer
  useEffect(() => {
    if (otpTimer > 0) {
      const t = setTimeout(() => setOtpTimer(otpTimer - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [otpTimer]);

  const selectedCountry = COUNTRIES.find(c => c.code === country);

  const handleSendOtp = (type) => {
    setOtpSent(true);
    setOtpTimer(60);
  };

  const handleVerifyOtp = (type, code) => {
    // Auto-verify for now — will use real OTP provider in production
    if (type === 'email') setEmailVerified(true);
    if (type === 'phone') setPhoneVerified(true);
    return true;
  };

  const handleCategoryToggle = (cat) => {
    setProductCategories(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const totalSteps = role === 'vendor' ? 6 : 4;

  const canProceed = () => {
    switch (step) {
      case 1: return role === 'customer' || role === 'vendor' || role === 'retailer';
      case 2: return country !== '' && currency !== '';
      case 3: return emailVerified || email.length > 0;
      case 4: return firstName && lastName && email && password.length >= 8 && password === confirmPassword && agreed;
      case 5: return role === 'vendor' ? businessName && businessType && rcNumber && businessAddress : true;
      case 6: return true;
      default: return false;
    }
  };

  const handleSubmit = async () => {
    setError('');
    setIsSubmitting(true);

    try {
      const result = await register({
        name: `${firstName.trim()} ${lastName.trim()}`,
        email: email.trim(),
        password,
        phone: phone.trim() || null,
        role,
        country,
        currency,
        storeName: businessName || undefined,
        businessType: businessType || undefined,
        rcNumber: rcNumber || undefined,
        businessAddress: businessAddress || undefined,
        businessCity: businessCity || undefined,
        businessPhone: businessPhone || undefined,
        businessEmail: businessEmail || undefined,
        productCategories: productCategories.length > 0 ? productCategories : undefined,
      });

      if (result.success) {
        if (result.user.role === 'vendor') router.push('/vendor-dashboard');
        else if (result.user.role === 'retailer') router.push('/retailer-dashboard');
        else router.push('/account'); // Customer → Customer Dashboard
      } else {
        setError(result.error || 'Registration failed');
        setStep(4);
      }
    } catch (err) {
      setError('Network error. Please try again.');
    }
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-ob-light py-8 px-4">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <Link href="/" className="inline-block"><Logo size="large" /></Link>
          <h1 className="text-2xl font-bold text-ob-navy mt-4">Create Your Account</h1>
          <p className="text-gray-500 text-sm mt-1">Join the OjaBridge marketplace</p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {Array.from({ length: totalSteps }, (_, i) => (
            <div key={i} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                i + 1 < step ? 'bg-ob-lime text-ob-navy' :
                i + 1 === step ? 'bg-ob-purple text-white ring-4 ring-ob-purple/20' :
                'bg-gray-200 text-gray-400'
              }`}>
                {i + 1 < step ? '✓' : i + 1}
              </div>
              {i < totalSteps - 1 && (
                <div className={`w-6 h-0.5 mx-1 ${i + 1 < step ? 'bg-ob-lime' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-lg mb-6 flex items-start gap-2">
            <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <span>{error}</span>
          </div>
        )}

        <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-100">

          {/* STEP 1: Choose Role */}
          {step === 1 && (
            <div>
              <h2 className="text-lg font-bold text-ob-navy mb-1">How do you want to use OjaBridge?</h2>
              <p className="text-gray-500 text-sm mb-6">Select your role to get started.</p>
              <div className="space-y-3">
                {[
                  { value: 'customer', label: 'Customer', desc: 'Shop and buy products', icon: '🛒' },
                  { value: 'vendor', label: 'Vendor', desc: 'Sell your products on the marketplace', icon: '🏪' },
                  { value: 'retailer', label: 'Retailer', desc: 'Source products for your business', icon: '📦' },
                ].map(r => (
                  <button key={r.value} type="button" onClick={() => setRole(r.value)}
                    className={`w-full p-4 rounded-xl border-2 text-left transition-all flex items-center gap-4 ${
                      role === r.value ? 'border-ob-purple bg-ob-purple/5' : 'border-gray-200 hover:border-ob-purple/40'
                    }`}>
                    <span className="text-2xl">{r.icon}</span>
                    <div>
                      <p className="font-semibold text-ob-navy">{r.label}</p>
                      <p className="text-sm text-gray-500">{r.desc}</p>
                    </div>
                    {role === r.value && <span className="ml-auto text-ob-purple">✓</span>}
                  </button>
                ))}
              </div>
              {role === 'vendor' && (
                <div className="bg-ob-purple/5 border border-ob-purple/20 rounded-lg p-3 mt-4 text-xs text-ob-purple">
                  Vendor accounts require KYC/KYB verification including a mandatory RC Number before you can start selling.
                </div>
              )}
            </div>
          )}

          {/* STEP 2: Country & Currency */}
          {step === 2 && (
            <div>
              <h2 className="text-lg font-bold text-ob-navy mb-1">Choose your location & currency</h2>
              <p className="text-gray-500 text-sm mb-6">Select your country and preferred display currency.</p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Country / Region *</label>                    <select value={country} onChange={e => { setCountry(e.target.value); const active = COUNTRIES.find(c => c.code === e.target.value)?.currencies?.find(cu => cu.active); setCurrency(active ? active.code : 'NGN'); }}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-ob-purple focus:ring-2 focus:ring-ob-purple/20 outline-none">
                    <option value="">Select your country</option>
                    {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
                  </select>
                </div>
                {selectedCountry && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Display Currency *</label>
                    <div className="grid grid-cols-2 gap-2">
                      {selectedCountry.currencies.map(cur => (
                        <button key={cur.code} type="button" disabled={!!cur.comingSoon}
                          onClick={() => !cur.comingSoon && setCurrency(cur.code)}
                          className={`p-3 rounded-xl border-2 text-left transition-all ${
                            cur.comingSoon
                              ? 'border-gray-100 bg-gray-50 cursor-not-allowed opacity-60'
                              : currency === cur.code
                                ? 'border-ob-purple bg-ob-purple/5'
                                : 'border-gray-200 hover:border-ob-purple/40'
                          }`}>
                          <span className="text-lg font-bold text-ob-navy">{CURRENCY_SYMBOLS[cur.code] || cur.code}</span>
                          <span className="text-sm text-gray-600 ml-2">{cur.code}</span>
                          {cur.comingSoon && (
                            <span className="ml-2 text-[10px] bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full font-medium">Coming Soon</span>
                          )}
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-gray-400 mt-2">
                      Display currency can be changed later. Settlement currency is handled by the payment provider.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 3: Verify Identity */}
          {step === 3 && (
            <div>
              <h2 className="text-lg font-bold text-ob-navy mb-1">Verify your identity</h2>
              <p className="text-gray-500 text-sm mb-6">We&apos;ll send a verification code to confirm your contact details.</p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
                  <div className="flex gap-2">
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com"
                      className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-ob-purple outline-none" disabled={emailVerified} />
                    {emailVerified ? (
                      <span className="px-4 py-2.5 bg-green-100 text-green-700 rounded-lg text-sm font-medium">✓ Verified</span>
                    ) : (
                      <button type="button" onClick={() => handleSendOtp('email')} disabled={!email || otpTimer > 0}
                        className="px-4 py-2.5 bg-ob-purple text-white rounded-lg text-sm font-medium disabled:opacity-50 whitespace-nowrap">
                        {otpTimer > 0 ? `Resend (${otpTimer}s)` : 'Send Code'}
                      </button>
                    )}
                  </div>
                  {otpSent && !emailVerified && (
                    <div className="mt-2 flex gap-2">
                      <input type="text" value={emailOtp} onChange={e => setEmailOtp(e.target.value)} placeholder="Enter 6-digit code"
                        className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm" maxLength={6} />
                      <button type="button" onClick={() => handleVerifyOtp('email', emailOtp)} className="px-4 py-2.5 bg-ob-lime text-ob-navy rounded-lg text-sm font-medium">
                        Verify
                      </button>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number (optional)</label>
                  <div className="flex gap-2">
                    <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+234..."
                      className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-ob-purple outline-none" disabled={phoneVerified} />
                    {phoneVerified ? (
                      <span className="px-4 py-2.5 bg-green-100 text-green-700 rounded-lg text-sm font-medium">✓ Verified</span>
                    ) : (
                      <button type="button" onClick={() => handleSendOtp('phone')} disabled={!phone}
                        className="px-4 py-2.5 bg-ob-purple text-white rounded-lg text-sm font-medium disabled:opacity-50 whitespace-nowrap">
                        Send Code
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Account Setup */}
          {step === 4 && (
            <div>
              <h2 className="text-lg font-bold text-ob-navy mb-1">Set up your account</h2>
              <p className="text-gray-500 text-sm mb-6">Create your secure account credentials.</p>
              <div className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                    <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-ob-purple outline-none" placeholder="First name" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                    <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-ob-purple outline-none" placeholder="Last name" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email (confirmed)</label>
                  <input type="email" value={email} readOnly className="w-full px-4 py-2.5 border border-gray-100 bg-gray-50 rounded-lg text-sm text-gray-600" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                  <div className="relative">
                    <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-ob-purple outline-none pr-12" placeholder="Min 8 characters, 1 uppercase, 1 number" minLength={8} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showPassword ? (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>) : (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>)}
                    </button>
                  </div>
                  {password.length > 0 && (
                    <div className="mt-1 flex gap-1">
                      {[8, 12, 16].map(len => (
                        <div key={len} className={`h-1 flex-1 rounded ${password.length >= len ? (password.length >= 12 ? 'bg-green-500' : 'bg-amber-500') : 'bg-gray-200'}`} />
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password *</label>
                  <div className="relative">
                    <input type={showConfirm ? 'text' : 'password'} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-ob-purple outline-none pr-12" placeholder="Re-enter password" minLength={8} />
                    <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showConfirm ? (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>) : (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>)}
                    </button>
                  </div>
                  {confirmPassword && password !== confirmPassword && <p className="text-xs text-red-500 mt-1">Passwords do not match</p>}
                </div>
                <div className="flex items-start space-x-2">
                  <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} className="mt-1 rounded border-gray-300 text-ob-purple focus:ring-ob-purple" />
                  <span className="text-xs text-gray-500">I agree to the{' '}<Link href="/terms" className="text-ob-purple hover:underline">Terms of Service</Link>{' '}and{' '}<Link href="/privacy" className="text-ob-purple hover:underline">Privacy Policy</Link></span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: Business Information (Vendor only) */}
          {step === 5 && role === 'vendor' && (
            <div>
              <h2 className="text-lg font-bold text-ob-navy mb-1">Business Information</h2>
              <p className="text-gray-500 text-sm mb-6">Tell us about your business. Fields marked with * are required.</p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Registered Business Name *</label>
                  <input type="text" value={businessName} onChange={e => setBusinessName(e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-ob-purple outline-none" placeholder="As registered with CAC" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Business Type *</label>
                  <select value={businessType} onChange={e => setBusinessType(e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-ob-purple outline-none">
                    <option value="">Select business type</option>
                    {BUSINESS_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">RC Number *</label>
                  <input type="text" value={rcNumber} onChange={e => setRcNumber(e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-ob-purple outline-none" placeholder="RC1234567" />
                  <p className="text-xs text-gray-400 mt-1">Your Corporate Affairs Commission registration number. This is mandatory for vendor verification.</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Business Address *</label>
                  <input type="text" value={businessAddress} onChange={e => setBusinessAddress(e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-ob-purple outline-none" placeholder="Street address, city" />
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Business Phone</label>
                    <input type="tel" value={businessPhone} onChange={e => setBusinessPhone(e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-ob-purple outline-none" placeholder="+234..." />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Business Email</label>
                    <input type="email" value={businessEmail} onChange={e => setBusinessEmail(e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-ob-purple outline-none" placeholder="business@example.com" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Product Categories (optional)</label>
                  <div className="flex flex-wrap gap-2">
                    {['Electronics', 'Fashion', 'Home & Garden', 'Health & Beauty', 'Food & Groceries', 'Automotive', 'Sports', 'Books', 'Others'].map(cat => (
                      <button key={cat} type="button" onClick={() => handleCategoryToggle(cat)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                          productCategories.includes(cat) ? 'bg-ob-purple text-white border-ob-purple' : 'bg-white text-gray-600 border-gray-200 hover:border-ob-purple'
                        }`}>{cat}</button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 6: Review & Submit */}
          {step === totalSteps && (
            <div>
              <h2 className="text-lg font-bold text-ob-navy mb-1">Review & Create Account</h2>
              <p className="text-gray-500 text-sm mb-6">Verify your information before creating your account.</p>
              <div className="space-y-3 bg-gray-50 p-4 rounded-xl">
                <div className="flex justify-between text-sm"><span className="text-gray-500">Role</span><span className="font-medium text-ob-navy capitalize">{role}</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-500">Name</span><span className="font-medium text-ob-navy">{firstName} {lastName}</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-500">Email</span><span className="font-medium text-ob-navy">{email}</span></div>
                {phone && <div className="flex justify-between text-sm"><span className="text-gray-500">Phone</span><span className="font-medium text-ob-navy">{phone}</span></div>}
                <div className="flex justify-between text-sm"><span className="text-gray-500">Country</span><span className="font-medium text-ob-navy">{selectedCountry?.name || country}</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-500">Currency</span><span className="font-medium text-ob-navy">{CURRENCY_SYMBOLS[currency]} {currency}</span></div>
                {role === 'vendor' && (
                  <>
                    <div className="border-t border-gray-200 my-2 pt-2"><p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Business Details</p></div>
                    <div className="flex justify-between text-sm"><span className="text-gray-500">Business Name</span><span className="font-medium text-ob-navy">{businessName}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-gray-500">Business Type</span><span className="font-medium text-ob-navy">{businessType}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-gray-500">RC Number</span><span className="font-medium text-ob-navy">{rcNumber}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-gray-500">Address</span><span className="font-medium text-ob-navy">{businessAddress}</span></div>
                  </>
                )}
              </div>
              {role === 'vendor' && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mt-4 text-xs text-amber-700">
                  After registration, you&apos;ll need to complete KYC/KYB verification (government ID, bank account, and identity verification) before you can publish products.
                </div>
              )}
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex gap-3 mt-6 pt-4 border-t border-gray-100">
            {step > 1 && (
              <button type="button" onClick={() => setStep(step - 1)}
                className="flex-1 py-3 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-all">
                Back
              </button>
            )}
            <button type="button" onClick={() => {
                if (step === totalSteps) handleSubmit();
                else setStep(step + 1);
              }}
              disabled={!canProceed() || isSubmitting}
              className="flex-1 py-3 btn-primary disabled:opacity-50 disabled:cursor-not-allowed">
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
                  Creating Account...
                </span>
              ) : step === totalSteps ? 'Create Account' : 'Continue'}
            </button>
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            Already have an account?{' '}
            <Link href="/login" className="text-ob-purple font-semibold hover:underline">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
