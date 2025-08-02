import { plaidClient } from './client'
import { getUser } from '../database/users'
import { getAccounts, addAccount, updateAccount } from '../database/accounts'
import { addTransaction, deleteUserTransactions } from '../database/transactions'

// Plaid transaction functions
export async function fetchTransactions(userId: string) {
  try {
    console.log(`🔍 Starting fetchTransactions for userId: ${userId}`)
    
    // Get user's Plaid access token
    const { data: user } = await getUser(userId)
    console.log(`👤 User data retrieved:`, user ? 'Found user' : 'No user found')
    
    if (!user?.plaid_token) {
      console.log(`❌ No Plaid token found for user ${userId}`)
      return { success: false, error: 'No Plaid token found' }
    }
    
    console.log(`🔑 Plaid token found, proceeding with transaction fetch`)

    // Get accounts from Plaid
    console.log(`📊 Fetching accounts from Plaid...`)
    const accountsResponse = await plaidClient.accountsGet({
      access_token: user.plaid_token,
    })

    const plaidAccounts = accountsResponse.data.accounts
    console.log(`✅ Retrieved ${plaidAccounts.length} accounts from Plaid`)

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

      // Store transactions in database with AI analysis
      for (const txn of transactions) {
        const transactionData = {
          trans_id: txn.transaction_id,
          account_id: account.account_id,
          date: txn.date,
          amount: Math.abs(txn.amount),
          merchant_name: txn.merchant_name || 'Unknown Merchant',
          category: txn.category?.join(', ') || 'Uncategorized',
        }

        // Analyze transaction with OpenAI via API route
        console.log(`Analyzing transaction: ${transactionData.merchant_name} - $${transactionData.amount}`)
        
        try {
          const analysisResponse = await fetch('/api/openai/analyze-transaction', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              transaction: {
                merchant_name: transactionData.merchant_name,
                amount: transactionData.amount,
                category: transactionData.category,
                date: transactionData.date,
              }
            }),
          });

          if (analysisResponse.ok) {
            const analysisData = await analysisResponse.json();
            
            if (analysisData.success) {
              // Add AI analysis results to transaction data
              Object.assign(transactionData, {
                is_deductible: analysisData.analysis.is_deductible,
                deductible_reason: analysisData.analysis.deductible_reason,
                deduction_score: analysisData.analysis.deduction_score,
              })
              
              console.log(`✅ AI Analysis: ${analysisData.analysis.is_deductible ? 'Deductible' : 'Not Deductible'} - ${analysisData.analysis.deductible_reason} (${analysisData.analysis.confidence_percentage}% confidence)`)
            } else {
              console.log(`❌ AI Analysis failed for ${transactionData.merchant_name}:`, analysisData.error)
              // Set defaults if analysis fails
              Object.assign(transactionData, {
                is_deductible: false,
                deductible_reason: 'Analysis failed - requires manual review',
                deduction_score: 0,
              })
            }
          } else {
            console.log(`❌ AI Analysis API failed for ${transactionData.merchant_name}`)
            // Set defaults if analysis fails
            Object.assign(transactionData, {
              is_deductible: false,
              deductible_reason: 'Analysis failed - requires manual review',
              deduction_score: 0,
            })
          }
        } catch (error) {
          console.error(`Error analyzing transaction ${transactionData.merchant_name}:`, error)
          // Set defaults if analysis throws an error
          Object.assign(transactionData, {
            is_deductible: false,
            deductible_reason: 'Analysis error - requires manual review',
            deduction_score: 0,
          })
        }

        await addTransaction(transactionData)
        console.log(`💾 Transaction saved: ${transactionData.merchant_name} - $${transactionData.amount}`)
      }

      totalTransactions += transactions.length

      // Update account with last cursor for sync
      if (transactionsResponse.data.request_id) {
        await updateAccount(account.account_id, {
          last_cursor: transactionsResponse.data.request_id,
        })
      }
    }

    console.log(`🎉 Successfully fetched and stored ${totalTransactions} transactions`)
    return { success: true, count: totalTransactions }
  } catch (error) {
    console.error('❌ Error in fetchTransactions:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
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

    if (!response.data.item.institution_id) {
      return { success: false, error: 'No institution ID found' }
    }

    const institutionResponse = await plaidClient.institutionsGetById({
      institution_id: response.data.item.institution_id,
      country_codes: ['US' as any],
    })

    return { success: true, institution: institutionResponse.data.institution }
  } catch (error) {
    console.error('Error fetching institution info:', error)
    return { success: false, error }
  }
} 