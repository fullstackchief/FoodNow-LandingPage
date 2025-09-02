/**
 * DIRECT RLS STATUS CHECK
 * =======================
 * Uses Supabase API directly to check RLS status
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

async function directRLSCheck() {
  console.log('🔍 DIRECT RLS INVESTIGATION')
  console.log('===========================')
  console.log(`⏰ Started: ${new Date().toISOString()}`)
  console.log(`📍 Supabase URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL}`)

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  // Test tables for RLS
  const tablesToTest = [
    'users', 'restaurants', 'menu_items', 'orders', 'order_items',
    'notifications', 'delivery_zones', 'support_tickets', 'payment_transactions',
    'delivery_assignments', 'rider_documents', 'restaurant_documents',
    'admin_permissions', 'system_settings', 'rider_guarantors', 'payout_history',
    'admin_users', 'admin_sessions', 'role_applications', 'guarantor_verifications'
  ]

  console.log('\n📋 TESTING RLS STATUS BY TABLE ACCESS:')
  console.log('=====================================')

  const results = {
    withServiceRole: {},
    withAnonKey: {}
  }

  // Test with service role (should always work)
  console.log('\n🔑 Testing with SERVICE_ROLE_KEY:')
  for (const table of tablesToTest) {
    try {
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true })

      if (error) {
        console.log(`   ❌ ${table}: ${error.message}`)
        results.withServiceRole[table] = 'ERROR'
      } else {
        console.log(`   ✅ ${table}: Accessible (${count || 0} rows)`)
        results.withServiceRole[table] = 'ACCESSIBLE'
      }
    } catch (err) {
      console.log(`   💥 ${table}: Exception - ${err.message}`)
      results.withServiceRole[table] = 'EXCEPTION'
    }
  }

  // Test with anon key (should be blocked if RLS is enabled)
  const anonSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )

  console.log('\n🔑 Testing with ANON_KEY (should be blocked):')
  for (const table of tablesToTest) {
    try {
      const { data, error, count } = await anonSupabase
        .from(table)
        .select('*', { count: 'exact', head: true })

      if (error) {
        if (error.message.includes('no rows') || error.code === 'PGRST116') {
          console.log(`   🔒 ${table}: BLOCKED (RLS working)`)
          results.withAnonKey[table] = 'BLOCKED_RLS'
        } else {
          console.log(`   ⚠️  ${table}: Error but not RLS - ${error.message}`)
          results.withAnonKey[table] = 'ERROR_OTHER'
        }
      } else {
        console.log(`   ❌ ${table}: ACCESSIBLE (RLS NOT working!) - ${count || 0} rows`)
        results.withAnonKey[table] = 'ACCESSIBLE_NO_RLS'
      }
    } catch (err) {
      console.log(`   💥 ${table}: Exception - ${err.message}`)
      results.withAnonKey[table] = 'EXCEPTION'
    }
  }

  // Analyze results
  console.log('\n📊 RLS ANALYSIS:')
  console.log('================')

  const rlsEnabled = []
  const rlsDisabled = []
  const rlsUnknown = []

  for (const table of tablesToTest) {
    if (results.withServiceRole[table] === 'ACCESSIBLE') {
      if (results.withAnonKey[table] === 'BLOCKED_RLS') {
        rlsEnabled.push(table)
      } else if (results.withAnonKey[table] === 'ACCESSIBLE_NO_RLS') {
        rlsDisabled.push(table)
      } else {
        rlsUnknown.push(table)
      }
    }
  }

  console.log(`\n✅ RLS PROPERLY ENABLED (${rlsEnabled.length} tables):`)
  rlsEnabled.forEach(t => console.log(`   - ${t}`))

  console.log(`\n❌ RLS DISABLED/NOT WORKING (${rlsDisabled.length} tables):`)
  rlsDisabled.forEach(t => console.log(`   - ${t}`))

  if (rlsUnknown.length > 0) {
    console.log(`\n⚠️  UNKNOWN STATUS (${rlsUnknown.length} tables):`)
    rlsUnknown.forEach(t => console.log(`   - ${t}`))
  }

  // Final verdict
  console.log('\n🎯 FINAL VERDICT:')
  console.log('=================')
  if (rlsDisabled.length === 0) {
    console.log('✅ ALL TABLES HAVE RLS ENABLED AND WORKING')
  } else {
    console.log(`❌ ${rlsDisabled.length} TABLES HAVE RLS ISSUES`)
    console.log('\n🔧 SOLUTION:')
    console.log('1. The RLS migration may not have executed properly')
    console.log('2. Try executing each ALTER TABLE command individually')
    console.log('3. Check Supabase Dashboard > Authentication > Policies')
  }

  return { rlsEnabled, rlsDisabled, rlsUnknown }
}

directRLSCheck()
  .then(results => {
    console.log('\n🎉 RLS INVESTIGATION COMPLETE')
  })
  .catch(error => {
    console.error('💥 Investigation error:', error)
  })