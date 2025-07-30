import { NextRequest, NextResponse } from 'next/server';
import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid';
import { updateUserProfile } from '@/lib/database/profiles';

const configuration = new Configuration({
  basePath: PlaidEnvironments[process.env.PLAID_ENV as keyof typeof PlaidEnvironments || 'sandbox'],
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
      'PLAID-SECRET': process.env.PLAID_SECRET,
    },
  },
});

const client = new PlaidApi(configuration);

export async function POST(request: NextRequest) {
  try {
    const { public_token, userId } = await request.json();

    if (!public_token || !userId) {
      return NextResponse.json({ error: 'Public token and user ID are required' }, { status: 400 });
    }

    // Exchange public token for access token
    const tokenResponse = await client.itemPublicTokenExchange({
      public_token,
    });

    const accessToken = tokenResponse.data.access_token;
    const itemId = tokenResponse.data.item_id;

    // Get account information
    const accountsResponse = await client.accountsGet({
      access_token: accessToken,
    });

    // Update user profile with Plaid token
    const { error: updateError } = await updateUserProfile(userId, {
      plaid_token: accessToken,
    });

    if (updateError) {
      console.error('Error updating user profile:', updateError);
      return NextResponse.json({ error: 'Failed to save bank connection' }, { status: 500 });
    }

    return NextResponse.json({
      access_token: accessToken,
      item_id: itemId,
      accounts: accountsResponse.data.accounts,
    });
  } catch (error) {
    console.error('Error exchanging public token:', error);
    return NextResponse.json(
      { error: 'Failed to exchange public token' },
      { status: 500 }
    );
  }
}
