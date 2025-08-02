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
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const supabase = await createClient();

    // Get user's Plaid access token
    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('plaid_token')
      .eq('user_id', userId)
      .single();

    if (profileError || !userProfile?.plaid_token) {
      return NextResponse.json({ error: 'No Plaid token found for user' }, { status: 404 });
    }

    // Get all user's accounts with their cursors
    const { data: accounts, error: accountsError } = await supabase
      .from('accounts')
      .select('account_id, name, last_cursor')
      .eq('user_id', userId);

    if (accountsError) {
      console.error('Error fetching accounts:', accountsError);
      return NextResponse.json({ error: 'Failed to fetch accounts' }, { status: 500 });
    }

    console.log(`🔄 Syncing transactions for ${accounts?.length || 0} accounts...`);
    let totalTransactionsSaved = 0;
    let totalAccountsProcessed = 0;

    for (const account of accounts || []) {
      try {
        console.log(`📊 Syncing transactions for account: ${account.name} (${account.account_id})`);
        
        // Use stored cursor or null for initial sync
        const cursor = account.last_cursor || null;
        
        // Fetch transactions using Plaid's transactionsSync
        const transactionsResponse = await client.transactionsSync({
          access_token: userProfile.plaid_token,
          options: {
            include_personal_finance_category: true,
            include_logo_and_counterparty_beta: true,
          },
        });

        console.log(`📊 Plaid transactionsSync response for account ${account.name}:`);
        console.log('Response structure:', {
          hasAdded: !!transactionsResponse.data.added,
          hasModified: !!transactionsResponse.data.modified,
          hasRemoved: !!transactionsResponse.data.removed,
          hasNextCursor: !!transactionsResponse.data.next_cursor,
          addedCount: transactionsResponse.data.added?.length || 0,
          modifiedCount: transactionsResponse.data.modified?.length || 0,
          removedCount: transactionsResponse.data.removed?.length || 0,
        });

        // Log all transactions returned by Plaid
        console.log(`📋 All transactions from Plaid for account ${account.name}:`);
        transactionsResponse.data.added.forEach((transaction: any, index: number) => {
          console.log(`Transaction ${index + 1}:`, {
            transaction_id: transaction.transaction_id,
            account_id: transaction.account_id,
            date: transaction.date,
            amount: transaction.amount,
            name: transaction.name,
            merchant_name: transaction.merchant_name,
            category: transaction.category,
            personal_finance_category: transaction.personal_finance_category,
            payment_channel: transaction.payment_channel,
            pending: transaction.pending,
            account_owner: transaction.account_owner,
            iso_currency_code: transaction.iso_currency_code,
            unofficial_currency_code: transaction.unofficial_currency_code,
            check_number: transaction.check_number,
            payment_processor: transaction.payment_processor,
            reference_number: transaction.reference_number,
            authorized_date: transaction.authorized_date,
            authorized_datetime: transaction.authorized_datetime,
            datetime: transaction.datetime,
            location: transaction.location,
            logo_url: transaction.logo_url,
            counterparties: transaction.counterparties,
          });
        });

        // Filter transactions for this specific account
        const accountTransactions = transactionsResponse.data.added.filter(
          (transaction: any) => transaction.account_id === account.account_id
        );

        console.log(`📈 Found ${accountTransactions.length} transactions for account ${account.name} (${account.account_id})`);
        console.log(`🔍 Filtered transactions for account ${account.name}:`);
        accountTransactions.forEach((transaction: any, index: number) => {
          console.log(`Filtered Transaction ${index + 1}:`, {
            transaction_id: transaction.transaction_id,
            account_id: transaction.account_id,
            date: transaction.date,
            amount: transaction.amount,
            name: transaction.name,
            merchant_name: transaction.merchant_name,
            category: transaction.category,
            personal_finance_category: transaction.personal_finance_category,
          });
        });

        if (accountTransactions.length > 0) {
          // Save transactions to database
          const transactionsToSave = accountTransactions.map((transaction: any) => ({
            trans_id: transaction.transaction_id,
            account_id: transaction.account_id,
            date: transaction.date,
            amount: transaction.amount,
            merchant_name: transaction.merchant_name || transaction.name,
            category: transaction.personal_finance_category?.[0] || transaction.category?.[0] || 'Other',
            is_deductible: false, // Will be updated by AI analysis
            deductible_reason: null,
            deduction_score: 0,
          }));

          console.log(`💾 Formatted transactions to save for account ${account.name}:`);
          transactionsToSave.forEach((formattedTransaction: any, index: number) => {
            console.log(`Formatted Transaction ${index + 1}:`, {
              trans_id: formattedTransaction.trans_id,
              account_id: formattedTransaction.account_id,
              date: formattedTransaction.date,
              amount: formattedTransaction.amount,
              merchant_name: formattedTransaction.merchant_name,
              category: formattedTransaction.category,
              is_deductible: formattedTransaction.is_deductible,
              deductible_reason: formattedTransaction.deductible_reason,
              deduction_score: formattedTransaction.deduction_score,
            });
          });

          const { data: savedTransactions, error: transactionsError } = await supabase
            .from('transactions')
            .upsert(transactionsToSave, { onConflict: 'trans_id' })
            .select();

          if (transactionsError) {
            console.error(`❌ Failed to save transactions for account ${account.name}:`, transactionsError);
          } else {
            console.log(`✅ Successfully saved ${savedTransactions?.length || 0} transactions for account ${account.name}`);
            console.log('Saved transaction IDs:', savedTransactions?.map((t: any) => t.trans_id) || []);
            totalTransactionsSaved += savedTransactions?.length || 0;
          }

          // Update the cursor for this account
          const newCursor = transactionsResponse.data.next_cursor;
          if (newCursor) {
            const { error: cursorError } = await supabase
              .from('accounts')
              .update({ last_cursor: newCursor })
              .eq('account_id', account.account_id);

            if (cursorError) {
              console.error(`❌ Failed to update cursor for account ${account.name}:`, cursorError);
            } else {
              console.log(`✅ Updated cursor for account ${account.name}: ${newCursor}`);
            }
          }
        } else {
          console.log(`📭 No new transactions for account ${account.name}`);
        }

        totalAccountsProcessed++;
      } catch (error) {
        console.error(`❌ Error syncing transactions for account ${account.name}:`, error);
      }
    }
    
    console.log(`🎉 Transaction sync completed! Processed ${totalAccountsProcessed} accounts, saved ${totalTransactionsSaved} transactions`);

    return NextResponse.json({
      success: true,
      accounts_processed: totalAccountsProcessed,
      transactions_saved: totalTransactionsSaved,
    });
  } catch (error) {
    console.error('Error syncing transactions:', error);
    return NextResponse.json(
      { error: 'Failed to sync transactions' },
      { status: 500 }
    );
  }
} 