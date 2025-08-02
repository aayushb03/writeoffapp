import { NextRequest, NextResponse } from 'next/server';
import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid';
import { createClient } from '@/lib/supabase/server';

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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Get user's Plaid access token from database
    const supabase = await createClient();
    const { data: userProfile, error: userError } = await supabase
      .from('user_profiles')
      .select('plaid_token')
      .eq('user_id', userId)
      .single();

    if (userError || !userProfile?.plaid_token) {
      return NextResponse.json({ error: 'No Plaid token found for user' }, { status: 404 });
    }

    // Get accounts from Plaid
    const accountsResponse = await client.accountsGet({
      access_token: userProfile.plaid_token,
    });

    return NextResponse.json({
      accounts: accountsResponse.data.accounts,
    });
  } catch (error) {
    console.error('Error fetching accounts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch accounts' },
      { status: 500 }
    );
  }
} 