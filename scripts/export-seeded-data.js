#!/usr/bin/env node

/**
 * Export Seeded Data Script
 * 
 * Fetches all seeded data from Supabase and exports it in formats useful for frontend components.
 * This replaces all mock data with actual database data.
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function fetchAllData() {
  console.log('🔍 FETCHING SEEDED DATA FROM DATABASE');
  console.log('=====================================');
  console.log(`📡 Connected to: ${supabaseUrl}`);

  const data = {
    restaurants: [],
    menuItems: [],
    users: [],
    orders: [],
    timestamp: new Date().toISOString()
  };

  try {
    // Fetch all restaurants
    console.log('📊 Fetching restaurants...');
    const { data: restaurants, error: restaurantsError } = await supabase
      .from('restaurants')
      .select('*')
      .order('created_at', { ascending: true });

    if (restaurantsError) {
      throw new Error(`Restaurants fetch failed: ${restaurantsError.message}`);
    }
    data.restaurants = restaurants;
    console.log(`   ✅ Found ${restaurants.length} restaurants`);

    // Fetch all menu items
    console.log('🍽️ Fetching menu items...');
    const { data: menuItems, error: menuError } = await supabase
      .from('menu_items')
      .select('*')
      .order('created_at', { ascending: true });

    if (menuError) {
      throw new Error(`Menu items fetch failed: ${menuError.message}`);
    }
    data.menuItems = menuItems;
    console.log(`   ✅ Found ${menuItems.length} menu items`);

    // Fetch featured restaurants (restaurants with is_featured = true)
    console.log('⭐ Fetching featured restaurants...');
    const { data: featuredRestaurants, error: featuredError } = await supabase
      .from('restaurants')
      .select('*')
      .eq('is_featured', true)
      .eq('status', 'approved')
      .order('rating', { ascending: false })
      .limit(6);

    if (featuredError) {
      throw new Error(`Featured restaurants fetch failed: ${featuredError.message}`);
    }
    data.featuredRestaurants = featuredRestaurants;
    console.log(`   ✅ Found ${featuredRestaurants.length} featured restaurants`);

    // Fetch users (sample, no sensitive data)
    console.log('👥 Fetching users (non-sensitive data)...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, first_name, last_name, user_role, created_at, total_orders, tier')
      .limit(10);

    if (usersError) {
      throw new Error(`Users fetch failed: ${usersError.message}`);
    }
    data.users = users;
    console.log(`   ✅ Found ${users.length} users`);

    return data;

  } catch (error) {
    console.error('❌ Error fetching data:', error.message);
    throw error;
  }
}

function generateFeaturedRestaurantsComponent(featuredRestaurants) {
  // Transform database restaurants to match current component format
  const restaurants = featuredRestaurants.slice(0, 4).map((restaurant, index) => {
    const gradients = [
      'from-orange-100 to-red-100',
      'from-red-100 to-yellow-100', 
      'from-green-100 to-blue-100',
      'from-blue-100 to-purple-100'
    ];
    
    const emojis = ['🍛', '🍖', '🍝', '🐟'];
    
    // Extract first cuisine type or use default
    const cuisine = restaurant.cuisine_types?.[0] || 'Nigerian';
    
    return {
      id: restaurant.id,
      name: restaurant.name,
      cuisine: cuisine,
      rating: restaurant.rating,
      deliveryTime: restaurant.delivery_time,
      image: emojis[index % emojis.length],
      bgGradient: gradients[index % gradients.length],
      specialty: restaurant.description.split('.')[0], // First sentence as specialty
      location: restaurant.location?.area || 'Lagos'
    };
  });

  return JSON.stringify(restaurants, null, 2);
}

function generateRestaurantConstants(restaurants) {
  return `// Generated from database on ${new Date().toISOString()}
// This file contains actual restaurant data from Supabase

export const FEATURED_RESTAURANTS = ${JSON.stringify(
    restaurants.filter(r => r.is_featured && r.status === 'approved').slice(0, 6),
    null,
    2
  )};

export const ALL_RESTAURANTS = ${JSON.stringify(restaurants, null, 2)};

export const RESTAURANT_CATEGORIES = ${JSON.stringify([...new Set(restaurants.flatMap(r => r.cuisine_types || []))], null, 2)};
`;
}

function generateMenuConstants(menuItems, restaurants) {
  // Group menu items by restaurant
  const menuByRestaurant = {};
  menuItems.forEach(item => {
    if (!menuByRestaurant[item.restaurant_id]) {
      menuByRestaurant[item.restaurant_id] = [];
    }
    menuByRestaurant[item.restaurant_id].push(item);
  });

  return `// Generated from database on ${new Date().toISOString()}
// This file contains actual menu data from Supabase

export const MENU_ITEMS = ${JSON.stringify(menuItems, null, 2)};

export const MENU_BY_RESTAURANT = ${JSON.stringify(menuByRestaurant, null, 2)};

export const FOOD_CATEGORIES = ${JSON.stringify([...new Set(menuItems.flatMap(item => item.tags || []))], null, 2)};
`;
}

async function main() {
  try {
    // Fetch all data
    const data = await fetchAllData();

    // Create constants directory if it doesn't exist
    const constantsDir = path.join(__dirname, '..', 'src', 'constants');
    if (!fs.existsSync(constantsDir)) {
      fs.mkdirSync(constantsDir, { recursive: true });
    }

    // Export raw data JSON
    console.log('📝 Generating data exports...');
    
    // Raw data export
    fs.writeFileSync(
      path.join(constantsDir, 'seeded-data.json'),
      JSON.stringify(data, null, 2)
    );

    // Restaurant constants
    fs.writeFileSync(
      path.join(constantsDir, 'restaurants.ts'),
      generateRestaurantConstants(data.restaurants)
    );

    // Menu constants  
    fs.writeFileSync(
      path.join(constantsDir, 'menu.ts'),
      generateMenuConstants(data.menuItems, data.restaurants)
    );

    // Featured restaurants data for component
    fs.writeFileSync(
      path.join(constantsDir, 'featured-restaurants-data.js'),
      `// Generated from database on ${new Date().toISOString()}
// Use this to replace mock data in FeaturedRestaurants.tsx

export const FEATURED_RESTAURANTS_DATA = ${generateFeaturedRestaurantsComponent(data.featuredRestaurants)};
`
    );

    console.log('✅ Data export completed successfully!');
    console.log('\n📁 Generated files:');
    console.log('   - src/constants/seeded-data.json');
    console.log('   - src/constants/restaurants.ts');
    console.log('   - src/constants/menu.ts');
    console.log('   - src/constants/featured-restaurants-data.js');

    console.log('\n🎯 Next steps:');
    console.log('   1. Replace mock data in FeaturedRestaurants.tsx');
    console.log('   2. Update other components to use real data');
    console.log('   3. Test all pages with actual database content');

    console.log(`\n📊 Data Summary:`);
    console.log(`   - ${data.restaurants.length} restaurants`);
    console.log(`   - ${data.menuItems.length} menu items`);
    console.log(`   - ${data.featuredRestaurants.length} featured restaurants`);
    console.log(`   - ${data.users.length} users (sample)`);

  } catch (error) {
    console.error('❌ Export failed:', error.message);
    process.exit(1);
  }
}

// Run the script
main();