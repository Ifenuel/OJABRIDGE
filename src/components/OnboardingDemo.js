'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';

/**
 * InteractiveOnboardingDemo — Realistic iPhone mockup showing the real OjaBridge registration flow.
 * Features: actual register page UI inside phone, animated human hand typing, step progression.
 */

const ROLE_STEPS = {
  customer: [
    { title: 'Choose Your Role', stepNum: 1, totalSteps: 4, screen: 'role', highlight: 'Customer' },
    { title: 'Verify Your Email', stepNum: 3, totalSteps: 4, screen: 'otp', typing: 'emeka@example.com', otp: '482916' },
    { title: 'Set Up Your Account', stepNum: 4, totalSteps: 4, screen: 'account', typing: ['Adaeze', 'Okonkwo', '••••••••'] },
    { title: 'Review & Create', stepNum: 4, totalSteps: 4, screen: 'review', name: 'Adaeze Okonkwo', email: 'emeka@example.com' },
  ],
  retailer: [
    { title: 'Choose Your Role', stepNum: 1, totalSteps: 6, screen: 'role', highlight: 'Retailer' },
    { title: 'Verify Your Email', stepNum: 3, totalSteps: 6, screen: 'otp', typing: 'fatima@example.com', otp: '735291' },
    { title: 'Set Up Your Account', stepNum: 4, totalSteps: 6, screen: 'account', typing: ['Chukwuemeka', 'Adeyemi', '••••••••'] },
    { title: 'Business Information', stepNum: 5, totalSteps: 6, screen: 'business', typing: ['Emeka Retail Enterprises', 'Private Limited Company', 'RC8765432'] },
    { title: 'Review & Create', stepNum: 5, totalSteps: 6, screen: 'review', name: 'Chukwuemeka Adeyemi', email: 'fatima@example.com' },
  ],
  vendor: [
    { title: 'Choose Your Role', stepNum: 1, totalSteps: 6, screen: 'role', highlight: 'Vendor' },
    { title: 'Verify Your Email', stepNum: 3, totalSteps: 6, screen: 'otp', typing: 'fatima@example.com', otp: '591847' },
    { title: 'Set Up Your Account', stepNum: 4, totalSteps: 6, screen: 'account', typing: ['Fatima', 'Abdullahi', '••••••••'] },
    { title: 'Business Information', stepNum: 5, totalSteps: 6, screen: 'business', typing: ['Fatima Fashion Hub', 'Private Limited Company', 'RC1234567'] },
    { title: 'Review & Create', stepNum: 5, totalSteps: 6, screen: 'review', name: 'Fatima Abdullahi', email: 'fatima@example.com' },
  ],
};

