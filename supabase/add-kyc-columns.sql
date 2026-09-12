-- Add KYC rejection and additional info request columns to vendors table
-- Run this migration to add columns that were added after initial schema

ALTER TABLE vendors ADD COLUMN IF NOT EXISTS kyc_rejection_reason TEXT;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS additional_info_request TEXT;
