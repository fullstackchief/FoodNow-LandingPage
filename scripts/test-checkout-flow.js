/**
 * TEST CHECKOUT FLOW
 * ==================
 * Tests the complete order creation flow with real data
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function testCheckoutFlow() {
  console.log('🛒 TESTING CHECKOUT FLOW')
  console.log('========================')
  console.log(`⏰ Started: ${new Date().toISOString()}`)

  try {
    // 1. Get real user from database
    console.log('\n1️⃣ Getting real user data...')
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('*')
      .limit(1)

    if (userError || !users || users.length === 0) {
      console.log('❌ No users found in database')
      return
    }

    const testUser = users[0]
    console.log(`✅ Found test user: ${testUser.email} (${testUser.first_name} ${testUser.last_name})`)

    // 2. Get real restaurant and menu item
    console.log('\n2️⃣ Getting real restaurant and menu data...')
    const { data: restaurants, error: restaurantError } = await supabase
      .from('restaurants')
      .select('*')
      .limit(1)

    if (restaurantError || !restaurants || restaurants.length === 0) {
      console.log('❌ No restaurants found in database')
      return
    }

    const testRestaurant = restaurants[0]
    console.log(`✅ Found test restaurant: ${testRestaurant.name}`)

    // Get menu items for this restaurant
    const { data: menuItems, error: menuError } = await supabase
      .from('menu_items')
      .select('*')
      .eq('restaurant_id', testRestaurant.id)
      .limit(2)

    if (menuError || !menuItems || menuItems.length === 0) {
      console.log('❌ No menu items found for restaurant')
      return
    }

    console.log(`✅ Found ${menuItems.length} menu items`)
    menuItems.forEach(item => {
      console.log(`   - ${item.name}: ₦${item.base_price}`)
    })

    // 3. Create test order data
    console.log('\n3️⃣ Creating test order...')
    
    const orderData = {
      order_number: `TEST-${Date.now()}`,
      user_id: testUser.id,
      restaurant_id: testRestaurant.id,
      delivery_info: {
        street_address: '123 Test Street',
        area: 'Victoria Island',
        city: 'Lagos',
        state: 'Lagos'
      },
      subtotal: menuItems[0].base_price,
      delivery_fee: testRestaurant.delivery_fee || 500,
      service_fee: Math.round(menuItems[0].base_price * 0.10),
      tax: 0,
      discount: 0,
      commission_fee: 0,
      total: menuItems[0].base_price + (testRestaurant.delivery_fee || 500) + Math.round(menuItems[0].base_price * 0.10),
      status: 'pending',
      payment_method: 'cash',
      payment_status: 'pending',
      special_instructions: 'Test order - please ignore',
      estimated_delivery_time: new Date(Date.now() + 45 * 60000).toISOString(),
      tracking_updates: []
    }

    console.log('📝 Order Data:', {
      orderNumber: orderData.order_number,
      userId: orderData.user_id,
      restaurantId: orderData.restaurant_id,
      total: orderData.total,
      paymentMethod: orderData.payment_method
    })

    // 4. Insert order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert(orderData)
      .select()
      .single()

    if (orderError) {
      console.log('❌ Order creation failed:', orderError.message)
      return
    }

    console.log(`✅ Order created successfully: ${order.id}`)

    // 5. Create order items
    console.log('\n4️⃣ Creating order items...')
    
    const orderItems = menuItems.slice(0, 1).map(item => ({
      order_id: order.id,
      menu_item_id: item.id,
      quantity: 1,
      unit_price: item.base_price,
      total_price: item.base_price,
      customizations: ['Extra spicy'],
      notes: 'Test item'
    }))

    const { data: createdItems, error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems)
      .select()

    if (itemsError) {
      console.log('❌ Order items creation failed:', itemsError.message)
      return
    }

    console.log(`✅ Created ${createdItems.length} order items`)

    // 6. Verify complete order retrieval
    console.log('\n5️⃣ Verifying order retrieval...')
    
    const { data: fullOrder, error: retrieveError } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          *,
          menu_items (name, base_price)
        ),
        restaurants (name, delivery_fee)
      `)
      .eq('id', order.id)
      .single()

    if (retrieveError) {
      console.log('❌ Order retrieval failed:', retrieveError.message)
      return
    }

    console.log('✅ Order retrieval successful')
    console.log('📊 Full Order Data:', {
      orderNumber: fullOrder.order_number,
      status: fullOrder.status,
      total: fullOrder.total,
      itemsCount: fullOrder.order_items?.length || 0,
      restaurantName: fullOrder.restaurants?.name
    })

    // 7. Test order status update
    console.log('\n6️⃣ Testing order status update...')
    
    const { data: updatedOrder, error: updateError } = await supabase
      .from('orders')
      .update({
        status: 'confirmed',
        updated_at: new Date().toISOString()
      })
      .eq('id', order.id)
      .select()
      .single()

    if (updateError) {
      console.log('❌ Order status update failed:', updateError.message)
      return
    }

    console.log(`✅ Order status updated to: ${updatedOrder.status}`)

    // 8. Summary
    console.log('\n🎉 CHECKOUT FLOW TEST COMPLETED SUCCESSFULLY!')
    console.log('============================================')
    console.log(`✅ Order ID: ${order.id}`)
    console.log(`✅ Order Number: ${order.order_number}`)
    console.log(`✅ Customer: ${testUser.first_name} ${testUser.last_name}`)
    console.log(`✅ Restaurant: ${testRestaurant.name}`)
    console.log(`✅ Items: ${createdItems.length}`)
    console.log(`✅ Total: ₦${order.total.toLocaleString()}`)
    console.log(`✅ Status: ${updatedOrder.status}`)
    
    return {
      success: true,
      orderId: order.id,
      orderNumber: order.order_number
    }

  } catch (error) {
    console.log('💥 Test failed with exception:', error.message)
    return {
      success: false,
      error: error.message
    }
  }
}

// Execute test
testCheckoutFlow()
  .then(result => {
    if (result.success) {
      console.log('\n🎯 CHECKOUT SYSTEM VERIFIED!')
      console.log('============================')
      console.log('✅ Order creation works')
      console.log('✅ Order items creation works')
      console.log('✅ Order retrieval works')
      console.log('✅ Order status updates work')
      console.log('\n🚀 Ready for payment integration testing')
    } else {
      console.log('\n⚠️ CHECKOUT SYSTEM NEEDS ATTENTION')
      console.log('===================================')
      console.log(`❌ Error: ${result.error}`)
    }
  })
  .catch(error => {
    console.error('💥 Test execution failed:', error)
  })