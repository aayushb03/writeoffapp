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

    // Get user's Plaid access token and cursor
    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('plaid_token, last_cursor')
      .eq('user_id', userId)
      .single();

    if (profileError || !userProfile?.plaid_token) {
      return NextResponse.json({ error: 'No Plaid token found for user' }, { status: 404 });
    }

    // Get all user's accounts (for reference, but cursor is now at user level)
    const { data: accounts, error: accountsError } = await supabase
      .from('accounts')
      .select('account_id, name')
      .eq('user_id', userId);

    if (accountsError) {
      console.error('Error fetching accounts:', accountsError);
      return NextResponse.json({ error: 'Failed to fetch accounts' }, { status: 500 });
    }

    console.log(`🔄 Syncing transactions for user ${userId} with ${accounts?.length || 0} accounts...`);
    let totalTransactionsSaved = 0;

    try {
      console.log(`📊 Using cursor for user ${userId}:`, userProfile.last_cursor);
      
      // Fetch transactions using Plaid's transactionsSync (for all accounts)
      const transactionsResponse = await client.transactionsSync({
        access_token: userProfile.plaid_token,
        options: {
          include_personal_finance_category: true,
          include_logo_and_counterparty_beta: true,
        },
      });

      console.log(`📊 Plaid transactionsSync response for user ${userId}:`);
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
      console.log(`📋 All transactions from Plaid for user ${userId}:`);
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
            // Don't set analysis fields here - they should only be set by AI analysis
            // is_deductible, deductible_reason, deduction_score will be preserved if they exist
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

        console.log(`💾 Formatted transactions to save for user ${userId}:`);
        transactionsToSave.forEach((formattedTransaction: any, index: number) => {
          console.log(`Formatted Transaction ${index + 1}:`, {
            trans_id: formattedTransaction.trans_id,
            account_id: formattedTransaction.account_id,
            date: formattedTransaction.date,
            amount: formattedTransaction.amount,
            merchant_name: formattedTransaction.merchant_name,
            category: formattedTransaction.category,
            // Note: analysis fields not included in upsert to preserve existing values
          });
        });

        const { data: savedTransactions, error: transactionsError } = await supabase
          .from('transactions')
          .upsert(transactionsToSave, { 
            onConflict: 'trans_id',
            ignoreDuplicates: false // This will update existing records but preserve analysis fields
          })
          .select();

        // Debug: Check what was actually saved
        if (savedTransactions) {
          console.log(`🔍 Debug: Checking saved transactions for categories:`);
          savedTransactions.forEach((savedTransaction: any, index: number) => {
            console.log(`Saved Transaction ${index + 1}:`, {
              trans_id: savedTransaction.trans_id,
              merchant_name: savedTransaction.merchant_name,
              category: savedTransaction.category,
              amount: savedTransaction.amount,
            });
          });
        }

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
    } catch (error) {
      console.error(`❌ Error syncing transactions for user ${userId}:`, error);
    }
    
    console.log(`🎉 Transaction sync completed! Processed ${accounts?.length || 0} accounts, saved ${totalTransactionsSaved} transactions`);

    return NextResponse.json({
      success: true,
      accounts_processed: accounts?.length || 0,
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