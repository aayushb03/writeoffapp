import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY!
)

// Transaction database operations
export async function getTransactions(userId: string) {
  return await supabase
    .from('transactions')
    .select(`
      *,
      accounts!inner(user_id)
    `)
    .eq('accounts.user_id', userId)
    .order('date', { ascending: false })
}

export async function getTransactionsByAccount(accountId: string) {
  return await supabase
    .from('transactions')
    .select('*')
    .eq('account_id', accountId)
    .order('date', { ascending: false })
}

export async function addTransaction(transactionData: {
  trans_id: string
  account_id: string
  date: string
  amount: number
  merchant_name?: string
  category?: string
  is_deductible?: boolean
  deductible_reason?: string
  deduction_score?: number
}) {
  console.log(`💾 Attempting to add transaction:`, transactionData)
  const result = await supabase
    .from('transactions')
    .insert([transactionData])
  
  if (result.error) {
    console.error(`❌ Database error adding transaction:`, result.error)
  } else {
    console.log(`✅ Transaction added successfully`)
  }
  
  return result
}

export async function updateTransaction(transactionId: string, updates: {
  amount?: number
  merchant_name?: string
  category?: string
  is_deductible?: boolean
  deductible_reason?: string
  deduction_score?: number
}) {
  return await supabase
    .from('transactions')
    .update(updates)
    .eq('trans_id', transactionId)
}

export async function deleteTransaction(transactionId: string) {
  return await supabase
    .from('transactions')
    .delete()
    .eq('trans_id', transactionId)
}

export async function getTransaction(transactionId: string) {
  return await supabase
    .from('transactions')
    .select('*')
    .eq('trans_id', transactionId)
    .single()
}

export async function deleteUserTransactions(userId: string) {
  // Delete transactions for all accounts belonging to the user
  const { data: accounts } = await supabase
    .from('accounts')
    .select('account_id')
    .eq('user_id', userId)

  if (accounts && accounts.length > 0) {
    const accountIds = accounts.map(acc => acc.account_id)
    return await supabase
      .from('transactions')
      .delete()
      .in('account_id', accountIds)
  }

  return { data: null, error: null }
}

export async function getTransactionsByDateRange(userId: string, startDate: string, endDate: string) {
  return await supabase
    .from('transactions')
    .select(`
      *,
      accounts!inner(user_id)
    `)
    .eq('accounts.user_id', userId)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: false })
} 