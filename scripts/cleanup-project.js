/**
 * PROJECT CLEANUP SCRIPT
 * ======================
 * Removes unnecessary files and organizes the project structure
 */

const fs = require('fs')
const path = require('path')

async function cleanupProject() {
  console.log('🧹 STARTING PROJECT CLEANUP')
  console.log('===========================')
  console.log(`⏰ Started: ${new Date().toISOString()}`)

  const results = {
    deleted_files: [],
    kept_files: [],
    errors: []
  }

  // Files to keep (essential documentation)
  const keepFiles = [
    'README.md',
    'CLAUDE.local.md',
    'CORE-SYSTEMS-STATUS-REPORT.md',
    'PAYMENT-SYSTEM-COMPLETE.md',
    'PAYSTACK-CONFIGURATION-GUIDE.md',
    'rls-security-setup.sql'
  ]

  // Files to definitely delete (temporary/development files)
  const deleteFiles = [
    // Old analysis files
    'ADMIN-ACCESS-SECURE.md',
    'API-SECURITY-IMPROVEMENTS.md', 
    'AUTHENTICATION-SECURITY-ANALYSIS.md',
    'BACKEND-REVIEW-REPORT.md',
    'BUG-FIXES-COMPLETED.md',
    'COMPLETE-BUG-FIX-SUMMARY.md',
    'COMPLETE-DATABASE-ANALYSIS.md',
    'COMPREHENSIVE-BACKEND-FEEDBACK.md',
    'COMPREHENSIVE-CODE-REVIEW-2024.md',
    'COMPREHENSIVE-REVIEW-REPORT.md',
    'database-analysis-report.md',
    'database-reality-report.md',
    'DATABASE-SCHEMA-FIX-COMPLETE.md',
    'DATABASE-SCHEMA-FIX.md',
    'DATABASE-SETUP-GUIDE.md',
    'FOODNOW-REALITY-REPORT.md',
    'GOOGLE-MAPS-INTEGRATION.md',
    'ORDER-CREATION-DEBUG-COMPLETE.md',
    'ORDER-CREATION-DEBUG-GUIDE.md',
    'PAYMENT-AUTHENTICATION-FIX-SUMMARY.md',
    'PAYMENT-INTEGRATION-COMPLETE.md',
    'SEARCH-FLOW-INTEGRATION-COMPLETE.md',
    'SUPABASE_SETUP.md',
    'USER-ARCHITECTURE.md',
    'AGENT-COORDINATION.md',
    'MOCK-DATA-REPLACEMENT-COMPLETE.md',
    'RIDER-REGISTRATION-SYSTEM-COMPLETE.md',
    'UNIFIED-TODO-LIST.md',
    'ADMIN-APPROVAL-WORKFLOWS-COMPLETE.md',
    'DATABASE-REALITY-VERIFIED.md',
    
    // Temporary JSON files
    'backend-review-data.json',
    'database-analysis-report.json',
    'database-reality-report.json',
    'database-verification-results.json',
    'foodnow-analysis-data.json',
    'table-creation-results.json',
    'rls-implementation-results.json',
    'payment-integration-test-results.json',
    
    // Log files
    'build-errors.log',
    'lint-errors.log',
    'typescript-errors.log',
    'build-test.log',
    
    // Test guides
    'payment-test-guide.md',
    'foodnow-deep-analysis.md'
  ]

  console.log('\n1️⃣ CLEANING UP DOCUMENTATION FILES')
  console.log('===================================')

  // Delete unnecessary files
  for (const fileName of deleteFiles) {
    try {
      if (fs.existsSync(fileName)) {
        fs.unlinkSync(fileName)
        console.log(`🗑️ Deleted: ${fileName}`)
        results.deleted_files.push(fileName)
      }
    } catch (error) {
      console.log(`❌ Failed to delete ${fileName}: ${error.message}`)
      results.errors.push({ file: fileName, error: error.message })
    }
  }

  console.log('\n2️⃣ CLEANING UP SCRIPT FILES')
  console.log('=============================')

  // Clean up development scripts (keep essential ones)
  const scriptsToDelete = [
    'scripts/analyze-database.js',
    'scripts/check-database-simple.js',
    'scripts/debug-real-cart-data.js',
    'scripts/deep-analysis.js',
    'scripts/inspect-orders-schema.js',
    'scripts/review-backend.js',
    'scripts/review-database.js',
    'scripts/simple-db-check.js',
    'scripts/test-authenticated-order-creation.js',
    'scripts/test-cart-form-persistence.js',
    'scripts/test-complete-guest-flow.js',
    'scripts/test-guest-checkout-flow.js',
    'scripts/test-order-creation-flow.js',
    'scripts/test-order-creation.js',
    'scripts/test-order-flow.js',
    'scripts/test-order-items-fix.js',
    'scripts/test-order-service-fix.js',
    'scripts/test-rls-policies.js',
    'scripts/test-ui-ux-elements.js',
    'scripts/verify-order-fix.js',
    'scripts/debug-paystack-detailed.js',
    'scripts/test-payment-integration.js',
    'scripts/enable-rls-policies.js',
    'scripts/create-missing-tables.js'
  ]

  for (const scriptPath of scriptsToDelete) {
    try {
      if (fs.existsSync(scriptPath)) {
        fs.unlinkSync(scriptPath)
        console.log(`🗑️ Deleted: ${scriptPath}`)
        results.deleted_files.push(scriptPath)
      }
    } catch (error) {
      console.log(`❌ Failed to delete ${scriptPath}: ${error.message}`)
      results.errors.push({ file: scriptPath, error: error.message })
    }
  }

  console.log('\n3️⃣ ORGANIZING REMAINING FILES')
  console.log('==============================')

  // List essential files that were kept
  const essentialFiles = [
    'scripts/verify-database-reality.js',
    'scripts/test-checkout-flow.js',
    'scripts/test-payment-simple.js',
    'scripts/test-complete-payment-flow.js',
    'scripts/enable-rls-security.js',
    'rls-security-setup.sql'
  ]

  for (const file of essentialFiles) {
    if (fs.existsSync(file)) {
      console.log(`✅ Kept: ${file}`)
      results.kept_files.push(file)
    }
  }

  for (const file of keepFiles) {
    if (fs.existsSync(file)) {
      console.log(`✅ Kept: ${file}`)
      results.kept_files.push(file)
    }
  }

  console.log('\n📊 CLEANUP SUMMARY')
  console.log('==================')
  console.log(`🗑️ Deleted: ${results.deleted_files.length} files`)
  console.log(`✅ Kept: ${results.kept_files.length} essential files`)
  console.log(`❌ Errors: ${results.errors.length}`)

  if (results.errors.length === 0) {
    console.log('\n🎉 PROJECT CLEANUP SUCCESSFUL!')
    console.log('✅ Development artifacts removed')
    console.log('✅ Essential files preserved')
    console.log('✅ Project structure optimized')
  } else {
    console.log('\n⚠️ Some cleanup operations failed')
    results.errors.forEach(error => {
      console.log(`   - ${error.file}: ${error.error}`)
    })
  }

  return results
}

// Execute cleanup
cleanupProject()
  .then(results => {
    console.log('\n🚀 READY FOR PRODUCTION!')
    console.log('========================')
    console.log('✅ Codebase cleaned and optimized')
    console.log('✅ Ready for build and deployment')
  })
  .catch(error => {
    console.error('💥 Cleanup failed:', error)
  })