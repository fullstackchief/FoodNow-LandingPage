import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(_request: NextRequest) {
  try {
    console.log('🚀 Starting Supabase table creation...')
    
    // Use service role key for admin operations
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase service credentials')
    }
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
    
    console.log('🔧 Creating essential tables for FoodNow...')
    
    // Check if tables already exist
    const { data: _existingTables, error: tableCheckError } = await supabaseAdmin
      .from('restaurants')
      .select('count')
      .limit(1)
    
    if (!tableCheckError) {
      return NextResponse.json({
        success: true,
        message: 'Database tables already exist',
        details: { status: 'Tables found, ready for data population' }
      })
    }
    
    console.log('📊 Tables not found, need to create schema...')
    console.log('⚠️ Note: In Supabase dashboard, you need to run the migration manually')
    console.log('📄 Migration file location: supabase/migrations/001_complete_schema.sql')
    
    return NextResponse.json({
      success: false,
      error: 'Tables not found',
      message: 'Please apply the migration in Supabase dashboard first',
      details: {
        action_required: 'Go to Supabase dashboard > SQL Editor > Run the migration file',
        migration_file: 'supabase/migrations/001_complete_schema.sql',
        instructions: [
          '1. Open your Supabase dashboard',
          '2. Go to SQL Editor',
          '3. Copy and paste the contents of supabase/migrations/001_complete_schema.sql',
          '4. Run the SQL to create all tables',
          '5. Return here to populate seed data'
        ]
      }
    })

  } catch (error) {
    console.error('❌ Migration check failed:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Migration check failed',
      message: 'Failed to check database status'
    }, { status: 500 })
  }
}