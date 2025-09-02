/**
 * TEST SINGLE RLS COMMAND
 * =======================
 * Tests why RLS enablement isn't working
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

async function testSingleRLS() {
  console.log('🔍 TESTING SINGLE RLS COMMAND')
  console.log('=============================')

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  // Test single table RLS enablement
  const testTable = 'users'
  
  console.log(`\n🧪 Testing RLS on: ${testTable}`)
  console.log('================================')

  // First check current RLS status via pg_class
  try {
    const { data: rlsCheck, error: rlsError } = await supabase
      .rpc('exec_sql', { 
        sql_text: `
          SELECT 
            relname as table_name,
            relrowsecurity as rls_enabled,
            relforcerowsecurity as rls_forced
          FROM pg_class 
          WHERE relname = '${testTable}'
          AND relkind = 'r'
        `
      })

    if (rlsError) {
      console.log('❌ Cannot check RLS status - exec_sql function missing')
      console.log('🔧 This explains why RLS commands fail!')
      console.log('💡 Need to create exec_sql function first')
      return { needsExecFunction: true }
    }

    console.log('✅ RLS Status Check Result:', rlsCheck)

  } catch (err) {
    console.log('💥 RLS status check failed:', err.message)
  }

  // Test basic table access
  try {
    const { count } = await supabase
      .from(testTable)
      .select('*', { count: 'exact', head: true })
    
    console.log(`✅ Table ${testTable} accessible with service role (${count} rows)`)

    // Test anon access
    const anonSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )
    
    const { count: anonCount, error: anonError } = await anonSupabase
      .from(testTable)
      .select('*', { count: 'exact', head: true })

    if (anonError) {
      console.log(`🔒 Anonymous access BLOCKED - RLS working on ${testTable}`)
    } else {
      console.log(`❌ Anonymous access ALLOWED - RLS NOT working on ${testTable} (${anonCount} rows)`)
    }

  } catch (err) {
    console.log('💥 Table access test failed:', err.message)
  }

  return { needsExecFunction: false }
}

testSingleRLS()
  .then(result => {
    console.log('\n🎉 SINGLE RLS TEST COMPLETE')
    if (result.needsExecFunction) {
      console.log('\n🔧 SOLUTION: Create exec_sql function first!')
    }
  })
  .catch(error => {
    console.error('💥 Test error:', error)
  })