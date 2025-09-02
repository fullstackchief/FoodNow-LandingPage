/**
 * RAW SQL TABLE DISCOVERY - TRUTH ONLY
 * ====================================
 * Uses only raw SQL to find tables that actually exist
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')

async function rawSQLTableDiscovery() {
  console.log('🔍 RAW SQL TABLE DISCOVERY (TRUTH ONLY)')
  console.log('=======================================')

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  console.log('\n📋 GETTING ALL TABLES FROM INFORMATION_SCHEMA:')
  console.log('==============================================')

  try {
    const { data: result, error } = await supabase
      .rpc('exec_sql', { 
        sql_text: `
          SELECT 
            table_name,
            table_type,
            table_schema
          FROM information_schema.tables 
          WHERE table_schema = 'public'
          AND table_type = 'BASE TABLE'
          ORDER BY table_name
        `
      })

    if (error) {
      console.log('❌ Raw SQL query failed:', error.message)
      return
    }

    console.log('✅ Raw SQL query successful')
    
    // Parse the result - exec_sql returns text result
    let tableNames = []
    
    if (result && result.length > 0) {
      const resultText = result[0].result
      
      if (resultText.includes('ERROR:')) {
        console.log('❌ SQL execution error:', resultText)
        return
      }
      
      // The result should be the raw query output
      // Let's try a simpler query that just returns table names
      console.log('\n🔄 Trying simpler table name query...')
      
      const { data: simpleResult, error: simpleError } = await supabase
        .rpc('exec_sql', { 
          sql_text: `
            SELECT string_agg(table_name, ',') as table_list
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            AND table_type = 'BASE TABLE'
          `
        })

      if (simpleError) {
        console.log('❌ Simple query failed:', simpleError.message)
        return
      }

      if (simpleResult && simpleResult.length > 0) {
        const tableListResult = simpleResult[0].result
        
        if (tableListResult && !tableListResult.includes('ERROR:')) {
          // Parse comma-separated table names
          tableNames = tableListResult.split(',').map(name => name.trim()).filter(name => name)
          
          console.log(`✅ Found ${tableNames.length} tables via raw SQL:`)
          tableNames.forEach(name => console.log(`   - ${name}`))
          
          // Check if problem table exists
          const hasRestaurantSettings = tableNames.includes('restaurant_settings')
          console.log(`\n🎯 restaurant_settings exists: ${hasRestaurantSettings ? 'YES' : 'NO'}`)
          
        } else {
          console.log('❌ Simple query returned error:', tableListResult)
        }
      }
    }

    // Method 2: Try individual table verification for known core tables
    console.log('\n🧪 VERIFYING CORE TABLES INDIVIDUALLY:')
    console.log('=====================================')
    
    const coreTables = ['users', 'restaurants', 'menu_items', 'orders', 'order_items']
    const verifiedCore = []
    
    for (const table of coreTables) {
      const { data: testResult, error: testError } = await supabase
        .rpc('exec_sql', { 
          sql_text: `SELECT COUNT(*) FROM public.${table} LIMIT 1`
        })

      if (testError) {
        console.log(`❌ ${table}: Error - ${testError.message}`)
      } else if (testResult && testResult[0].result.includes('ERROR:')) {
        console.log(`❌ ${table}: ${testResult[0].result}`)
      } else {
        console.log(`✅ ${table}: EXISTS`)
        verifiedCore.push(table)
      }
    }

    console.log(`\n✅ ${verifiedCore.length} core tables verified to exist`)

    // Generate accurate report
    const report = {
      timestamp: new Date().toISOString(),
      investigation_method: 'raw_sql_only',
      problem_table: problemTable,
      problem_table_exists: tableNames.includes('restaurant_settings'),
      all_tables_found: tableNames,
      verified_core_tables: verifiedCore,
      total_tables: tableNames.length,
      discrepancy_explanation: 'Supabase client .from() method can return false positives'
    }

    fs.writeFileSync('raw-sql-table-truth.json', JSON.stringify(report, null, 2))
    console.log('\n📄 Truth report saved: raw-sql-table-truth.json')

    return {
      allTables: tableNames,
      coreTablesVerified: verifiedCore,
      restaurantSettingsExists: tableNames.includes('restaurant_settings')
    }

  } catch (error) {
    console.error('💥 Investigation failed:', error)
    return null
  }
}

rawSQLTableDiscovery()
  .then(result => {
    console.log('\n🎉 RAW SQL INVESTIGATION COMPLETE')
    if (result) {
      console.log(`✅ Truth: ${result.allTables.length} actual tables found`)
      console.log(`✅ Core verification: ${result.coreTablesVerified.length}/5 core tables`)
      console.log(`🎯 restaurant_settings actually exists: ${result.restaurantSettingsExists}`)
    }
  })
  .catch(error => {
    console.error('💥 Investigation error:', error)
  })