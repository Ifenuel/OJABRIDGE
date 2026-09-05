'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';

/**
 * InteractiveOnboardingDemo — Premium iPhone mockup showing real OjaBridge registration flow.
 * Features: iPhone 16 Pro Max frame, animated typing, step progression, hand cursor gesture.
 */

const ROLES = {
  customer: {
    label: 'Customer',
    icon: '🛒',
    desc: 'Shop & buy verified products',
    color: 'from-blue-500 to-blue-600',
    steps: [
      { title: 'Select Role', subtitle: 'Choose how you want to use OjaBridge', screen: 'role', field: 'Customer' },
      { title: 'Your Location', subtitle: 'Select your country and currency', screen: 'country', field: 'Nigeria' },
      { title: 'Email Verification', subtitle: 'Enter the 6-digit code sent to your email', screen: 'otp', field: '482916' },
      { title: 'Create Account', subtitle: 'Set up your secure credentials', screen: 'account', fields: ['Adaeze', 'Okonkwo', 'adaeze@example.com'] },
      { title: 'Welcome!', subtitle: 'Your account is ready', screen: 'success' },
    ],
  },
  retailer: {
    label: 'Retailer',
    icon: '📦',
    desc: 'Source products for your business',
    color: 'from-green-500 to-green-600',
    steps: [
      { title: 'Select Role', subtitle: 'Retailers need KYC/KYB verification', screen: 'role', field: 'Retailer' },
      { title: 'Your Location', subtitle: 'Select your country and currency', screen: 'country', field: 'Nigeria' },
      { title: 'Email Verification', subtitle: 'Enter the 6-digit code sent to your email', screen: 'otp', field: '735291' },
      { title: 'Create Account', subtitle: 'Set up your secure credentials', screen: 'account', fields: ['Chukwuemeka', 'Adeyemi', 'chukwuemeka@example.com'] },
      { title: 'Business Info', subtitle: 'Tell us about your retail business', screen: 'business', field: 'Emeka Retail Enterprises' },
      { title: 'Welcome!', subtitle: 'Your retailer account is ready', screen: 'success' },
    ],
  },
  vendor: {
    label: 'Vendor',
    icon: '🏪',
    desc: 'Sell products to thousands',
    color: 'from-purple-500 to-purple-600',
    steps: [
      { title: 'Select Role', subtitle: 'Vendors need RC Number for verification', screen: 'role', field: 'Vendor' },
      { title: 'Your Location', subtitle: 'Select your country and currency', screen: 'country', field: 'Nigeria' },
      { title: 'Email Verification', subtitle: 'Enter the 6-digit code sent to your email', screen: 'otp', field: '591847' },
      { title: 'Create Account', subtitle: 'Set up your secure credentials', screen: 'account', fields: ['Fatima', 'Abdullahi', 'fatima@example.com'] },
      { title: 'Business Info', subtitle: 'Tell us about your business', screen: 'business', field: 'Fatima Fashion Hub' },
      { title: 'Welcome!', subtitle: 'Your vendor account is ready', screen: 'success' },
    ],
  },
};

/* Hand cursor SVG component */
function HandCursor({ visible, x, y }) {
  if (!visible) return null;
  return (
    <div className="absolute pointer-events-none z-30 transition-all duration-300 ease-out" style={{ left: x, top: y }}>
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="drop-shadow-lg">
        <path d="M8 14V6a2 2 0 114 0v4m0-4a2 2 0 114 0v6m0-4a2 2 0 114 0v5a8 8 0 01-8 8H9a8 8 0 01-5.66-2.34l-1.24-1.24a1 1 0 011.41-1.41L8 17.17" stroke="#1a1a2e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="white" />
      </svg>
    </div>
  );
}

/* Typewriter for text values */
function TypewriterText({ text, speed = 35, onComplete }) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    setDisplayed('');
    setDone(false);
    let i = 0;
    const interval = setInterval(() => {
      if (i < text.length) {
        setDisplayed(text.slice(0, i + 1));
        i++;
      } else {
        clearInterval(interval);
        setDone(true);
        onComplete?.();
      }
    }, speed);
    return () => clearInterval(interval);
  }, [text, speed]);

  return (
    <span>
      {displayed}
      {!done && <span className="inline-block w-[2px] h-[14px] bg-ob-purple animate-pulse ml-[1px] align-middle" />}
    </span>
  );
}

