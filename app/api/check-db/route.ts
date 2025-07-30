import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();

    // First, let's check what tables exist
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');

    console.log('Existing tables:', tables);

    // Try to query user_profiles to see if it exists
    const { data: profileTest, error: profileError } = await supabase
      .from('user_profiles')
      .select('*', { count: 'exact', head: true });

    return NextResponse.json({
      success: true,
      tableExists: !profileError,
      tableError: profileError ? {
        message: profileError.message,
        code: profileError.code,
        details: profileError.details,
        hint: profileError.hint
      } : null,
      existingTables: tables?.map(t => t.table_name) || [],
      instruction: profileError ? 
        "The user_profiles table doesn't exist. Please create it in your Supabase dashboard." :
        "The user_profiles table exists and is accessible."
    });

  } catch (error: any) {
    console.error('Database check error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      details: error
    }, { status: 500 });
  }
}
