// Database operations
export * from '../database/users'
export * from '../database/accounts'
export * from '../database/transactions'

// Plaid operations
export * from '../plaid/auth'
export * from '../plaid/transactions'

// Re-export commonly used functions with aliases
import { checkUserExists, getUser, createUser, updateUser } from '../database/users'
import { getAccounts, addAccount, updateAccount } from '../database/accounts'
import { getTransactions, addTransaction, updateTransaction } from '../database/transactions'

// Client-side API functions that call server routes
export async function createLinkToken(userId: string) {
  try {
    const response = await fetch('/api/plaid/create-link-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId }),
    });

    if (!response.ok) {
      const error = await response.json();
      return { success: false, error: error.error || 'Failed to create link token' };
    }

    const data = await response.json();
    return { success: true, linkToken: data.link_token };
  } catch (error) {
    console.error('Error creating link token:', error);
    return { success: false, error: 'Network error' };
  }
}

export async function exchangePublicToken(publicToken: string, userId: string) {
  try {
    const response = await fetch('/api/plaid/exchange-public-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ public_token: publicToken, userId }),
    });

    if (!response.ok) {
      const error = await response.json();
      return { success: false, error: error.error || 'Failed to exchange token' };
    }

    const data = await response.json();
    return { success: true, accessToken: data.access_token, itemId: data.item_id };
  } catch (error) {
    console.error('Error exchanging public token:', error);
    return { success: false, error: 'Network error' };
  }
}

export async function getAccountBalances(userId: string) {
  try {
    const response = await fetch(`/api/plaid/accounts?userId=${userId}`);
    
    if (!response.ok) {
      return { success: false, error: 'Failed to fetch account balances' };
    }

    const data = await response.json();
    return { success: true, accounts: data.accounts };
  } catch (error) {
    console.error('Error fetching account balances:', error);
    return { success: false, error: 'Network error' };
  }
}

// Client-side wrapper for syncing transactions
export async function syncTransactions(userId: string) {
  try {
    const response = await fetch('/api/plaid/sync-transactions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to sync transactions');
    }

    return {
      success: true,
      accountsProcessed: data.accounts_processed,
      transactionsSaved: data.transactions_saved,
    };
  } catch (error) {
    console.error('Error syncing transactions:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to sync transactions',
    };
  }
}

// Convenience exports
export {
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