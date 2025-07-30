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

        -- Create an index on user_id for faster lookups
        CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);

        -- Enable Row Level Security (RLS)
        ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

        -- Create policy for users to only access their own profile
        DROP POLICY IF EXISTS "Users can only access their own profile" ON user_profiles;
        CREATE POLICY "Users can only access their own profile" ON user_profiles
        FOR ALL USING (auth.uid() = user_id);
      `
    });

    // Test the table by trying to select from it
    const { data: testData, error: testError } = await supabase
      .from('user_profiles')
      .select('*', { count: 'exact', head: true });

    return NextResponse.json({
      success: true,
      message: 'user_profiles table setup attempted',
      rpcResult: { data, error: error?.message },
      tableTest: {
        works: !testError,
        error: testError?.message,
        errorCode: testError?.code
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
