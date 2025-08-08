import { openaiClient } from './client'
import { getTransactions, updateTransaction } from '../database/transactions'

// OpenAI analysis functions
export async function analyzeTransactionDeductibility(transaction: any) {
  const prompt = `
    Analyze this transaction for tax deductibility:
    
    Transaction: ${transaction.merchant_name}
    Amount: $${transaction.amount}
    Category: ${transaction.category}
    Date: ${transaction.date}
    Notes: ${transaction.notes}
    
    Determine if this transaction is tax deductible for a business owner. Consider:
    1. Is it a legitimate business expense?
    2. Is it ordinary and necessary for the business?
    3. Is it directly related to business operations?
    4. What percentage of the transaction amount is deductible?
    
    IMPORTANT: If the transaction amount is negative (income/revenue), it is NOT deductible and should have deduction_percent = 0.
    
    Respond with a JSON object in this exact format:
    {
      "is_deductible": true/false,
      "deduction_score": 0.85,
      "deduction_percent": 100,
      "deduction_reason": "Detailed explanation of why it is or isn't deductible"
    }
    
    Where:
    - is_deductible: true if deductible, false if not
    - deduction_score: Confidence score from 0.0 to 1.0 (0.0 = not deductible, 1.0 = definitely deductible)
    - deduction_percent: What percentage of the transaction amount is deductible (0-100). For example, if only 50% of a meal is deductible, return 50. If the entire amount is deductible, return 100.
    - deduction_reason: Detailed explanation of why it is or isn't deductible. It should be clear, concise, and based on tax rules.
  
    Use conservative estimates and avoid over-claiming deductions.
    
    Examples:
    - Office supplies: {"is_deductible": true, "deduction_score": 0.95, "deduction_percent": 100, "deduction_reason": "Office supplies are fully deductible as they are ordinary and necessary for business operations"}
    - Business meal: {"is_deductible": true, "deduction_score": 0.85, "deduction_percent": 50, "deduction_reason": "Business meals are 50% deductible under current tax law"}
    - Personal expense: {"is_deductible": false, "deduction_score": 0.95, "deduction_percent": 0, "deduction_reason": "This is a personal expense not related to business operations"}
    - Income/Refund: {"is_deductible": false, "deduction_score": 0.0, "deduction_percent": 0, "deduction_reason": "This is income/revenue and not a deductible expense"}
  `

  try {
    const response = await openaiClient.chat.completions.create({
      model: 'gpt-4.1-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a tax expert specializing in business deductions. Provide accurate, conservative analysis. Always respond with valid JSON in the exact format requested.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 150,
      temperature: 0.1,
    })

    const content = response.choices[0].message.content || ''
    
    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      console.error('No valid JSON found in response:', content)
      return { success: false, error: 'Invalid response format' }
    }

    try {
      const analysis = JSON.parse(jsonMatch[0])
      
      // Validate required fields
      if (typeof analysis.is_deductible !== 'boolean') {
        console.error('Invalid is_deductible field:', analysis)
        return { success: false, error: 'Invalid is_deductible field' }
      }
      
      if (typeof analysis.deduction_score !== 'number' || analysis.deduction_score < 0 || analysis.deduction_score > 1) {
        console.error('Invalid deduction_score field:', analysis)
        return { success: false, error: 'Invalid deduction_score field' }
      }
      
      if (typeof analysis.deduction_percent !== 'number' || analysis.deduction_percent < 0 || analysis.deduction_percent > 100) {
        console.error('Invalid deduction_percent field:', analysis)
        return { success: false, error: 'Invalid deduction_percent field' }
      }
      
      if (typeof analysis.deduction_reason !== 'string' || analysis.deduction_reason.trim() === '') {
        console.error('Invalid deduction_reason field:', analysis)
        return { success: false, error: 'Invalid deduction_reason field' }
      }

      return {
        success: true,
        is_deductible: analysis.is_deductible,
        deduction_score: analysis.deduction_score,
        deduction_percent: analysis.deduction_percent,
        deduction_reason: analysis.deduction_reason,
      }
    } catch (parseError) {
      console.error('Error parsing JSON response:', parseError, 'Content:', content)
      return { success: false, error: 'Failed to parse JSON response' }
    }
  } catch (error) {
    console.error('Error analyzing transaction:', error)
    return { success: false, error }
  }
}

export async function analyzeAllTransactions(userId: string) {
  try {
    const { data: transactions } = await getTransactions(userId)
    if (!transactions || transactions.length === 0) {
      return { success: false, error: 'No transactions found' }
    }

    const analysisPromises = transactions.map(async (transaction) => {
      const analysis = await analyzeTransactionDeductibility(transaction)
      if (analysis.success) {
        await updateTransaction(transaction.id, {
          is_deductible: analysis.is_deductible,
          deductible_reason: analysis.deduction_reason,
          deduction_score: analysis.deduction_score || undefined,
        })
      }
      return analysis
    })

    const results = await Promise.all(analysisPromises)
    const successful = results.filter(r => r.success).length

    return { success: true, analyzed: successful, total: transactions.length }
  } catch (error) {
    console.error('Error analyzing all transactions:', error)
    return { success: false, error }
  }
}

export async function generateTaxSummary(userId: string) {
  try {
    const { data: transactions } = await getTransactions(userId)
    if (!transactions || transactions.length === 0) {
      return { success: false, error: 'No transactions found' }
    }

    const deductibleTransactions = transactions.filter(t => t.isDeductible)
    const totalDeductible = deductibleTransactions.reduce((sum, t) => sum + t.amount, 0)

    const prompt = `
      Generate a tax summary for business deductions:
      
      Total transactions: ${transactions.length}
      Deductible transactions: ${deductibleTransactions.length}
      Total deductible amount: $${totalDeductible}
      
      Deductible transactions:
      ${deductibleTransactions.map(t => `- ${t.merchant_name}: $${t.amount} (${t.deductibleReason})`).join('\n')}
      
      Provide a brief summary of the tax implications and any recommendations.
    `

    const response = await openaiClient.chat.completions.create({
      model: 'gpt-4.1-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a tax professional providing clear, actionable advice.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 500,
      temperature: 0.3,
    })

    return {
      success: true,
      summary: response.choices[0].message.content,
      totalDeductible,
      deductibleCount: deductibleTransactions.length,
    }
  } catch (error) {
    console.error('Error generating tax summary:', error)
    return { success: false, error }
  }
} 