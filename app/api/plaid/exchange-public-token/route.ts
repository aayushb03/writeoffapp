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

    // Save the access token to user_profiles table
    console.log('💾 Saving Plaid access token to user_profiles table...');
    const supabase = await createClient();
    
    // Update the user's plaid_token in the user_profiles table
    const { data: profileData, error: profileError } = await supabase
      .from('user_profiles')
      .update({ 
        plaid_token: accessToken,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .select();
    
    if (profileError) {
      console.error('❌ Failed to save Plaid token to user_profiles table:', profileError);
      console.error('Error details:', {
        message: profileError.message,
        code: profileError.code,
        details: profileError.details,
        hint: profileError.hint
      });
      
      // Check if user profile exists
      const { data: existingProfile, error: checkError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (checkError || !existingProfile) {
        console.error('❌ User profile does not exist for user:', userId);
        return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
      }
    } else {
      console.log('✅ Plaid token saved to user_profiles table');
      console.log('Updated profile:', profileData);
    }

    // Save accounts to the accounts table
    console.log('💾 Saving accounts to database...');
    console.log('Accounts to save:', accountsResponse.data.accounts);
    
    const accountsToSave = accountsResponse.data.accounts.map((account: any) => ({
      account_id: account.account_id,
      user_id: userId,
      name: account.name,
      mask: account.mask,
      type: account.type,
      subtype: account.subtype,
      institution_id: account.institution_id,
    }));

    console.log('Formatted accounts to save:', accountsToSave);

    const { data: savedAccounts, error: accountsError } = await supabase
      .from('accounts')
      .upsert(accountsToSave, { onConflict: 'account_id' })
      .select();

    if (accountsError) {
      console.error('❌ Failed to save accounts:', accountsError);
      console.error('Error details:', {
        message: accountsError.message,
        code: accountsError.code,
        details: accountsError.details,
        hint: accountsError.hint
      });
    } else {
      console.log(`✅ Saved ${savedAccounts?.length || 0} accounts to database`);
      console.log('Saved accounts:', savedAccounts);
    }

    // Fetch and save transactions for each account
    console.log('🔄 Fetching transactions for all accounts...');
    let totalTransactionsSaved = 0;

    // Get the current cursor for this user (if any)
    const { data: userProfileData } = await supabase
      .from('user_profiles')
      .select('last_cursor')
      .eq('user_id', userId)
      .single();

    const cursor = userProfileData?.last_cursor || null;
    console.log(`📊 Using cursor for user ${userId}:`, cursor);

    // Fetch transactions using Plaid's transactionsSync (for all accounts)
    const transactionsResponse = await client.transactionsSync({
      access_token: accessToken,
      options: {
        include_personal_finance_category: true,
        include_logo_and_counterparty_beta: true,
      },
    });

    // Process all transactions (no need to filter by account since we're processing all)
    const allTransactions = transactionsResponse.data.added;
    console.log(`📈 Found ${allTransactions.length} total transactions for user ${userId}`);

    if (allTransactions.length > 0) {
      // Save transactions to database - preserve existing categories and analysis
      const transactionsToSave: any[] = allTransactions.map((transaction: any) => {
        // Debug the category data from Plaid
        console.log(`🔍 Raw Plaid transaction category data for ${transaction.merchant_name}:`, {
          personal_finance_category: transaction.personal_finance_category,
          category: transaction.category,
          personal_finance_category_detailed: transaction.personal_finance_category?.detailed,
          category_0: transaction.category?.[0],
        });

        const category = transaction.personal_finance_category?.detailed || transaction.category?.[0] || 'Other';
        
        console.log(`📝 Final category for ${transaction.merchant_name}: ${category}`);
        
        return {
          trans_id: transaction.transaction_id,
          account_id: transaction.account_id,
          date: transaction.date,
          amount: transaction.amount,
          merchant_name: transaction.merchant_name || transaction.name,
          category: category,
          is_deductible: false, // Will be updated by AI analysis
          deductible_reason: null,
          deduction_score: 0,
        };
      });

              // For existing transactions, preserve their current category and analysis
        const existingTransactions = await supabase
          .from('transactions')
          .select('trans_id, category, is_deductible, deductible_reason, deduction_score, savings_percentage, notes')
          .in('trans_id', transactionsToSave.map(t => t.trans_id));

      if (existingTransactions.data) {
        const existingMap = new Map(existingTransactions.data.map(t => [t.trans_id, t]));
        
        // Merge with existing data to preserve categories and analysis
        transactionsToSave.forEach(transaction => {
          const existing = existingMap.get(transaction.trans_id);
          if (existing) {
            // Preserve existing category and analysis if they exist
            if (existing.category && existing.category !== 'Other') {
              transaction.category = existing.category;
            }
            if (existing.is_deductible !== null) {
              transaction.is_deductible = existing.is_deductible;
            }
            if (existing.deductible_reason) {
              transaction.deductible_reason = existing.deductible_reason;
            }
                          if (existing.deduction_score !== null) {
                transaction.deduction_score = existing.deduction_score;
              }
              if (existing.savings_percentage !== null) {
                transaction.savings_percentage = existing.savings_percentage;
              }
              if (existing.notes) {
                transaction.notes = existing.notes;
              }
          }
        });
      }


      const { data: savedTransactions, error: transactionsError } = await supabase
        .from('transactions')
        .upsert(transactionsToSave, { onConflict: 'trans_id' })
        .select();

      if (transactionsError) {
        console.error(`❌ Failed to save transactions for user ${userId}:`, transactionsError);
      } else {
        console.log(`✅ Successfully saved ${savedTransactions?.length || 0} transactions for user ${userId}`);
        console.log('Saved transaction IDs:', savedTransactions?.map((t: any) => t.trans_id) || []);
        totalTransactionsSaved = savedTransactions?.length || 0;
      }

      // Update the cursor for this user
      const newCursor = transactionsResponse.data.next_cursor;
      if (newCursor) {
        const { error: cursorError } = await supabase
          .from('user_profiles')
          .update({ last_cursor: newCursor })
          .eq('user_id', userId);

        if (cursorError) {
          console.error(`❌ Failed to update cursor for user ${userId}:`, cursorError);
        } else {
          console.log(`✅ Updated cursor for user ${userId}: ${newCursor}`);
        }
      }
    } else {
      console.log(`📭 No new transactions for user ${userId}`);
    }
    
    console.log(`🎉 Bank connection successful! Saved ${totalTransactionsSaved} total transactions`);

    return NextResponse.json({
      access_token: accessToken,
      item_id: itemId,
      accounts: accountsResponse.data.accounts,
      transactions_saved: totalTransactionsSaved,
    });
  } catch (error) {
    console.error('Error exchanging public token:', error);
    return NextResponse.json(
      { error: 'Failed to exchange public token' },
      { status: 500 }
    );
  }
}
