import { createClient } from '@/lib/supabase/client';

export interface UserProfile {
  id?: string;
  user_id: string;
  email: string;
  name: string;
  profession: string;
  income: string;
  state: string;
  filing_status: string;
  plaid_token?: string;
  created_at?: string;
  updated_at?: string;
}

const supabase = createClient();

// Create or update user profile
export async function upsertUserProfile(profile: Omit<UserProfile, 'id' | 'created_at' | 'updated_at'>) {
  console.log('upsertUserProfile called with:', profile);
  
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .upsert({
        ...profile,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Database error in upsertUserProfile:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
    } else {
      console.log('upsertUserProfile successful:', data);
    }

    return { data, error };
  } catch (err) {
    console.error('Exception in upsertUserProfile:', err);
    return { data: null, error: err };
  }
}

// Get user profile by user_id
export async function getUserProfile(userId: string) {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle(); // Use maybeSingle to avoid error when no rows exist

  return { data, error };
}

// Update user profile
export async function updateUserProfile(userId: string, updates: Partial<Omit<UserProfile, 'id' | 'user_id' | 'created_at' | 'updated_at'>>) {
  const { data, error } = await supabase
    .from('user_profiles')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('user_id', userId)
    .select()
    .single();

  return { data, error };
}

// Check if user profile exists
export async function checkUserProfileExists(userId: string) {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('id')
    .eq('user_id', userId)
    .single();

  return { exists: !!data, error };
}

// Delete user profile
export async function deleteUserProfile(userId: string) {
  const { error } = await supabase
    .from('user_profiles')
    .delete()
    .eq('user_id', userId);

  return { error };
}
