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

    console.log(`👤 Found user profile for ${userId}:`, {
      profession: userProfile.profession,
      income: userProfile.income,
      state: userProfile.state,
      filing_status: userProfile.filing_status
    });

    // Get all transactions for the user that haven't been analyzed yet
    const { data: transactions, error: transactionsError } = await supabase
      .from('transactions')
      .select(`
        *,
        accounts!inner(user_id)
      `)
      .eq('accounts.user_id', userId)
      .gte('amount', 0) // Only analyze expense transactions (positive amounts)
      .eq('deduction_score', 0) // Look for transactions with default deduction_score
      .eq('is_deductible', false) // And default is_deductible
      .is('deductible_reason', null) // And no deductible_reason yet
      .order('date', { ascending: false });

    if (transactionsError) {
      console.error('❌ Error fetching transactions:', transactionsError);
      return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 });
    }

    console.log(`🔍 Found ${transactions?.length || 0} transactions to analyze for user ${userId}`);
    
    // Test: Let's see what transactions we can actually read
    if (transactions && transactions.length > 0) {
      console.log(`📋 Sample transaction data:`, {
        trans_id: transactions[0].trans_id,
        merchant_name: transactions[0].merchant_name,
        amount: transactions[0].amount,
        is_deductible: transactions[0].is_deductible,
        deduction_score: transactions[0].deduction_score,
        deductible_reason: transactions[0].deductible_reason
      });
    }
    
    if (!transactions || transactions.length === 0) {
      // Let's also check if there are any transactions at all for this user
      const { data: allTransactions, error: allTransactionsError } = await supabase
        .from('transactions')
        .select(`
          *,
          accounts!inner(user_id)
        `)
        .eq('accounts.user_id', userId);

      console.log(`📊 Total transactions for user: ${allTransactions?.length || 0}`);
      if (allTransactions && allTransactions.length > 0) {
        console.log(`📊 Transactions with deduction_score > 0: ${allTransactions.filter(t => t.deduction_score > 0).length}`);
        console.log(`📊 Transactions with deduction_score = 0: ${allTransactions.filter(t => t.deduction_score === 0).length}`);
        console.log(`📊 Transactions with is_deductible = true: ${allTransactions.filter(t => t.is_deductible === true).length}`);
        console.log(`📊 Transactions with deductible_reason: ${allTransactions.filter(t => t.deductible_reason !== null).length}`);
      }

      return NextResponse.json({
        success: true,
        message: 'No transactions to analyze',
        analyzed: 0,
        total: 0,
      });
    }

    console.log(`🤖 Analyzing ${transactions.length} transactions for user ${userId}`);

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
    for (const transaction of transactions) {
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
          model: "gpt-4.1-mini",
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
              
              // Update transaction in database
              const { error: updateError } = await supabase
                .from('transactions')
                .update({
                  is_deductible: analysis.is_deductible,
                  deductible_reason: analysis.deductible_reason,
                  deduction_score: analysis.deduction_score,
                })
                .eq('trans_id', transaction.trans_id)
                .eq('account_id', transaction.account_id); // Add account_id filter for RLS

              if (updateError) {
                console.error(`❌ Failed to update transaction ${transaction.trans_id}:`, updateError);
                console.error(`❌ Update error details:`, {
                  trans_id: transaction.trans_id,
                  account_id: transaction.account_id,
                  error: updateError
                });
              } else {
                console.log(`✅ Successfully updated transaction: ${transaction.merchant_name} (${transaction.trans_id})`);
                console.log(`   - is_deductible: ${analysis.is_deductible}`);
                console.log(`   - deduction_score: ${analysis.deduction_score}`);
                console.log(`   - reason: ${analysis.deductible_reason?.substring(0, 50)}...`);
                
                // Verify the update worked by querying the transaction
                const { data: updatedTransaction, error: verifyError } = await supabase
                  .from('transactions')
                  .select('is_deductible, deductible_reason, deduction_score')
                  .eq('trans_id', transaction.trans_id)
                  .eq('account_id', transaction.account_id) // Add account_id filter for RLS
                  .single();
                
                if (verifyError) {
                  console.error(`❌ Failed to verify update for ${transaction.trans_id}:`, verifyError);
                } else {
                  console.log(`✅ Verified update for ${transaction.merchant_name}:`, {
                    is_deductible: updatedTransaction.is_deductible,
                    deduction_score: updatedTransaction.deduction_score,
                    has_reason: !!updatedTransaction.deductible_reason
                  });
                }
                
                analyzedCount++;
                analysisResults.push({
                  transaction_id: transaction.trans_id,
                  merchant_name: transaction.merchant_name,
                  analysis: analysis,
                });
              }
            } else {
              console.error(`❌ No JSON found in response for transaction ${transaction.trans_id}`);
              console.error(`❌ Raw response: ${responseText}`);
            }
          } catch (parseError) {
            console.error(`❌ Failed to parse analysis for transaction ${transaction.trans_id}:`, parseError);
            console.error(`❌ Raw response: ${responseText}`);
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

    console.log(`🎉 Transaction analysis completed! Analyzed ${analyzedCount} out of ${transactions.length} transactions`);

    return NextResponse.json({
      success: true,
      analyzed: analyzedCount,
      total: transactions.length,
      results: analysisResults,
    });

  } catch (error) {
    console.error('Error in analyze-transactions API:', error);
    return NextResponse.json(
      { error: 'Failed to analyze transactions' },
      { status: 500 }
    );
  }
}