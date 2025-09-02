/**
 * ORDER SERVICE
 * =============
 * Service for creating and managing orders in Supabase
 */

import { typedSupabase as supabase } from '@/lib/supabase-client'
import { supabaseServerClient, serverClientInfo } from '@/lib/supabase-server'
import type { Database } from '@/lib/database.types'
import type { CartState } from '@/store/slices/cartSlice'
import type { OrderWithItems } from '@/types'
import { calculateCartTotals, checkMinimumOrder } from './cartService'
import { devLog, prodLog } from '@/lib/logger'

type Order = Database['public']['Tables']['orders']['Row']
type OrderItem = Database['public']['Tables']['order_items']['Row']

export interface OrderServiceResult<T = unknown> {
  data: T | null
  error: string | null
}

export interface CreateOrderData {
  userId: string
  cartState: CartState
  deliveryAddress: {
    street: string
    area: string
    city: string
    state: string
    postalCode?: string
    instructions?: string
  }
  paymentMethod: 'cash' | 'card' | 'transfer'
  specialInstructions?: string
  scheduledFor?: string
  // Add user data to avoid Supabase session dependency
  userData?: {
    id: string
    email: string
    firstName?: string
    lastName?: string
  }
}

// OrderWithItems interface moved to src/types/index.ts to avoid conflicts
// Import it from there: import { OrderWithItems } from '@/types'

/**
 * Create a new order from cart state
 */
