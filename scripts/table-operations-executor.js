#!/usr/bin/env node

/**
 * TABLE OPERATIONS EXECUTOR
 * =========================
 * Creates tables using Supabase operations instead of raw SQL
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function verifyTableExists(tableName) {
  try {
    const { error } = await supabase.from(tableName).select('id').limit(1)
    return !error
  } catch {
    return false
  }
}

async function testTableCreation() {
  console.log('🧪 TESTING TABLE CREATION METHODS')
  console.log('=================================')
  
  const missingTables = [
    'restaurant_settings',
    'restaurant_subscriptions', 
    'user_preferences',
    'user_ratings',
    'user_reviews',
    'zones'
  ]
  
  console.log('\n🔍 Checking current table status...')
  for (const table of missingTables) {
    const exists = await verifyTableExists(table)
    console.log(`${exists ? '✅' : '❌'} ${table}: ${exists ? 'EXISTS' : 'MISSING'}`)
  }
  
  console.log('\n💡 SQL EXECUTION OPTIONS:')
  console.log('1. Manual execution in Supabase Dashboard')
  console.log('2. Supabase CLI (if available)')
  console.log('3. Direct database password connection')
  console.log('4. Contact Supabase support for exec_sql function')
  
  console.log('\n📋 MANUAL EXECUTION INSTRUCTIONS:')
  console.log('1. Open https://supabase.com/dashboard')
  console.log('2. Navigate to your project')
  console.log('3. Go to SQL Editor')
  console.log('4. Copy and paste create-missing-6-tables.sql content')
  console.log('5. Click RUN to execute')
  console.log('6. Verify all 6 tables are created')
  
  return { 
    tablesChecked: missingTables.length,
    requiresManualCreation: true
  }
}

async function checkSupabaseCLI() {
  console.log('\n🔍 CHECKING SUPABASE CLI AVAILABILITY')
  console.log('====================================')
  
  try {
    const { exec } = require('child_process')
    const { promisify } = require('util')
    const execAsync = promisify(exec)
    
    const { stdout, stderr } = await execAsync('supabase --version')
    
    if (stdout.includes('supabase')) {
      console.log('✅ Supabase CLI is available!')
      console.log(`📋 Version: ${stdout.trim()}`)
      
      console.log('\n💡 CLI EXECUTION OPTION:')
      console.log('supabase db reset --local')
      console.log('supabase db push')
      
      return true
    }
  } catch (error) {
    console.log('❌ Supabase CLI not found')
    console.log('💡 Install: npm install -g supabase')
  }
  
  return false
}

async function generateAlternativeApproach() {
  console.log('\n🔄 ALTERNATIVE EXECUTION APPROACHES')
  console.log('==================================')
  
  console.log('📋 Method 1: Supabase Dashboard (RECOMMENDED)')
  console.log('   ✅ Always works')
  console.log('   ✅ Visual feedback')
  console.log('   ✅ Error details visible')
  console.log('   📄 File: create-missing-6-tables.sql')
  
  console.log('\n📋 Method 2: Database Password Connection')
  console.log('   📝 Add SUPABASE_DB_PASSWORD to .env.local')
  console.log('   🔗 Get from: Supabase Dashboard > Settings > Database')
  console.log('   ⚡ Run: node scripts/direct-postgres-executor.js')
  
  console.log('\n📋 Method 3: Supabase CLI')
  console.log('   📦 Install: npm install -g supabase')
  console.log('   🔗 Login: supabase login')
  console.log('   📂 Link: supabase link --project-ref YOUR_PROJECT_ID')
  console.log('   ⚡ Push: supabase db push')
  
  console.log('\n📋 Method 4: API Creation (Individual Tables)')
  console.log('   🔨 Create each table via REST API calls')
  console.log('   📝 Use INSERT operations to build schema')
  console.log('   ⚠️  Complex but possible')
}

async function main() {
  console.log('🔧 TABLE OPERATIONS EXECUTOR')
  console.log('============================')
  console.log(`⏰ Started: ${new Date().toISOString()}`)
  
  try {
    // Test current state
    await testTableCreation()
    
    // Check for CLI availability
    await checkSupabaseCLI()
    
    // Show alternative approaches
    await generateAlternativeApproach()
    
    console.log('\n🎯 RECOMMENDED NEXT STEPS:')
    console.log('=========================')
    console.log('1. Use Supabase Dashboard SQL Editor (fastest)')
    console.log('2. Or add database password to .env.local')
    console.log('3. Or install and configure Supabase CLI')
    console.log('')
    console.log('📄 SQL ready in: create-missing-6-tables.sql')
    console.log('🔧 After execution, run verification script')
    
  } catch (error) {
    console.error('💥 Error:', error.message)
  }
}

main().catch(console.error)