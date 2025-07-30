import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Test if user_profiles table exists by trying a simple select
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .limit(1);
    
    if (error) {
      return NextResponse.json({
        exists: false,
        error: {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        }
      });
    }
    
    return NextResponse.json({
      exists: true,
      message: 'Table exists and is accessible',
      sampleData: data,
      recordCount: data?.length || 0
    });
    
  } catch (error) {
    return NextResponse.json({
      exists: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
