/**
 * SUPABASE MIGRATION EXECUTOR VIA API
 * ===================================
 * Executes SQL migrations using Supabase Management API
 */

const fs = require('fs')
const path = require('path')
require('dotenv').config({ path: '.env.local' })

async function executeMigrationsViaAPI() {
  console.log('🚀 SUPABASE MIGRATION EXECUTOR (API)')
  console.log('====================================')
  console.log(`⏰ Started: ${new Date().toISOString()}`)

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !serviceKey) {
    console.log('❌ Missing Supabase credentials')
    return
  }

  const projectId = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1]
  console.log(`📡 Project: ${projectId}`)

  // Migration sequence
  const migrations = [
    {
      name: '002_missing_tables.sql',
      description: 'Admin system tables (admin_users, admin_sessions, etc.)'
    },
    {
      name: '003_selective_tables.sql', 
      description: 'Remaining missing tables (delivery_zones, support_tickets, etc.)'
    },
    {
      name: '004_complete_rls_security.sql',
      description: 'Complete RLS security policies for all tables'
    }
  ]

  const results = []

  for (const migration of migrations) {
    console.log(`\n📄 PROCESSING: ${migration.name}`)
    console.log(`📝 ${migration.description}`)
    console.log('=' + '='.repeat(60))

    const filePath = `supabase/migrations/${migration.name}`
    
    try {
      // Read SQL file
      if (!fs.existsSync(filePath)) {
        console.log(`❌ File not found: ${filePath}`)
        results.push({ migration: migration.name, success: false, error: 'File not found' })
        continue
      }

      const sqlContent = fs.readFileSync(filePath, 'utf8')
      console.log(`📖 Read ${sqlContent.length} characters`)

      // Split SQL into individual statements for better error handling
      const statements = sqlContent
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))

      console.log(`🔢 Found ${statements.length} SQL statements to execute`)

      // For now, we'll output the SQL for manual execution
      console.log('\n📋 SQL CONTENT FOR MANUAL EXECUTION:')
      console.log('====================================')
      console.log('Copy this content to Supabase Dashboard SQL Editor:')
      console.log('\n```sql')
      console.log(sqlContent)
      console.log('```\n')

      results.push({ 
        migration: migration.name, 
        success: true, 
        statements: statements.length,
        ready_for_manual_execution: true
      })

    } catch (error) {
      console.log(`❌ Error processing ${migration.name}: ${error.message}`)
      results.push({ migration: migration.name, success: false, error: error.message })
    }
  }

  // Summary
  console.log('\n📊 MIGRATION PREPARATION SUMMARY')
  console.log('=================================')
  
  const successful = results.filter(r => r.success)
  const failed = results.filter(r => !r.success)

  console.log(`✅ Prepared: ${successful.length} migrations`)
  console.log(`❌ Failed: ${failed.length} migrations`)

  if (successful.length > 0) {
    console.log('\n✅ READY FOR MANUAL EXECUTION:')
    successful.forEach(result => {
      console.log(`   - ${result.migration} (${result.statements} statements)`)
    })
  }

  console.log('\n🎯 EXECUTION INSTRUCTIONS')
  console.log('=========================')
  console.log('1. Open Supabase Dashboard: https://supabase.com/dashboard')
  console.log('2. Navigate to your project > SQL Editor')
  console.log('3. Execute migrations in this EXACT sequence:')
  console.log('   a) 002_missing_tables.sql')
  console.log('   b) 003_selective_tables.sql') 
  console.log('   c) 004_complete_rls_security.sql')
  console.log('4. Run verification script after all migrations')

  return results
}

// Execute
executeMigrationsViaAPI()
  .then(results => {
    console.log('\n🎉 MIGRATION PREPARATION COMPLETE!')
    console.log('All SQL files ready for manual execution in Supabase Dashboard')
  })
  .catch(error => {
    console.error('💥 Migration preparation failed:', error)
  })