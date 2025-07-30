import { plaidClient } from './client'
import { getUser } from '../database/users'
import { getAccounts, addAccount, updateAccount } from '../database/accounts'
import { addTransaction, deleteUserTransactions } from '../database/transactions'

// Plaid transaction functions
export async function fetchTransactions(userId: string) {
  try {
    // Get user's Plaid access token
    const { data: user } = await getUser(userId)
    if (!user?.plaid_token) {
      return { success: false, error: 'No Plaid token found' }
    }

    // Get accounts from Plaid
    const accountsResponse = await plaidClient.accountsGet({
      access_token: user.plaid_token,
    })

    const plaidAccounts = accountsResponse.data.accounts

    // Store or update accounts in our database
    for (const account of plaidAccounts) {
      const existingAccount = await getAccounts(userId)
      const accountExists = existingAccount.data?.some(acc => acc.account_id === account.account_id)
      
      if (!accountExists) {
        await addAccount({
          account_id: account.account_id,
          user_id: userId,
        })
      }
    }

    // Get transactions from Plaid for each account
    let totalTransactions = 0
    
    for (const account of plaidAccounts) {
      const transactionsResponse = await plaidClient.transactionsGet({
        access_token: user.plaid_token,
        start_date: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Last 90 days
        end_date: new Date().toISOString().split('T')[0],
        options: {
          account_ids: [account.account_id],
        },
      })

      const transactions = transactionsResponse.data.transactions

      // Store transactions in database
      for (const txn of transactions) {
        const transactionData = {
          trans_id: txn.transaction_id,
          account_id: account.account_id,
          date: txn.date,
          amount: Math.abs(txn.amount),
          merchant_name: txn.merchant_name,
          category: txn.category?.join(', ') || 'Uncategorized',
        }

        await addTransaction(transactionData)
      }

      totalTransactions += transactions.length

      // Update account with last cursor for sync
      if (transactionsResponse.data.request_id) {
        await updateAccount(account.account_id, {
          last_cursor: transactionsResponse.data.request_id,
        })
      }
    }

    return { success: true, count: totalTransactions }
  } catch (error) {
    console.error('Error fetching transactions:', error)
    return { success: false, error }
  }
}

export async function getAccountBalances(userId: string) {
  try {
    const { data: user } = await getUser(userId)
    if (!user?.plaid_token) {
      return { success: false, error: 'No Plaid token found' }
    }

    const response = await plaidClient.accountsGet({
      access_token: user.plaid_token,
    })

    return { success: true, accounts: response.data.accounts }
  } catch (error) {
    console.error('Error fetching account balances:', error)
    return { success: false, error }
  }
}

export async function getInstitutionInfo(userId: string) {
  try {
    const { data: user } = await getUser(userId)
    if (!user?.plaid_token) {
      return { success: false, error: 'No Plaid token found' }
    }

    const response = await plaidClient.itemGet({
      access_token: user.plaid_token,
    })

    const institutionResponse = await plaidClient.institutionsGetById({
      institution_id: response.data.item.institution_id,
      country_codes: ['US'],
    })

    return { success: true, institution: institutionResponse.data.institution }
  } catch (error) {
    console.error('Error fetching institution info:', error)
    return { success: false, error }
  }
} 