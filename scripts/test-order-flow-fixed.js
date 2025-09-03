const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://fkcxijuikfsvxgojjbgp.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZrY3hpanVpa2Zzdnhnb2pqYmdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYxNTQxNjAsImV4cCI6MjA3MTczMDE2MH0.ElefrWu7fWpZm50xWeVIa5J0pGQuVX5_nWIEZ8uds1s'

const supabase = createClient(supabaseUrl, supabaseKey)

// Real verified IDs from database
const VERIFIED_RESTAURANT_ID = '550e8400-e29b-41d4-a716-446655440001'

async function testOrderCreationFlow() {
  console.log('🧪 Testing Order Creation Flow with Real Database\n')

  try {
    // Step 1: Get actual users data
    console.log('📋 Step 1: Getting real user data...')
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, first_name, last_name, user_role')
      .limit(5)

    if (usersError) {
      console.error('❌ Users query failed:', usersError)
      return
    }

    console.log(`✅ Found ${users.length} users in database`)
    if (users.length > 0) {
      console.log('Sample user:', {
        id: users[0].id,
        email: users[0].email,
        name: `${users[0].first_name} ${users[0].last_name}`,
        role: users[0].user_role
      })
    }

    // Step 2: Get restaurant and menu data  
    console.log('\n📋 Step 2: Verifying restaurant and menu...')
    const { data: restaurant, error: restaurantError } = await supabase
      .from('restaurants')
      .select('*')
      .eq('id', VERIFIED_RESTAURANT_ID)
      .single()

    if (restaurantError) {
      console.error('❌ Restaurant query failed:', restaurantError)
      return
    }

    console.log('✅ Restaurant verified:', {
      name: restaurant.name,
      status: restaurant.status,
      is_open: restaurant.is_open,
      minimum_order: restaurant.minimum_order,
      delivery_fee: restaurant.delivery_fee
    })

    // Get menu items for this restaurant
    const { data: menuItems, error: menuError } = await supabase
      .from('menu_items')
      .select('*')
      .eq('restaurant_id', VERIFIED_RESTAURANT_ID)
      .eq('is_available', true)
      .limit(3)

    if (menuError) {
      console.error('❌ Menu items query failed:', menuError)
      return
    }

    console.log(`✅ Found ${menuItems.length} available menu items`)
    
    if (menuItems.length > 0) {
      const sampleItem = menuItems[0]
      console.log('Sample menu item:', {
        id: sampleItem.id,
        name: sampleItem.name,
        base_price: sampleItem.base_price,
        preparation_time: sampleItem.preparation_time
      })

      // Step 3: Test order creation (if we have users)
      if (users.length > 0) {
        console.log('\n📋 Step 3: Testing order creation...')
        
        const testCustomerId = users[0].id
        const itemTotal = sampleItem.base_price + 500 + 200 // base + protein + extra
        const serviceCharge = Math.round(itemTotal * 0.1)
        const totalAmount = itemTotal + serviceCharge + restaurant.delivery_fee

        console.log('💰 Order calculations:', {
          base_price: sampleItem.base_price,
          customizations: 700,
          subtotal: itemTotal,
          service_charge: serviceCharge,
          delivery_fee: restaurant.delivery_fee,
          total_amount: totalAmount
        })

        // Create test order
        const orderData = {
          customer_id: testCustomerId,
          restaurant_id: VERIFIED_RESTAURANT_ID,
          status: 'payment_processing',
          total_amount: totalAmount,
          delivery_address: {
            street: '123 Test Street',
            area: 'Victoria Island',
            city: 'Lagos',
            coordinates: { lat: 6.4281, lng: 3.4219 }
          },
          delivery_instructions: 'Comprehensive flow test order',
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

        console.log('✅ Order created:', {
          order_id: order.id,
          total_amount: order.total_amount,
          status: order.status
        })

        // Create order item
        const orderItemData = {
          order_id: order.id,
          menu_item_id: sampleItem.id,
          quantity: 1,
          unit_price: sampleItem.base_price,
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

        console.log('✅ Order item created:', {
          item_id: orderItem.id,
          menu_item_name: sampleItem.name,
          total_price: orderItem.total_price
        })

        // Test status updates
        console.log('\n📋 Step 4: Testing order status flow...')
        const statuses = ['payment_confirmed', 'restaurant_confirmed', 'preparing']
        
        for (const status of statuses) {
          const { error: updateError } = await supabase
            .from('orders')
            .update({ status: status })
            .eq('id', order.id)

          if (updateError) {
            console.error(`❌ Status update to ${status} failed:`, updateError)
          } else {
            console.log(`✅ Status updated to: ${status}`)
          }
        }

        // Cleanup
        console.log('\n📋 Step 5: Cleaning up test data...')
        await supabase.from('order_items').delete().eq('order_id', order.id)
        await supabase.from('orders').delete().eq('id', order.id)
        console.log('✅ Test data cleaned up')

        console.log('\n🎉 ORDER FLOW TEST COMPLETED SUCCESSFULLY')
      } else {
        console.log('⚠️  No users found - cannot test order creation')
      }
    } else {
      console.log('⚠️  No menu items found')
    }

  } catch (error) {
    console.error('💥 Test failed:', error)
    process.exit(1)
  }
}

testOrderCreationFlow()