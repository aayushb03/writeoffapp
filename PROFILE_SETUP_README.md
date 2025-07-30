# Profile Setup Screen

This component provides a user-friendly interface for collecting and storing user profile information after account creation or sign-in.

## Database Setup

Before using the ProfileSetupScreen component, you need to create the `user_profiles` table in your Supabase database.

### Step 1: Create the Database Table

1. Go to your Supabase Dashboard
2. Navigate to the SQL Editor
3. Run the SQL script from `/sql/create_user_profiles.sql`

Alternatively, you can copy and paste this SQL:

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

## Usage

```tsx
import { ProfileSetupScreen } from '@/components/profile-setup-screen';

function MyComponent() {
  const [user, setUser] = useState(null);
  
  const handleProfileComplete = (profile) => {
    console.log('Profile saved:', profile);
    // Redirect to next step or dashboard
  };

  const handleBack = () => {
    // Handle back navigation
  };

  return (
    <ProfileSetupScreen
      user={user}
      onBack={handleBack}
      onComplete={handleProfileComplete}
    />
  );
}
```

## Features

- ✅ Responsive design with modern UI
- ✅ Form validation
- ✅ Supabase integration with Row Level Security
- ✅ Error handling
- ✅ Loading states
- ✅ Step-by-step progress indicator
- ✅ TypeScript support

## Data Collected

The component collects the following user information:

- Email address
- Full name
- Profession (from predefined list)
- Annual income range
- State of residence
- Tax filing status
- Plaid token (optional, for bank connections)

## Database Service

The component uses `/lib/database/profiles.ts` for all database operations:

- `upsertUserProfile()` - Create or update user profile
- `getUserProfile()` - Retrieve user profile
- `updateUserProfile()` - Update specific profile fields
- `checkUserProfileExists()` - Check if profile exists
- `deleteUserProfile()` - Delete user profile

## Security

- Row Level Security (RLS) is enabled
- Users can only access their own profile data
- All database operations use the authenticated user's ID
- Input validation and sanitization
