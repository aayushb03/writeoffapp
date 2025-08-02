import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST() {
  try {
    const supabase = await createClient();

    // Try to create the table using raw SQL through RPC
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        -- Create user_profiles table for storing additional user information
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
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          
          UNIQUE(user_id)
        );

        -- Create accounts table for storing Plaid account information
        CREATE TABLE IF NOT EXISTS accounts (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          account_id TEXT UNIQUE NOT NULL,
          user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
          name TEXT,
          mask TEXT,
          type TEXT,
          subtype TEXT,
          institution_id TEXT,
          last_cursor TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Create an index on user_id for faster lookups
        CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
        CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);
        CREATE INDEX IF NOT EXISTS idx_accounts_account_id ON accounts(account_id);

        -- Enable Row Level Security (RLS)
        ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
        ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;

        -- Create policy for users to only access their own profile
        DROP POLICY IF EXISTS "Users can only access their own profile" ON user_profiles;
        CREATE POLICY "Users can only access their own profile" ON user_profiles
        FOR ALL USING (auth.uid() = user_id);

        -- Create policy for users to only access their own accounts
        DROP POLICY IF EXISTS "Users can only access their own accounts" ON accounts;
        CREATE POLICY "Users can only access their own accounts" ON accounts
        FOR ALL USING (auth.uid() = user_id);
      `
    });

    // Test the tables by trying to select from them
    const { data: testProfiles, error: testProfilesError } = await supabase
      .from('user_profiles')
      .select('*', { count: 'exact', head: true });

    const { data: testAccounts, error: testAccountsError } = await supabase
      .from('accounts')
      .select('*', { count: 'exact', head: true });

    return NextResponse.json({
      success: true,
      message: 'Tables setup attempted',
      rpcResult: { data, error: error?.message },
      userProfilesTest: {
        works: !testProfilesError,
        error: testProfilesError?.message,
        errorCode: testProfilesError?.code
      },
      accountsTest: {
        works: !testAccountsError,
        error: testAccountsError?.message,
        errorCode: testAccountsError?.code
      }
    });

  } catch (error: any) {
    console.error('Error creating table:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      details: error
    }, { status: 500 });
  }
}
