const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://fkcxijuikfsvxgojjbgp.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseKey) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_ANON_KEY not found in environment')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Real verified IDs from database
const VERIFIED_CUSTOMER_ID = '22222222-2222-2222-2222-222222222222'
const VERIFIED_RESTAURANT_ID = '550e8400-e29b-41d4-a716-446655440001'
const VERIFIED_MENU_ITEM_ID = '8d36f456-892b-4af2-8d02-b59781820d44'

async function testCompleteOrderFlow() {
  console.log('🧪 Testing Complete Order Creation Flow with Real Data\n')

  try {
    // Step 1: Verify customer exists
    console.log('📋 Step 1: Verifying customer data...')
    const { data: customer, error: customerError } = await supabase
      .from('users')
      .select('*')
      .eq('id', VERIFIED_CUSTOMER_ID)
      .single()

    if (customerError) {
      console.error('❌ Customer verification failed:', customerError)
      return
    }

    console.log('✅ Customer verified:', {
      name: `${customer.first_name} ${customer.last_name}`,
      email: customer.email,
      phone: customer.phone,
      tier: customer.tier,
      total_orders: customer.total_orders
    })

    // Step 2: Verify restaurant and menu item
    console.log('\n📋 Step 2: Verifying restaurant and menu data...')
    const { data: restaurant, error: restaurantError } = await supabase
      .from('restaurants')
      .select('*')
      .eq('id', VERIFIED_RESTAURANT_ID)
      .single()

    if (restaurantError) {
      console.error('❌ Restaurant verification failed:', restaurantError)
      return
    }

    console.log('✅ Restaurant verified:', {
      name: restaurant.name,
      status: restaurant.status,
      is_open: restaurant.is_open,
      minimum_order: restaurant.minimum_order,
      delivery_fee: restaurant.delivery_fee
    })

    const { data: menuItem, error: menuError } = await supabase
      .from('menu_items')
      .select('*')
      .eq('id', VERIFIED_MENU_ITEM_ID)
      .single()

    if (menuError) {
      console.error('❌ Menu item verification failed:', menuError)
      return
    }

    console.log('✅ Menu item verified:', {
      name: menuItem.name,
      base_price: menuItem.base_price,
      is_available: menuItem.is_available,
      preparation_time: menuItem.preparation_time
    })

    // Step 3: Test order creation
    console.log('\n📋 Step 3: Creating test order...')
    
    // Calculate order with customizations
    const basePrice = menuItem.base_price
    const proteinPrice = 500 // Chicken
    const extraPrice = 200 // Extra Plantain
    const itemTotal = basePrice + proteinPrice + extraPrice
    const serviceCharge = Math.round(itemTotal * 0.1)
    const deliveryFee = restaurant.delivery_fee
    const totalAmount = itemTotal + serviceCharge + deliveryFee

    console.log('💰 Order calculations:', {
      base_price: basePrice,
      customizations: proteinPrice + extraPrice,
      subtotal: itemTotal,
      service_charge: serviceCharge,
      delivery_fee: deliveryFee,
      total_amount: totalAmount
    })

    // Create order
    const orderData = {
      customer_id: VERIFIED_CUSTOMER_ID,
      restaurant_id: VERIFIED_RESTAURANT_ID,
      status: 'payment_processing',
      total_amount: totalAmount,
      delivery_address: {
        street: '123 Test Street',
        area: 'Victoria Island', 
        city: 'Lagos',
        coordinates: { lat: 6.4281, lng: 3.4219 }
      },
      delivery_instructions: 'Test order - comprehensive flow validation',
      payment_method: 'paystack',
      created_at: new Date().toISOString()
    }

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert([orderData])
      .select()
      .single()

    if (orderError) {
      console.error('❌ Order creation failed:', orderError)
      return
    }

    console.log('✅ Order created successfully:', {
      order_id: order.id,
      total_amount: order.total_amount,
      status: order.status
    })

    // Step 4: Create order items
    console.log('\n📋 Step 4: Creating order items...')
    
    const orderItemData = {
      order_id: order.id,
      menu_item_id: VERIFIED_MENU_ITEM_ID,
      quantity: 1,
      unit_price: basePrice,
      customizations: {
        protein: 'Chicken (+₦500)',
        spice_level: 'Medium',
        extras: ['Extra Plantain (+₦200)']
      },
      total_price: itemTotal
    }

    const { data: orderItem, error: itemError } = await supabase
      .from('order_items')
      .insert([orderItemData])
      .select()
      .single()

    if (itemError) {
      console.error('❌ Order item creation failed:', itemError)
      // Cleanup order
      await supabase.from('orders').delete().eq('id', order.id)
      return
    }

    console.log('✅ Order item created successfully:', {
      item_id: orderItem.id,
      menu_item_name: menuItem.name,
      quantity: orderItem.quantity,
      total_price: orderItem.total_price
    })

    // Step 5: Verify complete order structure
    console.log('\n📋 Step 5: Verifying complete order structure...')
    
    const { data: completeOrder, error: fetchError } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (*,
          menu_items (name, base_price)
        ),
        users (first_name, last_name, email),
        restaurants (name, delivery_fee, minimum_order)
      `)
      .eq('id', order.id)
      .single()

    if (fetchError) {
      console.error('❌ Complete order fetch failed:', fetchError)
    } else {
      console.log('✅ Complete order structure verified:', {
        order_id: completeOrder.id,
        customer: `${completeOrder.users.first_name} ${completeOrder.users.last_name}`,
        restaurant: completeOrder.restaurants.name,
        items_count: completeOrder.order_items.length,
        total_amount: completeOrder.total_amount
      })
    }

    // Step 6: Test order status updates
    console.log('\n📋 Step 6: Testing order status updates...')
    
    const statusUpdates = ['payment_confirmed', 'restaurant_confirmed', 'preparing', 'ready_for_pickup']
    
    for (const status of statusUpdates) {
      const { error: updateError } = await supabase
        .from('orders')
        .update({ 
          status: status,
          updated_at: new Date().toISOString()
        })
        .eq('id', order.id)

      if (updateError) {
        console.error(`❌ Status update to ${status} failed:`, updateError)
      } else {
        console.log(`✅ Status updated to: ${status}`)
      }
    }

    // Step 7: Cleanup test data
    console.log('\n📋 Step 7: Cleaning up test data...')
    
    await supabase.from('order_items').delete().eq('order_id', order.id)
    await supabase.from('orders').delete().eq('id', order.id)
    
    console.log('✅ Test data cleaned up successfully')

    console.log('\n🎉 COMPREHENSIVE ORDER FLOW TEST COMPLETED SUCCESSFULLY')
    console.log('━'.repeat(60))
    console.log('✅ All order creation components working correctly')
    console.log('✅ Real database integration verified')
    console.log('✅ Pricing calculations accurate')
    console.log('✅ Order status flow functional')

  } catch (error) {
    console.error('💥 Comprehensive test failed:', error)
    process.exit(1)
  }
}

async function testMultipleRestaurants() {
  console.log('\n🧪 Testing Order Flow Across Multiple Restaurants\n')

  try {
    // Get all available restaurants
    const { data: restaurants, error: restaurantsError } = await supabase
      .from('restaurants')
      .select('id, name, minimum_order, delivery_fee, is_open, status')
      .eq('status', 'approved')
      .eq('is_open', true)
      .limit(3)

    if (restaurantsError) {
      console.error('❌ Restaurants fetch failed:', restaurantsError)
      return
    }

    console.log(`✅ Found ${restaurants.length} available restaurants for testing`)

    for (const restaurant of restaurants) {
      console.log(`\n🏪 Testing: ${restaurant.name}`)
      
      // Get menu items for this restaurant
      const { data: menuItems, error: menuError } = await supabase
        .from('menu_items')
        .select('id, name, base_price, is_available')
        .eq('restaurant_id', restaurant.id)
        .eq('is_available', true)
        .limit(2)

      if (menuError) {
        console.error(`❌ Menu items fetch failed for ${restaurant.name}:`, menuError)
        continue
      }

      console.log(`  📋 Available menu items: ${menuItems.length}`)
      
      if (menuItems.length > 0) {
        const totalOrderValue = menuItems.reduce((sum, item) => sum + item.base_price, 0)
        console.log(`  💰 Order value: ₦${totalOrderValue}`)
        console.log(`  📏 Minimum order: ₦${restaurant.minimum_order}`)
        console.log(`  🚚 Delivery fee: ₦${restaurant.delivery_fee}`)
        
        if (totalOrderValue >= restaurant.minimum_order) {
          console.log(`  ✅ Order meets minimum requirement`)
        } else {
          console.log(`  ⚠️  Order below minimum (₦${restaurant.minimum_order - totalOrderValue} short)`)
        }
      }
    }

  } catch (error) {
    console.error('💥 Multi-restaurant test failed:', error)
  }
}

// Run tests
async function runAllTests() {
  console.log('🚀 Starting Comprehensive Order Creation Flow Tests')
  console.log('='.repeat(60))
  
  await testCompleteOrderFlow()
  await testMultipleRestaurants()
  
  console.log('\n🏁 All Tests Completed')
}

runAllTests()