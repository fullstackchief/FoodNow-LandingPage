/**
 * THOROUGH TABLE INVESTIGATION
 * ============================
 * Deep investigation of table existence discrepancy
 * Compares multiple methods to find the truth
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')

async function thoroughInvestigation() {
  console.log('🔍 THOROUGH TABLE EXISTENCE INVESTIGATION')
  console.log('========================================')
  console.log(`⏰ Started: ${new Date().toISOString()}`)

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  const problemTable = 'restaurant_settings'
  
  console.log(`\n🎯 INVESTIGATING: ${problemTable}`)
  console.log('=====================================')

  // Method 1: Direct Supabase client access
  console.log('\n🔍 METHOD 1: Direct Supabase Client Access')
  try {
    const { count, error } = await supabase
      .from(problemTable)
      .select('*', { count: 'exact', head: true })

    if (error) {
      console.log(`❌ Supabase Client Error: ${error.message}`)
      console.log(`   Error Code: ${error.code}`)
      console.log(`   Error Details: ${error.details || 'None'}`)
    } else {
      console.log(`✅ Supabase Client: Table accessible (${count} rows)`)
    }
  } catch (err) {
    console.log(`💥 Supabase Client Exception: ${err.message}`)
  }

  // Method 2: Raw SQL via RPC (if exec_sql exists)
  console.log('\n🔍 METHOD 2: Raw SQL Query')
  try {
    const { data: sqlResult, error: sqlError } = await supabase
      .rpc('exec_sql', { 
        sql_text: `SELECT COUNT(*) FROM public.${problemTable} LIMIT 1`
      })

    if (sqlError) {
      console.log(`❌ Raw SQL Error: ${sqlError.message}`)
    } else {
      console.log(`✅ Raw SQL: Table accessible`)
      console.log(`   Result: ${JSON.stringify(sqlResult)}`)
    }
  } catch (err) {
    console.log(`💥 Raw SQL Exception: ${err.message}`)
  }

  // Method 3: Information Schema Query
  console.log('\n🔍 METHOD 3: Information Schema Query')
  try {
    const { data: schemaResult, error: schemaError } = await supabase
      .rpc('exec_sql', { 
        sql_text: `
          SELECT table_name, table_type
          FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = '${problemTable}'
        `
      })

    if (schemaError) {
      console.log(`❌ Schema Query Error: ${schemaError.message}`)
    } else {
      console.log(`✅ Information Schema Result:`)
      console.log(`   ${JSON.stringify(schemaResult)}`)
      if (schemaResult && schemaResult.length === 0) {
        console.log(`   🚨 TABLE NOT FOUND IN SCHEMA!`)
      }
    }
  } catch (err) {
    console.log(`💥 Schema Query Exception: ${err.message}`)
  }

  // Method 4: PostgreSQL Catalog Query
  console.log('\n🔍 METHOD 4: PostgreSQL Catalog Query')
  try {
    const { data: catalogResult, error: catalogError } = await supabase
      .rpc('exec_sql', { 
        sql_text: `
          SELECT 
            relname as table_name,
            relkind as kind,
            relowner as owner,
            relnamespace as namespace
          FROM pg_class 
          WHERE relname = '${problemTable}' 
          AND relkind = 'r'
        `
      })

    if (catalogError) {
      console.log(`❌ Catalog Query Error: ${catalogError.message}`)
    } else {
      console.log(`✅ PostgreSQL Catalog Result:`)
      console.log(`   ${JSON.stringify(catalogResult)}`)
      if (catalogResult && catalogResult.length === 0) {
        console.log(`   🚨 TABLE NOT FOUND IN PG_CLASS!`)
      }
    }
  } catch (err) {
    console.log(`💥 Catalog Query Exception: ${err.message}`)
  }

  // Method 5: Test ALL possible table discovery methods
  console.log('\n🔍 METHOD 5: Complete Schema Discovery')
  try {
    const { data: allTables, error: allError } = await supabase
      .rpc('exec_sql', { 
        sql_text: `
          SELECT 
            table_name,
            table_type,
            table_schema
          FROM information_schema.tables 
          WHERE table_schema = 'public'
          ORDER BY table_name
        `
      })

    if (allError) {
      console.log(`❌ Complete Discovery Error: ${allError.message}`)
    } else {
      console.log(`✅ Found ${allTables ? allTables.length : 0} total tables in schema`)
      
      if (allTables) {
        const actualTableNames = allTables.map(t => t.table_name)
        const hasRestaurantSettings = actualTableNames.includes(problemTable)
        
        console.log(`\n📋 ALL ACTUAL TABLES IN DATABASE:`)
        actualTableNames.forEach(name => {
          console.log(`   - ${name}${name === problemTable ? ' ← PROBLEM TABLE' : ''}`)
        })
        
        console.log(`\n🎯 VERDICT: ${problemTable} ${hasRestaurantSettings ? 'EXISTS' : 'DOES NOT EXIST'} in schema`)
        
        // Save the accurate list
        fs.writeFileSync('accurate-table-list.json', JSON.stringify({
          timestamp: new Date().toISOString(),
          method: 'information_schema.tables',
          total_tables: actualTableNames.length,
          table_names: actualTableNames,
          problem_table_exists: hasRestaurantSettings
        }, null, 2))
        
        return actualTableNames
      }
    }
  } catch (err) {
    console.log(`💥 Complete Discovery Exception: ${err.message}`)
  }

  return null
}

thoroughInvestigation()
  .then(result => {
    console.log('\n🎉 THOROUGH INVESTIGATION COMPLETE')
    if (result) {
      console.log(`✅ Accurate table list saved with ${result.length} tables`)
    } else {
      console.log('❌ Investigation inconclusive')
    }
  })
  .catch(error => {
    console.error('💥 Investigation error:', error)
  })