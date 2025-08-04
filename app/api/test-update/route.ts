import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const supabase = await createClient();

    // First, let's see what transactions we can read
    const { data: transactions, error: readError } = await supabase
      .from('transactions')
      .select(`
        *,
        accounts!inner(user_id)
      `)
      .eq('accounts.user_id', userId)
      .limit(1);

    if (readError) {
      console.error('❌ Error reading transactions:', readError);
      return NextResponse.json({ error: 'Failed to read transactions' }, { status: 500 });
    }

    if (!transactions || transactions.length === 0) {
      return NextResponse.json({ error: 'No transactions found' }, { status: 404 });
    }

    const testTransaction = transactions[0];
    console.log('📋 Test transaction before update:', {
      trans_id: testTransaction.trans_id,
      merchant_name: testTransaction.merchant_name,
      is_deductible: testTransaction.is_deductible,
      deduction_score: testTransaction.deduction_score,
      deductible_reason: testTransaction.deductible_reason
    });

    // Try to update the transaction
    const { data: updateData, error: updateError } = await supabase
      .from('transactions')
      .update({
        is_deductible: true,
        deductible_reason: 'Test update from API',
        deduction_score: 0.8,
      })
      .eq('trans_id', testTransaction.trans_id)
      .eq('account_id', testTransaction.account_id) // Add account_id filter for RLS
      .select();

    if (updateError) {
      console.error('❌ Error updating transaction:', updateError);
      return NextResponse.json({ 
        error: 'Failed to update transaction',
        details: updateError
      }, { status: 500 });
    }

    console.log('✅ Update result:', updateData);

    // Verify the update
    const { data: verifyData, error: verifyError } = await supabase
      .from('transactions')
      .select('is_deductible, deductible_reason, deduction_score')
      .eq('trans_id', testTransaction.trans_id)
      .eq('account_id', testTransaction.account_id) // Add account_id filter for RLS
      .single();

    if (verifyError) {
      console.error('❌ Error verifying update:', verifyError);
    } else {
      console.log('✅ Verification result:', verifyData);
    }

    return NextResponse.json({
      success: true,
      message: 'Test update completed',
      before: {
        is_deductible: testTransaction.is_deductible,
        deduction_score: testTransaction.deduction_score,
        deductible_reason: testTransaction.deductible_reason
      },
      after: verifyData,
      updateError: updateError,
      verifyError: verifyError
    });

  } catch (error) {
    console.error('Error in test-update API:', error);
    return NextResponse.json(
      { error: 'Failed to test update' },
      { status: 500 }
    );
  }
} 