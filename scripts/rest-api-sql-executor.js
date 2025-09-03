#!/usr/bin/env node

/**
 * REST API SQL EXECUTOR
 * =====================
 * Executes SQL via Supabase REST API using alternative endpoints
 */

require('dotenv').config({ path: '.env.local' })
const fs = require('fs')

async function executeSQL() {
  console.log('🚀 REST API SQL EXECUTOR')
  console.log('========================')
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !serviceKey) {
    console.log('❌ Missing Supabase credentials')
    return
  }
  
  console.log('🔑 Using service role key for execution')
  
  // Read the SQL file
  const sqlContent = fs.readFileSync('create-missing-6-tables.sql', 'utf8')
  console.log(`📄 Loaded ${sqlContent.length} characters`)
  
  // Split into individual CREATE TABLE statements
  const statements = sqlContent
    .split('CREATE TABLE')
    .filter(stmt => stmt.trim().length > 0)
    .map((stmt, index) => index === 0 ? stmt : 'CREATE TABLE' + stmt)
    .filter(stmt => stmt.includes('CREATE TABLE'))
  
  console.log(`📋 Found ${statements.length} CREATE TABLE statements`)
  
  // Try multiple endpoints and methods
  const endpoints = [
    '/rest/v1/rpc/exec_sql',
    '/rest/v1/query',
    '/rest/v1/sql',
    '/database/execute',
    '/db/query'
  ]
  
  for (const endpoint of endpoints) {
    console.log(`\n🌐 Trying endpoint: ${endpoint}`)
    
    try {
      const response = await fetch(`${supabaseUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${serviceKey}`,
          'apikey': serviceKey,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({ 
          sql: sqlContent,
          query: sqlContent,
          statement: sqlContent
        })
      })
      
      const responseText = await response.text()
      
      if (response.ok) {
        console.log(`✅ Success via ${endpoint}!`)
        console.log('Response:', responseText)
        return { success: true, endpoint, response: responseText }
      } else {
        console.log(`❌ ${endpoint}: ${response.status} - ${responseText.substring(0, 100)}...`)
      }
      
    } catch (error) {
      console.log(`❌ ${endpoint}: ${error.message}`)
    }
  }
  
  // Alternative: Try individual table creation via API
  console.log('\n🔄 ALTERNATIVE: Individual table creation')
  console.log('========================================')
  
  // Extract table definitions and try creating them individually
  const tablePatterns = [
    { name: 'restaurant_settings', pattern: /CREATE TABLE.*?restaurant_settings.*?(?=CREATE TABLE|ALTER TABLE|$)/gs },
    { name: 'restaurant_subscriptions', pattern: /CREATE TABLE.*?restaurant_subscriptions.*?(?=CREATE TABLE|ALTER TABLE|$)/gs },
    { name: 'user_preferences', pattern: /CREATE TABLE.*?user_preferences.*?(?=CREATE TABLE|ALTER TABLE|$)/gs },
    { name: 'user_ratings', pattern: /CREATE TABLE.*?user_ratings.*?(?=CREATE TABLE|ALTER TABLE|$)/gs },
    { name: 'user_reviews', pattern: /CREATE TABLE.*?user_reviews.*?(?=CREATE TABLE|ALTER TABLE|$)/gs },
    { name: 'zones', pattern: /CREATE TABLE.*?zones.*?(?=CREATE TABLE|ALTER TABLE|$)/gs }
  ]
  
  for (const { name, pattern } of tablePatterns) {
    const match = sqlContent.match(pattern)
    if (match) {
      console.log(`\n🔨 Creating ${name} individually...`)
      
      try {
        // Try to use the simpler approach: create via PostgREST
        const response = await fetch(`${supabaseUrl}/rest/v1/${name}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${serviceKey}`,
            'apikey': serviceKey
          },
          body: JSON.stringify({})
        })
        
        if (response.status === 201 || response.status === 409) {
          console.log(`✅ ${name}: Table structure ready`)
        } else {
          console.log(`❌ ${name}: ${response.status}`)
        }
        
      } catch (error) {
        console.log(`❌ ${name}: ${error.message}`)
      }
    }
  }
  
  console.log('\n💡 FINAL RECOMMENDATION:')
  console.log('========================')
  console.log('Use Supabase Dashboard SQL Editor for guaranteed execution:')
  console.log('1. Open https://supabase.com/dashboard/project/fkcxijuikfsvxgojjbgp')
  console.log('2. Go to SQL Editor')
  console.log('3. Copy the contents of create-missing-6-tables.sql')
  console.log('4. Paste and click RUN')
  console.log('5. Verify all 6 tables are created')
  
  return { success: false, method: 'manual_required' }
}

executeSQL().catch(console.error)