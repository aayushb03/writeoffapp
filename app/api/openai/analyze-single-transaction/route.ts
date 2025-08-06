import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { analyzeTransactionDeductibility } from '@/lib/openai/analysis';

export async function POST(request: NextRequest) {
  try {
    const { transactionId, notes } = await request.json();

    if (!transactionId) {
      return NextResponse.json({ error: 'Transaction ID is required' }, { status: 400 });
    }

    const supabase = await createClient();

    // Get the transaction details
    const { data: transaction, error: transactionError } = await supabase
      .from('transactions')
      .select(`
        *,
        accounts!inner(user_id)
      `)
      .eq('trans_id', transactionId)
      .single();

    if (transactionError || !transaction) {
      console.error('❌ Transaction not found:', transactionError);
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    // Get the user profile separately
    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', transaction.accounts.user_id)
      .single();

    if (profileError || !userProfile) {
      console.error('❌ User profile not found:', profileError);
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    console.log(`🤖 Re-analyzing transaction: ${transaction.merchant_name} - $${transaction.amount}`);

    // Create context for OpenAI analysis
    const userContext = `
User Profile:
- Profession: ${userProfile.profession}
- Income: ${userProfile.income}
- State: ${userProfile.state}
- Filing Status: ${userProfile.filing_status}

Analysis Instructions:
For this transaction, determine if it's tax deductible for this business owner. Consider:
1. The user's profession and business type
2. Current tax laws and regulations
3. Whether the expense is ordinary and necessary for their business
4. The specific details of each transaction
5. Any additional context provided by the user in notes

Provide:
- is_deductible: true/false
- deductible_reason: Detailed explanation of why it is or isn't deductible
- deduction_score: Confidence score from 0.0 to 1.0 (0.0 = not deductible, 1.0 = definitely deductible)
- savings_percentage: What percentage of this transaction amount is deductible (0-100). For example, if only 50% of a meal is deductible, return 50. If the entire amount is deductible, return 100.
`;

    // Update transaction notes if provided
    const transactionWithNotes = {
      ...transaction,
      notes: notes || transaction.notes
    };

    const analysis = await analyzeTransactionDeductibility(transactionWithNotes);
    
    if (analysis.success) {
          
          console.log(`📊 Re-analysis result for ${transaction.merchant_name}:`, analysis);
          
          // Update transaction in database
          const { error: updateError } = await supabase
            .from('transactions')
            .update({
              is_deductible: analysis.is_deductible,
              deductible_reason: analysis.deduction_reason,
              deduction_score: analysis.deduction_score,
              savings_percentage: analysis.deduction_percent !== undefined ? analysis.deduction_percent : 30.0,
              notes: notes || null, // Save the user's notes
              // Preserve the existing category
              category: transaction.category,
            })
            .eq('trans_id', transaction.trans_id)
            .eq('account_id', transaction.account_id);

          if (updateError) {
            console.error(`❌ Failed to update transaction ${transaction.trans_id}:`, updateError);
            return NextResponse.json({ error: 'Failed to update transaction' }, { status: 500 });
          } else {
            console.log(`✅ Successfully re-analyzed transaction: ${transaction.merchant_name} (${transaction.trans_id})`);
            return NextResponse.json({
              success: true,
              message: 'Transaction re-analyzed successfully',
              analysis: analysis
            });
          }
        } else {
          console.error('❌ Analysis failed:', analysis.error);
          return NextResponse.json({ error: 'Analysis failed' }, { status: 500 });
        }

  } catch (error) {
    console.error('❌ Error in single transaction analysis:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 