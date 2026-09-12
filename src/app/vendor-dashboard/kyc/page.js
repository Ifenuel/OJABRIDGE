'use client';

import { useState, useEffect, useRef } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import { NIGERIAN_BANKS as FALLBACK_BANKS, NIGERIAN_BANK_CODES } from '@/lib/nigerian-banks';

const VERIFICATION_STATES = {
  not_started: { label: 'Not Started', color: 'bg-gray-100 text-gray-600', icon: '📋', description: 'Complete all steps below to start the verification process.' },
  submitted: { label: 'Submitted', color: 'bg-amber-100 text-amber-700', icon: '📤', description: 'Your information has been submitted for review. Our team typically reviews within 1-3 business days.' },
  under_review: { label: 'Under Review', color: 'bg-amber-100 text-amber-700', icon: '⏳', description: 'Your information is being reviewed by our team. This typically takes 1-3 business days.' },
  verified: { label: 'Verified', color: 'bg-green-100 text-green-700', icon: '✅', description: 'Your identity and business have been verified. You can now publish products and receive orders.' },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-700', icon: '❌', description: 'Please review the feedback below and resubmit your information.' },
  requires_additional_info: { label: 'Additional Info Required', color: 'bg-amber-100 text-amber-700', icon: '📄', description: 'Our team needs more information. Please review the requirements below and resubmit.' },
  suspended: { label: 'Suspended', color: 'bg-red-100 text-red-700', icon: '🚫', description: 'Your verification has been suspended. Please contact support for assistance.' },
  banned: { label: 'Account Banned', color: 'bg-red-200 text-red-800', icon: '🚫', description: 'Your account has been banned from the platform. Please contact support for more information.' },
};

const ID_TYPES = ['National ID (NIN)', "Driver's License", 'International Passport', "Voter's Card"];

// Fallback only — the live list is loaded from /api/banks (Paystack-backed)
const NIGERIAN_BANKS = FALLBACK_BANKS;

function validateBvn(value) {
  const cleaned = (value || '').replace(/\s/g, '');
  if (!cleaned) return 'BVN is required';
  if (!/^\d{11}$/.test(cleaned)) return 'BVN must be exactly 11 digits';
  return null;
}

