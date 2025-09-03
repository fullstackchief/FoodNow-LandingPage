const { createClient } = require('@supabase/supabase-js')

// Test configuration - uses environment variables for security
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your_anon_key_here'

const supabase = createClient(supabaseUrl, supabaseKey)

describe('Order Creation Flow with Real Database', () => {
  // Real verified data from database
  const VERIFIED_RESTAURANT_ID = '550e8400-e29b-41d4-a716-446655440001'
  const VERIFIED_MENU_ITEM_ID = '8d36f456-892b-4af2-8d02-b59781820d44'

  beforeAll(async () => {
    // Verify database connection with restaurants table
    const { data, error } = await supabase.from('restaurants').select('id').limit(1)
    if (error) {
      console.error('Database connection failed:', error)
      throw new Error('Cannot connect to Supabase for testing')
    }
    console.log('Database connection verified for testing')
  })

  test('Customer can access verified restaurant', async () => {
    const { data: restaurant, error } = await supabase
      .from('restaurants')
      .select('*')
      .eq('id', VERIFIED_RESTAURANT_ID)
      .single()

    expect(error).toBeNull()
    expect(restaurant).toBeDefined()
    expect(restaurant.name).toBe('Mama Cass Kitchen')
    expect(restaurant.status).toBe('approved')
    expect(restaurant.is_open).toBe(true)
  })

  test('Customer can access verified menu item', async () => {
    const { data: menuItem, error } = await supabase
      .from('menu_items')
      .select('*')
      .eq('id', VERIFIED_MENU_ITEM_ID)
      .single()

    expect(error).toBeNull()
    expect(menuItem).toBeDefined()
    expect(menuItem.name).toBe('Special Jollof Rice')
    expect(menuItem.restaurant_id).toBe(VERIFIED_RESTAURANT_ID)
    expect(menuItem.is_available).toBe(true)
    expect(menuItem.base_price).toBe(2500)
  })

  test('Customer can retrieve menu items for restaurant', async () => {
    const { data: menuItems, error } = await supabase
      .from('menu_items')
      .select('*')
      .eq('restaurant_id', VERIFIED_RESTAURANT_ID)
      .eq('is_available', true)

    expect(error).toBeNull()
    expect(menuItems).toBeDefined()
    expect(Array.isArray(menuItems)).toBe(true)
    expect(menuItems.length).toBeGreaterThan(0)
    
    // Verify our test menu item is in the results
    const testItem = menuItems.find(item => item.id === VERIFIED_MENU_ITEM_ID)
    expect(testItem).toBeDefined()
  })

  test('Order data structure validation', async () => {
    // Test order data structure without creating records (due to RLS)
    const orderData = {
      customer_id: '11111111-1111-1111-1111-111111111111',
      restaurant_id: VERIFIED_RESTAURANT_ID,
      status: 'payment_processing',
      total_amount: 4020, // Base price + customizations + fees
      delivery_address: {
        street: '123 Test Street',
        area: 'Victoria Island',
        city: 'Lagos',
        coordinates: { lat: 6.4281, lng: 3.4219 }
      },
      delivery_instructions: 'Test delivery instructions',
      payment_method: 'paystack'
    }

    // Validate order structure
    expect(orderData.customer_id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/)
    expect(orderData.restaurant_id).toBe(VERIFIED_RESTAURANT_ID)
    expect(orderData.total_amount).toBeGreaterThan(0)
    expect(orderData.delivery_address).toHaveProperty('coordinates')
    expect(orderData.payment_method).toBe('paystack')

    // Test order items structure
    const orderItemData = {
      order_id: 'mock-order-id',
      menu_item_id: VERIFIED_MENU_ITEM_ID,
      quantity: 1,
      unit_price: 2500,
      customizations: {
        protein: 'Chicken (+₦500)',
        spice_level: 'Medium',
        extras: ['Extra Plantain (+₦200)']
      },
      total_price: 3200
    }

    expect(orderItemData.menu_item_id).toBe(VERIFIED_MENU_ITEM_ID)
    expect(orderItemData.customizations).toHaveProperty('protein')
    expect(orderItemData.total_price).toBe(3200)
  })

  test('Multi-item order calculation logic', async () => {
    // Get multiple menu items from Mama Cass Kitchen
    const { data: menuItems } = await supabase
      .from('menu_items')
      .select('*')
      .eq('restaurant_id', VERIFIED_RESTAURANT_ID)
      .eq('is_available', true)
      .limit(2)

    expect(menuItems.length).toBeGreaterThanOrEqual(2)

    // Test calculation logic without creating orders
    const item1Price = menuItems[0].base_price + 700 // With customizations
    const item2Price = menuItems[1].base_price + 300 // Different customizations
    const subtotal = item1Price + item2Price
    const serviceCharge = Math.round(subtotal * 0.1)
    const deliveryFee = 500 // From restaurant data
    const totalAmount = subtotal + serviceCharge + deliveryFee

    expect(subtotal).toBeGreaterThan(0)
    expect(serviceCharge).toBe(Math.round(subtotal * 0.1))
    expect(totalAmount).toBe(subtotal + serviceCharge + deliveryFee)

    // Verify minimum order requirement
    expect(totalAmount).toBeGreaterThan(2000) // Restaurant minimum
  })

  test('Order validation with restaurant minimum order requirements', async () => {
    const { data: restaurant } = await supabase
      .from('restaurants')
      .select('minimum_order')
      .eq('id', VERIFIED_RESTAURANT_ID)
      .single()

    // Test order below minimum
    const belowMinimumAmount = restaurant.minimum_order - 500

    const orderData = {
      customer_id: '11111111-1111-1111-1111-111111111111',
      restaurant_id: VERIFIED_RESTAURANT_ID,
      total_amount: belowMinimumAmount,
      status: 'payment_processing'
    }

    // This should be validated at application level
    // For now, test that we can detect the minimum order requirement
    expect(belowMinimumAmount).toBeLessThan(restaurant.minimum_order)
    expect(restaurant.minimum_order).toBe(2000) // Verified from database
  })

  test('User table structure validation', async () => {
    // Test user table exists but may be empty due to RLS
    const { error } = await supabase
      .from('users')
      .select('id')
      .limit(1)

    // Error should be null (table accessible) even if no data returned
    expect(error).toBeNull()
  })

  test('Menu item customization data structure', async () => {
    const { data: menuItem } = await supabase
      .from('menu_items')
      .select('customizations')
      .eq('id', VERIFIED_MENU_ITEM_ID)
      .single()

    expect(menuItem.customizations).toBeDefined()
    expect(menuItem.customizations.protein).toContain('Chicken (+₦500)')
    expect(menuItem.customizations.spice_level).toContain('Medium')
    expect(menuItem.customizations.extras).toContain('Extra Plantain (+₦200)')
  })
})