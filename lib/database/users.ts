import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// User database operations
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
  return await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()
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