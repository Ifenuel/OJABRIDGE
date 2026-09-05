'use client';

import { useState, useEffect, useRef } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/context/AuthContext';

const VERIFICATION_STATES = {
  not_started: { label: 'Not Started', color: 'bg-gray-100 text-gray-600', icon: '📋', description: 'Complete all steps below to start the verification process.' },
  submitted: { label: 'Submitted', color: 'bg-amber-100 text-amber-700', icon: '📤', description: 'Your information has been submitted for review. Our team typically reviews within 1-3 business days.' },
  under_review: { label: 'Under Review', color: 'bg-amber-100 text-amber-700', icon: '⏳', description: 'Your information is being reviewed by our team. This typically takes 1-3 business days.' },
  verified: { label: 'Verified', color: 'bg-green-100 text-green-700', icon: '✅', description: 'Your identity and business have been verified. You can now publish products and receive orders.' },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-700', icon: '❌', description: 'Please review the feedback below and resubmit your information.' },
  suspended: { label: 'Suspended', color: 'bg-red-100 text-red-700', icon: '🚫', description: 'Your verification has been suspended. Please contact support for assistance.' },
};

const ID_TYPES = ['National ID (NIN)', "Driver's License", 'International Passport', "Voter's Card"];

const NIGERIAN_BANKS = [
  'Access Bank', 'Citibank Nigeria', 'Ecobank Nigeria', 'Fidelity Bank',
  'First Bank of Nigeria', 'First City Monument Bank (FCMB)', 'Globus Bank',
  'Guaranty Trust Bank (GTBank)', 'Heritage Bank', 'Keystone Bank',
  'Kuda Bank', 'Opay (Paycom)', 'Palmpay', 'Polaris Bank',
  'Providus Bank', 'Stanbic IBTC Bank', 'Standard Chartered Bank',
  'Sterling Bank', 'SunTrust Bank', 'Titan Trust Bank',
  'Union Bank', 'United Bank for Africa (UBA)', 'Unity Bank',
  'VFD Microfinance Bank', 'Wema Bank', 'Zenith Bank',
  'AB Microfinance Bank', 'ALAT by Wema', 'Amju Unique Microfinance Bank',
  'ASO Savings and Loans', 'Baobab Microfinance Bank', 'Branch International Finance',
  'Carbon (Formerly OneCredit)', 'Chaka', 'Cowrywise',
  'CrusaderSterling Microfinance Bank', 'DLM Asset Management',
  'Ekondo Microfinance Bank', 'Eyowo', 'Fairmoney',
  'Firmus Finance', 'FSDH Asset Managers', 'FundQuest Financial Services',
  'Hedon Consulting', 'Ignite Education Fund', 'IzMee Microfinance Bank',
  'Jubilee Life Mortgage Bank', 'Lagos Building Investment Company',
  'La Canera Microfinance Bank', 'Lotus Bank', 'Malachy Microfinance Bank',
  'Meridian Microfinance Bank', 'Microvis Microfinance Bank',
  'Money Trust Microfinance Bank', 'NPF Microfinance Bank',
  'Oakland Microfinance Bank', 'Ohafx Microfinance Bank',
  'Olympic Microfinance Bank', 'One Finance', 'Parallex Bank',
  'Petra Microfinance Bank', 'Pillar Microfinance Bank',
  'Rephidim Microfinance Bank', 'Rogo Microfinance Bank',
  'SafeHaven Microfinance Bank', 'Sparkle Microfinance Bank',
  'Spring Capital', 'Supreme Microfinance Bank',
  'Tangerine Microfinance Bank', 'TrustBanc Financial Services',
  'Unical Microfinance Bank', 'VAS2Nets Technologies',
  'Wagnet Microfinance Bank', 'Wow Momo', 'Zedvance',
];

// BVN validation: must be exactly 11 digits
function validateBvn(value) {
  if (!value) return null; // optional
  const cleaned = value.replace(/\s/g, '');
  if (!/^\d{11}$/.test(cleaned)) return 'BVN must be exactly 11 digits';
  return null;
}

