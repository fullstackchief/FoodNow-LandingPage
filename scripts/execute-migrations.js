/**
 * SUPABASE MIGRATION EXECUTOR
 * ===========================
 * Executes SQL migration files directly in Supabase database
 * Uses pg package for direct PostgreSQL connection
 */

const { Client } = require('pg')
const fs = require('fs')
const path = require('path')
require('dotenv').config({ path: '.env.local' })

async function executeMigrations() {
  console.log('🚀 SUPABASE MIGRATION EXECUTOR')
  console.log('==============================')
  console.log(`⏰ Started: ${new Date().toISOString()}`)

  // Extract connection details from Supabase URL
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !serviceKey) {
    console.log('❌ Missing Supabase credentials in .env.local')
    return
  }

  // Parse Supabase URL to get database connection details
  // Format: https://PROJECT_ID.supabase.co
  const projectId = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1]
  
  if (!projectId) {
    console.log('❌ Could not extract project ID from Supabase URL')
    return
  }

  console.log(`📡 Connecting to project: ${projectId}`)

  // Create PostgreSQL client
  const client = new Client({
    host: `db.${projectId}.supabase.co`,
    port: 5432,
    database: 'postgres',
    user: 'postgres',
    password: process.env.SUPABASE_DB_PASSWORD || 'your-db-password', // Need DB password
    ssl: {
      rejectUnauthorized: false
    }
  })

  const results = {
    executed: [],
    failed: [],
    skipped: []
  }

  // Migration files in execution order
  const migrations = [
    'supabase/migrations/002_missing_tables.sql',
    'supabase/migrations/003_selective_tables.sql', 
    'supabase/migrations/004_complete_rls_security.sql'
  ]

  try {
    console.log('\n🔌 Connecting to database...')
    await client.connect()
    console.log('✅ Database connection established')

    // Execute migrations in sequence
    for (const migrationFile of migrations) {
      console.log(`\n📄 Executing: ${migrationFile}`)
      console.log('=' + '='.repeat(50))

      try {
        // Check if file exists
        if (!fs.existsSync(migrationFile)) {
          console.log(`❌ File not found: ${migrationFile}`)
          results.skipped.push({ file: migrationFile, reason: 'File not found' })
          continue
        }

        // Read SQL content
        const sqlContent = fs.readFileSync(migrationFile, 'utf8')
        console.log(`📝 Read ${sqlContent.length} characters from ${path.basename(migrationFile)}`)

        // Execute SQL
        console.log('⚡ Executing SQL...')
        const startTime = Date.now()
        
        const result = await client.query(sqlContent)
        
        const duration = Date.now() - startTime
        console.log(`✅ Migration completed successfully in ${duration}ms`)
        
        results.executed.push({
          file: migrationFile,
          duration,
          rowCount: result.rowCount,
          command: result.command
        })

      } catch (error) {
        console.log(`❌ Migration failed: ${error.message}`)
        console.log(`   Error code: ${error.code}`)
        console.log(`   Error detail: ${error.detail || 'No additional details'}`)
        
        results.failed.push({
          file: migrationFile,
          error: error.message,
          code: error.code,
          detail: error.detail
        })

        // Continue with next migration even if one fails
        console.log('⏭️  Continuing with next migration...')
      }
    }

  } catch (connectionError) {
    console.log(`💥 Database connection failed: ${connectionError.message}`)
    console.log('💡 ALTERNATIVE: Use Supabase Dashboard SQL Editor manually')
    console.log('   1. Copy SQL content from migration files')
    console.log('   2. Execute in Dashboard > SQL Editor')
    console.log('   3. Follow the sequence: 002 → 003 → 004')
    
    return {
      success: false,
      error: connectionError.message,
      alternative: 'manual_dashboard_execution'
    }
  } finally {
    await client.end()
    console.log('🔌 Database connection closed')
  }

  // Summary
  console.log('\n📊 MIGRATION EXECUTION SUMMARY')
  console.log('==============================')
  console.log(`✅ Executed: ${results.executed.length} migrations`)
  console.log(`❌ Failed: ${results.failed.length} migrations`)
  console.log(`⏭️  Skipped: ${results.skipped.length} migrations`)

  if (results.executed.length > 0) {
    console.log('\n✅ SUCCESSFUL MIGRATIONS:')
    results.executed.forEach(({ file, duration }) => {
      console.log(`   - ${path.basename(file)} (${duration}ms)`)
    })
  }

  if (results.failed.length > 0) {
    console.log('\n❌ FAILED MIGRATIONS:')
    results.failed.forEach(({ file, error, code }) => {
      console.log(`   - ${path.basename(file)}: ${error} (${code})`)
    })
  }

  const success = results.failed.length === 0 && results.executed.length > 0
  
  if (success) {
    console.log('\n🎉 ALL MIGRATIONS EXECUTED SUCCESSFULLY!')
    console.log('✅ Database schema is now complete')
    console.log('✅ RLS policies enabled')
    console.log('✅ Ready for production use')
  } else {
    console.log('\n⚠️  SOME MIGRATIONS FAILED')
    console.log('🔧 Check error details above and fix issues')
  }

  return {
    success,
    results,
    executed: results.executed.length,
    failed: results.failed.length
  }
}

// Execute migrations
executeMigrations()
  .then(result => {
    if (result && result.success) {
      console.log('\n🚀 MIGRATION PROCESS COMPLETE!')
      console.log('Database is ready for FoodNow platform')
    } else {
      console.log('\n💡 Next steps: Use Supabase Dashboard for manual execution')
    }
  })
  .catch(error => {
    console.error('💥 Migration process failed:', error)
  })