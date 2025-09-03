const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://fkcxijuikfsvxgojjbgp.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZrY3hpanVpa2Zzdnhnb2pqYmdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYxNTQxNjAsImV4cCI6MjA3MTczMDE2MH0.ElefrWu7fWpZm50xWeVIa5J0pGQuVX5_nWIEZ8uds1s'

const supabase = createClient(supabaseUrl, supabaseKey)

const VERIFIED_RESTAURANT_ID = '550e8400-e29b-41d4-a716-446655440001'

async function debugRestaurantPage() {
  console.log('🔍 Debugging Restaurant Page Data Loading\n')

  try {
    // Test the exact same query as RestaurantDetailClient
    console.log('📋 Testing restaurant query...')
    const { data: restaurant, error: restaurantError } = await supabase
      .from('restaurants')
      .select('id, name, description, image_url, cover_image_url, rating, review_count, price_range, cuisine_types, delivery_time, delivery_fee, minimum_order, is_open, opening_hours, location, features, phone_number, email, total_orders, established_year, created_at, updated_at, promotions, is_featured')
      .eq('id', VERIFIED_RESTAURANT_ID)
      .single()

    if (restaurantError) {
      console.error('❌ Restaurant query failed:', restaurantError)
      return
    }

    console.log('✅ Restaurant data retrieved:')
    console.log(`   Name: ${restaurant.name}`)
    console.log(`   Description: ${restaurant.description}`)
    console.log(`   Status: Open=${restaurant.is_open}, Featured=${restaurant.is_featured}`)
    console.log(`   Rating: ${restaurant.rating} (${restaurant.review_count} reviews)`)
    console.log(`   Delivery: ${restaurant.delivery_time}, Fee: ₦${restaurant.delivery_fee}`)
    console.log(`   Minimum Order: ₦${restaurant.minimum_order}`)

    // Test menu items query
    console.log('\n📋 Testing menu items query...')
    const { data: menuItems, error: menuError } = await supabase
      .from('menu_items')
      .select('id, restaurant_id, category_id, name, description, base_price, image_url, is_available, is_popular, preparation_time, calories, tags, allergens, customizations, nutrition_info, display_order, created_at, updated_at')
      .eq('restaurant_id', VERIFIED_RESTAURANT_ID)
      .eq('is_available', true)
      .order('display_order', { ascending: true })
      .order('name', { ascending: true })

    if (menuError) {
      console.error('❌ Menu items query failed:', menuError)
      return
    }

    console.log(`✅ Menu items found: ${menuItems.length}`)
    menuItems.forEach((item, index) => {
      console.log(`   ${index + 1}. ${item.name}`)
      console.log(`      Price: ₦${item.base_price}`)
      console.log(`      Prep Time: ${item.preparation_time} minutes`)
      console.log(`      Available: ${item.is_available}`)
      console.log(`      ID: ${item.id}`)
      if (item.customizations) {
        const customKeys = Object.keys(item.customizations)
        console.log(`      Customizations: ${customKeys.join(', ')}`)
      }
      console.log('')
    })

    // Test if the page would receive the data properly
    console.log('📋 Testing complete restaurant object...')
    const restaurantWithMenu = {
      ...restaurant,
      menu_items: menuItems || []
    }

    console.log('✅ Complete restaurant object structure:')
    console.log(`   Restaurant keys: ${Object.keys(restaurant).length}`)
    console.log(`   Menu items count: ${restaurantWithMenu.menu_items.length}`)
    console.log(`   First menu item: ${restaurantWithMenu.menu_items[0]?.name}`)

    // Check if there are any issues with data that could cause 404
    console.log('\n📋 Checking for potential issues...')
    
    if (!restaurant.is_open) {
      console.log('⚠️  Restaurant is marked as closed')
    }
    
    if (restaurant.status !== 'approved') {
      console.log('⚠️  Restaurant status is not approved:', restaurant.status)
    }
    
    if (menuItems.length === 0) {
      console.log('⚠️  No available menu items found')
    }

    console.log('\n✅ Restaurant page data debugging completed')
    console.log('📝 Data is available - issue might be in frontend rendering')

  } catch (error) {
    console.error('💥 Debug failed:', error)
  }
}

debugRestaurantPage()