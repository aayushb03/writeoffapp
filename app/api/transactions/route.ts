import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const supabase = await createClient();

    // Get transactions with proper user filtering
    const { data: transactions, error } = await supabase
      .from('transactions')
      .select(`
        *,
        accounts!inner(user_id)
      `)
      .eq('accounts.user_id', userId)
      .order('date', { ascending: false });

    if (error) {
      console.error('Error fetching transactions:', error);
      return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 });
    }

    // Transform database fields to match UI expectations
    const transformedTransactions = transactions?.map(transaction => ({
      id: transaction.trans_id,
      merchant_name: transaction.merchant_name || 'Unknown Transaction',
      amount: transaction.amount,
      category: transaction.category,
      date: transaction.date,
      type: transaction.amount < 0 ? 'income' : 'expense',
      is_deductible: transaction.is_deductible,
      deductible_reason: transaction.deductible_reason,
      deduction_score: transaction.deduction_score,
      // Provide estimated_deduction_percent from DB value (no hard default)
      estimated_deduction_percent: transaction.savings_percentage ?? transaction.deduction_percent ?? null,
      // Keep original fields for backward compatibility (no 30% hardcode)
      savings_percentage: transaction.savings_percentage ?? null,
      deduction_percent: transaction.deduction_percent ?? null,
      notes: transaction.notes,
      description: transaction.merchant_name,
      account_id: transaction.account_id,
    })) || [];

    console.log('🔍 Server-side fetched transactions:', {
      originalCount: transactions?.length || 0,
      transformedCount: transformedTransactions.length,
      userId: userId,
    });

    // Debug: check first 5 transactions' is_deductible values
    console.log('🔍 First 5 transactions is_deductible values:', 
      transactions?.slice(0, 5).map(t => ({
        id: t.trans_id,
        merchant: t.merchant_name,
        category: t.category,
        is_deductible: t.is_deductible,
        is_deductible_type: typeof t.is_deductible,
      }))
    );

    return NextResponse.json({
      success: true,
      transactions: transformedTransactions,
      count: transformedTransactions.length,
    });
  } catch (error) {
    console.error('Error in transactions API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    );
  }
}
