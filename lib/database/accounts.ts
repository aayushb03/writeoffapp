import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY!
)

// Account database operations
export async function getAccounts(userId: string) {
  return await supabase
    .from('accounts')
    .select('*')
    .eq('user_id', userId)
}

export async function addAccount(accountData: {
  account_id: string
  user_id: string
  last_cursor?: string
}) {
  return await supabase
    .from('accounts')
    .insert([accountData])
}

export async function updateAccount(accountId: string, updates: {
  last_cursor?: string
}) {
  return await supabase
    .from('accounts')
    .update(updates)
    .eq('account_id', accountId)
}

export async function deleteAccount(accountId: string) {
  return await supabase
    .from('accounts')
    .delete()
    .eq('account_id', accountId)
}

export async function getAccount(accountId: string) {
  return await supabase
    .from('accounts')
    .select('*')
    .eq('account_id', accountId)
    .single()
} 