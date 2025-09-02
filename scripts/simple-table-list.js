/**
 * SIMPLE TABLE LISTING AND RLS CHECK
 * ===================================
 * Lists all tables by trying to access them directly
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

async function listAllTables() {
  console.log('🔍 DISCOVERING ALL TABLES BY DIRECT ACCESS')
  console.log('==========================================')

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  // Known table names from the screenshot and codebase
  const possibleTables = [
    // Core FoodNow tables
    'users', 'restaurants', 'menu_items', 'orders', 'order_items', 'notifications',
    
    // Admin system tables
    'admin_users', 'admin_sessions', 'role_applications', 'guarantor_verifications',
    
    // Operational tables
    'delivery_zones', 'support_tickets', 'payment_transactions', 'delivery_assignments',
    'rider_documents', 'restaurant_documents', 'admin_permissions', 'system_settings',
    'rider_guarantors', 'payout_history',
    
    // Additional tables visible in screenshot
    'payment_transactions', 'payout_history', 'promo_code_usage', 'promo_codes',
    'push_subscriptions', 'rate_limits', 'restaurant_analytics', 'restaurant_settings',
    'restaurant_subscriptions', 'review_votes', 'reviews', 'rider_documents',
    'rider_guarantors', 'riders', 'service_areas', 'spatial_ref_sys', 'system_analytics',
    'system_settings', 'user_order_history', 'user_preferences', 'user_ratings',
    'user_reviews', 'zones'
  ]

  const foundTables = []
  const rlsStatus = []

  console.log('\n📋 TESTING TABLE ACCESS:')
  console.log('========================')

  for (const tableName of possibleTables) {
    try {
      // Test with service role
      const { count, error } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true })

      if (!error) {
        foundTables.push(tableName)
        
        // Test RLS with anon key
        const anonSupabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        )
        
        const { data: anonData, error: anonError } = await anonSupabase
          .from(tableName)
          .select('*', { count: 'exact', head: true })
        
        let rls = '❌ DISABLED'
        if (anonError) {
          if (anonError.code === 'PGRST116' || anonError.message.includes('row')) {
            rls = '🔒 ENABLED'
          } else {
            rls = '⚠️  ERROR'
          }
        }
        
        rlsStatus.push({ table: tableName, rows: count || 0, rls })
        console.log(`   ${rls} ${tableName} (${count || 0} rows)`)
      }
    } catch (err) {
      // Table doesn't exist, skip silently
    }
  }

  console.log('\n📊 COMPLETE TABLE ANALYSIS:')
  console.log('===========================')
  console.log(`Total Tables Found: ${foundTables.length}`)
  
  const enabledTables = rlsStatus.filter(t => t.rls === '🔒 ENABLED')
  const disabledTables = rlsStatus.filter(t => t.rls === '❌ DISABLED')
  
  console.log(`RLS Enabled: ${enabledTables.length}`)
  console.log(`RLS Disabled: ${disabledTables.length}`)

  if (disabledTables.length > 0) {
    console.log('\n❌ TABLES WITHOUT RLS (SECURITY RISK):')
    disabledTables.forEach(t => console.log(`   - ${t.table} (${t.rows} rows)`))
  }

  if (enabledTables.length > 0) {
    console.log('\n✅ TABLES WITH RLS:')
    enabledTables.forEach(t => console.log(`   - ${t.table} (${t.rows} rows)`))
  }

  // Save comprehensive report
  const report = {
    timestamp: new Date().toISOString(),
    total_tables: foundTables.length,
    rls_enabled_count: enabledTables.length,
    rls_disabled_count: disabledTables.length,
    tables: rlsStatus
  }

  const fs = require('fs')
  fs.writeFileSync('complete-42-table-analysis.json', JSON.stringify(report, null, 2))
  
  console.log('\n📄 Complete analysis saved to: complete-42-table-analysis.json')
  
  return {
    foundTables,
    rlsEnabled: enabledTables,
    rlsDisabled: disabledTables
  }
}

listAllTables()
  .then(result => {
    console.log('\n🎉 42-TABLE DISCOVERY COMPLETE')
    if (result.rlsDisabled.length > 0) {
      console.log(`\n🚨 SECURITY ALERT: ${result.rlsDisabled.length} tables without RLS!`)
    }
  })
  .catch(error => {
    console.error('💥 Discovery error:', error)
  })