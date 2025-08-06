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

    // Get current date info
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const startOfYear = new Date(currentYear, 0, 1);
    const startOfMonth = new Date(currentYear, currentMonth, 1);
    const endOfMonth = new Date(currentYear, currentMonth + 1, 0);

    // Fetch all deductible transactions for the user
    const { data: transactions, error } = await supabase
      .from('transactions')
      .select(`
        *,
        accounts!inner(user_id)
      `)
      .eq('accounts.user_id', userId)
      .eq('is_deductible', true)
      .gte('amount', 0) // Only positive amounts (expenses)
      .order('date', { ascending: false });

    if (error) {
      console.error('Error fetching transactions:', error);
      return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 });
    }

    // Calculate totals
    const allDeductibleTransactions = transactions || [];
    
    // Year-to-date deductible expenses
    const yearToDateTransactions = allDeductibleTransactions.filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate >= startOfYear;
    });
    
    // Current month deductible expenses
    const currentMonthTransactions = allDeductibleTransactions.filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate >= startOfMonth && transactionDate <= endOfMonth;
    });

    // Calculate totals using savings_percentage for accurate deductible amounts
    const yearToDateTotal = yearToDateTransactions.reduce((sum, t) => {
      const deductibleAmount = t.amount * (t.savings_percentage || 100) / 100;
      return sum + deductibleAmount;
    }, 0);
    const currentMonthTotal = currentMonthTransactions.reduce((sum, t) => {
      const deductibleAmount = t.amount * (t.savings_percentage || 100) / 100;
      return sum + deductibleAmount;
    }, 0);
    
    // Tax savings calculation (assuming 30% tax rate)
    const taxRate = 0.30;
    const yearToDateTaxSavings = yearToDateTotal * taxRate;
    const currentMonthTaxSavings = currentMonthTotal * taxRate;
    
    // Projected annual savings (based on current year-to-date)
    const monthsElapsed = now.getMonth() + 1;
    const projectedAnnualSavings = monthsElapsed > 0 ? (yearToDateTaxSavings / monthsElapsed) * 12 : 0;
    
    // Monthly target (assuming $10,000 annual deduction goal)
    const annualDeductionGoal = 10000;
    const monthlyTarget = annualDeductionGoal / 12;
    const monthlyTargetPercentage = monthlyTarget > 0 ? (currentMonthTotal / monthlyTarget) * 100 : 0;

    console.log('📊 Tax savings calculation:', {
      userId,
      yearToDateTotal,
      currentMonthTotal,
      yearToDateTaxSavings,
      currentMonthTaxSavings,
      projectedAnnualSavings,
      monthlyTargetPercentage
    });

    return NextResponse.json({
      success: true,
      data: {
        taxSavings: {
          yearToDate: yearToDateTaxSavings,
          currentMonth: currentMonthTaxSavings,
          projectedAnnual: projectedAnnualSavings
        },
        deductions: {
          yearToDate: yearToDateTotal,
          currentMonth: currentMonthTotal,
          monthlyTarget: monthlyTarget,
          monthlyTargetPercentage: monthlyTargetPercentage
        },
        transactionCounts: {
          yearToDate: yearToDateTransactions.length,
          currentMonth: currentMonthTransactions.length
        }
      }
    });
  } catch (error) {
    console.error('Error in tax savings API:', error);
    return NextResponse.json(
      { error: 'Failed to calculate tax savings' },
      { status: 500 }
    );
  }
} 