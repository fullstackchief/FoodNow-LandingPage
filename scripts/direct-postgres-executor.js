#!/usr/bin/env node

/**
 * DIRECT POSTGRESQL EXECUTOR
 * ==========================
 * Executes SQL directly via PostgreSQL connection using service role
 */

require('dotenv').config({ path: '.env.local' })
const { Client } = require('pg')
const fs = require('fs')

async function executeSQL() {
  console.log('🚀 DIRECT POSTGRESQL EXECUTOR')
  console.log('=============================')
  
  // Extract project ID from Supabase URL
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const projectId = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1]
  
  if (!projectId) {
    console.log('❌ Could not extract project ID from Supabase URL')
    return
  }
  
  console.log(`📡 Project ID: ${projectId}`)
  
  // Try to read database password from environment
  const dbPassword = process.env.SUPABASE_DB_PASSWORD || process.env.DATABASE_PASSWORD
  
  if (!dbPassword) {
    console.log('⚠️  Database password not found in environment')
    console.log('💡 You need to add SUPABASE_DB_PASSWORD to .env.local')
    console.log('   Get it from: Supabase Dashboard > Settings > Database')
    return
  }

  // Try multiple connection methods
  const connectionConfigs = [
    {
      name: 'Direct Connection',
      host: `db.fkcxijuikfsvxgojjbgp.supabase.co`,
      port: 5432,
      database: 'postgres',
      user: 'postgres',
      password: dbPassword,
      ssl: { rejectUnauthorized: false }
    },
    {
      name: 'Connection Pooling',
      host: `aws-0-eu-central-1.pooler.supabase.com`,
      port: 5432,
      database: 'postgres', 
      user: `postgres.fkcxijuikfsvxgojjbgp`,
      password: dbPassword,
      ssl: { rejectUnauthorized: false }
    },
    {
      name: 'Alternative Port',
      host: `db.fkcxijuikfsvxgojjbgp.supabase.co`,
      port: 6543,
      database: 'postgres',
      user: 'postgres',
      password: dbPassword,
      ssl: { rejectUnauthorized: false }
    }
  ]
  
  for (const config of connectionConfigs) {
    console.log(`\n🔌 Trying ${config.name}...`)
    const client = new Client(config)

    try {
      console.log('🔌 Connecting to PostgreSQL...')
      await client.connect()
      console.log('✅ Connected successfully!')

      // Read and execute the SQL file
      const sqlContent = fs.readFileSync('create-missing-6-tables.sql', 'utf8')
      console.log(`📄 Loaded ${sqlContent.length} characters`)

      console.log('⚡ Executing SQL...')
      const result = await client.query(sqlContent)
      
      console.log('✅ SQL executed successfully!')
      console.log(`📊 Result: ${result.command || 'Multiple'} ${result.rowCount || 'Multiple'} operations completed`)
      
      // Verify tables were created
      console.log('\n🔍 Verifying table creation...')
      
      const verifySQL = `
        SELECT table_name, 
               CASE WHEN table_name IS NOT NULL THEN 'EXISTS' ELSE 'MISSING' END as status
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
          AND table_name IN ('restaurant_settings', 'restaurant_subscriptions', 'user_preferences', 'user_ratings', 'user_reviews', 'zones')
        ORDER BY table_name;
      `
      
      const verification = await client.query(verifySQL)
      
      console.log('📊 VERIFICATION RESULTS:')
      verification.rows.forEach(row => {
        const status = row.status === 'EXISTS' ? '✅' : '❌'
        console.log(`   ${status} ${row.table_name}: ${row.status}`)
      })
      
      const createdTables = verification.rows.filter(row => row.status === 'EXISTS').length
      console.log(`\n📈 SUCCESS RATE: ${createdTables}/6 tables created`)
      
      if (createdTables === 6) {
        console.log('🎉 ALL 6 MISSING TABLES CREATED SUCCESSFULLY!')
        console.log('✅ Database is now 100% complete (38/38 tables)')
        return true
      } else {
        console.log('⚠️  Some tables still missing, continuing to next connection method...')
      }
      
    } catch (error) {
      console.log(`❌ ${config.name} failed: ${error.message}`)
      
      if (error.message.includes('ENOTFOUND')) {
        console.log('   Host not reachable')
      } else if (error.message.includes('authentication')) {
        console.log('   Authentication failed - check password')
      } else {
        console.log(`   Connection error: ${error.code}`)
      }
      
    } finally {
      try {
        await client.end()
      } catch (endError) {
        // Ignore cleanup errors
      }
    }
  }
  
  console.log('\n💡 ALL CONNECTION METHODS FAILED')
  console.log('=================================')
  console.log('📋 MANUAL EXECUTION REQUIRED:')
  console.log('1. Open https://supabase.com/dashboard/project/fkcxijuikfsvxgojjbgp')
  console.log('2. Go to SQL Editor')
  console.log('3. Copy and paste create-missing-6-tables.sql content')
  console.log('4. Click RUN to execute')
  console.log('5. Run verification: node scripts/table-operations-executor.js')
  
  return false
}

executeSQL().catch(console.error)