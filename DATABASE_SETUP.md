# Database Setup Instructions

Before testing the profile setup flow, you need to create the `user_profiles` table in your Supabase database.

## Option 1: Using Supabase Dashboard (Recommended)

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/serqhkcwzojdrnquuter
2. Navigate to the **SQL Editor** tab
3. Copy and paste the contents of `/sql/create_user_profiles.sql`
4. Click **Run** to execute the SQL

## Option 2: Copy/Paste SQL Directly

```sql
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

-- Create trigger to automatically update the updated_at timestamp
CREATE TRIGGER update_user_profiles_updated_at 
    BEFORE UPDATE ON user_profiles 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
```

## Testing the Flow

After running the SQL:

1. **Sign up** for a new account or **sign in** with an existing account
2. You'll be automatically redirected to the **Profile Setup Screen**
3. Fill out all the required fields
4. Click **"Continue to Bank Connection"**
5. Your profile will be saved to Supabase and you'll see the dashboard

## Authentication Flow

Here's what happens after sign-in:

1. **Sign In/Sign Up** → Redirect to `/protected`
2. **Check Profile** → If no profile exists, show ProfileSetupScreen
3. **Complete Profile** → Save to Supabase, show dashboard
4. **Returning Users** → Go directly to dashboard

## Troubleshooting

- **"No rows returned" error**: This is normal for new users who haven't completed profile setup yet
- **Permission errors**: Make sure RLS policies are created correctly
- **Form not submitting**: Check browser console for detailed error messages
