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
      description: transaction.merchant_name || 'Unknown Transaction',
      amount: transaction.amount,
      category: transaction.category,
      date: transaction.date,
      type: transaction.amount < 0 ? 'income' : 'expense', // Fixed: negative = income, positive = expense
      isDeductible: transaction.is_deductible || false,
      deductibleReason: transaction.deductible_reason,
      confidenceScore: transaction.deduction_score,
      merchant_name: transaction.merchant_name,
      account_id: transaction.account_id,
    })) || [];

    console.log('🔍 Server-side fetched transactions:', {
      originalCount: transactions?.length || 0,
      transformedCount: transformedTransactions.length,
      userId: userId,
    });

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
