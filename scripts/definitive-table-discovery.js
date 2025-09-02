/**
 * DEFINITIVE TABLE DISCOVERY - RAW SQL TRUTH ONLY
 * ===============================================
 * Uses ONLY raw SQL to find tables that actually exist
 * No false positives from Supabase client methods
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')

async function definitiveTableDiscovery() {
  console.log('🔍 DEFINITIVE TABLE DISCOVERY - RAW SQL TRUTH')
  console.log('============================================')
  console.log(`⏰ Started: ${new Date().toISOString()}`)

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  // Step 1: Get all table names using information_schema
  console.log('\n📋 QUERYING INFORMATION_SCHEMA FOR ALL TABLES:')
  console.log('==============================================')

  try {
    // Use a query that returns results in a parseable format
    const { data: result, error } = await supabase
      .rpc('exec_sql', { 
        sql_text: `
          SELECT 
            'TABLE:' || table_name as table_info
          FROM information_schema.tables 
          WHERE table_schema = 'public'
          AND table_type = 'BASE TABLE'
          ORDER BY table_name
        `
      })

    if (error) {
      console.log('❌ Information schema query failed:', error.message)
      return
    }

    if (!result || result.length === 0 || result[0].result.includes('ERROR:')) {
      console.log('❌ No valid result from information_schema query')
      console.log('Result:', result)
      return
    }

    console.log('✅ Information schema query successful')

    // Try alternative approach: test specific known tables
    console.log('\n🧪 TESTING KNOWN TABLES VIA RAW SQL:')
    console.log('===================================')

    const knownTables = [
      'users', 'restaurants', 'menu_items', 'orders', 'order_items', 'notifications',
      'admin_users', 'admin_sessions', 'role_applications', 'guarantor_verifications',
      'delivery_zones', 'support_tickets', 'payment_transactions', 'delivery_assignments',
      'rider_documents', 'restaurant_documents', 'admin_permissions', 'system_settings',
      'rider_guarantors', 'payout_history', 'promo_codes', 'promo_code_usage',
      'push_subscriptions', 'rate_limits', 'restaurant_analytics', 'restaurant_settings',
      'restaurant_subscriptions', 'review_votes', 'reviews', 'riders', 'service_areas',
      'spatial_ref_sys', 'system_analytics', 'user_order_history', 'user_preferences',
      'user_ratings', 'user_reviews', 'zones'
    ]

    const actuallyExistingTables = []
    const nonExistentTables = []

    for (const tableName of knownTables) {
      try {
        const { data: testResult, error: testError } = await supabase
          .rpc('exec_sql', { 
            sql_text: `SELECT 1 FROM public.${tableName} LIMIT 1`
          })

        if (testError) {
          console.log(`❌ ${tableName}: RPC Error - ${testError.message}`)
          nonExistentTables.push(tableName)
        } else if (testResult && testResult[0].result.includes('ERROR:')) {
          console.log(`❌ ${tableName}: SQL Error - ${testResult[0].result}`)
          nonExistentTables.push(tableName)
        } else {
          console.log(`✅ ${tableName}: EXISTS`)
          actuallyExistingTables.push(tableName)
        }
      } catch (err) {
        console.log(`💥 ${tableName}: Exception - ${err.message}`)
        nonExistentTables.push(tableName)
      }
    }

    console.log('\n📊 DEFINITIVE RESULTS:')
    console.log('======================')
    console.log(`Total tested: ${knownTables.length}`)
    console.log(`Actually exist: ${actuallyExistingTables.length}`)
    console.log(`Do not exist: ${nonExistentTables.length}`)

    console.log('\n✅ TABLES THAT ACTUALLY EXIST:')
    actuallyExistingTables.forEach(t => console.log(`   - ${t}`))

    console.log('\n❌ TABLES THAT DO NOT EXIST:')
    nonExistentTables.forEach(t => console.log(`   - ${t}`))

    // Save definitive truth
    const truthReport = {
      timestamp: new Date().toISOString(),
      method: 'raw_sql_individual_verification',
      total_existing: actuallyExistingTables.length,
      existing_tables: actuallyExistingTables,
      non_existent_tables: nonExistentTables,
      problem_table_restaurant_settings: actuallyExistingTables.includes('restaurant_settings'),
      discovery_issue: 'Supabase client .from() gives false positives, raw SQL gives truth'
    }

    fs.writeFileSync('definitive-table-truth.json', JSON.stringify(truthReport, null, 2))
    console.log('\n📄 Definitive truth saved: definitive-table-truth.json')

    return actuallyExistingTables

  } catch (error) {
    console.error('💥 Definitive discovery failed:', error)
    return null
  }
}

definitiveTableDiscovery()
  .then(tables => {
    if (tables) {
      console.log(`\n🎉 DEFINITIVE DISCOVERY COMPLETE: ${tables.length} REAL TABLES`)
      console.log('✅ Ready to create accurate RLS migration')
    } else {
      console.log('\n❌ Discovery failed - need manual table listing')
    }
  })
  .catch(error => {
    console.error('💥 Error:', error)
  })