const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your_anon_key_here'

const supabase = createClient(supabaseUrl, supabaseKey)

async function createTestUser() {
  console.log('🧪 Creating Test User for Order Flow Testing\n')

  try {
    // Create a test customer
    const testUserData = {
      id: '11111111-1111-1111-1111-111111111111',
      email: 'test.customer@foodnow.test',
      first_name: 'Test',
      last_name: 'Customer',
      phone: '+2348012345678',
      user_role: 'customer',
      is_active: true,
      is_verified: true,
      onboarding_completed: true,
      tier: 'bronze',
      loyalty_points: 0,
      total_orders: 0,
      total_spent: 0,
      referral_code: 'TEST123',
      preferences: {
        cuisine: ['Nigerian', 'Chinese'],
        dietary: [],
        allergens: [],
        spiceLevel: 'medium',
        notifications: {
          promotions: true,
          orderUpdates: true,
          newRestaurants: true
        }
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { data: user, error: userError } = await supabase
      .from('users')
      .insert([testUserData])
      .select()
      .single()

    if (userError) {
      console.error('❌ Test user creation failed:', userError)
      return null
    }

    console.log('✅ Test user created:', {
      id: user.id,
      email: user.email,
      name: `${user.first_name} ${user.last_name}`,
      role: user.user_role
    })

    return user.id

  } catch (error) {
    console.error('💥 Test user creation error:', error)
    return null
  }
}

async function testOrderWithUser() {
  const userId = await createTestUser()
  if (!userId) return

  console.log('\n🧪 Testing Order Creation with Test User\n')

  try {
    // Get restaurant and menu item
    const { data: restaurant } = await supabase
      .from('restaurants')
      .select('*')
      .eq('id', '550e8400-e29b-41d4-a716-446655440001')
      .single()

    const { data: menuItems } = await supabase
      .from('menu_items')
      .select('*')
      .eq('restaurant_id', '550e8400-e29b-41d4-a716-446655440001')
      .eq('is_available', true)
      .limit(1)

    if (menuItems.length === 0) {
      console.error('❌ No menu items found')
      return
    }

    const menuItem = menuItems[0]
    
    // Calculate order total
    const basePrice = menuItem.base_price
    const customizationPrice = 700 // Chicken + Extra Plantain
    const subtotal = basePrice + customizationPrice
    const serviceCharge = Math.round(subtotal * 0.1)
    const totalAmount = subtotal + serviceCharge + restaurant.delivery_fee

    console.log('💰 Order breakdown:', {
      menu_item: menuItem.name,
      base_price: basePrice,
      customizations: customizationPrice,
      subtotal: subtotal,
      service_charge: serviceCharge,
      delivery_fee: restaurant.delivery_fee,
      total_amount: totalAmount
    })

    // Create order
    const orderData = {
      customer_id: userId,
      restaurant_id: restaurant.id,
      status: 'payment_processing',
      total_amount: totalAmount,
      delivery_address: {
        street: '456 Test Avenue',
        area: 'Victoria Island',
        city: 'Lagos',
        coordinates: { lat: 6.4281, lng: 3.4219 }
      },
      delivery_instructions: 'Test order creation flow',
      payment_method: 'paystack'
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

    console.log('✅ Order created successfully:', order.id)

    // Create order item
    const orderItemData = {
      order_id: order.id,
      menu_item_id: menuItem.id,
      quantity: 1,
      unit_price: basePrice,
      customizations: {
        protein: 'Chicken (+₦500)',
        extras: ['Extra Plantain (+₦200)'],
        spice_level: 'Medium'
      },
      total_price: subtotal
    }

    const { data: orderItem, error: itemError } = await supabase
      .from('order_items')
      .insert([orderItemData])
      .select()
      .single()

    if (itemError) {
      console.error('❌ Order item creation failed:', itemError)
      await supabase.from('orders').delete().eq('id', order.id)
      return
    }

    console.log('✅ Order item created successfully:', orderItem.id)

    // Test complete order retrieval
    const { data: completeOrder, error: fetchError } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (*,
          menu_items (name, base_price)
        ),
        restaurants (name, delivery_fee)
      `)
      .eq('id', order.id)
      .single()

    if (fetchError) {
      console.error('❌ Complete order fetch failed:', fetchError)
    } else {
      console.log('✅ Complete order verified:', {
        order_id: completeOrder.id,
        restaurant: completeOrder.restaurants.name,
        items_count: completeOrder.order_items.length,
        total_amount: completeOrder.total_amount
      })
    }

    // Cleanup
    console.log('\n📋 Cleaning up test data...')
    await supabase.from('order_items').delete().eq('order_id', order.id)
    await supabase.from('orders').delete().eq('id', order.id)
    await supabase.from('users').delete().eq('id', userId)
    
    console.log('✅ All test data cleaned up')
    console.log('\n🎉 COMPLETE ORDER FLOW TEST SUCCESSFUL')

  } catch (error) {
    console.error('💥 Order test failed:', error)
    // Cleanup user if it was created
    await supabase.from('users').delete().eq('id', userId)
  }
}

testOrderWithUser()