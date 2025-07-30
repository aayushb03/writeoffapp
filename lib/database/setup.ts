import { createClient } from '@/lib/supabase/server';

export async function createUserProfilesTable() {
  const supabase = await createClient();
  
  try {
    // Check if we can create tables (this will fail if we don't have the right permissions)
    const { error } = await supabase.rpc('exec', {
      sql: `
        -- Create user_profiles table
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

        -- Create index for faster lookups
        CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);

        -- Enable Row Level Security
        ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

        -- Create policy for users to access only their own profile
        DROP POLICY IF EXISTS "Users can only access their own profile" ON user_profiles;
        CREATE POLICY "Users can only access their own profile" ON user_profiles
        FOR ALL USING (auth.uid() = user_id);
      `
    });

    if (error) {
      console.error('Error creating table:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error in createUserProfilesTable:', error);
    return { success: false, error: error.message };
  }
}
