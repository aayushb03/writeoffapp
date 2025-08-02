import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();

    // Test if accounts table exists and can be queried
    const { data, error, count } = await supabase
      .from('accounts')
      .select('*', { count: 'exact' });

    return NextResponse.json({
      success: true,
      tableExists: !error,
      error: error?.message,
      errorCode: error?.code,
      count: count || 0,
      accounts: data || [],
      message: error ? 'Accounts table does not exist or cannot be accessed' : 'Accounts table exists and is accessible'
    });

  } catch (error: any) {
    console.error('Error testing accounts table:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      details: error
    }, { status: 500 });
  }
} 