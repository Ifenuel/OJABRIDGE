'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';

/**
 * InteractiveOnboardingDemo — Code-driven live-style demonstration
 * Shows how Customer, Retailer, and Vendor registration works on OjaBridge.
 * Uses synthetic data only — never creates real accounts.
 */

const ROLES = {
  customer: {
    label: 'Customer',
    icon: '🛒',
    desc: 'Shop and buy products',
    steps: [
      { title: 'Choose Your Role', subtitle: 'Select how you want to use OjaBridge', fields: [
        { type: 'select', label: 'Role', value: 'Customer', options: ['Customer', 'Vendor', 'Retailer'] }
      ]},
      { title: 'Select Location & Currency', subtitle: 'Choose your country and preferred currency', fields: [
        { type: 'select', label: 'Country', value: 'Nigeria', options: ['Nigeria', 'Ghana', 'Kenya', 'South Africa'] },
        { type: 'select', label: 'Currency', value: 'NGN (₦)', options: ['NGN (₦)', 'GHS (GH₵)', 'KES (KSh)', 'USD ($)'] },
      ]},
      { title: 'Verify Your Email', subtitle: 'We send a 6-digit code to your email', fields: [
        { type: 'email', label: 'Email Address', value: 'demo@example.com' },
        { type: 'otp', label: 'Verification Code', value: '482916', subtitle: 'Code sent to demo@example.com' },
      ]},
      { title: 'Set Up Account', subtitle: 'Create your secure credentials', fields: [
        { type: 'text', label: 'First Name', value: 'Adaeze' },
        { type: 'text', label: 'Last Name', value: 'Okonkwo' },
        { type: 'password', label: 'Password', value: '••••••••' },
      ]},
      { title: 'Account Created!', subtitle: 'Welcome to OjaBridge', dashboard: 'customer' },
    ],
  },
  retailer: {
    label: 'Retailer',
    icon: '📦',
    desc: 'Source products for your business',
    steps: [
      { title: 'Choose Your Role', subtitle: 'Select how you want to use OjaBridge', fields: [
        { type: 'select', label: 'Role', value: 'Retailer', options: ['Customer', 'Vendor', 'Retailer'] },
        { type: 'info', value: 'Retailer accounts require KYC/KYB verification before sourcing products.' },
      ]},
      { title: 'Select Location & Currency', subtitle: 'Choose your country and preferred currency', fields: [
        { type: 'select', label: 'Country', value: 'Nigeria', options: ['Nigeria', 'Ghana', 'Kenya'] },
        { type: 'select', label: 'Currency', value: 'NGN (₦)', options: ['NGN (₦)'] },
      ]},
      { title: 'Verify Your Email', subtitle: 'We send a 6-digit code to your email', fields: [
        { type: 'email', label: 'Email Address', value: 'demo@example.com' },
        { type: 'otp', label: 'Verification Code', value: '735291', subtitle: 'Code sent to demo@example.com' },
      ]},
      { title: 'Set Up Account', subtitle: 'Create your secure credentials', fields: [
        { type: 'text', label: 'First Name', value: 'Chukwuemeka' },
        { type: 'text', label: 'Last Name', value: 'Adeyemi' },
        { type: 'phone', label: 'Phone Number', value: '+234 812 345 6789' },
        { type: 'password', label: 'Password', value: '••••••••' },
      ]},
      { title: 'Business Information', subtitle: 'Tell us about your retail business', fields: [
        { type: 'text', label: 'Business Name', value: 'Emeka Retail Enterprises' },
        { type: 'select', label: 'Business Type', value: 'Private Limited Company', options: ['Sole Proprietorship', 'Private Limited Company', 'Partnership'] },
        { type: 'text', label: 'RC Number', value: 'RC1234567', subtitle: 'Corporate Affairs Commission registration' },
        { type: 'text', label: 'Business Address', value: '12 Marina Road, Lagos Island, Lagos' },
      ]},
      { title: 'Review & Submit', subtitle: 'Verify your information', dashboard: 'retailer' },
    ],
  },
  vendor: {
    label: 'Vendor',
    icon: '🏪',
    desc: 'Sell your products on the marketplace',
    steps: [
      { title: 'Choose Your Role', subtitle: 'Select how you want to use OjaBridge', fields: [
        { type: 'select', label: 'Role', value: 'Vendor', options: ['Customer', 'Vendor', 'Retailer'] },
        { type: 'info', value: 'Vendor accounts require KYC/KYB verification including a mandatory RC Number before you can start selling.' },
      ]},
      { title: 'Select Location & Currency', subtitle: 'Choose your country and preferred currency', fields: [
        { type: 'select', label: 'Country', value: 'Nigeria', options: ['Nigeria', 'Ghana', 'Kenya'] },
        { type: 'select', label: 'Currency', value: 'NGN (₦)', options: ['NGN (₦)'] },
      ]},
      { title: 'Verify Your Email', subtitle: 'We send a 6-digit code to your email', fields: [
        { type: 'email', label: 'Email Address', value: 'demo@example.com' },
        { type: 'otp', label: 'Verification Code', value: '591847', subtitle: 'Code sent to demo@example.com' },
      ]},
      { title: 'Set Up Account', subtitle: 'Create your secure credentials', fields: [
        { type: 'text', label: 'First Name', value: 'Fatima' },
        { type: 'text', label: 'Last Name', value: 'Abdullahi' },
        { type: 'phone', label: 'Phone Number', value: '+234 703 456 7890' },
        { type: 'password', label: 'Password', value: '••••••••' },
      ]},
      { title: 'Business Information', subtitle: 'Tell us about your business', fields: [
        { type: 'text', label: 'Business Name', value: 'Fatima Fashion Hub' },
        { type: 'select', label: 'Business Type', value: 'Private Limited Company', options: ['Sole Proprietorship', 'Private Limited Company', 'Partnership'] },
        { type: 'text', label: 'RC Number', value: 'RC9876543', subtitle: 'Mandatory for vendor verification' },
        { type: 'text', label: 'Business Address', value: '45 Broad Street, Lagos Island, Lagos' },
      ]},
      { title: 'Review & Submit', subtitle: 'Verify your information', dashboard: 'vendor' },
    ],
  },
};