function validateNin(value) {
  const cleaned = (value || '').replace(/\s/g, '');
  if (!cleaned) return 'NIN is required';
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

  // Live bank list + Paystack account resolution
  const [banks, setBanks] = useState(FALLBACK_BANKS);
  const [resolving, setResolving] = useState(false);
  const [resolveNote, setResolveNote] = useState(null);

  useEffect(() => { fetchKycData(); }, []);

  // Load live bank list from /api/banks (Paystack; falls back to bundled list)
  useEffect(() => {
    fetch('/api/banks', { credentials: 'include' })
      .then(r => r.json())
      .then(d => {
        if (d.success && Array.isArray(d.banks) && d.banks.length) {
          setBanks(d.banks.map(b => b.name || b));
        }
      })
      .catch(() => {}); // fallback list already in place
  }, []);

  // Paystack account resolution: when bank + full account number are entered,
  // verify the account and confirm the account name belongs to the user.
  useEffect(() => {
    const acct = accountNumber.replace(/\s/g, '');
    const code = NIGERIAN_BANK_CODES[bankName];
    if (!bankName || !code || acct.length !== 10 || !/^\d{10}$/.test(acct)) {
      setResolveNote(null);
      return;
    }
    let cancelled = false;
    setResolving(true);
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/banks?resolve=1&accountNumber=${acct}&bankCode=${code}`, { credentials: 'include' });
        const data = await res.json();
        if (cancelled) return;
        if (data.success && data.accountName) {
          setAccountName(data.accountName);
          setResolveNote({ ok: true, text: `✓ Verified: ${data.accountName}` });
        } else if (data.unavailable) {
          setResolveNote({ ok: false, text: 'Bank check unavailable — we will confirm the account name during review.' });
        } else {
          setResolveNote({ ok: false, text: data.error || 'Account could not be verified. Please check the number and bank.' });
        }
      } catch {
        if (!cancelled) setResolveNote({ ok: false, text: 'Bank check unavailable — we will confirm the account name during review.' });
      } finally {
        if (!cancelled) setResolving(false);
      }
    }, 700); // debounce
    return () => { cancelled = true; clearTimeout(t); setResolving(false); };
  }, [accountNumber, bankName]);

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
        // DO NOT clear bank account fields — they are masked from API
        if (data.kyc.accountName) setAccountName(data.kyc.accountName);
        // Prefill masked sensitive values so users SEE their saved data.
        // Masked strings ("****1234") are accepted by validation as "unchanged"
        // and the server keeps stored values for them — no retyping secrets.
        if (data.kyc.bvn) setBvn(data.kyc.bvn);
        if (data.kyc.nin) setNin(data.kyc.nin);
        if (data.kyc.bankAccountNumber) setAccountNumber(data.kyc.bankAccountNumber);
        // Bank name + account holder name may have been verified on a previous submission.
        // Show them so the vendor actually sees what is on file (e.g. account holder name).
        if (data.kyc.bankName) setBankName(data.kyc.bankName);
        // Show saved account holder name even for verified vendors — but never clobber a value the user is currently editing.
        if (data.kyc.bankAccountName && !accountName) setAccountName(data.kyc.bankAccountName);
        if (data.kyc.idDocumentUrl) setIdFileUrl(data.kyc.idDocumentUrl);
        if (data.kyc.fullName) setFullName(data.kyc.fullName);
        if (data.kyc.businessType) setBusinessType(data.kyc.businessType);
        if (data.kyc.businessAddress) setBusinessAddress(data.kyc.businessAddress);
      }
    } catch (err) {
      console.error('Failed to fetch KYC data:', err);
    }
    setLoading(false);
  };

  const status = VERIFICATION_STATES[kycData?.status || 'not_started'] || VERIFICATION_STATES.not_started;

  // Masked-value aware checks — fields prefilled as "****1234" count as SAVED/unchanged.
  // The server keeps stored values for masked inputs, so users never retype secrets to update other fields.
  const hasDigits = (val, n) => !!val && !String(val).includes('*') && val.replace(/\s/g, '').length === n;
  const isMasked = (val) => !!val && String(val).includes('*');
  const bvnOk = hasDigits(bvn, 11) || isMasked(bvn);
  const ninOk = hasDigits(nin, 11) || isMasked(nin);
  const acctOk = (!!accountNumber && !accountNumber.includes('*') && accountNumber.replace(/\s/g, '').length >= 6) || isMasked(accountNumber);

  // Calculate completion — BOTH BVN and NIN required for step 2
  const step1Done = fullName && dateOfBirth;
  const step2Done = bvnOk && ninOk;
  const step3Done = bankName && acctOk && accountName;
  const step4Done = businessName && rcNumber;
  const stepsCompleted = [step1Done, step2Done, step3Done, step4Done].filter(Boolean).length;

  const validateField = (field, value) => {
    const newErrors = { ...errors };
    if (field === 'bvn') {
      const err = validateBvn(value);
      if (err && value) newErrors.bvn = err; else delete newErrors.bvn;
    }
    if (field === 'nin') {
      const err = validateNin(value);
      if (err && value) newErrors.nin = err; else delete newErrors.nin;
    }
    setErrors(newErrors);
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
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
      formData.append('folder', 'kyc'); // private — only owner + admins can view via /api/secure-document
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
    const newErrors = {};
    if (!bvnOk) newErrors.bvn = bvn ? validateBvn(bvn) : 'BVN is required';
    if (!ninOk) newErrors.nin = nin ? validateNin(nin) : 'NIN is required';
    if (!fullName) newErrors.fullName = 'Full name is required';
    if (!dateOfBirth) newErrors.dateOfBirth = 'Date of birth is required';
    if (!bankName) newErrors.bankName = 'Bank name is required';
    if (!acctOk) newErrors.accountNumber = 'Account number is required';
    if (!accountName) newErrors.accountName = 'Account name is required';
    if (!businessName) newErrors.businessName = 'Business name is required';
    if (!rcNumber) newErrors.rcNumber = 'RC number is required';
    
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
          bankCode: NIGERIAN_BANK_CODES[bankName] || null,
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

  // Both BVN and NIN are now required
  const canSubmit = fullName && dateOfBirth && bvnOk && ninOk && bankName && acctOk && accountName && businessName && rcNumber;

  // Show caution only when BVN or NIN is missing
  const showIdentityCaution = !bvn || !nin;

  return (
    <DashboardLayout role="vendor">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-ob-navy">KYC & Business Verification</h1>
        <p className="text-gray-500 text-sm mt-1">Complete identity and business verification to start selling on OjaBridge.</p>
      </div>

      {message && (
        <div className={`p-4 rounded-lg mb-6 ${message.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
          {message.text}
        </div>
      )}

      {/* Overall Status Banner */}
      <div className={`p-6 rounded-2xl mb-8 ${kycData?.status === 'verified' ? 'bg-green-50 border border-green-200' : kycData?.status === 'submitted' || kycData?.status === 'under_review' || kycData?.status === 'requires_additional_info' ? 'bg-amber-50 border border-amber-200' : kycData?.status === 'rejected' || kycData?.status === 'suspended' ? 'bg-red-50 border border-red-200' : 'bg-blue-50 border border-blue-200'}`}>
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
            {kycData?.additionalInfoRequest && (kycData?.status === 'requires_additional_info') && (
              <div className="mt-3 p-3 bg-amber-100 border border-amber-200 rounded-lg">
                <p className="text-xs font-semibold text-amber-700 mb-1">📄 Additional Information Required:</p>
                <p className="text-sm text-amber-600">{kycData.additionalInfoRequest}</p>
              </div>
            )}
            {kycData?.status !== 'verified' && (
              <div className="mt-3">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Completion Progress</span>
                  <span className={stepsCompleted === 4 ? 'text-green-600 font-semibold' : ''}>{stepsCompleted}/4 steps completed</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className={`h-2 rounded-full transition-all duration-500 ${stepsCompleted === 4 ? 'bg-green-500' : 'bg-ob-purple'}`} style={{ width: `${(stepsCompleted / 4) * 100}%` }} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Step Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Personal Info', done: step1Done, icon: '👤' },
          { label: 'Identity (BVN & NIN)', done: step2Done, icon: '🪪' },
          { label: 'Bank Account', done: step3Done, icon: '🏦' },
          { label: 'Business (KYB)', done: step4Done, icon: '🏢' },
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
            <div className={`w-8 h-8 ${step1Done ? 'bg-green-500' : 'bg-ob-purple'} text-white rounded-full flex items-center justify-center text-sm font-bold`}>
              {step1Done ? '✓' : '1'}
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

        {/* Step 2: Identity Verification — BOTH BVN and NIN required */}
        <div className="bg-white p-6 rounded-xl border border-gray-100">
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-8 h-8 ${step2Done ? 'bg-green-500' : 'bg-ob-purple'} text-white rounded-full flex items-center justify-center text-sm font-bold`}>
              {step2Done ? '✓' : '2'}
            </div>
            <div>
              <h3 className="font-bold text-ob-navy">Identity Verification</h3>
              <p className="text-xs text-gray-400">Both BVN and NIN are required</p>
            </div>
          </div>

          {/* Caution — only shows when BVN or NIN is missing */}
          {showIdentityCaution && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4 text-xs text-amber-700">
              ⚠️ Both BVN and NIN are required for identity verification. This information is used for fraud prevention and is kept strictly confidential.
            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">BVN (Bank Verification Number) *</label>
              <input type="text" value={bvn} onChange={e => { setBvn(e.target.value); validateField('bvn', e.target.value); }} maxLength={11}
                className={`w-full px-4 py-2.5 border rounded-lg text-sm outline-none ${errors.bvn ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-ob-purple'}`} placeholder="11-digit BVN" />
              <p className="text-[10px] text-gray-400 mt-1">Dial *565*0# to check your BVN</p>
              {isMasked(bvn) && <p className="text-[10px] text-green-600 mt-1">✓ Saved on file — leave as is or type a new BVN to change it</p>}
              {errors.bvn && <p className="text-xs text-red-500 mt-1">{errors.bvn}</p>}
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">NIN (National Identification Number) *</label>
              <input type="text" value={nin} onChange={e => { setNin(e.target.value); validateField('nin', e.target.value); }} maxLength={11}
                className={`w-full px-4 py-2.5 border rounded-lg text-sm outline-none ${errors.nin ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-ob-purple'}`} placeholder="11-digit NIN" />
              <p className="text-[10px] text-gray-400 mt-1">Dial *346# to check your NIN</p>
              {isMasked(nin) && <p className="text-[10px] text-green-600 mt-1">✓ Saved on file — leave as is or type a new NIN to change it</p>}
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

            {/* Upload ID */}
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
            <div className={`w-8 h-8 ${step3Done || !!(kycData?.bankName) ? 'bg-green-500' : 'bg-ob-purple'} text-white rounded-full flex items-center justify-center text-sm font-bold`}>
              {step3Done || !!(kycData?.bankName) ? '✓' : '3'}
            </div>
            <div>
              <h3 className="font-bold text-ob-navy">Bank Account</h3>
              <p className="text-xs text-gray-400">Connect your bank for receiving payouts</p>
            </div>
          </div>
          {kycData?.bankName && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 text-xs text-blue-700">
              <span className="font-medium">Bank on file:</span> {kycData.bankName}
              {kycData.bankAccountName ? ` · Account holder: ${kycData.bankAccountName}` : ''}
              {kycData.bankAccountNumber ? ` · Account: ••••${kycData.bankAccountNumber.replace(/\*/g, '')}` : ''}
            </div>
          )}
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
                    {banks.filter(b => !bankSearch || b.toLowerCase().includes(bankSearch.toLowerCase())).map(bank => (
                      <button key={bank} type="button" onClick={() => { setBankName(bank); setBankSearch(''); setShowBankDropdown(false); }}
                        className={`w-full text-left px-4 py-2.5 text-sm hover:bg-ob-purple/5 transition-colors ${bankName === bank ? 'bg-ob-purple/10 text-ob-purple font-medium' : 'text-gray-700'}`}>
                        {bank}
                      </button>
                    ))}
                    {banks.filter(b => !bankSearch || b.toLowerCase().includes(bankSearch.toLowerCase())).length === 0 && (
                      <div className="px-4 py-3 text-sm text-gray-400 text-center">No banks found matching &quot;{bankSearch}&quot;</div>
                    )}
                  </div>
                </div>
              )}
              {errors.bankName && <p className="text-xs text-red-500 mt-1">{errors.bankName}</p>}
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Account Number *</label>
              <input type="text" inputMode="numeric" value={accountNumber} onChange={e => setAccountNumber(e.target.value.replace(/[^0-9]/g, ''))} maxLength={10}
                className={`w-full px-4 py-2.5 border rounded-lg text-sm outline-none ${errors.accountNumber ? 'border-red-300' : 'border-gray-200 focus:border-ob-purple'}`} placeholder="10-digit account number" />
              {resolving && <p className="text-[10px] text-gray-500 mt-1">Verifying account…</p>}
              {!resolving && resolveNote && <p className={`text-[10px] mt-1 ${resolveNote.ok ? 'text-green-600' : 'text-amber-600'}`}>{resolveNote.text}</p>}
              {!resolving && !resolveNote && isMasked(accountNumber) && <p className="text-[10px] text-green-600 mt-1">✓ Saved on file — leave as is or type the full number to change it</p>}
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
            <div className={`w-8 h-8 ${step4Done ? 'bg-green-500' : 'bg-ob-purple'} text-white rounded-full flex items-center justify-center text-sm font-bold`}>
              {step4Done ? '✓' : '4'}
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
        {kycData?.status === 'verified' && (
          <p className="text-xs text-green-600 mb-3">✓ Your business is verified. You can still review or update the information below and resubmit if anything changes.</p>
        )}
        <button onClick={handleSubmitForReview} disabled={!canSubmit || submitting}
          className="bg-ob-purple hover:bg-ob-purple-dark text-white font-semibold px-8 py-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto">
          {submitting ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
              Submitting...
            </span>
          ) : kycData?.status === 'verified' ? '📝 Review & Resubmit' : kycData?.status === 'submitted' || kycData?.status === 'under_review' ? 'Update Submission' : kycData?.status === 'requires_additional_info' ? '📄 Resubmit with Additional Info' : 'Submit for Verification'}
        </button>
      </div>
    </DashboardLayout>
  );
}