/* Realistic hand SVG — a human right hand with index finger extended for tapping */
function HumanHand({ visible, style }) {
  if (!visible) return null;
  return (
    <div className="absolute pointer-events-none z-40 transition-all duration-500 ease-in-out" style={style}>
      <svg width="72" height="90" viewBox="0 0 72 90" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Palm and fingers — realistic hand shape */}
        <defs>
          <linearGradient id="skinGrad" x1="36" y1="0" x2="36" y2="90" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#E8B89D" />
            <stop offset="100%" stopColor="#D4967A" />
          </linearGradient>
          <filter id="handShadow" x="-20%" y="-10%" width="140%" height="130%">
            <feDropShadow dx="2" dy="3" stdDeviation="3" floodColor="#000" floodOpacity="0.25" />
          </filter>
        </defs>
        <g filter="url(#handShadow)">
          {/* Thumb */}
          <path d="M18 42 C12 38, 8 32, 10 26 C12 20, 16 18, 19 22 C22 26, 22 34, 20 40" fill="url(#skinGrad)" stroke="#C4856B" strokeWidth="0.5" />
          {/* Index finger — extended for tapping */}
          <path d="M26 44 C25 36, 24 24, 26 14 C28 8, 32 8, 34 14 C36 24, 35 36, 34 44" fill="url(#skinGrad)" stroke="#C4856B" strokeWidth="0.5" />
          {/* Middle finger */}
          <path d="M34 46 C33 38, 33 26, 35 18 C37 12, 41 12, 42 18 C43 26, 42 38, 41 46" fill="url(#skinGrad)" stroke="#C4856B" strokeWidth="0.5" />
          {/* Ring finger */}
          <path d="M41 47 C40 40, 40 30, 42 22 C44 16, 47 16, 48 22 C49 30, 48 40, 47 47" fill="url(#skinGrad)" stroke="#C4856B" strokeWidth="0.5" />
          {/* Pinky */}
          <path d="M47 48 C47 42, 47 34, 49 28 C50 24, 53 24, 53 28 C53 34, 52 42, 51 48" fill="url(#skinGrad)" stroke="#C4856B" strokeWidth="0.5" />
          {/* Palm */}
          <path d="M18 44 C16 50, 16 58, 20 64 C24 70, 30 74, 36 74 C42 74, 48 70, 52 64 C56 58, 55 50, 51 46 L47 46 L41 45 L34 44 L26 43 Z" fill="url(#skinGrad)" stroke="#C4856B" strokeWidth="0.5" />
          {/* Wrist */}
          <path d="M20 64 C20 72, 22 80, 26 84 L46 84 C50 80, 52 72, 52 64" fill="url(#skinGrad)" stroke="#C4856B" strokeWidth="0.5" />
          {/* Fingernail on index finger */}
          <ellipse cx="30" cy="13" rx="3.5" ry="4" fill="#F2D5C7" stroke="#C4856B" strokeWidth="0.3" />
          {/* Crease lines on palm */}
          <path d="M22 52 Q30 48, 48 52" stroke="#C4856B" strokeWidth="0.6" fill="none" opacity="0.4" />
          <path d="M24 58 Q34 54, 48 58" stroke="#C4856B" strokeWidth="0.6" fill="none" opacity="0.3" />
          {/* Knuckle creases */}
          <path d="M26 40 Q30 38, 34 40" stroke="#C4856B" strokeWidth="0.4" fill="none" opacity="0.3" />
          <path d="M35 41 Q38 39, 42 41" stroke="#C4856B" strokeWidth="0.4" fill="none" opacity="0.3" />
        </g>
      </svg>
    </div>
  );
}

/* Typing animation hook — types text character by character */
function useTypewriter(speed = 45) {
  const [text, setText] = useState('');
  const timerRef = useRef(null);

  const type = useCallback((fullText, onComplete) => {
    setText('');
    let i = 0;
    const tick = () => {
      if (i < fullText.length) {
        setText(fullText.slice(0, i + 1));
        i++;
        timerRef.current = setTimeout(tick, speed);
      } else {
        onComplete?.();
      }
    };
    tick();
  }, [speed]);

  const reset = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setText('');
  }, []);

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  return { text, type, reset };
}

/* OTP digit-by-digit animation */
function useOtpAnimation(speed = 180) {
  const [digits, setDigits] = useState('');
  const timerRef = useRef(null);

  const type = useCallback((otpStr, onComplete) => {
    setDigits('');
    let i = 0;
    const tick = () => {
      if (i < otpStr.length) {
        setDigits(otpStr.slice(0, i + 1));
        i++;
        timerRef.current = setTimeout(tick, speed);
      } else {
        onComplete?.();
      }
    };
    timerRef.current = setTimeout(tick, 400);
  }, [speed]);

  const reset = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setDigits('');
  }, []);

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  return { digits, type, reset };
}

/* ─── Phone Screen Renderers (match the real OjaBridge register page) ─── */

