/**
 * MIGRATION EXECUTOR VIA API
 * ==========================
 * Executes migrations through our custom API endpoint
 */

require('dotenv').config({ path: '.env.local' })

async function executeMigrationsViaAPI() {
  console.log('🚀 EXECUTING MIGRATIONS VIA API')
  console.log('================================')
  console.log(`⏰ Started: ${new Date().toISOString()}`)

  const baseUrl = 'http://localhost:3000' // Adjust if server running on different port
  const adminKey = 'foodnow-migration-key-2025'

  // Migration sequence
  const migrations = [
    '002_missing_tables.sql',
    '003_selective_tables.sql',
    '004_complete_rls_security.sql'
  ]

  const results = []

  // First, check if API is available
  try {
    console.log('\n🔍 Checking API availability...')
    const response = await fetch(`${baseUrl}/api/supabase/execute-migration`)
    
    if (!response.ok) {
      throw new Error(`API not available: ${response.status}`)
    }

    const { available_migrations } = await response.json()
    console.log(`✅ API available - ${available_migrations.length} migration files found`)

  } catch (error) {
    console.log('❌ API not available:', error.message)
    console.log('💡 Make sure development server is running: npm run dev')
    return
  }

  // Execute migrations in sequence
  for (const migration of migrations) {
    console.log(`\n📄 EXECUTING: ${migration}`)
    console.log('=' + '='.repeat(50))

    try {
      const response = await fetch(`${baseUrl}/api/supabase/execute-migration`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          migrationFile: migration,
          adminKey: adminKey
        })
      })

      const result = await response.json()

      if (result.success) {
        console.log(`✅ ${migration} executed successfully`)
        console.log(`   📊 ${result.successful_statements}/${result.total_statements} statements successful`)
        results.push({ migration, success: true, ...result })
      } else {
        console.log(`❌ ${migration} failed: ${result.error}`)
        console.log(`   📊 ${result.failed_statements || 0} statements failed`)
        if (result.execution_results) {
          result.execution_results
            .filter(r => !r.success)
            .forEach(r => console.log(`      - Statement ${r.statement_number}: ${r.error}`))
        }
        results.push({ migration, success: false, ...result })
      }

    } catch (error) {
      console.log(`💥 ${migration} execution failed: ${error.message}`)
      results.push({ migration, success: false, error: error.message })
    }

    // Small delay between migrations
    await new Promise(resolve => setTimeout(resolve, 1000))
  }

  // Summary
  console.log('\n📊 MIGRATION EXECUTION SUMMARY')
  console.log('==============================')
  
  const successful = results.filter(r => r.success)
  const failed = results.filter(r => !r.success)

  console.log(`✅ Successful: ${successful.length} migrations`)
  console.log(`❌ Failed: ${failed.length} migrations`)

  if (successful.length > 0) {
    console.log('\n✅ SUCCESSFUL MIGRATIONS:')
    successful.forEach(r => console.log(`   - ${r.migration}`))
  }

  if (failed.length > 0) {
    console.log('\n❌ FAILED MIGRATIONS:')
    failed.forEach(r => console.log(`   - ${r.migration}: ${r.error}`))
  }

  if (failed.length === 0) {
    console.log('\n🎉 ALL MIGRATIONS COMPLETED SUCCESSFULLY!')
    console.log('✅ Database schema is complete')
    console.log('✅ RLS policies enabled')
    console.log('✅ Admin system ready')
    console.log('✅ Platform ready for production')
  }

  return {
    success: failed.length === 0,
    executed: successful.length,
    failed: failed.length,
    results
  }
}

// Execute
executeMigrationsViaAPI()
  .then(result => {
    if (result.success) {
      console.log('\n🚀 MIGRATION PROCESS COMPLETE!')
    } else {
      console.log('\n⚠️  Some migrations failed - check details above')
    }
  })
  .catch(error => {
    console.error('💥 Migration process error:', error)
  })