/* Render iPhone screen content based on step */
function PhoneScreen({ step, role, typedValues, otpDigits, currentFieldIdx }) {
  if (step.screen === 'success') {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-6 animate-fade-in">
        <div className="w-16 h-16 bg-ob-lime/20 rounded-full flex items-center justify-center mb-3">
          <span className="text-3xl">🎉</span>
        </div>
        <p className="text-base font-bold text-ob-navy mb-1">Welcome to OjaBridge!</p>
        <p className="text-[11px] text-gray-500 mb-4">Your {role} account is ready</p>
        <div className="w-full bg-gray-50 rounded-lg p-3 text-left">
          <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Your Dashboard</p>
          {role === 'customer' && (
            <div className="space-y-1.5">
              {['📦 My Orders', '❤️ Favorites', '📍 Addresses', '🔔 Notifications'].map((item, i) => (
                <div key={i} className="flex items-center gap-2 p-1.5 bg-white rounded text-[10px] text-ob-navy">{item}</div>
              ))}
            </div>
          )}
          {role === 'vendor' && (
            <div className="space-y-1.5">
              {['📊 Overview', '📦 Products', '💰 Payouts', '📋 KYC'].map((item, i) => (
                <div key={i} className="flex items-center gap-2 p-1.5 bg-white rounded text-[10px] text-ob-navy">{item}</div>
              ))}
            </div>
          )}
          {role === 'retailer' && (
            <div className="space-y-1.5">
              {['📊 Overview', '🔍 Sourcing', '📦 Orders', '📋 KYC'].map((item, i) => (
                <div key={i} className="flex items-center gap-2 p-1.5 bg-white rounded text-[10px] text-ob-navy">{item}</div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (step.screen === 'role') {
    return (
      <div className="p-4 h-full">
        <div className="text-center mb-4">
          <p className="text-[9px] text-gray-400 uppercase tracking-wider mb-1">Step 1 of 6</p>
          <p className="text-sm font-bold text-ob-navy">How will you use OjaBridge?</p>
        </div>
        {['Customer', 'Retailer', 'Vendor'].map((r, i) => (
          <div key={r} className={`p-2.5 rounded-lg border mb-2 transition-all ${step.field === r ? 'border-ob-purple bg-ob-purple/5' : 'border-gray-200 bg-white'}`}>
            <div className="flex items-center gap-2">
              <span className="text-sm">{i === 0 ? '🛒' : i === 1 ? '📦' : '🏪'}</span>
              <span className="text-[11px] font-medium text-ob-navy">{r}</span>
              {step.field === r && <span className="ml-auto text-ob-purple text-[10px]">✓</span>}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (step.screen === 'country') {
    return (
      <div className="p-4 h-full">
        <div className="text-center mb-4">
          <p className="text-[9px] text-gray-400 uppercase tracking-wider mb-1">Step 2 of 6</p>
          <p className="text-sm font-bold text-ob-navy">Select Your Location</p>
        </div>
        <div className="space-y-2">
          <div className="p-2.5 rounded-lg border border-ob-purple bg-ob-purple/5">
            <div className="flex items-center gap-2">
              <span className="text-sm">🇳🇬</span>
              <span className="text-[11px] font-medium text-ob-navy">Nigeria</span>
              <span className="ml-auto text-ob-purple text-[10px]">✓</span>
            </div>
          </div>
          {['Ghana', 'Kenya', 'South Africa'].map(c => (
            <div key={c} className="p-2.5 rounded-lg border border-gray-200 bg-white">
              <div className="flex items-center gap-2">
                <span className="text-sm opacity-40">{c === 'Ghana' ? '🇬🇭' : c === 'Kenya' ? '🇰🇪' : '🇿🇦'}</span>
                <span className="text-[11px] text-gray-400">{c}</span>
                <span className="ml-auto text-[9px] text-gray-300">Coming Soon</span>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3 p-2.5 rounded-lg border border-gray-200 bg-white">
          <p className="text-[9px] text-gray-400 mb-1">Currency</p>
          <p className="text-[11px] font-medium text-ob-navy">NGN (₦) Nigerian Naira</p>
        </div>
      </div>
    );
  }

  if (step.screen === 'otp') {
    return (
      <div className="p-4 h-full">
        <div className="text-center mb-4">
          <p className="text-[9px] text-gray-400 uppercase tracking-wider mb-1">Step 3 of 6</p>
          <p className="text-sm font-bold text-ob-navy">Verify Your Email</p>
          <p className="text-[10px] text-gray-400 mt-1">Enter the 6-digit code sent to your email</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 mb-3">
          <p className="text-[10px] text-gray-400 mb-1">Email Address</p>
          <p className="text-[11px] text-ob-navy font-medium">{typedValues.email || 'demo@example.com'}</p>
        </div>
        <div className="flex gap-1.5 justify-center my-4">
          {step.field.split('').map((digit, i) => (
            <div key={i} className={`w-8 h-10 flex items-center justify-center rounded-lg text-sm font-bold transition-all ${
              otpDigits.includes(digit) ? 'border-2 border-ob-purple bg-ob-purple/5 text-ob-navy' : 'border border-gray-200 bg-white text-gray-300'
            }`}>
              {otpDigits.includes(digit) ? digit : ''}
            </div>
          ))}
        </div>
        <p className="text-center text-[9px] text-gray-400">
          Didn&apos;t receive the code? <span className="text-ob-purple">Resend</span>
        </p>
      </div>
    );
  }

  if (step.screen === 'account') {
    const fields = step.fields || [];
    return (
      <div className="p-4 h-full">
        <div className="text-center mb-4">
          <p className="text-[9px] text-gray-400 uppercase tracking-wider mb-1">Step 4 of 6</p>
          <p className="text-sm font-bold text-ob-navy">Create Your Account</p>
        </div>
        <div className="space-y-2.5">
          {[
            { label: 'First Name', value: fields[0] },
            { label: 'Last Name', value: fields[1] },
            { label: 'Email Address', value: fields[2] },
            { label: 'Phone Number', value: '+234 812 345 6789' },
            { label: 'Password', value: '••••••••', isPassword: true },
          ].map((f, i) => (
            <div key={i}>
              <p className="text-[9px] text-gray-400 mb-0.5">{f.label} *</p>
              <div className="px-2.5 py-2 bg-white border border-gray-200 rounded-lg text-[11px] text-ob-navy">
                {typedValues[`field_${i}`] || (i === currentFieldIdx ? '' : (i < currentFieldIdx ? f.value : ''))}
                {i === currentFieldIdx && <span className="inline-block w-[2px] h-3 bg-ob-purple animate-pulse ml-[1px] align-middle" />}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (step.screen === 'business') {
    return (
      <div className="p-4 h-full">
        <div className="text-center mb-4">
          <p className="text-[9px] text-gray-400 uppercase tracking-wider mb-1">Step 5 of 6</p>
          <p className="text-sm font-bold text-ob-navy">Business Information</p>
        </div>
        <div className="space-y-2.5">
          {[
            { label: 'Business Name', value: step.field },
            { label: 'Business Type', value: 'Private Limited Company' },
            { label: 'RC Number', value: 'RC1234567' },
            { label: 'Business Address', value: '12 Marina Road, Lagos' },
          ].map((f, i) => (
            <div key={i}>
              <p className="text-[9px] text-gray-400 mb-0.5">{f.label} *</p>
              <div className="px-2.5 py-2 bg-white border border-gray-200 rounded-lg text-[11px] text-ob-navy">
                {typedValues[`biz_${i}`] || (i <= currentFieldIdx ? f.value : '')}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return null;
}

export default function OnboardingDemo() {
  const [selectedRole, setSelectedRole] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [typedValues, setTypedValues] = useState({});
  const [otpDigits, setOtpDigits] = useState('');
  const [currentFieldIdx, setCurrentFieldIdx] = useState(0);
  const [handVisible, setHandVisible] = useState(false);
  const [handPos, setHandPos] = useState({ x: 0, y: 0 });
  const timerRef = useRef(null);
  const playRef = useRef(false);

  const role = selectedRole ? ROLES[selectedRole] : null;
  const steps = role?.steps || [];
  const step = steps[currentStep];
  const totalSteps = steps.length;

  // Clear timers on unmount
  useEffect(() => {
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, []);

  const clearTimers = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  };

  // Auto-type OTP digits
  useEffect(() => {
    if (!step || step.screen !== 'otp' || !isPlaying) return;
    setOtpDigits('');
    let idx = 0;
    const digits = step.field;
    const typeDigit = () => {
      if (idx < digits.length && playRef.current) {
        setOtpDigits(prev => prev + digits[idx]);
        idx++;
        timerRef.current = setTimeout(typeDigit, 200);
      } else {
        timerRef.current = setTimeout(advanceStep, 1200);
      }
    };
    timerRef.current = setTimeout(typeDigit, 800);
    return () => clearTimers();
  }, [currentStep, isPlaying]);

  // Auto-type account/business fields
  useEffect(() => {
    if (!step || !isPlaying) return;
    if (step.screen !== 'account' && step.screen !== 'business') return;

    const fields = step.screen === 'account' ? (step.fields || []) : (step.fields || ['test']);
    setCurrentFieldIdx(0);
    setTypedValues({});

    let fieldIndex = 0;
    const typeField = () => {
      if (fieldIndex >= fields.length || !playRef.current) {
        timerRef.current = setTimeout(advanceStep, 1000);
        return;
      }
      setCurrentFieldIdx(fieldIndex);
      const val = fields[fieldIndex];
      const prefix = step.screen === 'account' ? 'field_' : 'biz_';
      let charIdx = 0;
      const typeChar = () => {
        if (charIdx < val.length && playRef.current) {
          charIdx++;
          setTypedValues(prev => ({ ...prev, [`${prefix}${fieldIndex}`]: val.slice(0, charIdx) }));
          timerRef.current = setTimeout(typeChar, 30);
        } else {
          fieldIndex++;
          timerRef.current = setTimeout(typeField, 400);
        }
      };
      typeChar();
    };
    timerRef.current = setTimeout(typeField, 600);
    return () => clearTimers();
  }, [currentStep, isPlaying]);

  // For role/country screens — auto-advance after delay
  useEffect(() => {
    if (!step || !isPlaying) return;
    if (step.screen === 'role' || step.screen === 'country') {
      timerRef.current = setTimeout(advanceStep, 2000);
      return () => clearTimers();
    }
  }, [currentStep, isPlaying]);

  const advanceStep = useCallback(() => {
    if (!playRef.current) return;
    if (currentStep < totalSteps - 1) {
      setCurrentStep(prev => prev + 1);
      setTypedValues({});
      setOtpDigits('');
      setCurrentFieldIdx(0);
    } else {
      setIsPlaying(false);
      playRef.current = false;
    }
  }, [currentStep, totalSteps]);

  const startDemo = (roleKey) => {
    clearTimers();
    setSelectedRole(roleKey);
    setCurrentStep(0);
    setTypedValues({});
    setOtpDigits('');
    setCurrentFieldIdx(0);
    setIsPlaying(true);
    playRef.current = true;
    setHandVisible(true);
    setHandPos({ x: '55%', y: '30%' });
  };

  const togglePlay = () => {
    if (isPlaying) {
      setIsPlaying(false);
      playRef.current = false;
      clearTimers();
    } else {
      setIsPlaying(true);
      playRef.current = true;
      setHandVisible(true);
    }
  };

  const nextStep = () => {
    clearTimers();
    playRef.current = false;
    setIsPlaying(false);
    if (currentStep < totalSteps - 1) {
      setCurrentStep(prev => prev + 1);
      setTypedValues({});
      setOtpDigits('');
      setCurrentFieldIdx(0);
    }
  };

  const prevStep = () => {
    clearTimers();
    playRef.current = false;
    setIsPlaying(false);
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
      setTypedValues({});
      setOtpDigits('');
      setCurrentFieldIdx(0);
    }
  };

  const restart = () => {
    clearTimers();
    setCurrentStep(0);
    setTypedValues({});
    setOtpDigits('');
    setCurrentFieldIdx(0);
    setIsPlaying(true);
    playRef.current = true;
    setHandVisible(true);
  };

  const switchRole = (roleKey) => {
    clearTimers();
    setSelectedRole(roleKey);
    setCurrentStep(0);
    setTypedValues({});
    setOtpDigits('');
    setCurrentFieldIdx(0);
    setIsPlaying(true);
    playRef.current = true;
    setHandVisible(true);
  };

  return (
    <section className="py-16 md:py-24 px-4 bg-gradient-to-b from-white via-ob-light to-white" id="onboarding-demo">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <span className="text-ob-purple font-semibold text-sm uppercase tracking-wider">See It In Action</span>
          <h2 className="text-3xl md:text-4xl font-bold text-ob-navy mt-3 mb-4">
            Try OjaBridge <span className="text-ob-purple">Live</span>
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Watch how easy it is to join OjaBridge. Pick a role and see the complete registration flow play out in real time — just like the real thing.
          </p>
        </div>

        {/* Role Selector Cards */}
        {!selectedRole && (
          <div className="grid sm:grid-cols-3 gap-6 max-w-3xl mx-auto mb-12">
            {Object.entries(ROLES).map(([key, r]) => (
              <button
                key={key}
                onClick={() => startDemo(key)}
                className="bg-white p-6 rounded-2xl border-2 border-gray-100 hover:border-ob-purple hover:shadow-xl transition-all text-center group"
              >
                <span className="text-4xl block mb-3 group-hover:scale-110 transition-transform">{r.icon}</span>
                <h3 className="font-bold text-ob-navy text-lg mb-1">{r.label}</h3>
                <p className="text-gray-500 text-sm mb-3">{r.desc}</p>
                <span className="text-ob-purple text-sm font-semibold group-hover:underline">Watch Demo →</span>
              </button>
            ))}
          </div>
        )}

        {/* iPhone Mockup + Controls */}
        {selectedRole && (
          <div className="flex flex-col lg:flex-row items-center gap-10 max-w-5xl mx-auto">
            {/* Left: Info Panel */}
            <div className="flex-1 text-center lg:text-left">
              <div className="flex gap-2 mb-4 justify-center lg:justify-start">
                {Object.entries(ROLES).map(([key, r]) => (
                  <button
                    key={key}
                    onClick={() => switchRole(key)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                      selectedRole === key ? 'bg-ob-purple text-white' : 'bg-white text-gray-600 border border-gray-200 hover:border-ob-purple'
                    }`}
                  >
                    {r.icon} {r.label}
                  </button>
                ))}
              </div>

              <h3 className="text-xl font-bold text-ob-navy mb-2">
                {step?.screen === 'success' ? '🎉 Account Created!' : `Step ${currentStep + 1}: ${step?.title}`}
              </h3>
              <p className="text-gray-500 text-sm mb-4">{step?.subtitle}</p>

              {/* Step Progress */}
              <div className="flex items-center gap-1.5 mb-6 justify-center lg:justify-start">
                {Array.from({ length: totalSteps }, (_, i) => (
                  <div key={i} className="flex items-center">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold transition-all ${
                      i < currentStep ? 'bg-ob-lime text-ob-navy' : i === currentStep ? 'bg-ob-purple text-white' : 'bg-gray-200 text-gray-400'
                    }`}>
                      {i < currentStep ? '✓' : i + 1}
                    </div>
                    {i < totalSteps - 1 && <div className={`w-3 h-0.5 mx-0.5 ${i < currentStep ? 'bg-ob-lime' : 'bg-gray-200'}`} />}
                  </div>
                ))}
              </div>

              {/* Controls */}
              <div className="flex items-center gap-3 justify-center lg:justify-start">
                <button onClick={restart} className="p-2 rounded-full bg-white border border-gray-200 text-gray-600 hover:border-ob-purple transition-colors" title="Restart">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                </button>
                <button onClick={prevStep} disabled={currentStep === 0} className="p-2 rounded-full bg-white border border-gray-200 text-gray-600 hover:border-ob-purple transition-colors disabled:opacity-30">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                </button>
                <button onClick={togglePlay} className="p-3 rounded-full bg-ob-purple text-white hover:bg-ob-purple-dark transition-colors shadow-lg shadow-ob-purple/20">
                  {isPlaying ? (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" /></svg>
                  ) : (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                  )}
                </button>
                <button onClick={nextStep} disabled={currentStep === totalSteps - 1} className="p-2 rounded-full bg-white border border-gray-200 text-gray-600 hover:border-ob-purple transition-colors disabled:opacity-30">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </button>
              </div>

              <p className="text-xs text-gray-400 mt-3 text-center lg:text-left">
                Step {currentStep + 1} of {totalSteps} — {role?.label} Flow
              </p>

              {step?.screen === 'success' && (
                <div className="mt-6 text-center lg:text-left">
                  <Link href="/register" className="bg-ob-purple hover:bg-ob-purple-dark text-white font-semibold px-6 py-2.5 rounded-xl transition-all inline-flex items-center gap-2 text-sm">
                    Create Your Account
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                  </Link>
                </div>
              )}
            </div>

            {/* Right: iPhone 16 Pro Max Mockup */}
            <div className="relative flex-shrink-0">
              {/* iPhone Frame */}
              <div className="relative w-[280px] h-[580px] bg-black rounded-[44px] p-[10px] shadow-2xl">
                {/* Screen */}
                <div className="relative w-full h-full bg-white rounded-[36px] overflow-hidden">
                  {/* Dynamic Island / Notch */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[120px] h-[28px] bg-black rounded-b-2xl z-20" />

                  {/* Status Bar */}
                  <div className="relative z-10 flex items-center justify-between px-6 pt-2 pb-1">
                    <span className="text-[9px] font-semibold text-black">9:41</span>
                    <div className="flex items-center gap-1">
                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="black"><path d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.08 2.93 1 9zm8 8l3 3 3-3c-1.65-1.66-4.34-1.66-6 0zm-4-4l2 2c2.76-2.76 7.24-2.76 10 0l2-2C15.14 9.14 8.87 9.14 5 13z" /></svg>
                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="black"><path d="M15.67 4H14V2h-4v2H8.33C7.6 4 7 4.6 7 5.33v15.33C7 21.4 7.6 22 8.33 22h7.33c.74 0 1.34-.6 1.34-1.33V5.33C17 4.6 16.4 4 15.67 4z" /></svg>
                    </div>
                  </div>

                  {/* App Header */}
                  <div className="relative z-10 px-4 py-2 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] font-bold text-ob-navy">OjaBridge</p>
                      <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-medium ${
                        step?.screen === 'success' ? 'bg-green-100 text-green-700' : 'bg-ob-purple/10 text-ob-purple'
                      }`}>
                        {step?.screen === 'success' ? '✓ Done' : 'Registration'}
                      </span>
                    </div>
                  </div>

                  {/* Phone Screen Content */}
                  <div className="relative z-10 h-[calc(100%-90px)] overflow-y-auto">
                    <PhoneScreen step={step} role={selectedRole} typedValues={typedValues} otpDigits={otpDigits} currentFieldIdx={currentFieldIdx} />
                  </div>

                  {/* Home Indicator */}
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-[100px] h-[4px] bg-black rounded-full z-20" />
                </div>

                {/* Side Buttons */}
                <div className="absolute right-[-2px] top-[120px] w-[3px] h-[40px] bg-gray-600 rounded-r" />
                <div className="absolute right-[-2px] top-[180px] w-[3px] h-[60px] bg-gray-600 rounded-r" />
                <div className="absolute left-[-2px] top-[160px] w-[3px] h-[30px] bg-gray-600 rounded-l" />
              </div>

              {/* Hand cursor */}
              {isPlaying && (
                <div className="absolute -bottom-6 -right-6 pointer-events-none z-30 animate-bounce" style={{ animationDuration: '2s' }}>
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" className="drop-shadow-xl rotate-[-20deg]">
                    <path d="M8 14V6a2 2 0 114 0v4m0-4a2 2 0 114 0v6m0-4a2 2 0 114 0v5a8 8 0 01-8 8H9a8 8 0 01-5.66-2.34l-1.24-1.24a1 1 0 011.41-1.41L8 17.17" stroke="#1a1a2e" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" fill="white" />
                  </svg>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
