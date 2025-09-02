/**
 * COMPREHENSIVE TABLE DISCOVERY SCRIPT
 * ====================================
 * Discovers ALL actual tables in the Supabase database
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function discoverAllTables() {
  console.log('🔍 COMPREHENSIVE TABLE DISCOVERY')
  console.log('==================================')
  console.log(`⏰ Started: ${new Date().toISOString()}`)

  const results = {
    existing_tables: [],
    missing_tables: [],
    errors: []
  }

  // All tables referenced in RLS script
  const allReferencedTables = [
    'users', 'restaurants', 'menu_items', 'orders', 'order_items',
    'notifications', 'delivery_zones', 'support_tickets', 
    'payment_transactions', 'delivery_assignments', 'rider_documents',
    'restaurant_documents', 'admin_permissions', 'system_settings',
    'rider_guarantors', 'payout_history'
  ]

  console.log('\n🔍 Testing individual table existence:')
  console.log('=====================================')
  
  for (const table of allReferencedTables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1)
      
      if (!error) {
        console.log(`✅ ${table.padEnd(25)} - EXISTS (${data?.length || 0} sample rows)`)
        results.existing_tables.push(table)
      } else {
        console.log(`❌ ${table.padEnd(25)} - NOT FOUND: ${error.message}`)
        results.missing_tables.push({ table, error: error.message })
      }
    } catch (e) {
      console.log(`💥 ${table.padEnd(25)} - ERROR: ${e.message}`)
      results.errors.push({ table, error: e.message })
    }
  }

  console.log('\n📊 DISCOVERY SUMMARY')
  console.log('====================')
  console.log(`✅ Existing tables: ${results.existing_tables.length}`)
  console.log(`❌ Missing tables: ${results.missing_tables.length}`)
  console.log(`💥 Errors: ${results.errors.length}`)

  if (results.existing_tables.length > 0) {
    console.log('\n✅ EXISTING TABLES:')
    results.existing_tables.forEach(table => console.log(`   - ${table}`))
  }

  if (results.missing_tables.length > 0) {
    console.log('\n❌ MISSING TABLES:')
    results.missing_tables.forEach(({ table, error }) => {
      console.log(`   - ${table}: ${error}`)
    })
  }

  // Now let's check what RLS script is trying to enable
  console.log('\n🔒 RLS SCRIPT ANALYSIS')
  console.log('======================')
  
  const rlsMissing = results.missing_tables.filter(t => 
    allReferencedTables.includes(t.table)
  )
  
  if (rlsMissing.length > 0) {
    console.log('⚠️ RLS script references tables that DO NOT EXIST:')
    rlsMissing.forEach(({ table }) => console.log(`   - ${table}`))
    console.log('\n💡 SOLUTION: Create corrected RLS script with only existing tables')
  } else {
    console.log('✅ All tables in RLS script exist - different issue')
  }

  return results
}

// Execute discovery
discoverAllTables()
  .then(results => {
    console.log('\n🎯 INVESTIGATION COMPLETE')
    console.log('=========================')
    
    if (results.missing_tables.length > 0) {
      console.log('🔧 NEXT ACTIONS NEEDED:')
      console.log('1. Create missing tables OR')
      console.log('2. Generate corrected RLS script with only existing tables')
      console.log('3. Execute corrected RLS script in Supabase Dashboard')
    } else {
      console.log('✅ All tables exist - RLS script should work')
    }
  })
  .catch(error => {
    console.error('💥 Discovery failed:', error)
  })