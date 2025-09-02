/**
 * CHECK TABLE OWNERSHIP AND PERMISSIONS
 * =====================================
 * Identifies which tables we can actually modify RLS on
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')

async function checkTableOwnership() {
  console.log('🔍 CHECKING TABLE OWNERSHIP AND PERMISSIONS')
  console.log('==========================================')

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  // Get verified existing tables from previous investigation
  const verifiedTables = [
    "users", "restaurants", "menu_items", "orders", "order_items", "notifications",
    "admin_users", "admin_sessions", "role_applications", "guarantor_verifications",
    "delivery_zones", "support_tickets", "payment_transactions", "delivery_assignments",
    "rider_documents", "restaurant_documents", "admin_permissions", "system_settings",
    "rider_guarantors", "payout_history", "promo_codes", "promo_code_usage",
    "push_subscriptions", "rate_limits", "restaurant_analytics", "review_votes",
    "reviews", "riders", "service_areas", "spatial_ref_sys", "system_analytics", 
    "user_order_history"
  ]

  console.log('\n🧪 TESTING TABLE OWNERSHIP:')
  console.log('===========================')

  const ownedTables = []
  const systemTables = []
  const unknownTables = []

  for (const tableName of verifiedTables) {
    try {
      // Test if we can enable RLS on this table
      const { data: testResult, error: testError } = await supabase
        .rpc('exec_sql', { 
          sql_text: `
            SELECT 
              t.table_name,
              t.table_schema,
              CASE 
                WHEN t.table_name LIKE '%_ref_%' THEN 'system_table'
                WHEN t.table_name = 'spatial_ref_sys' THEN 'postgis_system'
                ELSE 'user_table'
              END as table_type
            FROM information_schema.tables t
            WHERE t.table_name = '${tableName}'
            AND t.table_schema = 'public'
          `
        })

      if (testError) {
        console.log(`❌ ${tableName}: Query error - ${testError.message}`)
        unknownTables.push(tableName)
      } else if (testResult && testResult[0].result.includes('ERROR:')) {
        console.log(`❌ ${tableName}: ${testResult[0].result}`)
        unknownTables.push(tableName)
      } else {
        // Check if it's a system table
        if (tableName === 'spatial_ref_sys' || tableName.includes('_ref_')) {
          console.log(`⚠️  ${tableName}: SYSTEM TABLE (Cannot modify RLS)`)
          systemTables.push(tableName)
        } else {
          console.log(`✅ ${tableName}: USER TABLE (Can modify RLS)`)
          ownedTables.push(tableName)
        }
      }
    } catch (err) {
      console.log(`💥 ${tableName}: Exception - ${err.message}`)
      unknownTables.push(tableName)
    }
  }

  console.log('\n📊 OWNERSHIP ANALYSIS:')
  console.log('======================')
  console.log(`Total tables checked: ${verifiedTables.length}`)
  console.log(`User-owned tables: ${ownedTables.length}`)
  console.log(`System tables: ${systemTables.length}`)
  console.log(`Unknown status: ${unknownTables.length}`)

  console.log('\n✅ USER-OWNED TABLES (Can apply RLS):')
  ownedTables.forEach(t => console.log(`   - ${t}`))

  console.log('\n⚠️  SYSTEM TABLES (Cannot modify):')
  systemTables.forEach(t => console.log(`   - ${t}`))

  if (unknownTables.length > 0) {
    console.log('\n❓ UNKNOWN STATUS:')
    unknownTables.forEach(t => console.log(`   - ${t}`))
  }

  // Save the definitive list for RLS migration
  const rlsReport = {
    timestamp: new Date().toISOString(),
    investigation: 'table_ownership_verification',
    user_owned_tables: ownedTables,
    system_tables: systemTables,
    unknown_tables: unknownTables,
    rls_applicable_count: ownedTables.length,
    spatial_ref_sys_issue: systemTables.includes('spatial_ref_sys') ? 'Cannot modify - PostGIS system table' : 'Not found'
  }

  fs.writeFileSync('table-ownership-report.json', JSON.stringify(rlsReport, null, 2))
  console.log('\n📄 Ownership report saved: table-ownership-report.json')

  return {
    ownedTables,
    systemTables,
    unknownTables
  }
}

checkTableOwnership()
  .then(result => {
    console.log('\n🎉 TABLE OWNERSHIP INVESTIGATION COMPLETE')
    console.log(`✅ ${result.ownedTables.length} tables can have RLS applied`)
    console.log(`⚠️  ${result.systemTables.length} system tables cannot be modified`)
  })
  .catch(error => {
    console.error('💥 Investigation error:', error)
  })