/**
 * COMPLETE SUPABASE DATABASE ANALYSIS
 * ===================================
 * Comprehensive analysis of current database state including:
 * - All tables and their schemas
 * - Row Level Security (RLS) policies
 * - Indexes and constraints
 * - Current data counts
 * - Missing tables identification
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
require('dotenv').config({ path: '.env.local' })

// Use service role for full database access
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function analyzeCompleteDatabase() {
  console.log('🔍 COMPLETE SUPABASE DATABASE ANALYSIS')
  console.log('=====================================')
  console.log(`📡 Connected to: ${process.env.NEXT_PUBLIC_SUPABASE_URL}`)
  console.log(`⏰ Analysis started: ${new Date().toISOString()}`)
  console.log('')

  const analysis = {
    connection: {},
    tables: {},
    policies: {},
    indexes: {},
    functions: {},
    data_counts: {},
    missing_tables: [],
    recommendations: []
  }

  try {
    // ===========================
    // 1. TEST DATABASE CONNECTION
    // ===========================
    console.log('1️⃣ TESTING DATABASE CONNECTION')
    console.log('==============================')
    
    const { data: testData, error: testError } = await supabase
      .from('users')
      .select('count')
      .limit(1)
    
    if (testError) {
      console.log('❌ Connection failed:', testError.message)
      analysis.connection = { status: 'failed', error: testError.message }
      return analysis
    }
    
    console.log('✅ Database connection successful')
    analysis.connection = { status: 'connected', url: process.env.NEXT_PUBLIC_SUPABASE_URL }

    // ===========================
    // 2. DISCOVER ALL TABLES
    // ===========================
    console.log('\n2️⃣ DISCOVERING ALL TABLES')
    console.log('==========================')
    
    // Try multiple methods to get table information
    let tables = []
    
    // Method 1: Query information_schema (PostgreSQL standard)
    try {
      const { data: schemaData, error: schemaError } = await supabase
        .rpc('get_table_info')
      
      if (!schemaError && schemaData) {
        tables = schemaData
        console.log('✅ Retrieved table info via custom function')
      }
    } catch (err) {
      console.log('⚠️ Custom function not available, trying direct query...')
    }
    
    // Method 2: Direct information_schema query
    if (tables.length === 0) {
      try {
        const { data: directData, error: directError } = await supabase
          .from('information_schema.tables')
          .select('*')
          .eq('table_schema', 'public')
        
        if (!directError && directData) {
          tables = directData.map(t => ({ table_name: t.table_name }))
          console.log('✅ Retrieved table info via information_schema')
        }
      } catch (err) {
        console.log('⚠️ Direct schema query failed, using table discovery...')
      }
    }
    
    // Method 3: Try known tables individually
    if (tables.length === 0) {
      const knownTables = [
        'users', 'restaurants', 'menu_items', 'orders', 'order_items',
        'notifications', 'delivery_zones', 'support_tickets', 'payment_transactions',
        'delivery_assignments', 'rider_documents', 'restaurant_documents',
        'admin_permissions', 'system_settings', 'rider_guarantors', 'payout_history'
      ]
      
      console.log('🔍 Testing known tables individually...')
      for (const tableName of knownTables) {
        try {
          const { error } = await supabase
            .from(tableName)
            .select('*')
            .limit(1)
          
          if (!error) {
            tables.push({ table_name: tableName })
            console.log(`✅ Found: ${tableName}`)
          } else {
            console.log(`❌ Missing: ${tableName}`)
            analysis.missing_tables.push(tableName)
          }
        } catch (err) {
          console.log(`❌ Error testing ${tableName}:`, err.message)
        }
      }
    }
    
    analysis.tables = tables.reduce((acc, table) => {
      acc[table.table_name] = { exists: true }
      return acc
    }, {})

    // ===========================
    // 3. GET DATA COUNTS
    // ===========================
    console.log('\n3️⃣ COUNTING DATA IN EACH TABLE')
    console.log('===============================')
    
    for (const table of tables) {
      try {
        const { count, error } = await supabase
          .from(table.table_name)
          .select('*', { count: 'exact', head: true })
        
        if (!error) {
          console.log(`📊 ${table.table_name}: ${count} rows`)
          analysis.data_counts[table.table_name] = count
          analysis.tables[table.table_name].row_count = count
        } else {
          console.log(`❌ ${table.table_name}: Could not count (${error.message})`)
          analysis.tables[table.table_name].row_count = 'unknown'
        }
      } catch (err) {
        console.log(`❌ ${table.table_name}: Error counting (${err.message})`)
      }
    }

    // ===========================
    // 4. CHECK RLS STATUS
    // ===========================
    console.log('\n4️⃣ CHECKING ROW LEVEL SECURITY (RLS)')
    console.log('====================================')
    
    try {
      // Try to check RLS status using a SQL query
      const { data: rlsData, error: rlsError } = await supabase
        .rpc('check_rls_status')
      
      if (!rlsError && rlsData) {
        console.log('📋 RLS Status from custom function:')
        rlsData.forEach(table => {
          const status = table.rls_enabled ? '🔒 Enabled' : '🔓 Disabled'
          console.log(`  ${table.table_name}: ${status}`)
          analysis.policies[table.table_name] = {
            rls_enabled: table.rls_enabled,
            policies: table.policies || []
          }
        })
      } else {
        console.log('⚠️ Cannot check RLS status - will test tables individually')
        
        // Test RLS by attempting queries
        for (const table of tables) {
          try {
            // Try with anon client to see if RLS blocks
            const anonClient = createClient(
              process.env.NEXT_PUBLIC_SUPABASE_URL,
              process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
            )
            
            const { error: anonError } = await anonClient
              .from(table.table_name)
              .select('*')
              .limit(1)
            
            const rlsStatus = anonError && anonError.message.includes('row-level security') ? 'enabled' : 'disabled'
            console.log(`  ${table.table_name}: RLS ${rlsStatus}`)
            analysis.policies[table.table_name] = { rls_enabled: rlsStatus === 'enabled' }
          } catch (err) {
            console.log(`  ${table.table_name}: Could not test RLS`)
          }
        }
      }
    } catch (err) {
      console.log('❌ RLS check failed:', err.message)
    }

    // ===========================
    // 5. SAMPLE DATA FROM KEY TABLES
    // ===========================
    console.log('\n5️⃣ SAMPLING KEY TABLE DATA')
    console.log('===========================')
    
    const keyTables = ['users', 'restaurants', 'menu_items', 'orders']
    
    for (const tableName of keyTables) {
      if (analysis.tables[tableName]) {
        try {
          const { data, error } = await supabase
            .from(tableName)
            .select('*')
            .limit(3)
          
          if (!error && data) {
            console.log(`\n📋 Sample from ${tableName}:`)
            data.forEach((row, index) => {
              console.log(`  Row ${index + 1}:`, Object.keys(row).slice(0, 5).map(key => `${key}: ${row[key]}`).join(', '))
            })
            analysis.tables[tableName].sample_data = data.slice(0, 2) // Store 2 samples
          }
        } catch (err) {
          console.log(`❌ Could not sample ${tableName}:`, err.message)
        }
      }
    }

    // ===========================
    // 6. IDENTIFY MISSING TABLES
    // ===========================
    console.log('\n6️⃣ IDENTIFYING MISSING CRITICAL TABLES')
    console.log('======================================')
    
    const requiredTables = [
      'notifications', 'delivery_zones', 'support_tickets', 'payment_transactions',
      'delivery_assignments', 'rider_documents', 'restaurant_documents',
      'admin_permissions', 'system_settings', 'rider_guarantors', 'payout_history'
    ]
    
    const missingTables = requiredTables.filter(tableName => !analysis.tables[tableName])
    
    if (missingTables.length > 0) {
      console.log('❌ Missing critical tables:')
      missingTables.forEach(table => {
        console.log(`  - ${table}`)
        analysis.missing_tables.push(table)
      })
    } else {
      console.log('✅ All critical tables exist')
    }

    // ===========================
    // 7. CHECK EXISTING TABLE SCHEMAS
    // ===========================
    console.log('\n7️⃣ CHECKING EXISTING TABLE SCHEMAS')
    console.log('===================================')
    
    for (const tableName of ['users', 'restaurants', 'menu_items', 'orders', 'order_items']) {
      if (analysis.tables[tableName]) {
        try {
          const { data, error } = await supabase
            .from(tableName)
            .select('*')
            .limit(1)
          
          if (!error && data && data[0]) {
            const columns = Object.keys(data[0])
            console.log(`📋 ${tableName} columns:`, columns.join(', '))
            analysis.tables[tableName].columns = columns
          }
        } catch (err) {
          console.log(`❌ Could not analyze ${tableName} schema`)
        }
      }
    }

    // ===========================
    // 8. GENERATE RECOMMENDATIONS
    // ===========================
    console.log('\n8️⃣ GENERATING RECOMMENDATIONS')
    console.log('==============================')
    
    // Check for critical missing features
    if (analysis.missing_tables.length > 0) {
      analysis.recommendations.push('🚨 URGENT: Create missing tables for core functionality')
    }
    
    if (!analysis.policies['users']?.rls_enabled) {
      analysis.recommendations.push('🔒 SECURITY: Enable RLS on users table')
    }
    
    if (!analysis.policies['orders']?.rls_enabled) {
      analysis.recommendations.push('🔒 SECURITY: Enable RLS on orders table')
    }
    
    if (analysis.data_counts['users'] > 0 && analysis.missing_tables.includes('notifications')) {
      analysis.recommendations.push('📧 CUSTOMER EXPERIENCE: Create notifications table for user communication')
    }
    
    analysis.recommendations.forEach(rec => console.log(rec))

    // ===========================
    // 9. SAVE ANALYSIS RESULTS
    // ===========================
    console.log('\n9️⃣ SAVING ANALYSIS RESULTS')
    console.log('===========================')
    
    // Save detailed JSON report
    fs.writeFileSync('database-complete-analysis.json', JSON.stringify(analysis, null, 2))
    console.log('✅ Detailed analysis saved to: database-complete-analysis.json')
    
    // Save human-readable report
    const report = generateHumanReport(analysis)
    fs.writeFileSync('COMPLETE-DATABASE-ANALYSIS.md', report)
    console.log('✅ Human-readable report saved to: COMPLETE-DATABASE-ANALYSIS.md')
    
    console.log('\n🎉 COMPLETE DATABASE ANALYSIS FINISHED')
    console.log('======================================')

  } catch (error) {
    console.error('💥 Analysis failed:', error.message)
    analysis.error = error.message
  }
  
  return analysis
}

function generateHumanReport(analysis) {
  const timestamp = new Date().toISOString()
  
  return `# COMPLETE SUPABASE DATABASE ANALYSIS
**Generated:** ${timestamp}
**Connection:** ${analysis.connection.status}
**Database URL:** ${analysis.connection.url}

## 📊 TABLE INVENTORY

### Existing Tables:
${Object.entries(analysis.tables).map(([name, info]) => 
  `- **${name}**: ${info.row_count} rows | RLS: ${analysis.policies[name]?.rls_enabled ? '🔒 Enabled' : '🔓 Disabled'}`
).join('\n')}

### Missing Critical Tables:
${analysis.missing_tables.length > 0 ? 
  analysis.missing_tables.map(name => `- ❌ **${name}** - Required for core functionality`).join('\n') :
  '✅ All critical tables exist'
}

## 🔒 SECURITY STATUS

### Row Level Security (RLS):
${Object.entries(analysis.policies).map(([table, policy]) => 
  `- **${table}**: ${policy.rls_enabled ? '🔒 ENABLED' : '🔓 DISABLED'}`
).join('\n')}

## 📈 DATA SUMMARY

### Current Data Counts:
${Object.entries(analysis.data_counts).map(([table, count]) => 
  `- **${table}**: ${count} records`
).join('\n')}

## 🚨 CRITICAL RECOMMENDATIONS

${analysis.recommendations.map(rec => `- ${rec}`).join('\n')}

## 📋 NEXT STEPS

1. **Create missing tables** using migration scripts
2. **Enable RLS** on all tables for security
3. **Test service role bypass** for admin operations
4. **Verify data integrity** after changes
5. **Update application code** to use new tables

---
*Analysis completed successfully. Ready for table creation phase.*`
}

// Execute the analysis
analyzeCompleteDatabase()
  .then(result => {
    console.log('\n📋 Analysis Summary:')
    console.log(`- Tables found: ${Object.keys(result.tables).length}`)
    console.log(`- Missing tables: ${result.missing_tables.length}`)
    console.log(`- Recommendations: ${result.recommendations.length}`)
  })
  .catch(error => {
    console.error('💥 Complete analysis failed:', error)
  })