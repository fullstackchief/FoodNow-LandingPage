/**
 * CHECK RLS STATUS ON ALL TABLES
 * ==============================
 * Verifies if Row Level Security is actually enabled
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

async function checkRLSStatus() {
  console.log('🔒 CHECKING RLS STATUS ON ALL TABLES')
  console.log('===================================')

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  // Query RLS status for all tables
  try {
    const { data, error } = await supabase
      .rpc('exec_sql', { 
        sql_text: `
          SELECT 
            schemaname,
            tablename,
            rowsecurity as rls_enabled,
            CASE WHEN rowsecurity THEN '🔒 ENABLED' ELSE '❌ DISABLED' END as status
          FROM pg_tables 
          WHERE schemaname = 'public'
          AND tablename NOT LIKE 'pg_%'
          ORDER BY tablename
        `
      })

    if (error) {
      console.log('❌ Error checking RLS status:', error.message)
      return
    }

    console.log('\n📋 RLS STATUS BY TABLE:')
    console.log('======================')
    
    let enabledCount = 0
    let disabledCount = 0
    
    if (data && data.length > 0) {
      data.forEach(table => {
        console.log(`${table.status} ${table.tablename}`)
        if (table.rls_enabled) {
          enabledCount++
        } else {
          disabledCount++
        }
      })
    }

    console.log('\n📊 RLS SUMMARY:')
    console.log('===============')
    console.log(`🔒 RLS Enabled: ${enabledCount} tables`)
    console.log(`❌ RLS Disabled: ${disabledCount} tables`)
    
    if (disabledCount > 0) {
      console.log('\n⚠️  RLS SECURITY ISSUE DETECTED!')
      console.log('🔧 Solution: Execute 004_complete_rls_security.sql again')
    } else {
      console.log('\n✅ ALL TABLES PROPERLY SECURED')
    }

  } catch (err) {
    console.log('💥 RLS check failed:', err.message)
  }
}

checkRLSStatus()
  .then(() => console.log('\n🎉 RLS STATUS CHECK COMPLETE'))
  .catch(error => console.error('💥 Check error:', error))