export async function createOrder(orderData: CreateOrderData): Promise<OrderServiceResult<Order>> {
  devLog.info('Starting order creation process', {
    hasCartState: !!orderData.cartState,
    cartItemsCount: orderData.cartState.items.length,
    restaurantId: orderData.cartState.restaurant?.id,
    paymentMethod: orderData.paymentMethod,
    hasDeliveryAddress: !!orderData.deliveryAddress,
    deliveryAddressArea: orderData.deliveryAddress?.area
  })

  try {
    devLog.info('Order creation starting - checking authentication', {
      hasOrderData: !!orderData,
      cartItemsCount: orderData?.cartState?.items?.length || 0,
      hasUserDataPassed: !!orderData.userData
    })

    let user: any = null
    let authSource = 'unknown'
    
    // Try to use passed user data first (preferred method)
    if (orderData.userData) {
      devLog.info('Raw passed user data', {
        userData: orderData.userData,
        userDataType: typeof orderData.userData,
        userDataKeys: Object.keys(orderData.userData || {}),
        hasId: !!orderData.userData?.id,
        hasEmail: !!orderData.userData?.email,
        firstName: orderData.userData?.firstName,
        lastName: orderData.userData?.lastName
      })
      
      user = {
        id: orderData.userData.id,
        email: orderData.userData.email,
        user_metadata: {
          first_name: orderData.userData.firstName,
          last_name: orderData.userData.lastName
        }
      }
      authSource = 'passed_user_data'
      devLog.info('Using passed user data for authentication', { 
        userId: user?.id, 
        email: user.email,
        source: authSource 
      })
    } else {
      // Fallback to Supabase session
      const { data: { user: supabaseUser }, error: userError } = await supabase.auth.getUser()
      
      devLog.info('Supabase auth.getUser() result', {
        hasUser: !!supabaseUser,
        hasError: !!userError,
        errorMessage: userError?.message,
        userId: supabaseUser?.id,
        userEmail: supabaseUser?.email
      })
      
      if (userError || !supabaseUser) {
        prodLog.error('User authentication failed during order creation', userError, {
          errorCode: userError?.name,
          errorMessage: userError?.message,
          errorDetails: userError,
          authSource: 'supabase_session_fallback'
        })
        return { data: null, error: 'User not authenticated' }
      }
      
      user = supabaseUser
      authSource = 'supabase_session'
    }

    if (!user || !user.id || !user.email) {
      prodLog.error('Invalid user data for order creation', null, {
        hasUser: !!user,
        userId: user?.id,
        userEmail: user?.email,
        authSource
      })
      return { data: null, error: 'Invalid user authentication' }
    }

    devLog.info('User authenticated for order creation', { 
      userId: user.id, 
      email: user.email,
      authSource 
    })

    const { cartState, deliveryAddress, paymentMethod, specialInstructions, scheduledFor } = orderData

    // Validate cart is not empty
    if (!cartState.items.length || !cartState.restaurant) {
      return { data: null, error: 'Cart is empty' }
    }

    // Validate cart items have required fields
    const invalidCartItems = cartState.items.filter(item => 
      !item.id || !item.name || typeof item.price !== 'number' || item.price <= 0 || typeof item.quantity !== 'number' || item.quantity <= 0
    )
    
    if (invalidCartItems.length > 0) {
      prodLog.error('Invalid cart items found', null, {
        invalidItems: invalidCartItems.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity
        })),
        userId: user.id
      })
      return { data: null, error: 'Invalid items in cart' }
    }

    // Validate restaurant has required fields
    if (!cartState.restaurant.id || !cartState.restaurant.name) {
      prodLog.error('Invalid restaurant data in cart', null, {
        restaurant: {
          id: cartState.restaurant.id,
          name: cartState.restaurant.name
        },
        userId: user.id
      })
      return { data: null, error: 'Invalid restaurant selected' }
    }

    // Check minimum order
    devLog.info('Checking minimum order requirement', {
      restaurantMinimum: cartState.restaurant.minimumOrder,
      cartItemsCount: cartState.items.length
    })
    
    const { meetsMinimum, shortfall } = checkMinimumOrder(cartState)
    devLog.info('Minimum order check result', {
      meetsMinimum,
      shortfall,
      restaurantId: cartState.restaurant.id
    })
    
    if (!meetsMinimum) {
      prodLog.warn('Order below minimum threshold', {
        userId: user?.id,
        restaurantId: cartState.restaurant.id,
        minimumRequired: cartState.restaurant.minimumOrder,
        shortfall,
        currentTotal: cartState.items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
      })
      return { 
        data: null, 
        error: `Minimum order of ₦${cartState.restaurant.minimumOrder.toLocaleString()} not met. Add ₦${shortfall.toLocaleString()} more to your cart.` 
      }
    }

    // Calculate totals
    devLog.info('Calculating order totals', {
      itemsCount: cartState.items.length,
      restaurantDeliveryFee: cartState.restaurant.deliveryFee,
      promoCode: cartState.promoCode
    })
    
    const { subtotal, deliveryFee, promoDiscount, total } = calculateCartTotals(cartState)
    devLog.info('Order totals calculated', {
      subtotal,
      deliveryFee,
      promoDiscount,
      total,
      userId: user.id
    })

    // Prepare delivery info as JSON (matching database schema)
    const deliveryInfo = {
      street_address: deliveryAddress.street,
      area: deliveryAddress.area,
      city: deliveryAddress.city,
      state: deliveryAddress.state,
      postal_code: deliveryAddress.postalCode || null,
      delivery_instructions: deliveryAddress.instructions || null,
      coordinates: null // TODO: Add geocoding
    }

    // Try to save delivery address to separate table if it exists (for future reference)
    // but don't fail the order if the table doesn't exist
    try {
      await supabase
        .from('delivery_addresses')
        .insert({
          user_id: user.id,
          ...deliveryInfo,
          is_default: false
        } as any)
    } catch (addressError) {
      // Silently ignore if delivery addresses table doesn't exist
      prodLog.warn('Delivery addresses table not available - using embedded delivery info only', {
        userId: user?.id,
        deliveryAddress: deliveryAddress.area
      })
    }

    // Generate order number
    const orderNumber = `FN${Date.now()}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`
    devLog.info('Generated order number', { orderNumber, userId: user.id })

    // Prepare order data for insertion
    const orderInsertData = {
      order_number: orderNumber,
      user_id: user.id,
      restaurant_id: cartState.restaurant.id,
      delivery_info: deliveryInfo, // JSONB column accepts objects directly
      // delivery_address and promo_code fields removed - don't exist in database
      subtotal: subtotal || 0, // Ensure subtotal is never null
      delivery_fee: deliveryFee || 0,
      service_fee: 0, // Required field, set to 0 for now
      tax: 0, // Required field, set to 0 for now  
      discount: promoDiscount || 0,
      total: total || 0,
      status: 'pending',
      payment_method: 'card',
      payment_status: 'pending',
      special_instructions: specialInstructions || null,
      estimated_delivery_time: new Date(Date.now() + 45 * 60000).toISOString(), // 45 minutes from now
      // promo_code field removed - doesn't exist in database
      tracking_updates: [] // Must be array, not stringified
    }

    devLog.info('Prepared order data for database insertion', {
      orderNumber,
      userId: user.id,
      restaurantId: cartState.restaurant.id,
      total,
      deliveryArea: deliveryInfo.area,
      paymentMethod,
      status: orderInsertData.status,
      dataKeys: Object.keys(orderInsertData)
    })

    // Comprehensive database verification
    devLog.info('Starting database verification', { 
      orderNumber,
      userId: user.id,
      authSource 
    })
    
    try {
      // Test orders table access
      const { data: ordersTest, error: ordersError } = await supabaseServerClient
        .from('orders')
        .select('id')
        .limit(1)
      
      devLog.info('Orders table test result', {
        hasData: !!ordersTest,
        hasError: !!ordersError,
        errorMessage: ordersError?.message,
        errorCode: ordersError?.code
      })
      
      if (ordersError) {
        prodLog.error('Orders table access failed', ordersError, {
          userId: user?.id,
          orderNumber,
          testType: 'orders_table_access',
          errorCode: ordersError.code,
          errorMessage: ordersError.message,
          errorDetails: ordersError.details
        })
        
        if (ordersError.code === '42P01') {
          return { data: null, error: 'Orders table does not exist in database' }
        } else if (ordersError.code === '42501') {
          return { data: null, error: 'Insufficient permissions to access orders table' }
        } else {
          return { data: null, error: `Database error: ${ordersError.message}` }
        }
      }
      
      // Test order_items table access
      const { data: itemsTest, error: itemsError } = await supabaseServerClient
        .from('order_items')
        .select('id')
        .limit(1)
      
      devLog.info('Order_items table test result', {
        hasData: !!itemsTest,
        hasError: !!itemsError,
        errorMessage: itemsError?.message,
        errorCode: itemsError?.code
      })
      
      if (itemsError) {
        prodLog.error('Order_items table access failed', itemsError, {
          userId: user?.id,
          orderNumber,
          testType: 'order_items_table_access',
          errorCode: itemsError.code,
          errorMessage: itemsError.message
        })
        
        if (itemsError.code === '42P01') {
          return { data: null, error: 'Order_items table does not exist in database' }
        } else if (itemsError.code === '42501') {
          return { data: null, error: 'Insufficient permissions to access order_items table' }
        }
        // Continue anyway - order_items might be created later
      }
      
      devLog.info('Database verification passed', { 
        ordersTableOk: !ordersError,
        orderItemsTableOk: !itemsError
      })
      
    } catch (dbError) {
      prodLog.error('Database verification exception', dbError, {
        userId: user?.id,
        orderNumber,
        testType: 'database_verification_exception'
      })
      return { data: null, error: 'Database connection failed' }
    }

    // Create the order using server client (may be service role or anon key)
    devLog.info('Attempting database insertion', { 
      orderNumber, 
      userId: user.id,
      clientType: serverClientInfo.keyType,
      hasRLSBypass: serverClientInfo.hasRLSBypass
    })
    
    const { data: order, error: orderError } = await supabaseServerClient
      .from('orders')
      .insert(orderInsertData as any)
      .select()
      .single()
    
    devLog.info('Database insertion completed', {
      orderNumber,
      success: !orderError,
      hasData: !!order,
      errorPresent: !!orderError
    })

    if (orderError) {
      // Detailed error analysis and logging
      const errorMessage = orderError.message?.toLowerCase() || ''
      const isSchemaError = orderError.code === '42P01' || 
                           errorMessage.includes('relation') ||
                           errorMessage.includes('does not exist') ||
                           errorMessage.includes('table') && errorMessage.includes('schema cache') ||
                           errorMessage.includes('could not find')
      
      const isConstraintError = orderError.code === '23505' || // Unique constraint violation
                               orderError.code === '23503' || // Foreign key constraint violation
                               orderError.code === '23502'    // Not null constraint violation
      
      const isPermissionError = orderError.code === '42501' || // Insufficient privilege
                               errorMessage.includes('permission denied') ||
                               errorMessage.includes('access denied')
      
      prodLog.error('Order database insertion failed', {
        fullError: orderError,
        errorString: String(orderError),
        errorJSON: JSON.stringify(orderError, null, 2),
        errorCode: orderError?.code,
        errorMessage: orderError?.message,
        errorDetails: orderError?.details,
        errorHint: orderError?.hint,
        errorName: orderError?.name
      }, {
        userId: user?.id,
        restaurantId: cartState.restaurant.id,
        orderNumber,
        total,
        paymentMethod,
        authSource,
        isSchemaError,
        isConstraintError,
        isPermissionError
      })
      
      if (isSchemaError) {
        return { data: null, error: 'Orders table schema mismatch - database migration needed' }
      } else if (isPermissionError) {
        return { data: null, error: 'Database permission denied - insufficient privileges' }
      } else if (isConstraintError) {
        return { data: null, error: 'Data validation error - invalid order data' }
      } else {
        return { data: null, error: `Order creation failed: ${orderError.message}` }
      }
    }

    // Validate cart items before creating order items
    const invalidOrderItems = cartState.items.filter(item => 
      !item.id || 
      !item.price || 
      typeof item.price !== 'number' ||
      !item.quantity || 
      typeof item.quantity !== 'number' ||
      item.quantity <= 0
    )

    if (invalidOrderItems.length > 0) {
      console.error('❌ INVALID CART ITEMS FOUND:', invalidOrderItems)
      return { data: null, error: 'Invalid cart items detected' }
    }

    // Create order items - match database schema exactly
    const orderItems = cartState.items.map(item => ({
      order_id: (order as any).id,
      menu_item_id: item.id,
      quantity: item.quantity,
      unit_price: item.price, // Unit price per item
      total_price: item.price * item.quantity, // Total price for this item
      customizations: item.customizations || null,
      notes: item.notes || null // Database uses 'notes' field
    }))

    devLog.info('Creating order items', {
      itemsCount: orderItems.length,
      orderId: (order as any).id,
      totalValue: orderItems.reduce((sum, item) => sum + item.total_price, 0),
      cartItems: cartState.items.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        hasCustomizations: !!item.customizations,
        hasNotes: !!item.notes
      }))
    })

    // Log order items creation attempt
    devLog.info('Preparing order items for insertion', {
      itemCount: orderItems.length,
      totalValue: orderItems.reduce((sum, item) => sum + item.total_price, 0),
      clientType: serverClientInfo.keyType,
      hasRLSBypass: serverClientInfo.hasRLSBypass
    })

    const { error: itemsError } = await supabaseServerClient
      .from('order_items')
      .insert(orderItems as any)

    if (itemsError) {
      prodLog.error('Error creating order items', {
        fullError: itemsError,
        errorCode: itemsError?.code,
        errorMessage: itemsError?.message,
        errorDetails: itemsError?.details,
        errorHint: itemsError?.hint
      }, {
        orderId: (order as any).id,
        userId: user?.id,
        restaurantId: cartState.restaurant.id,
        itemCount: cartState.items.length,
        orderItems: orderItems.map(item => ({
          menu_item_id: item.menu_item_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.total_price
        }))
      })
      
      // Check if it's a constraint violation, missing table, or RLS issue
      const isConstraintError = itemsError.code === '23503' || itemsError.message?.includes('violates foreign key constraint')
      const isSchemaError = itemsError.code === '42P01' || itemsError.message?.includes('relation') || itemsError.message?.includes('does not exist')
      const isRLSError = itemsError.code === '42501' || itemsError.message?.includes('row-level security')
      
      if (isRLSError && !serverClientInfo.hasRLSBypass) {
        // RLS policy blocking insertion with anon key
        prodLog.error('RLS policy blocking order items insertion - service role key required', itemsError, {
          orderId: (order as any).id,
          userId: user?.id,
          clientType: serverClientInfo.keyType,
          hasRLSBypass: serverClientInfo.hasRLSBypass
        })
        // TODO: Rollback order creation
        return { data: null, error: 'Order creation requires admin privileges. Please contact support.' }
      } else if (isConstraintError) {
        // TODO: Rollback order creation
        return { data: null, error: 'Invalid menu items selected' }
      } else if (isSchemaError) {
        return { data: null, error: 'Order system temporarily unavailable' }
      } else {
        // TODO: Rollback order creation
        return { data: null, error: 'Failed to add items to order' }
      }
    }

    devLog.info('Order created successfully', {
      orderId: (order as any).id,
      orderNumber: (order as any).order_number,
      restaurantId: cartState.restaurant.id,
      total,
      itemCount: cartState.items.length
    })

    // Schedule auto-accept for this new order
    scheduleAutoAccept((order as any).id)
    
    devLog.info('Auto-accept scheduled for order', {
      orderId: (order as any).id,
      autoAcceptIn: '30 seconds'
    })

    return { data: order, error: null }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorStack = error instanceof Error ? error.stack : 'No stack trace'
    
    prodLog.error('Unexpected error creating order', error, {
      userId: orderData.userId || 'unknown',
      restaurantId: orderData.cartState?.restaurant?.id || 'missing',
      cartItemsCount: orderData.cartState?.items?.length || 0,
      paymentMethod: orderData.paymentMethod || 'missing',
      deliveryArea: orderData.deliveryAddress?.area || 'missing',
      errorMessage,
      errorType: typeof error,
      errorConstructor: error?.constructor?.name,
      functionStep: 'order_creation_exception'
    })
    
    devLog.error('Order creation exception details', {
      errorMessage,
      errorStack: errorStack?.substring(0, 500), // Limit stack trace length
      hasCartState: !!orderData.cartState,
      hasRestaurant: !!orderData.cartState?.restaurant,
      hasItems: !!orderData.cartState?.items?.length,
      hasDeliveryAddress: !!orderData.deliveryAddress
    })
    
    return { 
      data: null, 
      error: 'An unexpected error occurred while creating your order. Please try again.' 
    }
  }
}

