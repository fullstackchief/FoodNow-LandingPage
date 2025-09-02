#!/usr/bin/env node

/**
 * RESTAURANT DATABASE SEEDER
 * ==========================
 * Seeds the database with real Lagos restaurants and menu items
 * Run with: node scripts/seed-restaurants.js
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

// Initialize Supabase client with service role key
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Helper function to generate URL-friendly slugs
function generateSlug(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .trim()
}

// Real Lagos restaurant data
const restaurantsData = [
  {
    id: '550e8400-e29b-41d4-a716-446655440001',
    name: 'Mama Cass Kitchen',
    slug: 'mama-cass-kitchen',
    description: 'Authentic Nigerian cuisine with traditional recipes passed down through generations. Home of the best Jollof Rice in Lagos.',
    image_url: 'https://images.unsplash.com/photo-1596797038530-2c107229654b?w=800&h=600&fit=crop&auto=format',
    cover_image_url: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=1200&h=600&fit=crop&auto=format',
    rating: 4.8,
    review_count: 342,
    price_range: '$$',
    cuisine_types: ['Nigerian', 'African'],
    delivery_time: '25-35 min',
    delivery_fee: 500,
    minimum_order: 2000,
    is_open: true,
    is_featured: true,
    status: 'approved',
    opening_hours: {
      monday: { open: '08:00', close: '22:00' },
      tuesday: { open: '08:00', close: '22:00' },
      wednesday: { open: '08:00', close: '22:00' },
      thursday: { open: '08:00', close: '22:00' },
      friday: { open: '08:00', close: '23:00' },
      saturday: { open: '09:00', close: '23:00' },
      sunday: { open: '10:00', close: '21:00' }
    },
    location: { area: 'Victoria Island', city: 'Lagos', coordinates: { lat: 6.4281, lng: 3.4219 } },
    features: ['Fast Delivery', 'Nigerian Cuisine', 'Family Friendly'],
    phone_number: '+234 901 234 5678',
    email: 'info@mamacasskitchen.com',
    total_orders: 2847,
    established_year: 2015,
    promotions: { active: true, discount: 15, description: '15% off first order' }
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440002',
    name: 'Dragon Wok Chinese Kitchen',
    description: 'Authentic Chinese cuisine with fresh ingredients and traditional cooking methods. Best dim sum and noodles in Lagos.',
    image_url: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&h=600&fit=crop&auto=format',
    cover_image_url: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=1200&h=600&fit=crop&auto=format',
    rating: 4.7,
    review_count: 198,
    price_range: '$$$',
    cuisine_types: ['Chinese', 'Asian'],
    delivery_time: '30-45 min',
    delivery_fee: 800,
    minimum_order: 3000,
    is_open: true,
    is_featured: true,
    status: 'approved',
    opening_hours: {
      monday: { open: '11:00', close: '22:30' },
      tuesday: { open: '11:00', close: '22:30' },
      wednesday: { open: '11:00', close: '22:30' },
      thursday: { open: '11:00', close: '22:30' },
      friday: { open: '11:00', close: '23:30' },
      saturday: { open: '11:00', close: '23:30' },
      sunday: { open: '12:00', close: '22:00' }
    },
    location: { area: 'Lekki Phase 1', city: 'Lagos', coordinates: { lat: 6.4474, lng: 3.4553 } },
    features: ['Authentic Chinese', 'Vegetarian Options', 'Fresh Ingredients'],
    phone_number: '+234 802 345 6789',
    email: 'orders@dragonwok.ng',
    total_orders: 1654,
    established_year: 2018,
    promotions: { active: false }
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440003',
    name: 'Pizza Paradise Lagos',
    description: 'Wood-fired pizzas made with imported Italian ingredients. The finest pizza experience in Lagos with authentic flavors.',
    image_url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&h=600&fit=crop&auto=format',
    cover_image_url: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=1200&h=600&fit=crop&auto=format',
    rating: 4.6,
    review_count: 267,
    price_range: '$$$',
    cuisine_types: ['Italian', 'Pizza'],
    delivery_time: '20-30 min',
    delivery_fee: 600,
    minimum_order: 2500,
    is_open: true,
    is_featured: true,
    status: 'approved',
    opening_hours: {
      monday: { open: '10:00', close: '23:00' },
      tuesday: { open: '10:00', close: '23:00' },
      wednesday: { open: '10:00', close: '23:00' },
      thursday: { open: '10:00', close: '23:00' },
      friday: { open: '10:00', close: '24:00' },
      saturday: { open: '10:00', close: '24:00' },
      sunday: { open: '11:00', close: '23:00' }
    },
    location: { area: 'Ikeja GRA', city: 'Lagos', coordinates: { lat: 6.5966, lng: 3.3515 } },
    features: ['Wood-fired Pizza', 'Italian Cuisine', 'Late Night'],
    phone_number: '+234 703 456 7890',
    email: 'hello@pizzaparadise.ng',
    total_orders: 3421,
    established_year: 2017,
    promotions: { active: true, discount: 20, description: 'Buy 2 Get 1 Free on weekends' }
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440004',
    name: 'Burger Express',
    description: 'Premium burgers made with 100% beef patties and fresh ingredients. Fast, fresh, and delicious American-style burgers.',
    image_url: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=800&h=600&fit=crop&auto=format',
    cover_image_url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=1200&h=600&fit=crop&auto=format',
    rating: 4.4,
    review_count: 156,
    price_range: '$$',
    cuisine_types: ['American', 'Fast Food', 'Burgers'],
    delivery_time: '15-25 min',
    delivery_fee: 400,
    minimum_order: 1500,
    is_open: true,
    is_featured: false,
    status: 'approved',
    opening_hours: {
      monday: { open: '07:00', close: '23:00' },
      tuesday: { open: '07:00', close: '23:00' },
      wednesday: { open: '07:00', close: '23:00' },
      thursday: { open: '07:00', close: '23:00' },
      friday: { open: '07:00', close: '24:00' },
      saturday: { open: '08:00', close: '24:00' },
      sunday: { open: '09:00', close: '22:00' }
    },
    location: { area: 'Surulere', city: 'Lagos', coordinates: { lat: 6.4969, lng: 3.3841 } },
    features: ['Fast Delivery', '100% Beef', 'American Style'],
    phone_number: '+234 805 678 9012',
    email: 'orders@burgerexpress.ng',
    total_orders: 2156,
    established_year: 2019,
    promotions: { active: false }
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440005',
    name: 'Green Bowl Healthy Kitchen',
    description: 'Fresh, healthy meals made with organic ingredients. Salads, smoothie bowls, and nutritious meals for a healthy lifestyle.',
    image_url: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&h=600&fit=crop&auto=format',
    cover_image_url: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=1200&h=600&fit=crop&auto=format',
    rating: 4.5,
    review_count: 89,
    price_range: '$$$',
    cuisine_types: ['Healthy', 'Vegetarian', 'Salads'],
    delivery_time: '20-30 min',
    delivery_fee: 700,
    minimum_order: 2200,
    is_open: true,
    is_featured: false,
    status: 'approved',
    opening_hours: {
      monday: { open: '06:30', close: '20:00' },
      tuesday: { open: '06:30', close: '20:00' },
      wednesday: { open: '06:30', close: '20:00' },
      thursday: { open: '06:30', close: '20:00' },
      friday: { open: '06:30', close: '21:00' },
      saturday: { open: '07:00', close: '21:00' },
      sunday: { open: '08:00', close: '19:00' }
    },
    location: { area: 'Ikoyi', city: 'Lagos', coordinates: { lat: 6.4541, lng: 3.4316 } },
    features: ['Organic', 'Healthy Options', 'Vegetarian'],
    phone_number: '+234 814 567 8901',
    email: 'hello@greenbowl.ng',
    total_orders: 876,
    established_year: 2020,
    promotions: { active: true, discount: 10, description: '10% off healthy meals' }
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440006',
    name: 'Italian Corner',
    description: 'Authentic Italian pasta, risotto, and desserts. Family recipes brought from Italy to Lagos with love and tradition.',
    image_url: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=800&h=600&fit=crop&auto=format',
    cover_image_url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=1200&h=600&fit=crop&auto=format',
    rating: 4.7,
    review_count: 234,
    price_range: '$$$',
    cuisine_types: ['Italian', 'Pasta', 'European'],
    delivery_time: '25-35 min',
    delivery_fee: 650,
    minimum_order: 2800,
    is_open: true,
    is_featured: true,
    status: 'approved',
    opening_hours: {
      monday: { open: '11:00', close: '22:00' },
      tuesday: { open: '11:00', close: '22:00' },
      wednesday: { open: '11:00', close: '22:00' },
      thursday: { open: '11:00', close: '22:00' },
      friday: { open: '11:00', close: '23:00' },
      saturday: { open: '11:00', close: '23:00' },
      sunday: { open: '12:00', close: '21:00' }
    },
    location: { area: 'Victoria Island', city: 'Lagos', coordinates: { lat: 6.4284, lng: 3.4219 } },
    features: ['Authentic Italian', 'Family Recipes', 'Wine Selection'],
    phone_number: '+234 806 789 0123',
    email: 'ciao@italiancorner.ng',
    total_orders: 1987,
    established_year: 2016,
    promotions: { active: false }
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440007',
    name: 'Bukka Hut',
    description: 'Traditional Nigerian bukka-style meals served fresh and hot. Home-style cooking that reminds you of mama\'s kitchen.',
    image_url: 'https://images.unsplash.com/photo-1596797038530-2c107229654b?w=800&h=600&fit=crop&auto=format',
    cover_image_url: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=1200&h=600&fit=crop&auto=format',
    rating: 4.3,
    review_count: 445,
    price_range: '$',
    cuisine_types: ['Nigerian', 'African', 'Local Food'],
    delivery_time: '20-30 min',
    delivery_fee: 300,
    minimum_order: 1200,
    is_open: true,
    is_featured: false,
    status: 'approved',
    opening_hours: {
      monday: { open: '07:00', close: '21:00' },
      tuesday: { open: '07:00', close: '21:00' },
      wednesday: { open: '07:00', close: '21:00' },
      thursday: { open: '07:00', close: '21:00' },
      friday: { open: '07:00', close: '22:00' },
      saturday: { open: '08:00', close: '22:00' },
      sunday: { open: '09:00', close: '20:00' }
    },
    location: { area: 'Yaba', city: 'Lagos', coordinates: { lat: 6.5158, lng: 3.3696 } },
    features: ['Budget Friendly', 'Local Cuisine', 'Quick Service'],
    phone_number: '+234 807 890 1234',
    email: 'orders@bukkahut.ng',
    total_orders: 4523,
    established_year: 2014,
    promotions: { active: true, discount: 12, description: 'Student discount available' }
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440008',
    name: 'Sushi Tokyo',
    description: 'Fresh sushi and Japanese cuisine prepared by experienced Japanese chefs. Premium quality fish and authentic flavors.',
    image_url: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=800&h=600&fit=crop&auto=format',
    cover_image_url: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=1200&h=600&fit=crop&auto=format',
    rating: 4.9,
    review_count: 156,
    price_range: '$$$$',
    cuisine_types: ['Japanese', 'Sushi', 'Asian'],
    delivery_time: '35-50 min',
    delivery_fee: 1000,
    minimum_order: 4000,
    is_open: true,
    is_featured: true,
    status: 'approved',
    opening_hours: {
      monday: { open: '12:00', close: '22:00' },
      tuesday: { open: '12:00', close: '22:00' },
      wednesday: { open: '12:00', close: '22:00' },
      thursday: { open: '12:00', close: '22:00' },
      friday: { open: '12:00', close: '23:00' },
      saturday: { open: '12:00', close: '23:00' },
      sunday: { open: '14:00', close: '21:00' }
    },
    location: { area: 'Lekki Phase 1', city: 'Lagos', coordinates: { lat: 6.4474, lng: 3.4553 } },
    features: ['Premium Sushi', 'Japanese Chefs', 'Fresh Fish'],
    phone_number: '+234 809 012 3456',
    email: 'info@sushitokyo.ng',
    total_orders: 967,
    established_year: 2021,
    promotions: { active: false }
  }
]

// Menu items data for each restaurant
const menuItemsData = [
  // Mama Cass Kitchen Menu
  {
    restaurant_id: '550e8400-e29b-41d4-a716-446655440001',
    name: 'Special Jollof Rice',
    description: 'Our signature jollof rice cooked with premium basmati rice, fresh tomatoes, and authentic spices. Served with fried plantain.',
    base_price: 2500,
    image_url: 'https://images.unsplash.com/photo-1596797038530-2c107229654b?w=400&h=300&fit=crop&auto=format',
    category: 'Main Course',
    is_available: true,
    preparation_time: 15,
    calories: 680,
    tags: ['Popular', 'Signature Dish', 'Spicy'],
    allergens: null,
    customizations: {
      protein: ['Chicken (+₦500)', 'Beef (+₦800)', 'Fish (+₦600)', 'None'],
      spice_level: ['Mild', 'Medium', 'Hot'],
      extras: ['Extra Plantain (+₦200)', 'Coleslaw (+₦300)', 'Moi Moi (+₦400)']
    },
    nutrition_info: { calories: 680, protein: '25g', carbs: '75g', fat: '28g' }
  },
  {
    restaurant_id: '550e8400-e29b-41d4-a716-446655440001',
    name: 'Pounded Yam & Egusi Soup',
    description: 'Fresh pounded yam served with rich egusi soup loaded with assorted meat, fish, and vegetables.',
    base_price: 3200,
    image_url: 'https://images.unsplash.com/photo-1596797038530-2c107229654b?w=400&h=300&fit=crop&auto=format',
    category: 'Main Course',
    is_available: true,
    preparation_time: 25,
    calories: 850,
    tags: ['Traditional', 'Heavy Meal'],
    allergens: null,
    customizations: {
      protein: ['Assorted Meat (included)', 'Extra Fish (+₦400)', 'Extra Meat (+₦600)'],
      yam_portion: ['Regular', 'Large (+₦300)']
    },
    nutrition_info: { calories: 850, protein: '35g', carbs: '90g', fat: '32g' }
  },
  {
    restaurant_id: '550e8400-e29b-41d4-a716-446655440001',
    name: 'Pepper Soup (Catfish)',
    description: 'Spicy and aromatic catfish pepper soup with traditional herbs and spices. Perfect for any weather.',
    base_price: 2800,
    image_url: 'https://images.unsplash.com/photo-1596797038530-2c107229654b?w=400&h=300&fit=crop&auto=format',
    category: 'Soup',
    is_available: true,
    preparation_time: 20,
    calories: 420,
    tags: ['Spicy', 'Healthy', 'Low Carb'],
    allergens: ['Fish'],
    customizations: {
      spice_level: ['Mild', 'Hot', 'Extra Hot'],
      extras: ['Yam (+₦400)', 'Plantain (+₦200)']
    },
    nutrition_info: { calories: 420, protein: '45g', carbs: '8g', fat: '18g' }
  },

  // Dragon Wok Menu
  {
    restaurant_id: '550e8400-e29b-41d4-a716-446655440002',
    name: 'Dragon Special Fried Rice',
    description: 'Wok-fried rice with prawns, chicken, beef, and vegetables. Cooked with our secret sauce blend.',
    base_price: 3500,
    image_url: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400&h=300&fit=crop&auto=format',
    category: 'Main Course',
    is_available: true,
    preparation_time: 18,
    calories: 720,
    tags: ['Popular', 'Mixed Protein'],
    allergens: ['Shellfish', 'Soy'],
    customizations: {
      protein: ['Mixed (included)', 'Chicken Only', 'Beef Only', 'Prawns Only (+₦500)'],
      spice_level: ['No Spice', 'Mild', 'Medium', 'Hot']
    },
    nutrition_info: { calories: 720, protein: '38g', carbs: '65g', fat: '30g' }  },
  {
    restaurant_id: '550e8400-e29b-41d4-a716-446655440002',
    name: 'Sweet & Sour Chicken',
    description: 'Crispy chicken pieces glazed in our homemade sweet and sour sauce with bell peppers and pineapple.',
    base_price: 3200,
    image_url: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400&h=300&fit=crop&auto=format',
    category: 'Main Course',
    is_available: true,
    preparation_time: 22,
    calories: 650,
    tags: ['Sweet', 'Crispy', 'Popular'],
    allergens: ['Soy'],
    customizations: {
      serving_size: ['Regular', 'Large (+₦500)'],
      rice: ['Steamed Rice (included)', 'Fried Rice (+₦200)', 'No Rice (-₦150)']
    },
    nutrition_info: { calories: 650, protein: '32g', carbs: '58g', fat: '26g' }  },

  // Pizza Paradise Menu
  {
    restaurant_id: '550e8400-e29b-41d4-a716-446655440003',
    name: 'Margherita Pizza',
    description: 'Classic Italian pizza with fresh mozzarella, tomato sauce, and basil leaves on our wood-fired crust.',
    base_price: 4200,
    image_url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&h=300&fit=crop&auto=format',
    category: 'Pizza',
    is_available: true,
    preparation_time: 15,
    calories: 580,
    tags: ['Classic', 'Vegetarian'],
    allergens: ['Gluten', 'Dairy'],
    customizations: {
      size: ['Medium (included)', 'Large (+₦800)', 'Family Size (+₦1500)'],
      crust: ['Thin Crust', 'Thick Crust'],
      extras: ['Extra Cheese (+₦300)', 'Extra Basil (+₦100)']
    },
    nutrition_info: { calories: 580, protein: '25g', carbs: '52g', fat: '28g' }  },
  {
    restaurant_id: '550e8400-e29b-41d4-a716-446655440003',
    name: 'Meat Lovers Pizza',
    description: 'Loaded with pepperoni, sausage, bacon, and ham on our signature tomato base with mozzarella cheese.',
    base_price: 5800,
    image_url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&h=300&fit=crop&auto=format',
    category: 'Pizza',
    is_available: true,
    preparation_time: 18,
    calories: 780,
    tags: ['Meat Lovers', 'Heavy', 'Popular'],
    allergens: ['Gluten', 'Dairy'],
    customizations: {
      size: ['Medium (included)', 'Large (+₦800)', 'Family Size (+₦1500)'],
      crust: ['Thin Crust', 'Thick Crust']
    },
    nutrition_info: { calories: 780, protein: '42g', carbs: '48g', fat: '45g' }  },

  // Burger Express Menu
  {
    restaurant_id: '550e8400-e29b-41d4-a716-446655440004',
    name: 'Classic Beef Burger',
    description: '100% beef patty with lettuce, tomato, onions, pickles, and our special sauce. Served with crispy fries.',
    base_price: 2800,
    image_url: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=400&h=300&fit=crop&auto=format',
    category: 'Burgers',
    is_available: true,
    preparation_time: 12,
    calories: 650,
    tags: ['Classic', 'Beef', 'Popular'],
    allergens: ['Gluten'],
    customizations: {
      patty: ['Single (included)', 'Double (+₦500)'],
      cheese: ['No Cheese', 'American Cheese (+₦200)', 'Cheddar Cheese (+₦200)'],
      fries: ['Regular Fries (included)', 'Sweet Potato Fries (+₦300)', 'No Fries (-₦200)']
    },
    nutrition_info: { calories: 650, protein: '28g', carbs: '45g', fat: '38g' }  },
  {
    restaurant_id: '550e8400-e29b-41d4-a716-446655440004',
    name: 'Chicken Deluxe Burger',
    description: 'Grilled chicken breast with avocado, lettuce, tomato, and mayo on a brioche bun. Served with fries.',
    base_price: 3200,
    image_url: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=400&h=300&fit=crop&auto=format',
    category: 'Burgers',
    is_available: true,
    preparation_time: 15,
    calories: 580,
    tags: ['Chicken', 'Healthy', 'Avocado'],
    allergens: ['Gluten'],
    customizations: {
      chicken: ['Grilled (included)', 'Crispy (+₦200)'],
      extras: ['Bacon (+₦300)', 'Extra Avocado (+₦250)']
    },
    nutrition_info: { calories: 580, protein: '35g', carbs: '42g', fat: '28g' }  },

  // Green Bowl Menu
  {
    restaurant_id: '550e8400-e29b-41d4-a716-446655440005',
    name: 'Mediterranean Power Bowl',
    description: 'Quinoa, grilled chicken, mixed greens, cherry tomatoes, cucumber, olives, and feta with lemon herb dressing.',
    base_price: 3800,
    image_url: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=300&fit=crop&auto=format',
    category: 'Bowls',
    is_available: true,
    preparation_time: 10,
    calories: 520,
    tags: ['Healthy', 'High Protein', 'Mediterranean'],
    allergens: ['Dairy'],
    customizations: {
      protein: ['Grilled Chicken (included)', 'Salmon (+₦800)', 'Tofu (+₦200)', 'No Protein (-₦400)'],
      dressing: ['Lemon Herb', 'Balsamic', 'Caesar', 'Olive Oil & Vinegar']
    },
    nutrition_info: { calories: 520, protein: '38g', carbs: '35g', fat: '25g' }  },
  {
    restaurant_id: '550e8400-e29b-41d4-a716-446655440005',
    name: 'Acai Smoothie Bowl',
    description: 'Organic acai blend topped with granola, fresh berries, banana, coconut flakes, and honey.',
    base_price: 2500,
    image_url: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=300&fit=crop&auto=format',
    category: 'Smoothie Bowls',
    is_available: true,
    preparation_time: 8,
    calories: 380,
    tags: ['Vegan', 'Antioxidant Rich', 'Breakfast'],
    allergens: null,
    customizations: {
      toppings: ['Standard (included)', 'Extra Berries (+₦300)', 'Protein Powder (+₦400)', 'Chia Seeds (+₦200)']
    },
    nutrition_info: { calories: 380, protein: '8g', carbs: '65g', fat: '12g' }  },

  // Italian Corner Menu
  {
    restaurant_id: '550e8400-e29b-41d4-a716-446655440006',
    name: 'Spaghetti Carbonara',
    description: 'Classic Roman pasta with pancetta, egg yolk, pecorino romano, and black pepper. Made with imported Italian pasta.',
    base_price: 4200,
    image_url: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=400&h=300&fit=crop&auto=format',
    category: 'Pasta',
    is_available: true,
    preparation_time: 18,
    calories: 720,
    tags: ['Classic', 'Creamy', 'Traditional'],
    allergens: ['Gluten', 'Dairy', 'Eggs'],
    customizations: {
      portion: ['Regular (included)', 'Large (+₦600)'],
      extras: ['Extra Pancetta (+₦400)', 'Extra Cheese (+₦300)']
    },
    nutrition_info: { calories: 720, protein: '28g', carbs: '65g', fat: '38g' }  },
  {
    restaurant_id: '550e8400-e29b-41d4-a716-446655440006',
    name: 'Chicken Parmigiana',
    description: 'Breaded chicken breast topped with marinara sauce and melted mozzarella, served with spaghetti.',
    base_price: 4800,
    image_url: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=400&h=300&fit=crop&auto=format',
    category: 'Main Course',
    is_available: true,
    preparation_time: 25,
    calories: 850,
    tags: ['Comfort Food', 'Cheesy', 'Popular'],
    allergens: ['Gluten', 'Dairy'],
    customizations: {
      pasta: ['Spaghetti (included)', 'Penne', 'Fettuccine'],
      size: ['Regular', 'Large (+₦700)']
    },
    nutrition_info: { calories: 850, protein: '48g', carbs: '58g', fat: '42g' }  },

  // Bukka Hut Menu
  {
    restaurant_id: '550e8400-e29b-41d4-a716-446655440007',
    name: 'Rice & Stew Combo',
    description: 'White rice served with rich tomato stew, fried plantain, and your choice of protein.',
    base_price: 1500,
    image_url: 'https://images.unsplash.com/photo-1596797038530-2c107229654b?w=400&h=300&fit=crop&auto=format',
    category: 'Combo Meals',
    is_available: true,
    preparation_time: 10,
    calories: 650,
    tags: ['Budget Friendly', 'Filling', 'Local'],
    allergens: null,
    customizations: {
      protein: ['Chicken (+₦300)', 'Beef (+₦400)', 'Fish (+₦350)', 'Egg (+₦150)', 'None'],
      rice_portion: ['Regular', 'Large (+₦200)'],
      extras: ['Extra Plantain (+₦150)', 'Coleslaw (+₦200)']
    },
    nutrition_info: { calories: 650, protein: '25g', carbs: '75g', fat: '22g' }  },
  {
    restaurant_id: '550e8400-e29b-41d4-a716-446655440007',
    name: 'Beans & Plantain',
    description: 'Well-cooked honey beans served with fried ripe plantain and palm oil sauce.',
    base_price: 1200,
    image_url: 'https://images.unsplash.com/photo-1596797038530-2c107229654b?w=400&h=300&fit=crop&auto=format',
    category: 'Local Dishes',
    is_available: true,
    preparation_time: 15,
    calories: 480,
    tags: ['Vegetarian', 'Traditional', 'Budget'],
    allergens: null,
    customizations: {
      plantain: ['Regular (2 pieces)', 'Extra (+₦100)'],
      sauce: ['Palm Oil (included)', 'Tomato Stew (+₦100)']
    },
    nutrition_info: { calories: 480, protein: '18g', carbs: '68g', fat: '15g' }  },

  // Sushi Tokyo Menu
  {
    restaurant_id: '550e8400-e29b-41d4-a716-446655440008',
    name: 'Dragon Roll',
    description: 'Inside: tempura shrimp, avocado. Outside: eel, avocado, eel sauce. Our signature premium roll.',
    base_price: 6500,
    image_url: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=400&h=300&fit=crop&auto=format',
    category: 'Specialty Rolls',
    is_available: true,
    preparation_time: 20,
    calories: 420,
    tags: ['Signature', 'Premium', 'Tempura'],
    allergens: ['Shellfish', 'Fish'],
    customizations: {
      pieces: ['8 pieces (included)', '12 pieces (+₦1000)'],
      sides: ['Wasabi & Ginger (included)', 'Extra Wasabi (+₦100)', 'Soy Sauce (+₦50)']
    },
    nutrition_info: { calories: 420, protein: '22g', carbs: '35g', fat: '20g' }  },
  {
    restaurant_id: '550e8400-e29b-41d4-a716-446655440008',
    name: 'Salmon Nigiri Set',
    description: 'Fresh Norwegian salmon over seasoned sushi rice. Set of 6 pieces with wasabi and pickled ginger.',
    base_price: 4800,
    image_url: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=400&h=300&fit=crop&auto=format',
    category: 'Nigiri',
    is_available: true,
    preparation_time: 12,
    calories: 280,
    tags: ['Fresh', 'Premium Fish', 'Traditional'],
    allergens: ['Fish'],
    customizations: {
      pieces: ['6 pieces (included)', '10 pieces (+₦1200)'],
      preparation: ['Regular', 'Torched (+₦300)']
    },
    nutrition_info: { calories: 280, protein: '32g', carbs: '18g', fat: '8g' }  }
]

async function seedDatabase() {
  console.log('🌱 Starting restaurant database seeding...')
  
  try {
    // Clear existing data in the correct order (handle foreign keys)
    console.log('🗑️ Clearing existing order items...')
    const { error: clearOrderItemsError } = await supabase
      .from('order_items')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all
    
    if (clearOrderItemsError && !clearOrderItemsError.message.includes('0 rows')) {
      console.warn('⚠️ Warning clearing order items:', clearOrderItemsError.message)
    }

    console.log('🗑️ Clearing existing orders...')
    const { error: clearOrdersError } = await supabase
      .from('orders')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all
    
    if (clearOrdersError && !clearOrdersError.message.includes('0 rows')) {
      console.warn('⚠️ Warning clearing orders:', clearOrdersError.message)
    }

    console.log('🗑️ Clearing existing menu items...')
    const { error: clearMenuError } = await supabase
      .from('menu_items')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all
    
    if (clearMenuError && !clearMenuError.message.includes('0 rows')) {
      console.warn('⚠️ Warning clearing menu items:', clearMenuError.message)
    }

    console.log('🗑️ Clearing existing restaurants...')
    const { error: clearRestaurantError } = await supabase
      .from('restaurants')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all
    
    if (clearRestaurantError && !clearRestaurantError.message.includes('0 rows')) {
      console.warn('⚠️ Warning clearing restaurants:', clearRestaurantError.message)
    }

    // Add slugs to restaurant data
    const restaurantsWithSlugs = restaurantsData.map(restaurant => ({
      ...restaurant,
      slug: restaurant.slug || generateSlug(restaurant.name)
    }))

    // Insert restaurants
    console.log('🏪 Inserting restaurants...')
    const { data: restaurantData, error: restaurantError } = await supabase
      .from('restaurants')
      .insert(restaurantsWithSlugs)
      .select()

    if (restaurantError) {
      console.error('❌ Error inserting restaurants:', restaurantError)
      return
    }

    console.log(`✅ Successfully inserted ${restaurantData.length} restaurants`)

    // Remove category field if it doesn't exist in database
    const menuItemsWithoutCategory = menuItemsData.map(({ category, ...item }) => item)
    
    // Insert menu items
    console.log('🍽️ Inserting menu items...')
    const { data: menuData, error: menuError } = await supabase
      .from('menu_items')
      .insert(menuItemsWithoutCategory)
      .select()

    if (menuError) {
      console.error('❌ Error inserting menu items:', menuError)
      return
    }

    console.log(`✅ Successfully inserted ${menuData.length} menu items`)

    // Verify the data
    console.log('🔍 Verifying inserted data...')
    
    const { data: verifyRestaurants, error: verifyError } = await supabase
      .from('restaurants')
      .select('id, name, cuisine_types, rating')
      .order('name')

    if (verifyError) {
      console.error('❌ Error verifying data:', verifyError)
      return
    }

    console.log('\n📊 Database seeding completed successfully!')
    console.log('\n🏪 Inserted Restaurants:')
    verifyRestaurants.forEach((restaurant, index) => {
      console.log(`  ${index + 1}. ${restaurant.name} (${restaurant.cuisine_types.join(', ')}) - Rating: ${restaurant.rating}`)
    })

    console.log('\n🎉 Your Lagos food delivery database is ready!')
    console.log('💡 You can now run your app and see real restaurant data.')
    
  } catch (error) {
    console.error('💥 Fatal error during seeding:', error)
  }
}

// Run the seeding
seedDatabase()