// NIN validation: must be exactly 11 digits
function validateNin(value) {
  if (!value) return null; // optional
  const cleaned = value.replace(/\s/g, '');
  if (!/^\d{11}$/.test(cleaned)) return 'NIN must be exactly 11 digits';
  return null;
}

export default function VendorKycPage() {
  const { user } = useAuth();
  const fileInputRef = useRef(null);
  const [kycData, setKycData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);

  // Personal info
  const [fullName, setFullName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');

  // Identity verification
  const [bvn, setBvn] = useState('');
  const [nin, setNin] = useState('');
  const [idType, setIdType] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [idFile, setIdFile] = useState(null);
  const [idFileUrl, setIdFileUrl] = useState(null);
  const [idFileUploading, setIdFileUploading] = useState(false);

  // Validation errors
  const [errors, setErrors] = useState({});

  // Bank account
  const [bankName, setBankName] = useState('');
  const [bankSearch, setBankSearch] = useState('');
  const [showBankDropdown, setShowBankDropdown] = useState(false);
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');

  // Business info
  const [businessName, setBusinessName] = useState('');
  const [rcNumber, setRcNumber] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [businessAddress, setBusinessAddress] = useState('');

  // Load KYC data from API
  useEffect(() => { fetchKycData(); }, []);

  // Close bank dropdown on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (!e.target.closest('.bank-dropdown')) setShowBankDropdown(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const fetchKycData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/kyc', { credentials: 'include' });
      const data = await res.json();
      if (data.success && data.kyc) {
        setKycData(data.kyc);
        if (data.kyc.businessName) setBusinessName(data.kyc.businessName);
        if (data.kyc.rcNumber) setRcNumber(data.kyc.rcNumber);
        if (data.kyc.bankName) setBankName(data.kyc.bankName);
        if (data.kyc.idType) setIdType(data.kyc.idType);
        if (data.kyc.dateOfBirth) setDateOfBirth(data.kyc.dateOfBirth);
        if (data.kyc.bankAccountNumber) setAccountNumber('');
        if (data.kyc.accountName) setAccountName('');
        if (data.kyc.idDocumentUrl) setIdFileUrl(data.kyc.idDocumentUrl);
      }
    } catch (err) {
      console.error('Failed to fetch KYC data:', err);
    }
    setLoading(false);
  };

  const status = VERIFICATION_STATES[kycData?.status || 'not_started'] || VERIFICATION_STATES.not_started;

  // Calculate completion
  const stepsCompleted = [
    fullName && dateOfBirth,
    bvn || nin || (idType && idNumber),
    bankName && accountNumber && accountName,
    businessName && rcNumber,
  ].filter(Boolean).length;

  // Validate fields
  const validateField = (field, value) => {
    const newErrors = { ...errors };
    if (field === 'bvn') {
      const err = validateBvn(value);
      if (err) newErrors.bvn = err; else delete newErrors.bvn;
    }
    if (field === 'nin') {
      const err = validateNin(value);
      if (err) newErrors.nin = err; else delete newErrors.nin;
    }
    setErrors(newErrors);
  };

  // Handle file selection
  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      setErrors(prev => ({ ...prev, idFile: 'Only JPG, PNG, WebP, or PDF files are allowed' }));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrors(prev => ({ ...prev, idFile: 'File size must be under 5MB' }));
      return;
    }

    setErrors(prev => { const e = { ...prev }; delete e.idFile; return e; });
    setIdFile(file);
    setIdFileUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', credentials: 'include', body: formData });
      const data = await res.json();
      if (data.success) {
        setIdFileUrl(data.url);
      } else {
        setErrors(prev => ({ ...prev, idFile: data.error || 'Upload failed' }));
        setIdFile(null);
      }
    } catch (err) {
      setErrors(prev => ({ ...prev, idFile: 'Upload failed. Please try again.' }));
      setIdFile(null);
    }
    setIdFileUploading(false);
  };

  const handleSubmitForReview = async () => {
    // Validate before submit
    const newErrors = {};
    const bvnErr = validateBvn(bvn);
    const ninErr = validateNin(nin);
    if (bvnErr) newErrors.bvn = bvnErr;
    if (ninErr) newErrors.nin = ninErr;
    if (!fullName) newErrors.fullName = 'Full name is required';
    if (!dateOfBirth) newErrors.dateOfBirth = 'Date of birth is required';
    if (!bankName) newErrors.bankName = 'Bank name is required';
    if (!accountNumber) newErrors.accountNumber = 'Account number is required';
    if (!accountName) newErrors.accountName = 'Account name is required';
    if (!businessName) newErrors.businessName = 'Business name is required';
    if (!rcNumber) newErrors.rcNumber = 'RC number is required';
    if (!bvn && !nin) newErrors.identity = 'At least one of BVN or NIN is required';
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setMessage({ type: 'error', text: 'Please fix all validation errors before submitting.' });
      return;
    }

    setSubmitting(true);
    setMessage(null);
    try {
      const res = await fetch('/api/kyc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          fullName,
          dateOfBirth,
          bvn: bvn.replace(/\s/g, ''),
          nin: nin.replace(/\s/g, ''),
          idType,
          idNumber,
          idDocumentUrl: idFileUrl,
          bankName,
          bankAccountNumber: accountNumber,
          bankAccountName: accountName,
          businessName,
          rcNumber,
          businessType,
          businessAddress,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: 'KYC/KYB information submitted successfully! Our team will review your documents shortly. You will receive a notification once reviewed.' });
        await fetchKycData();
      } else {
        setMessage({ type: 'error', text: data.error || data.errors?.[0] || 'Submission failed. Please try again.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Network error. Please check your connection and try again.' });
    }
    setSubmitting(false);
  };

  const canSubmit = fullName && dateOfBirth && (bvn || nin) && bankName && accountNumber && accountName && businessName && rcNumber;

  return (
    <DashboardLayout role="retailer">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-ob-navy">KYC & Business Verification</h1>
        <p className="text-gray-500 text-sm mt-1">Complete identity and business verification to start selling on OjaBridge.</p>
      </div>

      {/* Status Message */}
      {message && (
        <div className={`p-4 rounded-lg mb-6 ${message.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
          {message.text}
        </div>
      )}

      {/* Overall Status Banner */}
      <div className={`p-6 rounded-2xl mb-8 ${kycData?.status === 'verified' ? 'bg-green-50 border border-green-200' : kycData?.status === 'submitted' || kycData?.status === 'under_review' ? 'bg-amber-50 border border-amber-200' : kycData?.status === 'rejected' || kycData?.status === 'suspended' ? 'bg-red-50 border border-red-200' : 'bg-blue-50 border border-blue-200'}`}>
        <div className="flex items-start gap-4">
          <span className="text-3xl">{status.icon}</span>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h3 className="font-bold text-ob-navy">Verification Status</h3>
              <span className={`${status.color} px-3 py-1 rounded-full text-sm font-medium`}>{status.label}</span>
            </div>
            <p className="text-gray-600 text-sm">{status.description}</p>
            {kycData?.rejectionReason && (kycData?.status === 'rejected') && (
              <div className="mt-3 p-3 bg-red-100 border border-red-200 rounded-lg">
                <p className="text-xs font-semibold text-red-700 mb-1">Rejection Reason:</p>
                <p className="text-sm text-red-600">{kycData.rejectionReason}</p>
              </div>
            )}
            {kycData?.status !== 'verified' && (
              <div className="mt-3">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Completion Progress</span>
                  <span>{stepsCompleted}/4 steps</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-ob-purple h-2 rounded-full transition-all duration-500" style={{ width: `${(stepsCompleted / 4) * 100}%` }} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Step Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Personal Info', done: fullName && dateOfBirth, icon: '👤' },
          { label: 'Identity (BVN/NIN)', done: bvn || nin || (idType && idNumber), icon: '🪪' },
          { label: 'Bank Account', done: bankName && accountNumber && accountName, icon: '🏦' },
          { label: 'Business (KYB)', done: businessName && rcNumber, icon: '🏢' },
        ].map((item, i) => (
          <div key={i} className="bg-white p-4 rounded-xl border border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">{item.icon}</span>
              <span className="text-xs text-gray-500">{item.label}</span>
            </div>
            <span className={`text-xs px-2 py-0.5 rounded-full ${item.done ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
              {item.done ? 'Completed' : 'Pending'}
            </span>
          </div>
        ))}
      </div>

      {/* Verification Steps */}
      <div className="space-y-6 max-w-2xl">

        {/* Step 1: Personal Information */}
        <div className="bg-white p-6 rounded-xl border border-gray-100">
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-8 h-8 ${fullName && dateOfBirth ? 'bg-green-500' : 'bg-ob-purple'} text-white rounded-full flex items-center justify-center text-sm font-bold`}>
              {fullName && dateOfBirth ? '✓' : '1'}
            </div>
            <div>
              <h3 className="font-bold text-ob-navy">Personal Information</h3>
              <p className="text-xs text-gray-400">Required for identity verification</p>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs text-gray-500 mb-1">Full Legal Name *</label>
              <input type="text" value={fullName} onChange={e => setFullName(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-ob-purple outline-none" placeholder="As it appears on your government ID" />
              {errors.fullName && <p className="text-xs text-red-500 mt-1">{errors.fullName}</p>}
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Date of Birth *</label>
              <input type="date" value={dateOfBirth} onChange={e => setDateOfBirth(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-ob-purple outline-none" />
              {errors.dateOfBirth && <p className="text-xs text-red-500 mt-1">{errors.dateOfBirth}</p>}
            </div>
          </div>
        </div>

        {/* Step 2: Identity Verification — BVN, NIN, Government ID */}
        <div className="bg-white p-6 rounded-xl border border-gray-100">
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-8 h-8 ${bvn || nin || (idType && idNumber) ? 'bg-green-500' : 'bg-ob-purple'} text-white rounded-full flex items-center justify-center text-sm font-bold`}>
              {bvn || nin || (idType && idNumber) ? '✓' : '2'}
            </div>
            <div>
              <h3 className="font-bold text-ob-navy">Identity Verification</h3>
              <p className="text-xs text-gray-400">BVN, NIN and/or Government-issued ID required</p>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4 text-xs text-amber-700">
            ⚠️ At least one of BVN or NIN is required. This information is used for identity verification and fraud prevention. It is kept confidential and never shared with other users.
          </div>

          {errors.identity && <p className="text-xs text-red-500 mb-3">{errors.identity}</p>}

          <div className="grid sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">BVN (Bank Verification Number)</label>
              <input type="text" value={bvn} onChange={e => { setBvn(e.target.value); validateField('bvn', e.target.value); }} maxLength={11}
                className={`w-full px-4 py-2.5 border rounded-lg text-sm outline-none ${errors.bvn ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-ob-purple'}`} placeholder="11-digit BVN" />
              <p className="text-[10px] text-gray-400 mt-1">Dial *565*0# to check your BVN</p>
              {errors.bvn && <p className="text-xs text-red-500 mt-1">{errors.bvn}</p>}
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">NIN (National Identification Number)</label>
              <input type="text" value={nin} onChange={e => { setNin(e.target.value); validateField('nin', e.target.value); }} maxLength={11}
                className={`w-full px-4 py-2.5 border rounded-lg text-sm outline-none ${errors.nin ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-ob-purple'}`} placeholder="11-digit NIN" />
              <p className="text-[10px] text-gray-400 mt-1">Dial *346# to check your NIN</p>
              {errors.nin && <p className="text-xs text-red-500 mt-1">{errors.nin}</p>}
            </div>
          </div>

          <div className="border-t border-gray-100 pt-4 mt-4">
            <p className="text-xs text-gray-500 font-medium mb-3">Government-Issued ID (optional but recommended)</p>
            <div className="grid sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">ID Type</label>
                <select value={idType} onChange={e => setIdType(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-ob-purple outline-none">
                  <option value="">Select ID type</option>
                  {ID_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">ID Number</label>
                <input type="text" value={idNumber} onChange={e => setIdNumber(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-ob-purple outline-none" placeholder="ID number" />
              </div>
            </div>

            {/* Upload ID — Real file input */}
            <div>
              <label className="block text-xs text-gray-500 mb-1">Upload ID Document *</label>
              <input type="file" ref={fileInputRef} accept="image/jpeg,image/png,image/webp,application/pdf" onChange={handleFileSelect}
                className="hidden" id="id-upload" />
              
              {idFileUrl ? (
                <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-green-700 truncate">{idFile?.name || 'ID Document Uploaded'}</p>
                    <p className="text-xs text-green-600">Successfully uploaded</p>
                  </div>
                  <button type="button" onClick={() => { setIdFile(null); setIdFileUrl(null); }}
                    className="text-red-500 hover:text-red-700 text-xs font-medium">Remove</button>
                </div>
              ) : (
                <label htmlFor="id-upload" className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-ob-purple transition-colors cursor-pointer">
                  {idFileUploading ? (
                    <>
                      <div className="animate-spin h-8 w-8 border-2 border-ob-purple border-t-transparent rounded-full mb-2" />
                      <p className="text-gray-500 text-sm">Uploading...</p>
                    </>
                  ) : (
                    <>
                      <svg className="w-8 h-8 text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                      <p className="text-gray-500 text-sm">Tap to upload a clear photo of your ID</p>
                      <p className="text-gray-400 text-xs mt-1">JPG, PNG, WebP or PDF. Max 5MB.</p>
                    </>
                  )}
                </label>
              )}
              {errors.idFile && <p className="text-xs text-red-500 mt-1">{errors.idFile}</p>}
            </div>
          </div>
        </div>

        {/* Step 3: Bank Account */}
        <div className="bg-white p-6 rounded-xl border border-gray-100">
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-8 h-8 ${bankName && accountNumber && accountName ? 'bg-green-500' : 'bg-ob-purple'} text-white rounded-full flex items-center justify-center text-sm font-bold`}>
              {bankName && accountNumber && accountName ? '✓' : '3'}
            </div>
            <div>
              <h3 className="font-bold text-ob-navy">Bank Account</h3>
              <p className="text-xs text-gray-400">Connect your bank for receiving payouts</p>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="relative bank-dropdown">
              <label className="block text-xs text-gray-500 mb-1">Bank Name *</label>
              <div onClick={() => setShowBankDropdown(!showBankDropdown)} className={`w-full px-4 py-2.5 border rounded-lg text-sm cursor-pointer bg-white flex items-center justify-between ${errors.bankName ? 'border-red-300' : 'border-gray-200'}`}>
                <span className={bankName ? 'text-ob-navy' : 'text-gray-400'}>{bankName || 'Search and select your bank'}</span>
                <svg className={`w-4 h-4 text-gray-400 transition-transform ${showBankDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </div>
              {showBankDropdown && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-hidden">
                  <div className="p-2 border-b border-gray-100 sticky top-0 bg-white">
                    <input type="text" value={bankSearch} onChange={e => setBankSearch(e.target.value)} placeholder="Type to search banks..."
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-ob-purple" autoFocus />
                  </div>
                  <div className="overflow-y-auto max-h-48">
                    {NIGERIAN_BANKS.filter(b => !bankSearch || b.toLowerCase().includes(bankSearch.toLowerCase())).map(bank => (
                      <button key={bank} type="button" onClick={() => { setBankName(bank); setBankSearch(''); setShowBankDropdown(false); }}
                        className={`w-full text-left px-4 py-2.5 text-sm hover:bg-ob-purple/5 transition-colors ${bankName === bank ? 'bg-ob-purple/10 text-ob-purple font-medium' : 'text-gray-700'}`}>
                        {bank}
                      </button>
                    ))}
                    {NIGERIAN_BANKS.filter(b => !bankSearch || b.toLowerCase().includes(bankSearch.toLowerCase())).length === 0 && (
                      <div className="px-4 py-3 text-sm text-gray-400 text-center">No banks found matching &quot;{bankSearch}&quot;</div>
                    )}
                  </div>
                </div>
              )}
              {bankName && (
                <button type="button" onClick={() => { setBankName(''); setBankSearch(''); }} className="absolute right-8 top-7 text-gray-400 hover:text-red-500 text-xs">Clear</button>
              )}
              {errors.bankName && <p className="text-xs text-red-500 mt-1">{errors.bankName}</p>}
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Account Number *</label>
              <input type="text" value={accountNumber} onChange={e => setAccountNumber(e.target.value)} maxLength={10}
                className={`w-full px-4 py-2.5 border rounded-lg text-sm outline-none ${errors.accountNumber ? 'border-red-300' : 'border-gray-200 focus:border-ob-purple'}`} placeholder="10-digit account number" />
              {errors.accountNumber && <p className="text-xs text-red-500 mt-1">{errors.accountNumber}</p>}
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Account Name *</label>
              <input type="text" value={accountName} onChange={e => setAccountName(e.target.value)}
                className={`w-full px-4 py-2.5 border rounded-lg text-sm outline-none ${errors.accountName ? 'border-red-300' : 'border-gray-200 focus:border-ob-purple'}`} placeholder="Name on bank account" />
              {errors.accountName && <p className="text-xs text-red-500 mt-1">{errors.accountName}</p>}
            </div>
          </div>
        </div>

        {/* Step 4: Business Information (KYB) */}
        <div className="bg-white p-6 rounded-xl border border-gray-100">
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-8 h-8 ${businessName && rcNumber ? 'bg-green-500' : 'bg-ob-purple'} text-white rounded-full flex items-center justify-center text-sm font-bold`}>
              {businessName && rcNumber ? '✓' : '4'}
            </div>
            <div>
              <h3 className="font-bold text-ob-navy">Business Information (KYB)</h3>
              <p className="text-xs text-gray-400">Business registration details</p>
            </div>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4 text-xs text-amber-700">
            ⚠️ RC Number (Corporate Affairs Commission registration) is mandatory. Vendors cannot publish products without a valid RC Number.
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs text-gray-500 mb-1">Registered Business Name *</label>
              <input type="text" value={businessName} onChange={e => setBusinessName(e.target.value)}
                className={`w-full px-4 py-2.5 border rounded-lg text-sm outline-none ${errors.businessName ? 'border-red-300' : 'border-gray-200 focus:border-ob-purple'}`} placeholder="As registered with CAC" />
              {errors.businessName && <p className="text-xs text-red-500 mt-1">{errors.businessName}</p>}
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">RC Number *</label>
              <input type="text" value={rcNumber} onChange={e => setRcNumber(e.target.value)}
                className={`w-full px-4 py-2.5 border rounded-lg text-sm outline-none ${errors.rcNumber ? 'border-red-300' : 'border-gray-200 focus:border-ob-purple'}`} placeholder="RC1234567" />
              {errors.rcNumber && <p className="text-xs text-red-500 mt-1">{errors.rcNumber}</p>}
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Business Type</label>
              <select value={businessType} onChange={e => setBusinessType(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-ob-purple outline-none">
                <option value="">Select type</option>
                <option>Sole Proprietorship</option><option>Private Limited Company</option>
                <option>Public Limited Company</option><option>Partnership</option><option>Other</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs text-gray-500 mb-1">Business Address</label>
              <input type="text" value={businessAddress} onChange={e => setBusinessAddress(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-ob-purple outline-none" placeholder="Full business address" />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <button onClick={handleSubmitForReview} disabled={!canSubmit || submitting || kycData?.status === 'verified'}
          className="bg-ob-purple hover:bg-ob-purple-dark text-white font-semibold px-8 py-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto">
          {submitting ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
              Submitting...
            </span>
          ) : kycData?.status === 'verified' ? '✓ Already Verified' : kycData?.status === 'submitted' || kycData?.status === 'under_review' ? 'Update Submission' : 'Submit for Verification'}
        </button>
      </div>
    </DashboardLayout>
  );
}
