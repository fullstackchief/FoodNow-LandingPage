/**
 * ERROR-BASED TABLE CLASSIFICATION
 * ================================
 * Tests RLS on each table individually and classifies by error type
 * This is the ONLY reliable method - let errors tell us the truth
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')

async function errorBasedClassification() {
  console.log('🔍 ERROR-BASED TABLE CLASSIFICATION')
  console.log('===================================')
  console.log('Testing RLS on each table individually - errors reveal truth')

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  // All objects we discovered
  const allObjects = [
    "users", "restaurants", "menu_items", "orders", "order_items", "notifications",
    "admin_users", "admin_sessions", "role_applications", "guarantor_verifications",
    "delivery_zones", "support_tickets", "payment_transactions", "delivery_assignments",
    "rider_documents", "restaurant_documents", "admin_permissions", "system_settings",
    "rider_guarantors", "payout_history", "promo_codes", "promo_code_usage",
    "push_subscriptions", "rate_limits", "restaurant_analytics", "review_votes",
    "reviews", "riders", "service_areas", "spatial_ref_sys", "system_analytics", 
    "user_order_history"
  ]

  const classification = {
    actual_tables: [],
    views: [],
    system_tables: [],
    non_existent: [],
    unknown_errors: []
  }

  console.log('\n🧪 TESTING RLS ON EACH OBJECT:')
  console.log('==============================')

  for (const objName of allObjects) {
    console.log(`\nTesting: ${objName}`)
    
    try {
      const { data: rlsResult, error: rlsError } = await supabase
        .rpc('exec_sql', { 
          sql_text: `ALTER TABLE public.${objName} ENABLE ROW LEVEL SECURITY`
        })

      if (rlsError) {
        console.log(`   ❌ RPC Error: ${rlsError.message}`)
        classification.unknown_errors.push({ table: objName, error: rlsError.message })
      } else if (rlsResult && rlsResult[0].result.includes('ERROR:')) {
        const errorMsg = rlsResult[0].result
        console.log(`   ❌ SQL Error: ${errorMsg}`)
        
        // Classify by error type
        if (errorMsg.includes('42809') && errorMsg.includes('not supported for views')) {
          console.log(`   📋 CLASSIFICATION: VIEW`)
          classification.views.push(objName)
        } else if (errorMsg.includes('42501') && errorMsg.includes('must be owner')) {
          console.log(`   ⚠️  CLASSIFICATION: SYSTEM TABLE`)
          classification.system_tables.push(objName)
        } else if (errorMsg.includes('42P01') && errorMsg.includes('does not exist')) {
          console.log(`   ❌ CLASSIFICATION: NON-EXISTENT`)
          classification.non_existent.push(objName)
        } else {
          console.log(`   ❓ CLASSIFICATION: UNKNOWN ERROR`)
          classification.unknown_errors.push({ table: objName, error: errorMsg })
        }
      } else {
        console.log(`   ✅ SUCCESS: TABLE (RLS enabled)`)
        classification.actual_tables.push(objName)
      }
    } catch (err) {
      console.log(`   💥 Exception: ${err.message}`)
      classification.unknown_errors.push({ table: objName, error: err.message })
    }
  }

  console.log('\n📊 FINAL CLASSIFICATION BY ERRORS:')
  console.log('==================================')
  console.log(`✅ Actual Tables: ${classification.actual_tables.length}`)
  console.log(`📋 Views: ${classification.views.length}`)
  console.log(`⚠️  System Tables: ${classification.system_tables.length}`)
  console.log(`❌ Non-existent: ${classification.non_existent.length}`)
  console.log(`❓ Unknown Errors: ${classification.unknown_errors.length}`)

  console.log('\n✅ TABLES THAT CAN HAVE RLS (Working):')
  classification.actual_tables.forEach(t => console.log(`   - ${t}`))

  if (classification.views.length > 0) {
    console.log('\n📋 VIEWS (Cannot have RLS):')
    classification.views.forEach(t => console.log(`   - ${t}`))
  }

  if (classification.system_tables.length > 0) {
    console.log('\n⚠️  SYSTEM TABLES (Cannot modify):')
    classification.system_tables.forEach(t => console.log(`   - ${t}`))
  }

  if (classification.non_existent.length > 0) {
    console.log('\n❌ NON-EXISTENT TABLES:')
    classification.non_existent.forEach(t => console.log(`   - ${t}`))
  }

  if (classification.unknown_errors.length > 0) {
    console.log('\n❓ UNKNOWN ERRORS:')
    classification.unknown_errors.forEach(item => {
      console.log(`   - ${item.table}: ${item.error}`)
    })
  }

  // Save the error-based truth
  const finalTruth = {
    timestamp: new Date().toISOString(),
    method: 'error_based_classification',
    classification,
    rls_applicable_tables: classification.actual_tables,
    rls_applicable_count: classification.actual_tables.length,
    user_order_history_type: classification.views.includes('user_order_history') ? 'VIEW' : 
                              classification.system_tables.includes('user_order_history') ? 'SYSTEM_TABLE' :
                              classification.actual_tables.includes('user_order_history') ? 'TABLE' : 'UNKNOWN',
    spatial_ref_sys_type: classification.views.includes('spatial_ref_sys') ? 'VIEW' : 
                          classification.system_tables.includes('spatial_ref_sys') ? 'SYSTEM_TABLE' :
                          classification.actual_tables.includes('spatial_ref_sys') ? 'TABLE' : 'UNKNOWN'
  }

  fs.writeFileSync('error-based-classification.json', JSON.stringify(finalTruth, null, 2))
  console.log('\n📄 Error-based classification saved: error-based-classification.json')

  return classification
}

errorBasedClassification()
  .then(result => {
    console.log('\n🎯 ERROR-BASED CLASSIFICATION COMPLETE')
    console.log(`✅ ${result.actual_tables.length} tables confirmed for RLS`)
    console.log('💡 Ready to create error-proof RLS migration!')
  })
  .catch(error => {
    console.error('💥 Classification error:', error)
  })