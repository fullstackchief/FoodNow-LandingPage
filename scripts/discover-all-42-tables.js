/**
 * DISCOVER ALL TABLES IN SUPABASE DATABASE
 * ========================================
 * Comprehensive discovery of all 42+ tables in the database
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

async function discoverAllTables() {
  console.log('🔍 DISCOVERING ALL TABLES IN DATABASE')
  console.log('====================================')
  console.log(`⏰ Started: ${new Date().toISOString()}`)

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  // Query ALL tables in public schema
  try {
    const { data: allTables, error } = await supabase
      .from('information_schema.tables')
      .select('table_name, table_type')
      .eq('table_schema', 'public')
      .order('table_name')

    if (error) {
      console.log('❌ Error querying information_schema.tables:', error.message)
      
      // Fallback: Try direct SQL approach
      console.log('\n🔄 Trying alternative approach...')
      
      // Try to get table names from system catalogs
      const { data: pgTables, error: pgError } = await supabase
        .rpc('exec_sql', { 
          sql_text: `
            SELECT table_name, table_type
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name
          `
        })
      
      if (pgError) {
        console.log('❌ Alternative approach failed:', pgError.message)
        return
      }
      
      console.log('✅ Alternative approach successful')
      allTables = pgTables
    }

    if (!allTables || allTables.length === 0) {
      console.log('❌ No tables found')
      return
    }

    console.log(`\n📊 FOUND ${allTables.length} TABLES:`)
    console.log('=======================')

    // Check each table for data and RLS status
    const tableDetails = []
    
    for (const table of allTables) {
      const tableName = table.table_name
      
      try {
        // Get row count
        const { count, error: countError } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true })

        let rowCount = 'ERROR'
        let rlsStatus = 'UNKNOWN'
        
        if (!countError) {
          rowCount = count || 0
          
          // Test RLS by trying with anon key
          const anonSupabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
          )
          
          const { data: anonTest, error: anonError } = await anonSupabase
            .from(tableName)
            .select('*', { count: 'exact', head: true })
          
          if (anonError) {
            if (anonError.code === 'PGRST116' || anonError.message.includes('row')) {
              rlsStatus = '🔒 ENABLED'
            } else {
              rlsStatus = '⚠️  ERROR'
            }
          } else {
            rlsStatus = '❌ DISABLED'
          }
        }

        tableDetails.push({
          name: tableName,
          rows: rowCount,
          rls: rlsStatus
        })

        console.log(`   ${rlsStatus} ${tableName} (${rowCount} rows)`)

      } catch (err) {
        console.log(`   💥 ${tableName} - Error: ${err.message}`)
        tableDetails.push({
          name: tableName,
          rows: 'ERROR',
          rls: 'ERROR'
        })
      }
    }

    // Summary analysis
    console.log('\n📊 SUMMARY ANALYSIS:')
    console.log('====================')
    
    const rlsEnabled = tableDetails.filter(t => t.rls === '🔒 ENABLED')
    const rlsDisabled = tableDetails.filter(t => t.rls === '❌ DISABLED')
    const rlsErrors = tableDetails.filter(t => t.rls.includes('ERROR') || t.rls.includes('⚠️'))
    
    console.log(`Total Tables: ${tableDetails.length}`)
    console.log(`RLS Enabled: ${rlsEnabled.length}`)
    console.log(`RLS Disabled: ${rlsDisabled.length}`)
    console.log(`RLS Errors/Unknown: ${rlsErrors.length}`)

    if (rlsDisabled.length > 0) {
      console.log('\n❌ TABLES WITHOUT RLS:')
      rlsDisabled.forEach(t => console.log(`   - ${t.name} (${t.rows} rows)`))
    }

    if (rlsEnabled.length > 0) {
      console.log('\n✅ TABLES WITH RLS:')
      rlsEnabled.forEach(t => console.log(`   - ${t.name} (${t.rows} rows)`))
    }

    // Export results for documentation
    const fs = require('fs')
    const reportData = {
      timestamp: new Date().toISOString(),
      total_tables: tableDetails.length,
      rls_enabled: rlsEnabled.length,
      rls_disabled: rlsDisabled.length,
      table_details: tableDetails
    }

    fs.writeFileSync('complete-table-analysis.json', JSON.stringify(reportData, null, 2))
    console.log('\n📄 Report saved to: complete-table-analysis.json')

    return tableDetails

  } catch (error) {
    console.error('💥 Discovery failed:', error)
  }
}

discoverAllTables()
  .then(result => {
    console.log('\n🎉 COMPLETE TABLE DISCOVERY FINISHED')
  })
  .catch(error => {
    console.error('💥 Discovery error:', error)
  })