import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,  
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY!
)// User database operations
export async function checkUserExists(userId: string) {
  const { data, error } = await supabase
    .from('users')
    .select('id')
    .eq('id', userId)
    .single()
  
  return { exists: !!data, error }
}

export async function createUser(userId: string, userData: {
  plaid_token: string
  full_name?: string
  profession?: string
  income?: number
  state?: string
  filing_status?: string
}) {
  return await supabase
    .from('users')
    .insert([{ id: userId, ...userData }])
}

export async function getUser(userId: string) {
  console.log(`🔍 getUser called with userId: ${userId}`);
  
  // Try server client first (for server-side calls)
  try {
    const serverSupabase = await createServerClient();
    const serverResult = await serverSupabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
      
    console.log(`📊 getUser server result:`, {
      data: serverResult.data ? 'User found' : 'No data',
      error: serverResult.error ? serverResult.error.message : 'No error',
      hasPlaidToken: serverResult.data?.plaid_token ? 'Yes' : 'No'
    });
    
    if (serverResult.data || !serverResult.error) {
      return serverResult;
    }
  } catch (serverError) {
    console.log(`⚠️ Server client failed, trying regular client:`, serverError);
  }
  
  // Fallback to regular client
  const result = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();
    
  console.log(`📊 getUser regular client result:`, {
    data: result.data ? 'User found' : 'No data',
    error: result.error ? result.error.message : 'No error',
    hasPlaidToken: result.data?.plaid_token ? 'Yes' : 'No'
  });
  
  return result;
}

export async function updateUser(userId: string, updates: {
  plaid_token?: string
  full_name?: string
  profession?: string
  income?: number
  state?: string
  filing_status?: string
}) {
  return await supabase
    .from('users')
    .update(updates)
    .eq('id', userId)
}

export async function deleteUser(userId: string) {
  return await supabase
    .from('users')
    .delete()
    .eq('id', userId)
} 