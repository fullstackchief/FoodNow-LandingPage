#!/usr/bin/env node

/**
 * SUPABASE DATABASE REALITY VERIFICATION
 * =====================================
 * This script connects to the REAL Supabase database and documents exactly what exists.
 * No assumptions - only verified facts.
 * 
 * Purpose: Create single source of truth for all future development sessions
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing Supabase credentials in .env.local')
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

console.log('🔍 SUPABASE DATABASE REALITY VERIFICATION')
console.log('========================================')
console.log(`📡 Connecting to: ${SUPABASE_URL}`)

// Initialize Supabase client with service role
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

const verificationResults = {
  timestamp: new Date().toISOString(),
  supabase_url: SUPABASE_URL,
  connection_status: null,
  tables: {},
  rls_policies: {},
  sample_data: {},
  errors: []
}

async function verifyConnection() {
  try {
    console.log('\n📡 Testing database connection...')
    
    // Simple connection test - try to access any public table
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .limit(1)
    
    if (error) {
      // Try another approach - check if we can access the database at all
      if (error.code === '42P01') {
        console.log('⚠️  Users table does not exist, trying alternative connection test...')
        
        // Try accessing information_schema which should always exist
        const { error: schemaError } = await supabase
          .rpc('version')
        
        if (schemaError) {
          verificationResults.connection_status = 'failed'
          verificationResults.errors.push(`Connection failed: ${error.message}`)
          console.log(`❌ Connection failed: ${error.message}`)
          return false
        } else {
          verificationResults.connection_status = 'connected_but_empty'
          console.log('✅ Database connection successful (but no user table found)')
          return true
        }
      } else {
        verificationResults.connection_status = 'failed'
        verificationResults.errors.push(`Connection failed: ${error.message}`)
        console.log(`❌ Connection failed: ${error.message}`)
        return false
      }
    } else {
      verificationResults.connection_status = 'connected'
      console.log('✅ Database connection successful')
      return true
    }
  } catch (error) {
    verificationResults.connection_status = 'failed'
    verificationResults.errors.push(`Connection error: ${error.message}`)
    console.log(`❌ Connection error: ${error.message}`)
    return false
  }
}

async function discoverTables() {
  console.log('\n📋 Discovering actual database tables...')
  
  try {
    const { data: tables, error } = await supabase
      .rpc('get_table_info')
      .limit(50)
    
    if (error) {
      // Fallback to information_schema query
      console.log('Using information_schema fallback...')
      
      const { data: schemaData, error: schemaError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .not('table_name', 'like', 'pg_%')
        .not('table_name', 'like', '_realtime%')
      
      if (schemaError) {
        console.log(`❌ Could not query table structure: ${schemaError.message}`)
        verificationResults.errors.push(`Schema query failed: ${schemaError.message}`)
        return
      }
      
      if (schemaData) {
        console.log(`✅ Found ${schemaData.length} tables:`)
        schemaData.forEach(table => {
          console.log(`   - ${table.table_name}`)
          verificationResults.tables[table.table_name] = { exists: true, verified: true }
        })
      }
    } else {
      console.log(`✅ Found ${tables?.length || 0} tables via RPC`)
      tables?.forEach(table => {
        console.log(`   - ${table.table_name}`)
        verificationResults.tables[table.table_name] = { exists: true, verified: true }
      })
    }
  } catch (error) {
    console.log(`❌ Table discovery failed: ${error.message}`)
    verificationResults.errors.push(`Table discovery failed: ${error.message}`)
  }
}

async function verifyCoreTables() {
  console.log('\n🔍 Verifying core application tables...')
  
  const coreTables = ['users', 'restaurants', 'menu_items', 'orders', 'order_items']
  
  for (const tableName of coreTables) {
    try {
      console.log(`   Checking ${tableName}...`)
      
      // Test table access and get row count
      const { data, error, count } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true })
      
      if (error) {
        console.log(`   ❌ ${tableName}: ${error.message}`)
        verificationResults.tables[tableName] = {
          exists: false,
          error: error.message,
          code: error.code
        }
      } else {
        console.log(`   ✅ ${tableName}: ${count} rows`)
        verificationResults.tables[tableName] = {
          exists: true,
          row_count: count,
          verified: true
        }
        
        // Get sample data for key tables
        if (['users', 'restaurants', 'menu_items'].includes(tableName) && count > 0) {
          const { data: sampleData } = await supabase
            .from(tableName)
            .select('*')
            .limit(3)
          
          verificationResults.sample_data[tableName] = sampleData
        }
      }
    } catch (error) {
      console.log(`   ❌ ${tableName}: Exception - ${error.message}`)
      verificationResults.tables[tableName] = {
        exists: false,
        error: error.message,
        exception: true
      }
    }
  }
}

async function checkRLSPolicies() {
  console.log('\n🔒 Checking Row Level Security policies...')
  
  try {
    const { data: policies, error } = await supabase
      .from('pg_policies')
      .select('tablename, policyname, permissive, roles, cmd, qual')
      .in('tablename', ['users', 'restaurants', 'menu_items', 'orders', 'order_items'])
    
    if (error) {
      console.log(`❌ Could not query RLS policies: ${error.message}`)
      verificationResults.errors.push(`RLS query failed: ${error.message}`)
    } else {
      console.log(`✅ Found ${policies?.length || 0} RLS policies`)
      verificationResults.rls_policies = policies || []
      
      policies?.forEach(policy => {
        console.log(`   - ${policy.tablename}: ${policy.policyname} (${policy.cmd})`)
      })
    }
  } catch (error) {
    console.log(`❌ RLS check failed: ${error.message}`)
    verificationResults.errors.push(`RLS check failed: ${error.message}`)
  }
}

async function generateDocumentation() {
  console.log('\n📝 Generating verified documentation...')
  
  const timestamp = new Date().toLocaleString()
  const markdown = `# VERIFIED SUPABASE DATABASE STATUS
**Generated:** ${timestamp}
**Verified By:** Live database query script

## 🔗 VERIFIED CONNECTION DETAILS
- **Supabase URL:** \`${SUPABASE_URL}\`
- **Connection Status:** ${verificationResults.connection_status}
- **Project ID:** \`${SUPABASE_URL.split('//')[1].split('.')[0]}\`

## 📊 ACTUAL DATABASE TABLES

${Object.entries(verificationResults.tables).map(([table, info]) => {
  if (info.exists) {
    return `### ✅ \`${table}\`
- **Status:** EXISTS
- **Row Count:** ${info.row_count || 'Unknown'}
- **Verified:** ${info.verified ? 'YES' : 'NO'}`
  } else {
    return `### ❌ \`${table}\`
- **Status:** MISSING/INACCESSIBLE  
- **Error:** ${info.error}
- **Code:** ${info.code || 'Unknown'}`
  }
}).join('\n\n')}

## 🔒 ROW LEVEL SECURITY (RLS) STATUS

${verificationResults.rls_policies.length > 0 ? 
  verificationResults.rls_policies.map(policy => 
    `- **${policy.tablename}:** ${policy.policyname} (${policy.cmd})`
  ).join('\n') : 
  'No RLS policies found or query failed'
}

## 📋 SAMPLE DATA VERIFICATION

${Object.entries(verificationResults.sample_data).map(([table, data]) => {
  return `### ${table.toUpperCase()}
\`\`\`json
${JSON.stringify(data?.slice(0, 2), null, 2)}
\`\`\`
`
}).join('\n')}

## ⚠️ ERRORS & ISSUES

${verificationResults.errors.length > 0 ? 
  verificationResults.errors.map(error => `- ${error}`).join('\n') :
  'No errors encountered during verification'
}

## 🎯 VERIFICATION SUMMARY

**Database Connection:** ${verificationResults.connection_status === 'connected' ? '✅ WORKING' : '❌ FAILED'}
**Core Tables Status:** ${Object.values(verificationResults.tables).filter(t => t.exists).length}/${Object.keys(verificationResults.tables).length} tables accessible
**RLS Policies:** ${verificationResults.rls_policies.length} policies found

---
**⚠️ IMPORTANT:** This document represents the ACTUAL state of the database at verification time. Use ONLY this information for development decisions.
`

  // Save verification results
  fs.writeFileSync(
    path.join(process.cwd(), 'DATABASE-REALITY-VERIFIED.md'),
    markdown
  )
  
  fs.writeFileSync(
    path.join(process.cwd(), 'database-verification-results.json'),
    JSON.stringify(verificationResults, null, 2)
  )
  
  console.log('✅ Documentation generated:')
  console.log('   - DATABASE-REALITY-VERIFIED.md')
  console.log('   - database-verification-results.json')
}

async function main() {
  console.log('Starting comprehensive database verification...\n')
  
  const connected = await verifyConnection()
  if (!connected) {
    console.log('\n❌ Database verification failed - cannot proceed')
    process.exit(1)
  }
  
  await discoverTables()
  await verifyCoreTables() 
  await checkRLSPolicies()
  await generateDocumentation()
  
  console.log('\n🎉 Database verification complete!')
  console.log('📖 Check DATABASE-REALITY-VERIFIED.md for results')
}

main().catch(error => {
  console.error('💥 Verification script failed:', error)
  verificationResults.errors.push(`Script execution failed: ${error.message}`)
  process.exit(1)
})