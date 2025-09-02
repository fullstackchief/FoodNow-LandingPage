import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(_request: NextRequest) {
  try {
    console.log('🚀 Starting seed data population...')
    
    // Use service role key for admin operations
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase service credentials')
    }
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
    
    console.log('🗃️ Populating seed data with coordinates...')
    
    // First, clear existing data
    console.log('🧹 Clearing existing test data...')
    await supabaseAdmin.from('menu_items').delete().eq('restaurant_id', 'rest-1111')
    await supabaseAdmin.from('restaurants').delete().in('id', ['rest-1111', 'rest-2222', 'rest-3333', 'rest-4444'])
    
    // Insert restaurants with precise coordinates for Lagos
    console.log('🏪 Inserting restaurants with coordinates...')
    
    const restaurantsWithCoords = [
      {
        id: 'rest-1111',
        name: 'Mama Cass Kitchen',
        description: 'Authentic Nigerian cuisine with traditional recipes passed down through generations',
        cuisine_type: 'Nigerian',
        address: '15 Allen Avenue, Ikeja, Lagos',
        city: 'Lagos',
        state: 'Lagos',
        phone: '+2348234567890',
        email: 'info@mamacass.com',
        logo_url: '/images/restaurants/mamacass-logo.jpg',
        cover_image_url: '/images/restaurants/mamacass-cover.jpg',
        rating: 4.5,
        total_reviews: 234,
        is_active: true,
        is_open: true,
        opening_time: '08:00',
        closing_time: '22:00',
        minimum_order: 2000,
        delivery_fee: 500,
        preparation_time: 25,
        latitude: 6.6018, // Ikeja coordinates
        longitude: 3.3515
      },
      {
        id: 'rest-2222',
        name: 'Northern Taste',
        description: 'Specializing in authentic Northern Nigerian delicacies',
        cuisine_type: 'Northern Nigerian',
        address: '8 Ahmadu Bello Way, Victoria Island, Lagos',
        city: 'Lagos',
        state: 'Lagos',
        phone: '+2349234567890',
        email: 'info@northerntaste.com',
        logo_url: '/images/restaurants/northern-logo.jpg',
        cover_image_url: '/images/restaurants/northern-cover.jpg',
        rating: 4.7,
        total_reviews: 189,
        is_active: true,
        is_open: true,
        opening_time: '09:00',
        closing_time: '23:00',
        minimum_order: 2500,
        delivery_fee: 500,
        preparation_time: 30,
        latitude: 6.4281, // Victoria Island coordinates
        longitude: 3.4219
      },
      {
        id: 'rest-3333',
        name: 'Igbo Kitchen Delights',
        description: 'Traditional Igbo cuisine featuring authentic eastern delicacies',
        cuisine_type: 'Igbo Traditional',
        address: '22 Admiralty Way, Lekki Phase 1, Lagos',
        city: 'Lagos',
        state: 'Lagos',
        phone: '+2340234567891',
        email: 'info@igbokitchen.com',
        logo_url: '/images/restaurants/igbo-logo.jpg',
        cover_image_url: '/images/restaurants/igbo-cover.jpg',
        rating: 4.8,
        total_reviews: 156,
        is_active: true,
        is_open: true,
        opening_time: '10:00',
        closing_time: '22:00',
        minimum_order: 1500,
        delivery_fee: 500,
        preparation_time: 20,
        latitude: 6.4474, // Lekki Phase 1 coordinates
        longitude: 3.5562
      },
      {
        id: 'rest-4444',
        name: 'Spice Route Lagos',
        description: 'Contemporary Nigerian cuisine with international fusion',
        cuisine_type: 'Fusion',
        address: '5 Water Corporation Road, Victoria Island, Lagos',
        city: 'Lagos',
        state: 'Lagos',
        phone: '+2342234567890',
        email: 'info@spiceroute.com',
        logo_url: '/images/restaurants/spice-logo.jpg',
        cover_image_url: '/images/restaurants/spice-cover.jpg',
        rating: 4.6,
        total_reviews: 98,
        is_active: true,
        is_open: true,
        opening_time: '11:00',
        closing_time: '23:00',
        minimum_order: 3000,
        delivery_fee: 600,
        preparation_time: 30,
        latitude: 6.4290, // Victoria Island (different area)
        longitude: 3.4200
      }
    ]
    
    const { data: restaurantData, error: restaurantError } = await supabaseAdmin
      .from('restaurants')
      .insert(restaurantsWithCoords)
      .select()
    
    if (restaurantError) {
      throw new Error(`Failed to insert restaurants: ${restaurantError.message}`)
    }
    
    console.log(`✅ Inserted ${restaurantData?.length} restaurants`)
    
    // Insert menu items
    console.log('🍽️ Inserting menu items...')
    
    const menuItems = [
      // Mama Cass Kitchen menu
      { id: 'menu-1111', restaurant_id: 'rest-1111', name: 'Jollof Rice Special', description: 'Traditional Nigerian jollof rice with your choice of protein', category: 'Main Course', base_price: 3500, image_url: '/images/menu/jollof-rice.jpg', is_available: true, preparation_time: 25, dietary_tags: ['Gluten-Free'], spicy_level: 2 },
      { id: 'menu-1112', restaurant_id: 'rest-1111', name: 'Pepper Soup', description: 'Spicy traditional pepper soup with assorted meat', category: 'Soup', base_price: 4200, image_url: '/images/menu/pepper-soup.jpg', is_available: true, preparation_time: 30, dietary_tags: ['Gluten-Free', 'Dairy-Free'], spicy_level: 4 },
      { id: 'menu-1113', restaurant_id: 'rest-1111', name: 'Fried Rice & Chicken', description: 'Nigerian style fried rice with grilled chicken', category: 'Main Course', base_price: 4000, image_url: '/images/menu/fried-rice.jpg', is_available: true, preparation_time: 20, dietary_tags: ['Contains Soy'], spicy_level: 1 },
      
      // Northern Taste menu
      { id: 'menu-2221', restaurant_id: 'rest-2222', name: 'Tuwo Shinkafa', description: 'Rice pudding served with miyan kuka', category: 'Main Course', base_price: 3000, image_url: '/images/menu/tuwo.jpg', is_available: true, preparation_time: 35, dietary_tags: ['Gluten-Free'], spicy_level: 2 },
      { id: 'menu-2222', restaurant_id: 'rest-2222', name: 'Suya Platter', description: 'Grilled spiced meat skewers', category: 'Appetizer', base_price: 2500, image_url: '/images/menu/suya.jpg', is_available: true, preparation_time: 15, dietary_tags: ['High-Protein'], spicy_level: 3 },
      
      // Igbo Kitchen menu
      { id: 'menu-3331', restaurant_id: 'rest-3333', name: 'Ofe Nsala', description: 'White soup with assorted meat', category: 'Soup', base_price: 5000, image_url: '/images/menu/nsala.jpg', is_available: true, preparation_time: 40, dietary_tags: ['Gluten-Free'], spicy_level: 1 },
      { id: 'menu-3332', restaurant_id: 'rest-3333', name: 'Nkwobi', description: 'Spiced cow foot in palm oil sauce', category: 'Appetizer', base_price: 4500, image_url: '/images/menu/nkwobi.jpg', is_available: true, preparation_time: 25, dietary_tags: ['High-Protein'], spicy_level: 3 },
      
      // Spice Route menu
      { id: 'menu-4441', restaurant_id: 'rest-4444', name: 'Fusion Jollof Bowl', description: 'Modern take on traditional jollof with international ingredients', category: 'Main Course', base_price: 4500, image_url: '/images/menu/fusion-jollof.jpg', is_available: true, preparation_time: 25, dietary_tags: ['Gluten-Free'], spicy_level: 2 },
      { id: 'menu-4442', restaurant_id: 'rest-4444', name: 'Lagos Surf & Turf', description: 'Grilled prawns and beef with Nigerian spices', category: 'Main Course', base_price: 8500, image_url: '/images/menu/surf-turf.jpg', is_available: true, preparation_time: 35, dietary_tags: ['High-Protein'], spicy_level: 2 }
    ]
    
    const { data: menuData, error: menuError } = await supabaseAdmin
      .from('menu_items')
      .insert(menuItems)
      .select()
    
    if (menuError) {
      throw new Error(`Failed to insert menu items: ${menuError.message}`)
    }
    
    console.log(`✅ Inserted ${menuData?.length} menu items`)
    
    return NextResponse.json({
      success: true,
      message: 'Seed data populated successfully',
      details: {
        restaurants_inserted: restaurantData?.length || 0,
        menu_items_inserted: menuData?.length || 0,
        restaurants: restaurantData?.map(r => ({ 
          id: r.id, 
          name: r.name, 
          coordinates: { lat: r.latitude, lng: r.longitude } 
        }))
      }
    })

  } catch (error) {
    console.error('❌ Seed population failed:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Seed population failed',
      message: 'Failed to populate seed data'
    }, { status: 500 })
  }
}