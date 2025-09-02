#!/usr/bin/env node

/**
 * Test payment verification API endpoint
 */

require('dotenv').config({ path: '.env.local' })

const testPaymentVerification = async () => {
  console.log('🧪 Testing Payment Verification API\n')
  
  try {
    // First get a valid session token
    // For testing, we'll simulate what the client would send
    
    console.log('📝 Testing API endpoint structure...')
    
    // Test the API endpoint structure
    const testCall = await fetch('http://localhost:3001/api/payments/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ reference: 'test_reference_123' })
    })
    
    const responseText = await testCall.text()
    console.log(`Status: ${testCall.status}`)
    console.log(`Response: ${responseText}`)
    
    if (testCall.status === 401) {
      console.log('✅ API correctly requires authentication')
    } else {
      console.log('⚠️ Unexpected response - check API authentication')
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

testPaymentVerification()