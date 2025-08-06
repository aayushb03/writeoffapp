-- Complete Database Setup Script for WriteOff App
-- This script creates all necessary tables, indexes, policies, and triggers

-- Enhanced user_profiles table (replaces original users table)
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  profession TEXT NOT NULL,
  income TEXT NOT NULL,
  state TEXT NOT NULL,
  filing_status TEXT NOT NULL,
  plaid_token TEXT,
  last_cursor TEXT, -- Plaid cursor for transaction syncing (moved from accounts)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(user_id)
);

-- Index for faster lookup
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policy: users can only access their own profile
DROP POLICY IF EXISTS "Users can only access their own profile" ON user_profiles;
CREATE POLICY "Users can only access their own profile" ON user_profiles
FOR ALL USING (auth.uid() = user_id);

-- Function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

-- Trigger to update updated_at on changes
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at 
BEFORE UPDATE ON user_profiles 
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();

-- Enhanced accounts table with Plaid fields (removed last_cursor)
CREATE TABLE IF NOT EXISTS accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES user_profiles(user_id) ON DELETE CASCADE NOT NULL,
  name TEXT,
  mask TEXT,
  type TEXT,
  subtype TEXT,
  institution_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for accounts table
CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_accounts_account_id ON accounts(account_id);

-- Enable Row Level Security for accounts
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;

-- RLS Policy: users can only access their own accounts
DROP POLICY IF EXISTS "Users can only access their own accounts" ON accounts;
CREATE POLICY "Users can only access their own accounts" ON accounts
FOR ALL USING (auth.uid() = user_id);

-- Trigger to update updated_at on accounts
DROP TRIGGER IF EXISTS update_accounts_updated_at ON accounts;
CREATE TRIGGER update_accounts_updated_at 
BEFORE UPDATE ON accounts 
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();

-- Transactions table linked to accounts
CREATE TABLE IF NOT EXISTS transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  trans_id TEXT UNIQUE NOT NULL,
  account_id TEXT REFERENCES accounts(account_id) ON DELETE CASCADE NOT NULL,
  date DATE,
  amount NUMERIC,
  merchant_name TEXT,
  category TEXT,
  is_deductible BOOLEAN DEFAULT FALSE,
  deductible_reason TEXT,
  deduction_score NUMERIC,
  savings_percentage NUMERIC DEFAULT 30.0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for transactions table
CREATE INDEX IF NOT EXISTS idx_transactions_account_id ON transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_trans_id ON transactions(trans_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);

-- Enable Row Level Security for transactions
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policy: users can only access their own transactions
DROP POLICY IF EXISTS "Users can only access their own transactions" ON transactions;
CREATE POLICY "Users can only access their own transactions" ON transactions
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM accounts 
    WHERE accounts.account_id = transactions.account_id 
    AND accounts.user_id = auth.uid()
  )
);

-- Trigger to update updated_at on transactions
DROP TRIGGER IF EXISTS update_transactions_updated_at ON transactions;
CREATE TRIGGER update_transactions_updated_at 
BEFORE UPDATE ON transactions 
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column(); 