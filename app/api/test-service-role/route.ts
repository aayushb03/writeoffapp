import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    // Check if service role key is available
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) {
      return NextResponse.json({ 
        error: 'SUPABASE_SERVICE_ROLE_KEY not found in environment variables' 
      }, { status: 500 });
    }

    // Create service role client
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Test a simple query
    const { data, error } = await supabaseAdmin
      .from('user_profiles')
      .select('user_id, profession')
      .limit(1);

    if (error) {
      return NextResponse.json({ 
        error: 'Service role client failed to query database',
        details: error
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Service role client is working',
      data: data,
      serviceRoleKeyLength: serviceRoleKey.length
    });

  } catch (error) {
    console.error('Error in test-service-role API:', error);
    return NextResponse.json(
      { error: 'Failed to test service role client' },
      { status: 500 }
    );
  }
} 