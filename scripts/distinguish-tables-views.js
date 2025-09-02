/**
 * DISTINGUISH TABLES FROM VIEWS
 * =============================
 * Identifies what are actual tables vs views vs system objects
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')

async function distinguishTablesViews() {
  console.log('🔍 DISTINGUISHING TABLES FROM VIEWS')
  console.log('===================================')

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  // Get all objects in public schema with their types
  console.log('\n📋 QUERYING ALL OBJECTS BY TYPE:')
  console.log('================================')

  try {
    const { data: result, error } = await supabase
      .rpc('exec_sql', { 
        sql_text: `
          SELECT 
            table_name,
            table_type,
            CASE 
              WHEN table_type = 'BASE TABLE' THEN 'TABLE'
              WHEN table_type = 'VIEW' THEN 'VIEW'
              ELSE table_type
            END as object_type
          FROM information_schema.tables 
          WHERE table_schema = 'public'
          ORDER BY table_type, table_name
        `
      })

    if (error) {
      console.log('❌ Schema query failed:', error.message)
      return
    }

    if (!result || result.length === 0 || result[0].result.includes('ERROR:')) {
      console.log('❌ No valid result from schema query')
      return
    }

    // Alternative approach: Check each known object individually
    console.log('\n🧪 TESTING EACH OBJECT INDIVIDUALLY:')
    console.log('===================================')

    const knownObjects = [
      "users", "restaurants", "menu_items", "orders", "order_items", "notifications",
      "admin_users", "admin_sessions", "role_applications", "guarantor_verifications",
      "delivery_zones", "support_tickets", "payment_transactions", "delivery_assignments",
      "rider_documents", "restaurant_documents", "admin_permissions", "system_settings",
      "rider_guarantors", "payout_history", "promo_codes", "promo_code_usage",
      "push_subscriptions", "rate_limits", "restaurant_analytics", "review_votes",
      "reviews", "riders", "service_areas", "spatial_ref_sys", "system_analytics", 
      "user_order_history"
    ]

    const actualTables = []
    const views = []
    const systemObjects = []
    const nonExistent = []

    for (const objName of knownObjects) {
      try {
        // Check object type
        const { data: typeResult, error: typeError } = await supabase
          .rpc('exec_sql', { 
            sql_text: `
              SELECT 
                table_name,
                table_type,
                CASE 
                  WHEN table_type = 'BASE TABLE' THEN 'CAN_APPLY_RLS'
                  WHEN table_type = 'VIEW' THEN 'CANNOT_APPLY_RLS'
                  ELSE 'UNKNOWN'
                END as rls_applicable
              FROM information_schema.tables 
              WHERE table_name = '${objName}' 
              AND table_schema = 'public'
            `
          })

        if (typeError) {
          console.log(`❌ ${objName}: Type check error - ${typeError.message}`)
          nonExistent.push(objName)
        } else if (typeResult && typeResult[0].result.includes('ERROR:')) {
          console.log(`❌ ${objName}: ${typeResult[0].result}`)
          nonExistent.push(objName)
        } else {
          // Parse the result to determine type
          // Since we can't easily parse the SQL result, let's try a simpler approach
          
          // Test if we can enable RLS (will fail for views)
          const { data: rlsTest, error: rlsError } = await supabase
            .rpc('exec_sql', { 
              sql_text: `
                DO $$
                BEGIN
                  BEGIN
                    ALTER TABLE public.${objName} ENABLE ROW LEVEL SECURITY;
                    RAISE NOTICE 'RLS_ENABLED_ON_TABLE: ${objName}';
                  EXCEPTION
                    WHEN OTHERS THEN
                      RAISE NOTICE 'RLS_FAILED: ${objName} - %', SQLERRM;
                  END;
                END $$
              `
            })

          if (rlsError) {
            console.log(`❌ ${objName}: RLS test error - ${rlsError.message}`)
            nonExistent.push(objName)
          } else if (rlsTest && rlsTest[0].result.includes('This operation is not supported for views')) {
            console.log(`📋 ${objName}: VIEW (Cannot apply RLS)`)
            views.push(objName)
          } else if (rlsTest && rlsTest[0].result.includes('must be owner')) {
            console.log(`⚠️  ${objName}: SYSTEM OBJECT (Cannot modify)`)
            systemObjects.push(objName)
          } else if (rlsTest && rlsTest[0].result.includes('relation') && rlsTest[0].result.includes('does not exist')) {
            console.log(`❌ ${objName}: DOES NOT EXIST`)
            nonExistent.push(objName)
          } else {
            console.log(`✅ ${objName}: TABLE (Can apply RLS)`)
            actualTables.push(objName)
          }
        }
      } catch (err) {
        console.log(`💥 ${objName}: Exception - ${err.message}`)
        nonExistent.push(objName)
      }
    }

    console.log('\n📊 FINAL OBJECT CLASSIFICATION:')
    console.log('===============================')
    console.log(`Actual Tables (RLS applicable): ${actualTables.length}`)
    console.log(`Views (RLS not applicable): ${views.length}`)
    console.log(`System Objects (Cannot modify): ${systemObjects.length}`)
    console.log(`Non-existent: ${nonExistent.length}`)

    console.log('\n✅ ACTUAL TABLES (Can apply RLS):')
    actualTables.forEach(t => console.log(`   - ${t}`))

    console.log('\n📋 VIEWS (Cannot apply RLS):')
    views.forEach(t => console.log(`   - ${t}`))

    console.log('\n⚠️  SYSTEM OBJECTS (Cannot modify):')
    systemObjects.forEach(t => console.log(`   - ${t}`))

    if (nonExistent.length > 0) {
      console.log('\n❌ NON-EXISTENT:')
      nonExistent.forEach(t => console.log(`   - ${t}`))
    }

    // Save the final truth
    const finalReport = {
      timestamp: new Date().toISOString(),
      method: 'rls_test_based_classification',
      actual_tables: actualTables,
      views: views,
      system_objects: systemObjects,
      non_existent: nonExistent,
      rls_applicable_count: actualTables.length
    }

    fs.writeFileSync('tables-vs-views-truth.json', JSON.stringify(finalReport, null, 2))
    console.log('\n📄 Final classification saved: tables-vs-views-truth.json')

    return {
      actualTables,
      views,
      systemObjects,
      nonExistent
    }

  } catch (error) {
    console.error('💥 Classification failed:', error)
    return null
  }
}

distinguishTablesViews()
  .then(result => {
    if (result) {
      console.log('\n🎉 TABLE/VIEW CLASSIFICATION COMPLETE')
      console.log(`✅ ${result.actualTables.length} actual tables can have RLS`)
      console.log(`📋 ${result.views.length} views cannot have RLS`)
      console.log(`⚠️  ${result.systemObjects.length} system objects cannot be modified`)
    }
  })
  .catch(error => {
    console.error('💥 Error:', error)
  })