/**
 * Get order by ID
 */
export async function getOrderById(orderId: string): Promise<OrderServiceResult<OrderWithItems>> {
  try {
    // Get order with related data (excluding delivery_addresses since we use delivery_info JSON)
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          *,
          menu_items (*)
        ),
        restaurants (*)
      `)
      .eq('id', orderId)
      .single()

    if (orderError) {
      prodLog.error('Error fetching order by ID', orderError, {
        orderId,
        errorMessage: orderError.message
      })
      return { data: null, error: 'Order not found' }
    }

    return { 
      data: {
        ...order,
        order_items: order.order_items || [],
        restaurant: order.restaurants,
        delivery_address: order.delivery_info // Use delivery_info JSON instead of joined table
      } as any, 
      error: null 
    }
  } catch (error) {
    prodLog.error('Unexpected error fetching order', error, {
      orderId
    })
    return { data: null, error: 'Failed to fetch order' }
  }
}

/**
 * Get user's order history
 */
export async function getUserOrders(
  userId?: string,
  limit: number = 10,
  offset: number = 0
): Promise<OrderServiceResult<Order[]>> {
  try {
    let query = supabase
      .from('orders')
      .select(`
        *,
        restaurants (name, image_url, cuisine_types),
        order_items (count)
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // If userId provided, filter by user
    if (userId) {
      query = query.eq('user_id', userId)
    } else {
      // Get current user's orders
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        return { data: null, error: 'User not authenticated' }
      }
      query = query.eq('user_id', user.id)
    }

    const { data, error } = await query

    if (error) {
      prodLog.error('Error fetching user orders', error, {
        userId,
        limit,
        offset,
        errorMessage: error.message
      })
      return { data: null, error: 'Failed to fetch orders' }
    }

    return { data: data || [], error: null }
  } catch (error) {
    prodLog.error('Unexpected error fetching user orders', error, {
      userId,
      limit,
      offset
    })
    return { data: null, error: 'Failed to fetch order history' }
  }
}

