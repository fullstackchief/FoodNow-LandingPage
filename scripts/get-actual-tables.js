/**
 * GET ACTUAL EXISTING TABLES ONLY
 * ===============================
 * Returns only tables that actually exist for RLS policy creation
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

async function getActualTables() {
  console.log('🔍 GETTING ACTUAL EXISTING TABLES')
  console.log('=================================')

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  // Test each table by trying to access it
  const allPossibleTables = [
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

  const existingTables = []
  const nonExistentTables = []

  console.log('\n📋 TESTING TABLE EXISTENCE:')
  console.log('===========================')

  for (const tableName of allPossibleTables) {
    try {
      const { count, error } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true })

      if (error) {
        console.log(`❌ ${tableName}: ${error.message}`)
        nonExistentTables.push(tableName)
      } else {
        console.log(`✅ ${tableName}: EXISTS (${count || 0} rows)`)
        existingTables.push(tableName)
      }
    } catch (err) {
      console.log(`💥 ${tableName}: Exception - ${err.message}`)
      nonExistentTables.push(tableName)
    }
  }

  console.log('\n📊 SUMMARY:')
  console.log('===========')
  console.log(`Total tested: ${allPossibleTables.length}`)
  console.log(`Existing tables: ${existingTables.length}`)
  console.log(`Non-existent: ${nonExistentTables.length}`)

  console.log('\n✅ EXISTING TABLES:')
  existingTables.forEach(t => console.log(`   - ${t}`))

  if (nonExistentTables.length > 0) {
    console.log('\n❌ NON-EXISTENT TABLES:')
    nonExistentTables.forEach(t => console.log(`   - ${t}`))
  }

  // Save results for RLS policy creation
  const fs = require('fs')
  const report = {
    timestamp: new Date().toISOString(),
    existing_tables: existingTables,
    non_existent_tables: nonExistentTables,
    total_existing: existingTables.length
  }

  fs.writeFileSync('actual-tables-only.json', JSON.stringify(report, null, 2))
  console.log('\n📄 Report saved to: actual-tables-only.json')

  return existingTables
}

getActualTables()
  .then(tables => {
    console.log(`\n🎉 FOUND ${tables.length} ACTUAL TABLES`)
    console.log('Ready to create RLS policies for existing tables only!')
  })
  .catch(error => {
    console.error('💥 Error:', error)
  })