import { plaidClient } from './client'
import { updateUser, createUser, checkUserExists } from '../database/users'

// Plaid authentication functions
export async function createLinkToken(userId: string) {
  const request = {
    user: { client_user_id: userId },
    client_name: 'WriteOff App',
    products: ['transactions'],
    country_codes: ['US'],
    language: 'en',
  }

  try {
    const response = await plaidClient.linkTokenCreate(request)
    return { success: true, linkToken: response.data.link_token }
  } catch (error) {
    console.error('Error creating link token:', error)
    return { success: false, error }
  }
}

export async function exchangePublicToken(publicToken: string, userId: string) {
  try {
    const response = await plaidClient.itemPublicTokenExchange({
      public_token: publicToken,
    })

    const accessToken = response.data.access_token
    const itemId = response.data.item_id

    // Check if user exists in our users table
    const { exists } = await checkUserExists(userId)
    
    if (exists) {
      // Update existing user with Plaid token
      await updateUser(userId, { plaid_token: accessToken })
    } else {
      // Create new user with Plaid token
      await createUser(userId, { plaid_token: accessToken })
    }

    return { success: true, accessToken, itemId }
  } catch (error) {
    console.error('Error exchanging public token:', error)
    return { success: false, error }
  }
}

export async function removePlaidConnection(userId: string) {
  try {
    // Remove Plaid token from database
    await updateUser(userId, { plaid_token: '' })

    return { success: true }
  } catch (error) {
    console.error('Error removing Plaid connection:', error)
    return { success: false, error }
  }
} 