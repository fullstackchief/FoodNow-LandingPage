/**
 * SIMPLE PAYSTACK PAYMENT TEST
 * =============================
 * Tests basic Paystack configuration
 */

require('dotenv').config({ path: '.env.local' })

async function testPaymentSimple() {
  console.log('💳 TESTING PAYSTACK CONFIGURATION')
  console.log('=================================')

  // 1. Check environment variables
  console.log('\n1️⃣ Environment Variables')
  const publicKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY
  const secretKey = process.env.PAYSTACK_SECRET_KEY

  if (publicKey) {
    console.log(`✅ Public Key: ${publicKey.substring(0, 15)}...`)
  } else {
    console.log('❌ Public Key: Missing')
    return false
  }

  if (secretKey) {
    console.log(`✅ Secret Key: ${secretKey.substring(0, 15)}...`)
  } else {
    console.log('❌ Secret Key: Missing')
    return false
  }

  // 2. Test Paystack API
  console.log('\n2️⃣ Testing Paystack API')
  try {
    const response = await fetch('https://api.paystack.co/bank', {
      headers: {
        'Authorization': `Bearer ${secretKey}`,
        'Content-Type': 'application/json'
      }
    })

    if (response.ok) {
      const data = await response.json()
      console.log(`✅ API Connected - ${data.data?.length || 0} banks available`)
    } else {
      console.log(`❌ API Error: ${response.status}`)
      return false
    }
  } catch (error) {
    console.log(`❌ API Exception: ${error.message}`)
    return false
  }

  // 3. Test payment initialization
  console.log('\n3️⃣ Testing Payment Initialization')
  try {
    const testData = {
      email: 'test@example.com',
      amount: 300000, // ₦3,000 in kobo
      currency: 'NGN',
      reference: `TEST_${Date.now()}`,
      callback_url: 'http://localhost:3000/payment/callback'
    }

    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${secretKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testData)
    })

    if (response.ok) {
      const result = await response.json()
      if (result.status) {
        console.log('✅ Payment Initialization Working')
        console.log(`📝 Reference: ${result.data.reference}`)
        return true
      } else {
        console.log(`❌ Payment Failed: ${result.message}`)
        return false
      }
    } else {
      console.log(`❌ Payment API Error: ${response.status}`)
      return false
    }
  } catch (error) {
    console.log(`❌ Payment Exception: ${error.message}`)
    return false
  }
}

// Execute test
testPaymentSimple()
  .then(success => {
    console.log('\n📊 FINAL RESULT')
    console.log('===============')
    if (success) {
      console.log('🎉 PAYSTACK FULLY CONFIGURED AND WORKING!')
      console.log('✅ Environment variables present')
      console.log('✅ API connectivity working')
      console.log('✅ Payment initialization working')
      console.log('\n🚀 Ready for payment processing!')
    } else {
      console.log('⚠️ PAYSTACK CONFIGURATION INCOMPLETE')
      console.log('Please check the errors above')
    }
  })
  .catch(error => {
    console.log('💥 Test failed:', error.message)
  })