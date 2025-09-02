#!/usr/bin/env node

/**
 * Diagnostic script to test Paystack environment variable configuration
 * Tests both server-side and client-side access to Paystack keys
 */

console.log('🔍 PAYSTACK CONFIGURATION DIAGNOSTIC\n')

// Test 1: Check if .env.local exists and is readable
const fs = require('fs')
const path = require('path')

const envLocalPath = path.join(process.cwd(), '.env.local')
console.log('1. Checking .env.local file...')
try {
  const envContent = fs.readFileSync(envLocalPath, 'utf8')
  const paystackLines = envContent.split('\n').filter(line => 
    line.includes('PAYSTACK') && !line.startsWith('#')
  )
  
  console.log(`   ✅ .env.local found at: ${envLocalPath}`)
  console.log(`   📝 Paystack-related lines found: ${paystackLines.length}`)
  paystackLines.forEach(line => {
    const [key] = line.split('=')
    console.log(`   🔑 Found key: ${key}`)
  })
} catch (error) {
  console.log(`   ❌ Error reading .env.local: ${error.message}`)
}

console.log('\n2. Testing process.env access...')

// Test 2: Check environment variables directly
const publicKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY
const secretKey = process.env.PAYSTACK_SECRET_KEY

console.log(`   NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY: ${publicKey ? '✅ SET' : '❌ NOT SET'}`)
console.log(`   PAYSTACK_SECRET_KEY: ${secretKey ? '✅ SET' : '❌ NOT SET'}`)

if (publicKey) {
  console.log(`   📋 Public key starts with: ${publicKey.substring(0, 10)}...`)
}
if (secretKey) {
  console.log(`   📋 Secret key starts with: ${secretKey.substring(0, 10)}...`)
}

// Test 3: Environment variable loading in different contexts
console.log('\n3. Testing Next.js environment loading...')

// Simulate server-side environment loading
try {
  require('dotenv').config({ path: '.env.local' })
  const afterDotenv = {
    public: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY,
    secret: process.env.PAYSTACK_SECRET_KEY
  }
  
  console.log('   After dotenv.config():')
  console.log(`   NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY: ${afterDotenv.public ? '✅ SET' : '❌ NOT SET'}`)
  console.log(`   PAYSTACK_SECRET_KEY: ${afterDotenv.secret ? '✅ SET' : '❌ NOT SET'}`)
} catch (error) {
  console.log(`   ⚠️  dotenv not available: ${error.message}`)
}

// Test 4: Check if keys are valid format
console.log('\n4. Validating key formats...')

if (publicKey) {
  const isValidPublic = publicKey.startsWith('pk_test_') || publicKey.startsWith('pk_live_')
  console.log(`   Public key format: ${isValidPublic ? '✅ VALID' : '❌ INVALID'}`)
  console.log(`   Public key length: ${publicKey.length} characters`)
}

if (secretKey) {
  const isValidSecret = secretKey.startsWith('sk_test_') || secretKey.startsWith('sk_live_')
  console.log(`   Secret key format: ${isValidSecret ? '✅ VALID' : '❌ INVALID'}`)
  console.log(`   Secret key length: ${secretKey.length} characters`)
}

// Test 5: Test Paystack API connection
console.log('\n5. Testing Paystack API connectivity...')

if (secretKey) {
  const testPaystackConnection = async () => {
    try {
      const response = await fetch('https://api.paystack.co/bank', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${secretKey}`,
          'Content-Type': 'application/json',
        }
      })
      
      if (response.ok) {
        console.log('   ✅ Paystack API connection successful')
        const data = await response.json()
        console.log(`   📊 API response status: ${data.status}`)
      } else {
        console.log(`   ❌ Paystack API connection failed: ${response.status} ${response.statusText}`)
        const errorText = await response.text()
        console.log(`   📝 Error details: ${errorText}`)
      }
    } catch (error) {
      console.log(`   ❌ Network error testing Paystack API: ${error.message}`)
    }
  }
  
  testPaystackConnection()
} else {
  console.log('   ⚠️  Cannot test API - secret key not available')
}

console.log('\n📋 DIAGNOSTIC COMPLETE')
console.log('Use this information to identify why Paystack verification is failing.')