function TypewriterText({ text, speed = 30, onComplete }) {
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
      {!done && <span className="inline-block w-0.5 h-4 bg-ob-purple animate-pulse ml-0.5 align-middle" />}
    </span>
  );
}

function CursorFaker() {
  return (
    <div className="absolute bottom-3 right-3 pointer-events-none">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-ob-purple animate-bounce">
        <path d="M5 3l14 8-6 2-2 6L5 3z" fill="currentColor" />
      </svg>
    </div>
  );
}

export default function OnboardingDemo() {
  const [selectedRole, setSelectedRole] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [autoAdvance, setAutoAdvance] = useState(true);
  const [fieldValues, setFieldValues] = useState({});
  const [visibleFields, setVisibleFields] = useState([]);
  const timerRef = useRef(null);
  const playRef = useRef(false);

  const role = selectedRole ? ROLES[selectedRole] : null;
  const steps = role?.steps || [];
  const step = steps[currentStep];
  const totalSteps = steps.length;

  // Auto-advance logic
  const advanceStep = useCallback(() => {
    if (!playRef.current) return;
    if (currentStep < totalSteps - 1) {
      setCurrentStep(prev => prev + 1);
      setVisibleFields([]);
      setFieldValues({});
    } else {
      setIsPlaying(false);
      playRef.current = false;
    }
  }, [currentStep, totalSteps]);

  // Field reveal animation
  useEffect(() => {
    if (!step || !isPlaying) return;
    if (!step.fields) { setVisibleFields([]); return; }

    let idx = 0;
    setVisibleFields([]);
    setFieldValues({});

    const revealField = () => {
      if (idx < step.fields.length && playRef.current) {
        setVisibleFields(prev => [...prev, idx]);
        const field = step.fields[idx];
        if (field.type !== 'info' && field.type !== 'otp') {
          // Typewriter effect for field value
          let charIdx = 0;
          const val = field.value;
          const typeInterval = setInterval(() => {
            if (charIdx < val.length && playRef.current) {
              charIdx++;
              setFieldValues(prev => ({ ...prev, [idx]: val.slice(0, charIdx) }));
            } else {
              clearInterval(typeInterval);
            }
          }, field.type === 'password' ? 80 : 40);
        } else if (field.type === 'otp') {
          // Reveal OTP as separate digits
          let digitIdx = 0;
          const val = field.value;
          const typeInterval = setInterval(() => {
            if (digitIdx < val.length && playRef.current) {
              digitIdx++;
              setFieldValues(prev => ({ ...prev, [idx]: val.slice(0, digitIdx) }));
            } else {
              clearInterval(typeInterval);
            }
          }, 150);
        }
        idx++;
        timerRef.current = setTimeout(revealField, isPlaying ? 600 : 0);
      } else {
        // All fields revealed, auto-advance
        timerRef.current = setTimeout(advanceStep, 1500);
      }
    };

    timerRef.current = setTimeout(revealField, 400);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [currentStep, isPlaying, step, advanceStep]);

  const startDemo = (roleKey) => {
    setSelectedRole(roleKey);
    setCurrentStep(0);
    setVisibleFields([]);
    setFieldValues({});
    setIsPlaying(true);
    playRef.current = true;
  };

  const togglePlay = () => {
    if (isPlaying) {
      setIsPlaying(false);
      playRef.current = false;
      if (timerRef.current) clearTimeout(timerRef.current);
    } else {
      setIsPlaying(true);
      playRef.current = true;
      // Trigger field reveal
      setCurrentStep(prev => prev);
    }
  };

  const nextStep = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    playRef.current = false;
    setIsPlaying(false);
    if (currentStep < totalSteps - 1) {
      setCurrentStep(prev => prev + 1);
      setVisibleFields([]);
      setFieldValues({});
    }
  };

  const prevStep = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    playRef.current = false;
    setIsPlaying(false);
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
      setVisibleFields([]);
      setFieldValues({});
    }
  };

  const restart = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setCurrentStep(0);
    setVisibleFields([]);
    setFieldValues({});
    setIsPlaying(true);
    playRef.current = true;
  };

  const switchRole = (roleKey) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setSelectedRole(roleKey);
    setCurrentStep(0);
    setVisibleFields([]);
    setFieldValues({});
    setIsPlaying(true);
    playRef.current = true;
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, []);

  const renderField = (field, idx) => {
    if (!visibleFields.includes(idx)) return null;
    const value = fieldValues[idx] || '';

    if (field.type === 'info') {
      return (
        <div key={idx} className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-700 mb-3 animate-fade-in">
          ⚠️ {field.value}
        </div>
      );
    }

    return (
      <div key={idx} className="mb-3 animate-fade-in">
        <label className="block text-xs font-medium text-gray-600 mb-1">{field.label}</label>
        {field.type === 'select' ? (
          <div className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-ob-navy">
            {value || field.value}
          </div>
        ) : field.type === 'otp' ? (
          <div className="flex gap-2">
            {field.value.split('').map((digit, i) => (
              <div key={i} className={`w-10 h-12 flex items-center justify-center border-2 rounded-lg text-lg font-bold transition-all ${
                i < (fieldValues[idx] || '').length ? 'border-ob-purple bg-ob-purple/5 text-ob-navy' : 'border-gray-200 bg-white text-gray-300'
              }`}>
                {(fieldValues[idx] || '')[i] || ''}
              </div>
            ))}
          </div>
        ) : field.type === 'password' ? (
          <div className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-400 tracking-widest">
            {value}
          </div>
        ) : (
          <div className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-ob-navy">
            {value}
          </div>
        )}
        {field.subtitle && <p className="text-[10px] text-gray-400 mt-1">{field.subtitle}</p>}
      </div>
    );
  };

  return (
    <section className="py-16 md:py-24 px-4 bg-gradient-to-b from-ob-light to-white" id="onboarding-demo">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <span className="text-ob-purple font-semibold text-sm uppercase tracking-wider">See It In Action</span>
          <h2 className="text-3xl md:text-4xl font-bold text-ob-navy mt-3 mb-4">
            Experience OjaBridge Onboarding
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Watch how easy it is to join OjaBridge. Choose a role and see the complete registration flow — from email verification to your personalized dashboard.
          </p>
        </div>

        {/* Role Selector */}
        {!selectedRole && (
          <div className="grid sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
            {Object.entries(ROLES).map(([key, role]) => (
              <button
                key={key}
                onClick={() => startDemo(key)}
                className="bg-white p-6 rounded-2xl border-2 border-gray-100 hover:border-ob-purple hover:shadow-lg transition-all text-center group"
              >
                <span className="text-4xl block mb-3 group-hover:scale-110 transition-transform">{role.icon}</span>
                <h3 className="font-bold text-ob-navy text-lg mb-1">{role.label}</h3>
                <p className="text-gray-500 text-sm">{role.desc}</p>
                <div className="mt-4 text-ob-purple text-sm font-medium group-hover:underline">
                  Watch Demo →
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Demo Player */}
        {selectedRole && (
          <div className="max-w-2xl mx-auto">
            {/* Role Tabs */}
            <div className="flex gap-2 mb-6 justify-center">
              {Object.entries(ROLES).map(([key, r]) => (
                <button
                  key={key}
                  onClick={() => switchRole(key)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    selectedRole === key
                      ? 'bg-ob-purple text-white'
                      : 'bg-white text-gray-600 border border-gray-200 hover:border-ob-purple'
                  }`}
                >
                  {r.icon} {r.label}
                </button>
              ))}
            </div>

            {/* Step Indicator */}
            <div className="flex items-center justify-center gap-1.5 mb-6">
              {Array.from({ length: totalSteps }, (_, i) => (
                <div key={i} className="flex items-center">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                    i < currentStep ? 'bg-ob-lime text-ob-navy' :
                    i === currentStep ? 'bg-ob-purple text-white ring-4 ring-ob-purple/20' :
                    'bg-gray-200 text-gray-400'
                  }`}>
                    {i < currentStep ? '✓' : i + 1}
                  </div>
                  {i < totalSteps - 1 && (
                    <div className={`w-4 h-0.5 mx-0.5 ${i < currentStep ? 'bg-ob-lime' : 'bg-gray-200'}`} />
                  )}
                </div>
              ))}
            </div>

            {/* Demo Frame */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
              {/* Browser Chrome */}
              <div className="bg-gray-50 border-b border-gray-200 px-4 py-3 flex items-center gap-3">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-amber-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                <div className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-1 text-xs text-gray-400 flex items-center gap-2">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  ojabridge.com/register
                </div>
              </div>

              {/* Demo Content */}
              <div className="p-6 relative min-h-[320px]">
                {step?.dashboard ? (
                  // Dashboard Preview
                  <div className="text-center animate-fade-in">
                    <div className="w-16 h-16 bg-ob-lime/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-3xl">🎉</span>
                    </div>
                    <h3 className="text-xl font-bold text-ob-navy mb-2">Welcome to OjaBridge!</h3>
                    <p className="text-gray-500 text-sm mb-6">Your {selectedRole} account is ready. Explore your dashboard to get started.</p>

                    <div className="bg-ob-light rounded-xl p-4 max-w-sm mx-auto text-left">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Your Dashboard</p>
                      {selectedRole === 'customer' && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-3 p-2 bg-white rounded-lg"><span>📦</span><span className="text-sm text-ob-navy">My Orders</span></div>
                          <div className="flex items-center gap-3 p-2 bg-white rounded-lg"><span>❤️</span><span className="text-sm text-ob-navy">Favorites</span></div>
                          <div className="flex items-center gap-3 p-2 bg-white rounded-lg"><span>📍</span><span className="text-sm text-ob-navy">Addresses</span></div>
                          <div className="flex items-center gap-3 p-2 bg-white rounded-lg"><span>🔔</span><span className="text-sm text-ob-navy">Notifications</span></div>
                        </div>
                      )}
                      {selectedRole === 'vendor' && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-3 p-2 bg-white rounded-lg"><span>📊</span><span className="text-sm text-ob-navy">Overview</span></div>
                          <div className="flex items-center gap-3 p-2 bg-white rounded-lg"><span>📦</span><span className="text-sm text-ob-navy">Products</span></div>
                          <div className="flex items-center gap-3 p-2 bg-white rounded-lg"><span>💰</span><span className="text-sm text-ob-navy">Payouts</span></div>
                          <div className="flex items-center gap-3 p-2 bg-white rounded-lg"><span>📋</span><span className="text-sm text-ob-navy">KYC & Verification</span></div>
                        </div>
                      )}
                      {selectedRole === 'retailer' && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-3 p-2 bg-white rounded-lg"><span>📊</span><span className="text-sm text-ob-navy">Overview</span></div>
                          <div className="flex items-center gap-3 p-2 bg-white rounded-lg"><span>🔍</span><span className="text-sm text-ob-navy">Sourcing</span></div>
                          <div className="flex items-center gap-3 p-2 bg-white rounded-lg"><span>📦</span><span className="text-sm text-ob-navy">My Orders</span></div>
                          <div className="flex items-center gap-3 p-2 bg-white rounded-lg"><span>📋</span><span className="text-sm text-ob-navy">KYC & Verification</span></div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  // Registration Step
                  <div>
                    <div className="mb-6">
                      <h3 className="text-lg font-bold text-ob-navy mb-1">
                        {step?.title && <TypewriterText text={step.title} speed={25} />}
                      </h3>
                      <p className="text-gray-500 text-sm">{step?.subtitle}</p>
                    </div>
                    <div>
                      {step?.fields?.map((field, idx) => renderField(field, idx))}
                    </div>
                  </div>
                )}

                {/* Cursor */}
                {isPlaying && <CursorFaker />}
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-3 mt-6">
              <button onClick={restart} className="p-2.5 rounded-full bg-white border border-gray-200 text-gray-600 hover:border-ob-purple transition-colors" title="Restart">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
              <button onClick={prevStep} disabled={currentStep === 0}
                className="p-2.5 rounded-full bg-white border border-gray-200 text-gray-600 hover:border-ob-purple transition-colors disabled:opacity-30" title="Back">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button onClick={togglePlay}
                className="p-3 rounded-full bg-ob-purple text-white hover:bg-ob-purple-dark transition-colors shadow-lg" title={isPlaying ? 'Pause' : 'Play'}>
                {isPlaying ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" /></svg>
                ) : (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                )}
              </button>
              <button onClick={nextStep} disabled={currentStep === totalSteps - 1}
                className="p-2.5 rounded-full bg-white border border-gray-200 text-gray-600 hover:border-ob-purple transition-colors disabled:opacity-30" title="Next">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Step Info */}
            <p className="text-center text-xs text-gray-400 mt-3">
              Step {currentStep + 1} of {totalSteps} — {ROLES[selectedRole]?.label} Flow
            </p>

            {/* CTA */}
            {step?.dashboard && (
              <div className="text-center mt-8 animate-fade-in">
                <Link href="/register" className="bg-ob-lime hover:bg-ob-lime-dark text-ob-navy font-semibold px-8 py-3 rounded-xl transition-all inline-flex items-center gap-2">
                  Create Your Account
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
