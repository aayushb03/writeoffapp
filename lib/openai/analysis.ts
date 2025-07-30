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
    
    Determine if this transaction is tax deductible for a business owner. Consider:
    1. Is it a legitimate business expense?
    2. Is it ordinary and necessary for the business?
    3. Is it directly related to business operations?
    
    Respond in this exact format:
    Yes/No, [brief reason], [confidence score]%
    
    Example: "Yes, Office supplies for business operations, 85%"
    Example: "No, Personal entertainment expense, 95%"
  `

  try {
    const response = await openaiClient.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are a tax expert specializing in business deductions. Provide accurate, conservative analysis.'
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
    
    // Parse the response
    const isYes = /^yes\b/i.test(content.trim())
    let reason = ''
    let deduction_score = null
    
    const match = content.match(/^(yes|no)[,\s]+(.+?)[,\s]+(\d{1,3})%/i)
    if (match) {
      reason = match[2].trim()
      deduction_score = Math.min(100, Math.max(0, parseInt(match[3], 10))) / 100 // Convert to 0-1 scale
    } else {
      // Fallback parsing
      const scoreMatch = content.match(/(\d{1,3})\s*%/)
      deduction_score = scoreMatch ? Math.min(100, Math.max(0, parseInt(scoreMatch[1], 10))) / 100 : null
      const reasonMatch = content.match(/^[^,]+,\s*(.+?),\s*\d{1,3}%/)
      reason = reasonMatch ? reasonMatch[1].trim() : 'No reason provided'
    }

    if (reason.length > 0) {
      reason = reason.charAt(0).toUpperCase() + reason.slice(1)
    }

    return {
      success: true,
      is_deductible: isYes,
      deductible_reason: reason,
      deduction_score,
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
        await updateTransaction(transaction.trans_id, {
          is_deductible: analysis.is_deductible,
          deductible_reason: analysis.deductible_reason,
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

    const deductibleTransactions = transactions.filter(t => t.is_deductible)
    const totalDeductible = deductibleTransactions.reduce((sum, t) => sum + t.amount, 0)

    const prompt = `
      Generate a tax summary for business deductions:
      
      Total transactions: ${transactions.length}
      Deductible transactions: ${deductibleTransactions.length}
      Total deductible amount: $${totalDeductible}
      
      Deductible transactions:
      ${deductibleTransactions.map(t => `- ${t.merchant_name}: $${t.amount} (${t.deductible_reason})`).join('\n')}
      
      Provide a brief summary of the tax implications and any recommendations.
    `

    const response = await openaiClient.chat.completions.create({
      model: 'gpt-4',
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