function RoleScreen({ highlight }) {
  return (
    <div className="p-3">
      <h3 className="text-[11px] font-bold text-ob-navy mb-0.5">How do you want to use OjaBridge?</h3>
      <p className="text-[8px] text-gray-400 mb-2">Select your role to get started.</p>
      <div className="space-y-1.5">
        {[
          { value: 'Customer', icon: '🛒', desc: 'Shop and buy products' },
          { value: 'Retailer', icon: '📦', desc: 'Source products for your business' },
          { value: 'Vendor', icon: '🏪', desc: 'Sell your products on the marketplace' },
        ].map(r => (
          <div key={r.value} className={`p-2 rounded-lg border flex items-center gap-2 ${highlight === r.value ? 'border-ob-purple bg-ob-purple/5' : 'border-gray-200'}`}>
            <span className="text-xs">{r.icon}</span>
            <div>
              <p className="text-[9px] font-semibold text-ob-navy">{r.value}</p>
              <p className="text-[7px] text-gray-400">{r.desc}</p>
            </div>
            {highlight === r.value && <span className="ml-auto text-ob-purple text-[8px]">✓</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

function OTPScreen({ typedEmail, otpDigits, otpCode }) {
  return (
    <div className="p-3">
      <h3 className="text-[11px] font-bold text-ob-navy mb-0.5">Verify your email</h3>
      <p className="text-[7px] text-gray-400 mb-2">Enter the 6-digit code sent to your email.</p>
      <div className="space-y-2">
        <div>
          <label className="text-[8px] text-gray-500 font-medium">Email Address *</label>
          <div className="flex gap-1 mt-0.5">
            <div className="flex-1 px-2 py-1.5 bg-white border border-green-300 rounded text-[8px] text-ob-navy truncate">{typedEmail}</div>
            <span className="px-2 py-1.5 bg-green-100 text-green-700 rounded text-[8px] font-medium whitespace-nowrap">✓ Verified</span>
          </div>
        </div>
        <div>
          <div className="flex gap-1 justify-center my-2">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className={`w-7 h-8 flex items-center justify-center rounded text-[10px] font-bold ${i < otpDigits.length ? 'border-2 border-ob-purple bg-ob-purple/5 text-ob-navy' : 'border border-gray-200 bg-white text-gray-300'}`}>
                {otpDigits[i] || ''}
              </div>
            ))}
          </div>
          <p className="text-[7px] text-gray-400 text-center">Didn&apos;t receive code? <span className="text-ob-purple">Resend</span></p>
        </div>
        <div>
          <label className="text-[8px] text-gray-500 font-medium">Phone Number *</label>
          <div className="px-2 py-1.5 bg-white border border-gray-200 rounded text-[8px] text-ob-navy mt-0.5">+234 812 345 6789</div>
        </div>
      </div>
    </div>
  );
}

function AccountScreen({ fieldValues, currentField }) {
  const fields = [
    { label: 'First Name', value: fieldValues[0] || '' },
    { label: 'Last Name', value: fieldValues[1] || '' },
    { label: 'Email (verified)', value: 'emeka@example.com', readOnly: true },
    { label: 'Phone Number (verified)', value: '+234 812 345 6789', readOnly: true },
    { label: 'Password', value: fieldValues[2] || '', isPassword: true },
  ];

  return (
    <div className="p-3">
      <h3 className="text-[11px] font-bold text-ob-navy mb-0.5">Set up your account</h3>
      <p className="text-[7px] text-gray-400 mb-2">Create your secure account credentials.</p>
      <div className="space-y-1.5">
        {fields.map((f, i) => (
          <div key={i}>
            <label className="text-[7px] text-gray-500 font-medium">{f.label}{!f.readOnly ? ' *' : ''}</label>
            <div className={`relative px-2 py-1.5 border rounded text-[8px] mt-0.5 ${f.readOnly ? 'bg-gray-50 border-gray-100 text-gray-500' : i === currentField ? 'border-ob-purple bg-ob-purple/5 text-ob-navy' : 'border-gray-200 bg-white text-ob-navy'}`}>
              {f.value || (f.readOnly ? '' : '')}
              {i === currentField && !f.readOnly && <span className="inline-block w-[1.5px] h-2.5 bg-ob-purple animate-pulse ml-[1px] align-middle" />}
            </div>
          </div>
        ))}
        {/* Terms checkbox */}
        <div className="flex items-center gap-1 mt-1">
          <div className="w-3 h-3 border border-gray-300 rounded-sm bg-ob-purple flex items-center justify-center">
            <span className="text-white text-[6px]">✓</span>
          </div>
          <span className="text-[6px] text-gray-400">I agree to the Terms of Service and Privacy Policy</span>
        </div>
      </div>
    </div>
  );
}

function BusinessScreen({ fieldValues, currentField }) {
  const fields = [
    { label: 'Registered Business Name', value: fieldValues[0] || '' },
    { label: 'Business Type', value: fieldValues[1] || '' },
    { label: 'RC Number', value: fieldValues[2] || '' },
    { label: 'Business Address', value: '12 Marina Road, Lagos' },
  ];

  return (
    <div className="p-3">
      <h3 className="text-[11px] font-bold text-ob-navy mb-0.5">Business Information</h3>
      <p className="text-[7px] text-gray-400 mb-2">Tell us about your business.</p>
      <div className="space-y-1.5">
        {fields.map((f, i) => (
          <div key={i}>
            <label className="text-[7px] text-gray-500 font-medium">{f.label} *</label>
            <div className={`px-2 py-1.5 border rounded text-[8px] mt-0.5 ${i === currentField ? 'border-ob-purple bg-ob-purple/5 text-ob-navy' : 'border-gray-200 bg-white text-ob-navy'}`}>
              {f.value}
              {i === currentField && <span className="inline-block w-[1.5px] h-2.5 bg-ob-purple animate-pulse ml-[1px] align-middle" />}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ReviewScreen({ name, email }) {
  return (
    <div className="p-3">
      <h3 className="text-[11px] font-bold text-ob-navy mb-0.5">Review & Create Account</h3>
      <p className="text-[7px] text-gray-400 mb-2">Verify your information before creating.</p>
      <div className="bg-gray-50 rounded-lg p-2 space-y-1">
        <div className="flex justify-between text-[8px]"><span className="text-gray-400">Name</span><span className="font-medium text-ob-navy">{name}</span></div>
        <div className="flex justify-between text-[8px]"><span className="text-gray-400">Email</span><span className="font-medium text-ob-navy">{email}</span></div>
        <div className="flex justify-between text-[8px]"><span className="text-gray-400">Phone</span><span className="font-medium text-ob-navy">+234 812 345 6789</span></div>
        <div className="flex justify-between text-[8px]"><span className="text-gray-400">Country</span><span className="font-medium text-ob-navy">Nigeria</span></div>
        <div className="flex justify-between text-[8px]"><span className="text-gray-400">Currency</span><span className="font-medium text-ob-navy">NGN (₦)</span></div>
      </div>
      <div className="mt-2 bg-ob-lime/10 border border-ob-lime/30 rounded p-2 text-[7px] text-ob-navy font-medium text-center">
        ✓ Ready to create your account
      </div>
    </div>
  );
}

function SuccessScreen({ role }) {
  return (
    <div className="p-3 flex flex-col items-center text-center pt-6">
      <div className="w-12 h-12 bg-ob-lime/20 rounded-full flex items-center justify-center mb-2">
        <span className="text-2xl">🎉</span>
      </div>
      <p className="text-[11px] font-bold text-ob-navy">Welcome to OjaBridge!</p>
      <p className="text-[7px] text-gray-400 mb-3">Your {role} account is ready</p>
      <div className="w-full bg-gray-50 rounded-lg p-2 text-left">
        <p className="text-[7px] text-gray-400 uppercase tracking-wider mb-1 font-medium">Your Dashboard</p>
        {['📊 Overview', '📦 Products', '💰 Payouts', '📋 KYC Verification'].map((item, i) => (
          <div key={i} className="flex items-center p-1 bg-white rounded text-[7px] text-ob-navy mb-0.5">{item}</div>
        ))}
      </div>
    </div>
  );
}

/* ─── Main Component ─── */

export default function OnboardingDemo() {
  const [selectedRole, setSelectedRole] = useState(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [fieldValues, setFieldValues] = useState({});
  const [currentField, setCurrentField] = useState(-1);
  const [otpDigits, setOtpDigits] = useState('');
  const [handPos, setHandPos] = useState({ x: '50%', y: '65%' });
  const [handVisible, setHandVisible] = useState(false);
  const [fingerTap, setFingerTap] = useState(false);

  const timerRef = useRef(null);
  const playRef = useRef(false);
  const fieldIdxRef = useRef(0);

  const emailType = useTypewriter(40);
  const otpType = useOtpAnimation(150);

  const role = selectedRole ? ROLE_STEPS[selectedRole] : null;
  const steps = role || [];
  const step = steps[currentIdx];

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  const clearTimer = () => { if (timerRef.current) clearTimeout(timerRef.current); };

  /* Tap animation — finger presses down and lifts */
  const tapFinger = (cb, delay = 300) => {
    setFingerTap(true);
    timerRef.current = setTimeout(() => {
      setFingerTap(false);
      cb?.();
    }, delay);
  };

  /* Advance to next step */
  const advanceStep = useCallback(() => {
    if (!playRef.current) return;
    if (currentIdx < steps.length - 1) {
      setCurrentIdx(prev => prev + 1);
      setFieldValues({});
      setCurrentField(-1);
      setOtpDigits('');
      fieldIdxRef.current = 0;
    } else {
      setIsPlaying(false);
      playRef.current = false;
    }
  }, [currentIdx, steps.length]);

  /* Play each step */
  useEffect(() => {
    if (!step || !isPlaying) return;
    clearTimer();

    if (step.screen === 'role') {
      // Move hand to highlight position then advance
      setHandPos({ x: '55%', y: '45%' });
      timerRef.current = setTimeout(() => {
        tapFinger(() => {
          timerRef.current = setTimeout(advanceStep, 600);
        });
      }, 800);
      return () => clearTimer();
    }

    if (step.screen === 'otp') {
      // Type email in the field
      setHandPos({ x: '50%', y: '35%' });
      timerRef.current = setTimeout(() => {
        emailType.type(step.typing, () => {
          // Then type OTP digits
          timerRef.current = setTimeout(() => {
            otpType.type(step.otp, () => {
              timerRef.current = setTimeout(advanceStep, 800);
            });
          }, 500);
        });
      }, 400);
      return () => clearTimer();
    }

    if (step.screen === 'account') {
      const fields = step.typing;
      let fIdx = 0;

      const typeNextField = () => {
        if (fIdx >= fields.length || !playRef.current) {
          timerRef.current = setTimeout(advanceStep, 600);
          return;
        }
        setCurrentField(fIdx);
        const val = fields[fIdx];
        const prefix = '';
        let charIdx = 0;

        // Position hand over current field
        const yPositions = ['38%', '46%', '68%'];
        setHandPos({ x: '55%', y: yPositions[fIdx] || '50%' });

        const typeChar = () => {
          if (charIdx < val.length && playRef.current) {
            charIdx++;
            setFieldValues(prev => ({ ...prev, [fIdx]: val.slice(0, charIdx) }));
            timerRef.current = setTimeout(typeChar, 25);
          } else {
            fIdx++;
            timerRef.current = setTimeout(typeNextField, 350);
          }
        };

        tapFinger(typeChar, 200);
      };

      timerRef.current = setTimeout(typeNextField, 400);
      return () => clearTimer();
    }

    if (step.screen === 'business') {
      const fields = step.typing;
      let fIdx = 0;

      const typeNextField = () => {
        if (fIdx >= fields.length || !playRef.current) {
          timerRef.current = setTimeout(advanceStep, 600);
          return;
        }
        setCurrentField(fIdx);
        const val = fields[fIdx];
        let charIdx = 0;

        const yPositions = ['35%', '48%', '60%'];
        setHandPos({ x: '55%', y: yPositions[fIdx] || '50%' });

        const typeChar = () => {
          if (charIdx < val.length && playRef.current) {
            charIdx++;
            setFieldValues(prev => ({ ...prev, [fIdx]: val.slice(0, charIdx) }));
            timerRef.current = setTimeout(typeChar, 20);
          } else {
            fIdx++;
            timerRef.current = setTimeout(typeNextField, 350);
          }
        };

        tapFinger(typeChar, 200);
      };

      timerRef.current = setTimeout(typeNextField, 400);
      return () => clearTimer();
    }

    if (step.screen === 'review') {
      setHandPos({ x: '50%', y: '75%' });
      timerRef.current = setTimeout(() => {
        tapFinger(() => {
          timerRef.current = setTimeout(advanceStep, 800);
        });
      }, 800);
      return () => clearTimer();
    }
  }, [currentIdx, isPlaying]);

  /* ─── Controls ─── */

  const startDemo = (roleKey) => {
    clearTimer();
    emailType.reset();
    otpType.reset();
    setSelectedRole(roleKey);
    setCurrentIdx(0);
    setFieldValues({});
    setCurrentField(-1);
    setOtpDigits('');
    fieldIdxRef.current = 0;
    setIsPlaying(true);
    playRef.current = true;
    setHandVisible(true);
    setHandPos({ x: '55%', y: '45%' });
  };

  const togglePlay = () => {
    if (isPlaying) {
      setIsPlaying(false);
      playRef.current = false;
      clearTimer();
    } else {
      emailType.reset();
      otpType.reset();
      setIsPlaying(true);
      playRef.current = true;
      setHandVisible(true);
    }
  };

  const goTo = (idx) => {
    clearTimer();
    emailType.reset();
    otpType.reset();
    setIsPlaying(false);
    playRef.current = false;
    setCurrentIdx(idx);
    setFieldValues({});
    setCurrentField(-1);
    setOtpDigits('');
    fieldIdxRef.current = 0;
  };

  const restart = () => {
    clearTimer();
    emailType.reset();
    otpType.reset();
    setCurrentIdx(0);
    setFieldValues({});
    setCurrentField(-1);
    setOtpDigits('');
    fieldIdxRef.current = 0;
    setIsPlaying(true);
    playRef.current = true;
    setHandVisible(true);
    setHandPos({ x: '55%', y: '45%' });
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

        {/* Role Selector */}
        {!selectedRole && (
          <div className="grid sm:grid-cols-3 gap-6 max-w-3xl mx-auto mb-12">
            {[
              { key: 'customer', icon: '🛒', label: 'Customer', desc: 'Shop & buy verified products' },
              { key: 'retailer', icon: '📦', label: 'Retailer', desc: 'Source products for your business' },
              { key: 'vendor', icon: '🏪', label: 'Vendor', desc: 'Sell products to thousands' },
            ].map(r => (
              <button
                key={r.key}
                onClick={() => startDemo(r.key)}
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

        {/* Demo Area */}
        {selectedRole && (
          <div className="flex flex-col lg:flex-row items-center gap-8 max-w-5xl mx-auto">

            {/* Left: Info + Controls */}
            <div className="flex-1 text-center lg:text-left">
              {/* Role Switcher */}
              <div className="flex gap-2 mb-4 justify-center lg:justify-start">
                {[
                  { key: 'customer', icon: '🛒', label: 'Customer' },
                  { key: 'retailer', icon: '📦', label: 'Retailer' },
                  { key: 'vendor', icon: '🏪', label: 'Vendor' },
                ].map(r => (
                  <button
                    key={r.key}
                    onClick={() => { setSelectedRole(r.key); startDemo(r.key); }}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                      selectedRole === r.key ? 'bg-ob-purple text-white' : 'bg-white text-gray-600 border border-gray-200 hover:border-ob-purple'
                    }`}
                  >
                    {r.icon} {r.label}
                  </button>
                ))}
              </div>

              <h3 className="text-xl font-bold text-ob-navy mb-2">
                Step {currentIdx + 1} of {steps.length}: {step?.title}
              </h3>
              <p className="text-gray-500 text-sm mb-4">
                {step?.screen === 'role' && 'Select your account type to begin registration'}
                {step?.screen === 'otp' && 'Email is verified with a 6-digit code — no fake bypass'}
                {step?.screen === 'account' && 'Fill in your name, email, and create a secure password'}
                {step?.screen === 'business' && 'Business details are required for vendor/retailer verification'}
                {step?.screen === 'review' && 'Review all details before creating your account'}
              </p>

              {/* Step dots */}
              <div className="flex items-center gap-1.5 mb-6 justify-center lg:justify-start">
                {steps.map((_, i) => (
                  <div key={i} className="flex items-center">
                    <button
                      onClick={() => goTo(i)}
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold transition-all ${
                        i < currentIdx ? 'bg-ob-lime text-ob-navy' : i === currentIdx ? 'bg-ob-purple text-white' : 'bg-gray-200 text-gray-400'
                      }`}
                    >
                      {i < currentIdx ? '✓' : i + 1}
                    </button>
                    {i < steps.length - 1 && <div className={`w-3 h-0.5 mx-0.5 ${i < currentIdx ? 'bg-ob-lime' : 'bg-gray-200'}`} />}
                  </div>
                ))}
              </div>

              {/* Controls */}
              <div className="flex items-center gap-3 justify-center lg:justify-start">
                <button onClick={restart} className="p-2 rounded-full bg-white border border-gray-200 text-gray-600 hover:border-ob-purple transition-colors" title="Restart">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                </button>
                <button onClick={() => goTo(Math.max(0, currentIdx - 1))} disabled={currentIdx === 0} className="p-2 rounded-full bg-white border border-gray-200 text-gray-600 hover:border-ob-purple transition-colors disabled:opacity-30">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                </button>
                <button onClick={togglePlay} className="p-3 rounded-full bg-ob-purple text-white hover:bg-ob-purple-dark transition-colors shadow-lg shadow-ob-purple/20">
                  {isPlaying ? (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" /></svg>
                  ) : (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                  )}
                </button>
                <button onClick={() => goTo(Math.min(steps.length - 1, currentIdx + 1))} disabled={currentIdx === steps.length - 1} className="p-2 rounded-full bg-white border border-gray-200 text-gray-600 hover:border-ob-purple transition-colors disabled:opacity-30">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </button>
              </div>

              {step?.screen === 'review' && (
                <div className="mt-6 text-center lg:text-left">
                  <Link href="/register" className="bg-ob-purple hover:bg-ob-purple-dark text-white font-semibold px-6 py-2.5 rounded-xl transition-all inline-flex items-center gap-2 text-sm">
                    Create Your Account
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                  </Link>
                </div>
              )}
            </div>

            {/* Right: iPhone 16 Pro Max with REAL registration form */}
            <div className="relative flex-shrink-0 select-none">
              {/* iPhone Frame */}
              <div className="relative w-[290px] h-[600px] bg-[#1a1a1a] rounded-[48px] p-[10px] shadow-2xl">
                {/* Bezel highlight */}
                <div className="absolute inset-0 rounded-[48px] border border-gray-600/30" />

                {/* Screen */}
                <div className="relative w-full h-full bg-white rounded-[40px] overflow-hidden">
                  {/* Dynamic Island */}
                  <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-[100px] h-[28px] bg-black rounded-full z-20" />

                  {/* Status Bar */}
                  <div className="relative z-10 flex items-center justify-between px-7 pt-3 pb-1">
                    <span className="text-[10px] font-semibold text-black">9:41</span>
                    <div className="flex items-center gap-[3px]">
                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="black"><path d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.08 2.93 1 9zm8 8l3 3 3-3c-1.65-1.66-4.34-1.66-6 0zm-4-4l2 2c2.76-2.76 7.24-2.76 10 0l2-2C15.14 9.14 8.87 9.14 5 13z" /></svg>
                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="black"><path d="M15.67 4H14V2h-4v2H8.33C7.6 4 7 4.6 7 5.33v15.33C7 21.4 7.6 22 8.33 22h7.33c.74 0 1.34-.6 1.34-1.33V5.33C17 4.6 16.4 4 15.67 4z" /></svg>
                    </div>
                  </div>

                  {/* OjaBridge App Header — matches real register page */}
                  <div className="relative z-10 px-3 py-2 border-b border-gray-100 bg-white">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <div className="w-5 h-5 bg-ob-purple rounded flex items-center justify-center">
                          <span className="text-white text-[7px] font-bold">OB</span>
                        </div>
                        <span className="text-[10px] font-bold text-ob-navy">OjaBridge</span>
                      </div>
                      <span className={`text-[7px] px-1.5 py-0.5 rounded-full font-medium ${
                        step?.screen === 'review' || step?.screen === 'success' ? 'bg-ob-lime/20 text-ob-lime-dark' : 'bg-ob-purple/10 text-ob-purple'
                      }`}>
                        Step {step?.stepNum || 1}/{step?.totalSteps || 4}
                      </span>
                    </div>
                  </div>

                  {/* Step Indicator — matches real register page dots */}
                  <div className="relative z-10 flex items-center justify-center gap-[3px] px-4 py-2 bg-white border-b border-gray-50">
                    {Array.from({ length: step?.totalSteps || 4 }, (_, i) => (
                      <div key={i} className="flex items-center">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[7px] font-bold ${
                          i + 1 < (step?.stepNum || 1) ? 'bg-ob-lime text-ob-navy' :
                          i + 1 === (step?.stepNum || 1) ? 'bg-ob-purple text-white' :
                          'bg-gray-200 text-gray-400'
                        }`}>
                          {i + 1 < (step?.stepNum || 1) ? '✓' : i + 1}
                        </div>
                        {i < (step?.totalSteps || 4) - 1 && (
                          <div className={`w-2 h-[2px] mx-[1px] ${i + 1 < (step?.stepNum || 1) ? 'bg-ob-lime' : 'bg-gray-200'}`} />
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Phone Screen Content — matches real form */}
                  <div className="relative z-10 h-[calc(100%-100px)] overflow-y-auto bg-white">
                    {step?.screen === 'role' && <RoleScreen highlight={step.highlight} />}
                    {step?.screen === 'otp' && <OTPScreen typedEmail={emailType.text} otpDigits={otpType.digits} otpCode={step.otp} />}
                    {step?.screen === 'account' && <AccountScreen fieldValues={fieldValues} currentField={currentField} />}
                    {step?.screen === 'business' && <BusinessScreen fieldValues={fieldValues} currentField={currentField} />}
                    {step?.screen === 'review' && <ReviewScreen name={step.name} email={step.email} />}
                    {step?.screen === 'success' && <SuccessScreen role={selectedRole} />}
                  </div>

                  {/* Home Indicator */}
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-[100px] h-[4px] bg-black rounded-full z-20" />
                </div>

                {/* Side Buttons */}
                <div className="absolute right-[-2px] top-[130px] w-[3px] h-[40px] bg-gray-600 rounded-r" />
                <div className="absolute right-[-2px] top-[190px] w-[3px] h-[60px] bg-gray-600 rounded-r" />
                <div className="absolute left-[-2px] top-[170px] w-[3px] h-[30px] bg-gray-600 rounded-l" />
              </div>

              {/* Human Hand — animated, typing on the phone */}
              {handVisible && (
                <HumanHand
                  visible={true}
                  style={{
                    left: handPos.x,
                    top: handPos.y,
                    transform: `translate(-30%, -10%) ${fingerTap ? 'scale(0.95)' : 'scale(1)'}`,
                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                    filter: fingerTap ? 'brightness(0.95)' : 'none',
                  }}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
