import { NextRequest, NextResponse } from 'next/server'
import { getTransactions } from '@/lib/database/transactions'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    const { data: transactions, error } = await getTransactions(userId)
    
    if (error) {
      console.error('Error fetching transactions:', error)
      return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      transactions: transactions || []
    })
  } catch (error) {
    console.error('Error in get transactions API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 
