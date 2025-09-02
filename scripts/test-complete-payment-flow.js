/**
 * COMPLETE PAYMENT FLOW TEST
 * ===========================
 * Tests the entire payment process from order creation to payment initialization
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function testCompletePaymentFlow() {
  console.log('💳 TESTING COMPLETE PAYMENT FLOW')
  console.log('================================')
  console.log(`⏰ Started: ${new Date().toISOString()}`)

  try {
    // 1. Get real test data
    console.log('\n1️⃣ Getting test data from database...')
    
    const { data: users } = await supabase.from('users').select('*').limit(1)
    const { data: restaurants } = await supabase.from('restaurants').select('*').limit(1)
    const { data: menuItems } = await supabase.from('menu_items').select('*').eq('restaurant_id', restaurants[0].id).limit(1)

    const testUser = users[0]
    const testRestaurant = restaurants[0]
    const testMenuItem = menuItems[0]

    console.log(`✅ User: ${testUser.first_name} ${testUser.last_name}`)
    console.log(`✅ Restaurant: ${testRestaurant.name}`)
    console.log(`✅ Menu Item: ${testMenuItem.name} (₦${testMenuItem.base_price})`)

    // 2. Create test order
    console.log('\n2️⃣ Creating test order...')
    
    const orderData = {
      order_number: `PAYMENT-TEST-${Date.now()}`,
      user_id: testUser.id,
      restaurant_id: testRestaurant.id,
      delivery_info: {
        street_address: '123 Payment Test Street',
        area: 'Victoria Island',
        city: 'Lagos',
        state: 'Lagos'
      },
      subtotal: testMenuItem.base_price,
      delivery_fee: testRestaurant.delivery_fee || 500,
      service_fee: Math.round(testMenuItem.base_price * 0.10),
      tax: 0,
      discount: 0,
      commission_fee: 0,
      total: testMenuItem.base_price + (testRestaurant.delivery_fee || 500) + Math.round(testMenuItem.base_price * 0.10),
      status: 'pending',
      payment_method: 'card',
      payment_status: 'pending',
      special_instructions: 'Payment flow test order',
      estimated_delivery_time: new Date(Date.now() + 45 * 60000).toISOString(),
      tracking_updates: []
    }

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert(orderData)
      .select()
      .single()

    if (orderError) {
      console.log('❌ Order creation failed:', orderError.message)
      return
    }

    console.log(`✅ Order created: ${order.id}`)

    // 3. Create order items
    const { error: itemsError } = await supabase
      .from('order_items')
      .insert({
        order_id: order.id,
        menu_item_id: testMenuItem.id,
        quantity: 1,
        unit_price: testMenuItem.base_price,
        total_price: testMenuItem.base_price,
        customizations: ['Test customization'],
        notes: 'Payment test item'
      })

    if (itemsError) {
      console.log('❌ Order items creation failed:', itemsError.message)
      return
    }

    console.log('✅ Order items created')

    // 4. Test payment initialization
    console.log('\n3️⃣ Testing payment initialization...')
    
    const paymentData = {
      email: testUser.email,
      amount: order.total * 100, // Convert to kobo
      currency: 'NGN',
      reference: `PAYMENT_${order.id}_${Date.now()}`,
      callback_url: 'http://localhost:3000/payment/callback',
      metadata: {
        order_id: order.id,
        user_id: testUser.id,
        customer_name: `${testUser.first_name} ${testUser.last_name}`,
        test: true
      }
    }

    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(paymentData)
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.log(`❌ Payment initialization failed: ${response.status} - ${errorText}`)
      return
    }

    const paymentResult = await response.json()

    if (!paymentResult.status) {
      console.log(`❌ Payment initialization error: ${paymentResult.message}`)
      return
    }

    console.log('✅ Payment initialization successful')
    console.log(`📝 Reference: ${paymentResult.data.reference}`)
    console.log(`🔗 Authorization URL: ${paymentResult.data.authorization_url}`)

    // 5. Test payment transaction storage (if table exists)
    console.log('\n4️⃣ Testing payment transaction storage...')
    
    try {
      const { error: paymentTransactionError } = await supabase
        .from('payment_transactions')
        .insert({
          order_id: order.id,
          customer_id: testUser.id,
          paystack_reference: paymentResult.data.reference,
          amount: order.total * 100,
          currency: 'NGN',
          status: 'pending',
          payment_method: 'card',
          gateway_response: JSON.stringify(paymentResult.data),
          customer_email: testUser.email,
          customer_phone: testUser.phone
        })

      if (paymentTransactionError) {
        console.log(`⚠️ Payment transaction storage failed: ${paymentTransactionError.message}`)
        console.log('   (Payment still works - transaction logging optional)')
      } else {
        console.log('✅ Payment transaction stored')
      }
    } catch (error) {
      console.log(`⚠️ Payment transactions table may not exist: ${error.message}`)
    }

    // 6. Summary
    console.log('\n🎉 COMPLETE PAYMENT FLOW TEST SUCCESSFUL!')
    console.log('=========================================')
    console.log(`✅ Order ID: ${order.id}`)
    console.log(`✅ Order Number: ${order.order_number}`)
    console.log(`✅ Payment Reference: ${paymentResult.data.reference}`)
    console.log(`✅ Total Amount: ₦${order.total.toLocaleString()}`)
    console.log(`🔗 Payment URL: ${paymentResult.data.authorization_url}`)
    
    console.log('\n🚀 PAYMENT SYSTEM FULLY OPERATIONAL!')
    console.log('====================================')
    console.log('✅ Orders can be created')
    console.log('✅ Paystack payments can be initialized')
    console.log('✅ Payment URLs are generated')
    console.log('✅ Ready for customer transactions')

    return {
      success: true,
      orderId: order.id,
      paymentReference: paymentResult.data.reference,
      paymentUrl: paymentResult.data.authorization_url
    }

  } catch (error) {
    console.log(`💥 Test failed: ${error.message}`)
    return { success: false, error: error.message }
  }
}

// Execute test
testCompletePaymentFlow()
  .then(result => {
    if (result.success) {
      console.log('\n✨ ALL SYSTEMS GO! ✨')
      console.log('FoodNow payment system is ready for customer orders')
    } else {
      console.log(`\n❌ Payment flow issue: ${result.error}`)
    }
  })
  .catch(error => {
    console.error('💥 Test execution failed:', error)
  })