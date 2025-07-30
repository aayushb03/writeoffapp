-- Check if user_profiles table exists and create it if it doesn't

-- First, let's check if the table exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_profiles') THEN
        -- Create user_profiles table for storing additional user information
        CREATE TABLE user_profiles (
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
        CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);

        -- Enable Row Level Security (RLS)
        ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

        -- Create policy for users to only access their own profile
        CREATE POLICY "Users can only access their own profile" ON user_profiles
        FOR ALL USING (auth.uid() = user_id);

        -- Create function to automatically update the updated_at timestamp
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
        END;
        $$ language 'plpgsql';

        -- Create trigger to automatically update updated_at
        CREATE TRIGGER update_user_profiles_updated_at 
            BEFORE UPDATE ON user_profiles 
            FOR EACH ROW 
            EXECUTE FUNCTION update_updated_at_column();

        RAISE NOTICE 'user_profiles table created successfully';
    ELSE
        RAISE NOTICE 'user_profiles table already exists';
    END IF;
END
$$;
