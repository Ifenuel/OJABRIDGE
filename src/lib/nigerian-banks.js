/**
 * Nigerian bank list + codes — single source of truth.
 *
 * The KYC pages load the LIVE list from /api/banks (Paystack-backed).
 * These constants are the offline fallback so the form always works,
 * even if the Paystack request fails.
 */

export const NIGERIAN_BANKS = [
  'Access Bank', 'Citibank Nigeria', 'Ecobank Nigeria',
  'Fidelity Bank', 'First Bank of Nigeria', 'First City Monument Bank (FCMB)',
  'Globus Bank', 'Guaranty Trust Bank (GTBank)', 'Heritage Bank',
  'Keystone Bank', 'Kuda Bank', 'Opay (Paycom)', 'Palmpay',
  'Polaris Bank', 'Providus Bank', 'Stanbic IBTC Bank',
  'Standard Chartered Bank', 'Sterling Bank', 'SunTrust Bank',
  'Titan Trust Bank', 'Union Bank', 'United Bank for Africa (UBA)', 'Unity Bank',
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

export const NIGERIAN_BANK_CODES = {
  'Access Bank': '044', 'Citibank Nigeria': '023', 'Ecobank Nigeria': '050',
  'Fidelity Bank': '070', 'First Bank of Nigeria': '011', 'First City Monument Bank (FCMB)': '214',
  'Globus Bank': '00103', 'Guaranty Trust Bank (GTBank)': '058', 'Heritage Bank': '030',
  'Keystone Bank': '082', 'Kuda Bank': '50211', 'Opay (Paycom)': '999992', 'Palmpay': '999991',
  'Polaris Bank': '076', 'Providus Bank': '101', 'Stanbic IBTC Bank': '221',
  'Standard Chartered Bank': '068', 'Sterling Bank': '232', 'SunTrust Bank': '100',
  'Titan Trust Bank': '102', 'Union Bank': '032', 'United Bank for Africa (UBA)': '033',
  'Unity Bank': '215', 'Wema Bank': '035', 'Zenith Bank': '057', 'ALAT by Wema': '555',
  'Lotus Bank': '303', 'Parallex Bank': '525', 'Sparkle Microfinance Bank': '526',
};
