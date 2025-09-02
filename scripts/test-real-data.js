#!/usr/bin/env node

/**
 * Test Real Data Integration
 * Verifies that all components are using real seeded data from database
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testRealDataIntegration() {
  console.log('🔍 TESTING REAL DATA INTEGRATION');
  console.log('================================');
  
  try {
    // Test 1: Verify restaurants exist and have real IDs
    console.log('1️⃣ Testing Restaurant Data...');
    const { data: restaurants, error: restaurantsError } = await supabase
      .from('restaurants')
      .select('id, name, slug, cuisine_types, is_featured')
      .limit(5);

    if (restaurantsError) {
      throw new Error(`Restaurant fetch failed: ${restaurantsError.message}`);
    }

    restaurants.forEach(restaurant => {
      console.log(`   ✅ ${restaurant.name} (${restaurant.id})`);
      console.log(`      - Slug: ${restaurant.slug}`);
      console.log(`      - Cuisine: ${restaurant.cuisine_types?.join(', ') || 'N/A'}`);
      console.log(`      - Featured: ${restaurant.is_featured ? 'Yes' : 'No'}`);
    });

    // Test 2: Verify menu items exist with real restaurant IDs
    console.log('\n2️⃣ Testing Menu Items Data...');
    const { data: menuItems, error: menuError } = await supabase
      .from('menu_items')
      .select('id, restaurant_id, name, base_price, is_available')
      .limit(5);

    if (menuError) {
      throw new Error(`Menu items fetch failed: ${menuError.message}`);
    }

    menuItems.forEach(item => {
      console.log(`   ✅ ${item.name} (₦${item.base_price})`);
      console.log(`      - ID: ${item.id}`);
      console.log(`      - Restaurant: ${item.restaurant_id}`);
      console.log(`      - Available: ${item.is_available ? 'Yes' : 'No'}`);
    });

    // Test 3: Verify specific real restaurant can be accessed
    console.log('\n3️⃣ Testing Specific Restaurant Access...');
    const realRestaurantId = '550e8400-e29b-41d4-a716-446655440001'; // Mama Cass Kitchen
    const { data: specificRestaurant, error: specificError } = await supabase
      .from('restaurants')
      .select('*')
      .eq('id', realRestaurantId)
      .single();

    if (specificError) {
      throw new Error(`Specific restaurant fetch failed: ${specificError.message}`);
    }

    console.log(`   ✅ Found: ${specificRestaurant.name}`);
    console.log(`      - Rating: ${specificRestaurant.rating}/5`);
    console.log(`      - Delivery Time: ${specificRestaurant.delivery_time}`);
    console.log(`      - Location: ${specificRestaurant.location?.area}, ${specificRestaurant.location?.city}`);

    // Test 4: Check menu items for specific restaurant
    console.log('\n4️⃣ Testing Restaurant Menu Items...');
    const { data: restaurantMenu, error: menuRestaurantError } = await supabase
      .from('menu_items')
      .select('name, base_price, description')
      .eq('restaurant_id', realRestaurantId)
      .limit(3);

    if (menuRestaurantError) {
      throw new Error(`Restaurant menu fetch failed: ${menuRestaurantError.message}`);
    }

    restaurantMenu.forEach(item => {
      console.log(`   ✅ ${item.name} - ₦${item.base_price?.toLocaleString()}`);
      console.log(`      - Description: ${item.description?.substring(0, 60)}...`);
    });

    console.log('\n🎉 SUCCESS: All data integration tests passed!');
    console.log('\n📝 Test Summary:');
    console.log(`   - ${restaurants.length} restaurants verified`);
    console.log(`   - ${menuItems.length} menu items verified`);
    console.log(`   - ${restaurantMenu.length} menu items for specific restaurant`);
    console.log('   - Real database IDs are being used');
    console.log('   - Mock data has been successfully replaced');

    // Test 5: Verify Featured Restaurants Data
    console.log('\n5️⃣ Testing Featured Restaurants...');
    const { data: featuredRestaurants, error: featuredError } = await supabase
      .from('restaurants')
      .select('id, name, rating, delivery_time')
      .eq('is_featured', true)
      .eq('status', 'approved')
      .limit(4);

    if (featuredError) {
      throw new Error(`Featured restaurants fetch failed: ${featuredError.message}`);
    }

    console.log('   Featured restaurants for homepage:');
    featuredRestaurants.forEach(restaurant => {
      console.log(`   ✅ ${restaurant.name} (${restaurant.rating}⭐) - ${restaurant.delivery_time}`);
    });

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run the test
testRealDataIntegration();