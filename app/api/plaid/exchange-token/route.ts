import { NextRequest, NextResponse } from 'next/server'
import { exchangePublicToken, removePlaidConnection } from '@/lib/api'

export async function POST(request: NextRequest) {
  try {
    const { publicToken, userId } = await request.json()
    
    if (!publicToken || !userId) {
      return NextResponse.json({ error: 'Public token and user ID are required' }, { status: 400 })
    }

    const result = await exchangePublicToken(publicToken, userId)
    
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      accessToken: result.accessToken,
      itemId: result.itemId 
    })
  } catch (error) {
    console.error('Error exchanging token:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await request.json()
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    const result = await removePlaidConnection(userId)
    
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error removing Plaid connection:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 