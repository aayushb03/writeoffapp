import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const supabase = await createClient();

    // Get user profile for context
    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (profileError || !userProfile) {
      console.error('❌ User profile not found:', profileError);
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    // Get all transactions for the user that haven't been analyzed yet
    console.log(`🔍 Looking for transactions to analyze for user ${userId}`);
    
    // First, let's see all transactions for this user
    const { data: allUserTransactions, error: allTransactionsError } = await supabase
      .from('transactions')
      .select(`
        *,
        accounts!inner(user_id)
      `)
      .eq('accounts.user_id', userId);

    if (allTransactionsError) {
      console.error('❌ Error fetching all transactions:', allTransactionsError);
      return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 });
    }

    console.log(`📊 Total transactions for user ${userId}: ${allUserTransactions?.length || 0}`);
    
    if (allUserTransactions && allUserTransactions.length > 0) {
      console.log(`📋 Sample transaction data:`, {
        trans_id: allUserTransactions[0].trans_id,
        amount: allUserTransactions[0].amount,
        deduction_score: allUserTransactions[0].deduction_score,
        is_deductible: allUserTransactions[0].is_deductible,
        deductible_reason: allUserTransactions[0].deductible_reason,
        merchant_name: allUserTransactions[0].merchant_name,
      });
    }

    // Now get transactions that need analysis
    const { data: transactions, error: transactionsError } = await supabase
      .from('transactions')
      .select(`
        *,
        accounts!inner(user_id)
      `)
      .eq('accounts.user_id', userId)
      .gte('amount', 0) // Only analyze expense transactions (positive amounts)
      .is('deductible_reason', null) // And no deductible_reason yet
      .order('date', { ascending: false });

    if (transactionsError) {
      console.error('❌ Error fetching transactions:', transactionsError);
      return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 });
    }

    console.log(`🔍 Transactions matching analysis criteria: ${transactions?.length || 0}`);
    
    // Filter transactions that actually need analysis (have null deduction_score or is_deductible)
    const transactionsToAnalyze = transactions?.filter(t => 
      (t.deduction_score === null || t.deduction_score === 0) && 
      (t.is_deductible === null || t.is_deductible === false)
    ) || [];
    
    console.log(`🔍 Transactions that actually need analysis: ${transactionsToAnalyze.length}`);
    
    if (transactionsToAnalyze.length > 0) {
      console.log(`📋 Sample transaction to analyze:`, {
        trans_id: transactionsToAnalyze[0].trans_id,
        amount: transactionsToAnalyze[0].amount,
        deduction_score: transactionsToAnalyze[0].deduction_score,
        is_deductible: transactionsToAnalyze[0].is_deductible,
        deductible_reason: transactionsToAnalyze[0].deductible_reason,
        merchant_name: transactionsToAnalyze[0].merchant_name,
      });
    }

    if (transactionsToAnalyze.length === 0) {
      console.log(`📭 No transactions found that need analysis`);
      return NextResponse.json({
        success: true,
        message: 'No transactions to analyze',
        analyzed: 0,
        total: 0,
      });
    }

    console.log(`🤖 Analyzing ${transactionsToAnalyze.length} transactions for user ${userId}`);

    // Create context for OpenAI analysis
    const userContext = `
User Profile:
- Profession: ${userProfile.profession}
- Income: ${userProfile.income}
- State: ${userProfile.state}
- Filing Status: ${userProfile.filing_status}

Analysis Instructions:
For each transaction, determine if it's tax deductible for this business owner. Consider:
1. The user's profession and business type
2. Current tax laws and regulations
3. Whether the expense is ordinary and necessary for their business
4. The specific details of each transaction

Provide:
- is_deductible: true/false
- deductible_reason: Detailed explanation of why it is or isn't deductible
- deduction_score: Confidence score from 0.0 to 1.0 (0.0 = not deductible, 1.0 = definitely deductible)
`;

    let analyzedCount = 0;
    const analysisResults = [];

    // Analyze each transaction
    for (const transaction of transactionsToAnalyze) {
      try {
        console.log(`📊 Analyzing transaction: ${transaction.merchant_name} - $${transaction.amount}`);

        const prompt = `${userContext}

Transaction to analyze:
- Merchant: ${transaction.merchant_name}
- Amount: $${transaction.amount}
- Category: ${transaction.category}
- Date: ${transaction.date}
- Account: ${transaction.account_id}

Please analyze this transaction and respond with a JSON object containing:
{
  "is_deductible": boolean,
  "deductible_reason": "detailed explanation",
  "deduction_score": number (0.0 to 1.0)
}`;

        const completion = await openai.chat.completions.create({
          model: "gpt-4",
          messages: [
            {
              role: "system",
              content: "You are a tax expert specializing in business deductions. Provide accurate, detailed analysis of whether business expenses are tax deductible."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          temperature: 0.1,
          max_tokens: 500,
        });

        const responseText = completion.choices[0]?.message?.content;
        
        if (responseText) {
          try {
            // Extract JSON from response
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              const analysis = JSON.parse(jsonMatch[0]);
              
              console.log(`📊 Analysis result for ${transaction.merchant_name}:`, analysis);
              
              // Update transaction in database - preserve existing category
              const { error: updateError } = await supabase
                .from('transactions')
                .update({
                  is_deductible: analysis.is_deductible,
                  deductible_reason: analysis.deductible_reason,
                  deduction_score: analysis.deduction_score,
                  // Preserve the existing category
                  category: transaction.category,
                })
                .eq('trans_id', transaction.trans_id)
                .eq('account_id', transaction.account_id);

              if (updateError) {
                console.error(`❌ Failed to update transaction ${transaction.trans_id}:`, updateError);
              } else {
                console.log(`✅ Successfully updated transaction: ${transaction.merchant_name} (${transaction.trans_id})`);
                
                analyzedCount++;
                analysisResults.push({
                  transaction_id: transaction.trans_id,
                  merchant_name: transaction.merchant_name,
                  analysis: analysis,
                });
              }
            } else {
              console.error(`❌ No JSON found in response for transaction ${transaction.trans_id}`);
            }
          } catch (parseError) {
            console.error(`❌ Failed to parse analysis for transaction ${transaction.trans_id}:`, parseError);
          }
        } else {
          console.error(`❌ No response from OpenAI for transaction ${transaction.trans_id}`);
        }

        // Add a small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        console.error(`❌ Error analyzing transaction ${transaction.trans_id}:`, error);
      }
    }

    console.log(`🎉 Transaction analysis completed! Analyzed ${analyzedCount} out of ${transactionsToAnalyze.length} transactions`);

    return NextResponse.json({
      success: true,
      analyzed: analyzedCount,
      total: transactionsToAnalyze.length,
      results: analysisResults,
    });

  } catch (error) {
    console.error('Error in analyze-with-progress API:', error);
    return NextResponse.json(
      { error: 'Failed to analyze transactions' },
      { status: 500 }
    );
  }
} 