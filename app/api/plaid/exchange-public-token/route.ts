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

    // Save the access token to the user's profile using server-side client
    console.log('💾 Saving Plaid access token to database...');
    const supabase = await createClient();
    
    // Try to update the user's plaid_token directly in the users table
    const { data: updateData, error: updateError } = await supabase
      .from('users')
      .update({ plaid_token: accessToken })
      .eq('id', userId)
      .select();
    
    if (updateError) {
      console.error('❌ Failed to save Plaid token to users table:', updateError);
      
      // Fallback: try to upsert in user_profiles table
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .upsert({
          user_id: userId,
          plaid_token: accessToken,
          updated_at: new Date().toISOString()
        })
        .select();
      
      if (profileError) {
        console.error('❌ Failed to save Plaid token to user_profiles table:', profileError);
        console.log('⚠️ Plaid token not saved - transactions may not be fetchable');
      } else {
        console.log('✅ Plaid token saved to user_profiles table');
      }
    } else {
      console.log('✅ Plaid token saved to users table');
    }
    
    console.log('Bank connection successful, access token received');

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