/**
 * Track order status in real-time
 */
export function subscribeToOrderUpdates(
  orderId: string,
  callback: (order: Order) => void
) {
  const subscription = supabase
    .channel(`order-${orderId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'orders',
        filter: `id=eq.${orderId}`
      },
      (payload: any) => {
        callback(payload.new as Order)
      }
    )
    .subscribe()

  // Return unsubscribe function
  return () => {
    subscription.unsubscribe()
  }
}

/**
 * Cancel an order
 */
export async function cancelOrder(orderId: string, reason?: string): Promise<OrderServiceResult<Order>> {
  let userId: string | undefined = undefined
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return { data: null, error: 'User not authenticated' }
    }
    userId = user.id

    // Check if order belongs to user and is cancellable
    const { data: existingOrder, error: fetchError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !existingOrder) {
      return { data: null, error: 'Order not found' }
    }

    // Can only cancel pending or confirmed orders
    if (!['pending', 'confirmed'].includes(existingOrder.status)) {
      return { data: null, error: `Cannot cancel order with status: ${existingOrder.status}` }
    }

    // Update order status
    const { data, error } = await supabase
      .from('orders')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        cancellation_reason: reason || 'Customer cancelled'
      } as any)
      .eq('id', orderId)
      .select()
      .single()

    if (error) {
      prodLog.error('Error cancelling order', error, {
        orderId,
        userId: user?.id,
        reason,
        originalStatus: existingOrder.status,
        errorMessage: error.message
      })
      return { data: null, error: 'Failed to cancel order' }
    }

    prodLog.info('Order cancelled successfully', {
      orderId,
      userId: user.id,
      reason,
      originalStatus: existingOrder.status
    })

    return { data, error: null }
  } catch (error) {
    prodLog.error('Unexpected error cancelling order', error, {
      orderId,
      userId,
      reason
    })
    return { data: null, error: 'Failed to cancel order' }
  }
}

/**
 * Rate an order
 */
export async function rateOrder(
  orderId: string,
  rating: number,
  review?: string
): Promise<OrderServiceResult<boolean>> {
  let userId: string | undefined = undefined
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return { data: null, error: 'User not authenticated' }
    }
    userId = user.id

    // Get order to verify it belongs to user and get restaurant_id
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('restaurant_id, user_id, status')
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      return { data: null, error: 'Order not found' }
    }

    if (order.user_id !== user.id) {
      return { data: null, error: 'Unauthorized' }
    }

    if (order.status !== 'delivered') {
      return { data: null, error: 'Can only rate delivered orders' }
    }

    // Create review
    const { error: reviewError } = await supabase
      .from('reviews')
      .insert({
        user_id: user.id,
        restaurant_id: order.restaurant_id,
        order_id: orderId,
        rating,
        comment: review || null,
        is_verified_purchase: true
      } as any)

    if (reviewError) {
      prodLog.error('Error creating review', reviewError, {
        orderId,
        userId: user?.id,
        restaurantId: order.restaurant_id,
        rating,
        errorMessage: reviewError.message
      })
      return { data: null, error: 'Failed to submit review' }
    }

    // Update order to mark as reviewed
    await supabase
      .from('orders')
      .update({ is_reviewed: true } as any)
      .eq('id', orderId)

    devLog.info('Order review submitted successfully', {
      orderId,
      userId: user.id,
      restaurantId: order.restaurant_id,
      rating
    })

    return { data: true, error: null }
  } catch (error) {
    prodLog.error('Unexpected error rating order', error, {
      orderId,
      userId,
      rating
    })
    return { data: null, error: 'Failed to submit rating' }
  }
}

/**
 * RESTAURANT ORDER MANAGEMENT
 * ===========================
 */

/**
 * Get orders for a specific restaurant
 */
export async function getRestaurantOrders(
  restaurantId: string,
  status?: string,
  limit: number = 20,
  offset: number = 0
): Promise<OrderServiceResult<OrderWithItems[]>> {
  try {
    let query = supabase
      .from('orders')
      .select(`
        *,
        order_items (
          *,
          menu_items (name, image_url)
        ),
        users!inner(first_name, last_name, phone)
      `)
      .eq('restaurant_id', restaurantId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (status) {
      query = query.eq('status', status)
    }

    const { data, error } = await query

    if (error) {
      prodLog.error('Error fetching restaurant orders', error, {
        restaurantId,
        status,
        limit,
        offset
      })
      return { data: null, error: 'Failed to fetch orders' }
    }

    return { data: data || [], error: null }
  } catch (error) {
    prodLog.error('Unexpected error fetching restaurant orders', error, {
      restaurantId,
      status
    })
    return { data: null, error: 'Failed to fetch restaurant orders' }
  }
}

/**
 * Update order status (restaurant action)
 */
export async function updateOrderStatus(
  orderId: string,
  newStatus: 'confirmed' | 'preparing' | 'ready' | 'cancelled',
  restaurantId?: string,
  rejectionReason?: string
): Promise<OrderServiceResult<Order>> {
  try {
    const updates: any = {
      status: newStatus,
      updated_at: new Date().toISOString()
    }

    // Add status-specific updates
    switch (newStatus) {
      case 'confirmed':
        updates.confirmed_at = new Date().toISOString()
        break
      case 'preparing':
        updates.started_preparing_at = new Date().toISOString()
        break
      case 'ready':
        updates.ready_at = new Date().toISOString()
        break
      case 'cancelled':
        updates.cancelled_at = new Date().toISOString()
        if (rejectionReason) {
          updates.cancellation_reason = rejectionReason
        }
        break
    }

    // Add tracking update
    const trackingUpdate = {
      status: newStatus,
      timestamp: new Date().toISOString(),
      message: newStatus === 'cancelled' 
        ? `Order cancelled: ${rejectionReason || 'Restaurant unavailable'}`
        : `Order ${newStatus}`,
      location: 'restaurant'
    }

    // First get current tracking updates
    const { data: currentOrder } = await supabase
      .from('orders')
      .select('tracking_updates')
      .eq('id', orderId)
      .single()

    const currentTracking = (currentOrder?.tracking_updates as any[]) || []
    updates.tracking_updates = [...currentTracking, trackingUpdate]

    let query = supabase
      .from('orders')
      .update(updates)
      .eq('id', orderId)

    // If restaurant ID provided, verify restaurant owns this order
    if (restaurantId) {
      query = query.eq('restaurant_id', restaurantId)
    }

    const { data, error } = await query.select().single()

    if (error) {
      prodLog.error('Error updating order status', error, {
        orderId,
        newStatus,
        restaurantId,
        rejectionReason
      })
      return { data: null, error: 'Failed to update order status' }
    }

    devLog.info('Order status updated successfully', {
      orderId,
      newStatus,
      restaurantId
    })

    return { data, error: null }
  } catch (error) {
    prodLog.error('Unexpected error updating order status', error, {
      orderId,
      newStatus,
      restaurantId
    })
    return { data: null, error: 'Failed to update order status' }
  }
}

/**
 * Auto-accept order after 30 seconds if not responded
 */
export async function scheduleAutoAccept(orderId: string): Promise<void> {
  setTimeout(async () => {
    try {
      // Check if order is still pending
      const { data: order } = await supabase
        .from('orders')
        .select('status')
        .eq('id', orderId)
        .single()

      if (order && order.status === 'pending') {
        // Auto-confirm the order
        await updateOrderStatus(orderId, 'confirmed')
        
        devLog.info('Order auto-confirmed after 30 seconds', { orderId })
        
        // Add auto-accept tracking update
        const { data: currentOrder } = await supabase
          .from('orders')
          .select('tracking_updates')
          .eq('id', orderId)
          .single()

        const currentTracking = (currentOrder?.tracking_updates as any[]) || []
        const autoAcceptUpdate = {
          status: 'confirmed',
          timestamp: new Date().toISOString(),
          message: 'Order auto-confirmed (restaurant did not respond within 30 seconds)',
          location: 'system'
        }

        await supabase
          .from('orders')
          .update({
            tracking_updates: [...currentTracking, autoAcceptUpdate]
          })
          .eq('id', orderId)
      }
    } catch (error) {
      prodLog.error('Error in auto-accept process', error, { orderId })
    }
  }, 30000) // 30 seconds
}

/**
 * Subscribe to restaurant orders in real-time
 */
export function subscribeToRestaurantOrders(
  restaurantId: string,
  callback: (order: Order) => void
) {
  const subscription = supabase
    .channel(`restaurant-orders-${restaurantId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'orders',
        filter: `restaurant_id=eq.${restaurantId}`
      },
      (payload: any) => {
        devLog.info('New order received for restaurant', {
          restaurantId,
          orderId: payload.new.id
        })
        callback(payload.new as Order)
        
        // Schedule auto-accept for new orders
        scheduleAutoAccept(payload.new.id)
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'orders',
        filter: `restaurant_id=eq.${restaurantId}`
      },
      (payload: any) => {
        callback(payload.new as Order)
      }
    )
    .subscribe()

  return () => {
    subscription.unsubscribe()
  }
}

