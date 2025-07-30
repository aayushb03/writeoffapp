import { NextRequest, NextResponse } from 'next/server'
import { createLinkToken } from '@/lib/api'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    const result = await createLinkToken(userId)
    
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({ linkToken: result.linkToken })
  } catch (error) {
    console.error('Error creating link token:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 