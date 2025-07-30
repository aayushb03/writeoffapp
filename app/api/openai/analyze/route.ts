import { NextRequest, NextResponse } from 'next/server'
import { analyzeAllTransactions } from '@/lib/api'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    const result = await analyzeAllTransactions(userId)
    
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      analyzed: result.analyzed,
      total: result.total 
    })
  } catch (error) {
    console.error('Error analyzing transactions:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 