/**
 * Get pending orders count for restaurant
 */
export async function getPendingOrdersCount(restaurantId: string): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .eq('restaurant_id', restaurantId)
      .eq('status', 'pending')

    if (error) {
      prodLog.error('Error counting pending orders', error, { restaurantId })
      return 0
    }

    return count || 0
  } catch (error) {
    prodLog.error('Unexpected error counting pending orders', error, { restaurantId })
    return 0
  }
}

/**
 * Get estimated delivery time
 */
export function getEstimatedDeliveryTime(restaurantDeliveryTime: string): Date {
  // Parse restaurant delivery time (e.g., "30-45 mins")
  const match = restaurantDeliveryTime.match(/(\d+)/)
  const baseTime = match ? parseInt(match[1]) : 30
  
  // Add buffer time for order preparation
  const totalMinutes = baseTime + 15
  
  return new Date(Date.now() + totalMinutes * 60000)
}

/**
 * Format order status for display
 */
export function formatOrderStatus(status: string): {
  label: string
  color: string
  icon: string
} {
  const statusMap: Record<string, { label: string; color: string; icon: string }> = {
    pending: { label: 'Order Placed', color: 'orange', icon: '📝' },
    confirmed: { label: 'Confirmed', color: 'blue', icon: '✅' },
    preparing: { label: 'Preparing', color: 'yellow', icon: '👨‍🍳' },
    ready: { label: 'Ready for Pickup', color: 'green', icon: '📦' },
    out_for_delivery: { label: 'Out for Delivery', color: 'purple', icon: '🏍️' },
    delivered: { label: 'Delivered', color: 'green', icon: '✔️' },
    cancelled: { label: 'Cancelled', color: 'red', icon: '❌' },
    refunded: { label: 'Refunded', color: 'gray', icon: '💰' }
  }

  return statusMap[status] || { label: status, color: 'gray', icon: '❓' }
}