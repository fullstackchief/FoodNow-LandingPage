#!/usr/bin/env node

/**
 * Test script to verify payment API environment variable access
 */

console.log('🧪 Testing Payment API Environment Variables\n')

// Test environment loading for API routes specifically
const testEnvForAPI = async () => {
  try {
    // Simulate API route environment
    require('dotenv').config({ path: '.env.local' })
    
    console.log('Environment Variables Check:')
    console.log(`PAYSTACK_SECRET_KEY: ${process.env.PAYSTACK_SECRET_KEY ? '✅ AVAILABLE' : '❌ NOT AVAILABLE'}`)
    console.log(`NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY: ${process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY ? '✅ AVAILABLE' : '❌ AVAILABLE'}`)
    
    if (process.env.PAYSTACK_SECRET_KEY) {
      console.log(`Secret key format: ${process.env.PAYSTACK_SECRET_KEY.startsWith('sk_test_') ? '✅ VALID' : '❌ INVALID'}`)
      console.log(`Secret key length: ${process.env.PAYSTACK_SECRET_KEY.length} characters`)
      
      // Test actual Paystack API call
      console.log('\n🔗 Testing Paystack API call with current environment:')
      const response = await fetch('https://api.paystack.co/bank', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log(`✅ Paystack API call successful: ${data.status}`)
        console.log(`📊 Response: ${data.message}`)
      } else {
        console.log(`❌ Paystack API call failed: ${response.status}`)
        const errorText = await response.text()
        console.log(`Error: ${errorText}`)
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

testEnvForAPI()