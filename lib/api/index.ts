// Database operations
export * from '../database/users'
export * from '../database/accounts'
export * from '../database/transactions'

// Plaid operations
export * from '../plaid/auth'
export * from '../plaid/transactions'

// OpenAI operations
export * from '../openai/analysis'

// Re-export commonly used functions with aliases
import { createLinkToken, exchangePublicToken, removePlaidConnection } from '../plaid/auth'
import { fetchTransactions, getAccountBalances, getInstitutionInfo } from '../plaid/transactions'
import { analyzeAllTransactions, generateTaxSummary } from '../openai/analysis'
import { checkUserExists, getUser, createUser, updateUser } from '../database/users'
import { getAccounts, addAccount, updateAccount } from '../database/accounts'
import { getTransactions, addTransaction, updateTransaction } from '../database/transactions'

// Convenience exports
export {
  // Plaid
  createLinkToken,
  exchangePublicToken,
  removePlaidConnection,
  fetchTransactions,
  getAccountBalances,
  getInstitutionInfo,
  
  // OpenAI
  analyzeAllTransactions,
  generateTaxSummary,
  
  // Database - Users
  checkUserExists,
  getUser,
  createUser,
  updateUser,
  
  // Database - Accounts
  getAccounts,
  addAccount,
  updateAccount,
  
  // Database - Transactions
  getTransactions,
  addTransaction,
  updateTransaction,
} 