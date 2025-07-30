import { NextRequest, NextResponse } from 'next/server'
import { analyzeTransactionDeductibility } from '@/lib/openai/analysis'

export async function POST(request: NextRequest) {
  try {
    const { transaction } = await request.json()
    
    if (!transaction) {
      return NextResponse.json({ error: 'Transaction data is required' }, { status: 400 })
    }

    // Validate required fields
    if (!transaction.merchant_name || !transaction.amount) {
      return NextResponse.json({ 
        error: 'Transaction must include merchant_name and amount' 
      }, { status: 400 })
    }

    console.log('🤖 Analyzing transaction with OpenAI:', {
      merchant: transaction.merchant_name,
      amount: transaction.amount,
      category: transaction.category,
      date: transaction.date
    })

    const result = await analyzeTransactionDeductibility(transaction)
    
    if (!result.success) {
      return NextResponse.json(
        { error: 'Failed to analyze transaction', details: result.error },
        { status: 500 }
      )
    }

    console.log('✅ Analysis complete:', {
      deductible: result.is_deductible,
      reason: result.deductible_reason,
      confidence: `${Math.round((result.deduction_score || 0) * 100)}%`
    })

    return NextResponse.json({
      success: true,
      analysis: {
        is_deductible: result.is_deductible,
        deductible_reason: result.deductible_reason,
        deduction_score: result.deduction_score,
        confidence_percentage: Math.round((result.deduction_score || 0) * 100)
      }
    })
  } catch (error) {
    console.error('Error in OpenAI analysis API:', error)
    return NextResponse.json(
      { error: 'Internal server error during analysis' },
      { status: 500 }
    )
  }
}
