// Cart service for managing cart persistence with database integration
import { supabase } from '@/lib/supabase-client'
import { devLog, prodLog } from '@/lib/logger'
import type { Database } from '@/lib/database.types'
import type { CartState, CartItem, Restaurant as CartRestaurant } from '@/store/slices/cartSlice'

type MenuItem = Database['public']['Tables']['menu_items']['Row']
type RestaurantDB = Database['public']['Tables']['restaurants']['Row']

const CART_STORAGE_KEY = 'foodnow_cart'

export interface CartServiceResult<T = unknown> {
  data: T | null
  error: string | null
}

// Local Storage Functions
export function saveCartToStorage(cartState: CartState): CartServiceResult<void> {
  try {
    if (typeof window === 'undefined') {
      return { data: null, error: 'Window is not available' }
    }

    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify({
      ...cartState,
      savedAt: new Date().toISOString()
    }))

    return { data: null, error: null }
  } catch (error) {
    prodLog.error('Failed to save cart to storage', error, { operation: 'saveCartToStorage', cartItemsCount: cartState.items.length })
    return { data: null, error: 'Failed to save cart to storage' }
  }
}

export function loadCartFromStorage(): CartServiceResult<CartState> {
  try {
    if (typeof window === 'undefined') {
      return { data: null, error: 'Window is not available' }
    }

    const savedCart = localStorage.getItem(CART_STORAGE_KEY)
    if (!savedCart) {
      return { data: null, error: null }
    }

    const parsedCart = JSON.parse(savedCart)
    const savedAtTime = new Date(parsedCart.savedAt)
    const now = new Date()
    
    // Cart expires after 24 hours
    if (now.getTime() - savedAtTime.getTime() > 24 * 60 * 60 * 1000) {
      clearCartFromStorage()
      return { data: null, error: 'Cart expired' }
    }

    // Remove the savedAt timestamp before returning
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { savedAt, ...cartState } = parsedCart
    return { data: cartState as CartState, error: null }
  } catch (error) {
    prodLog.error('Failed to load cart from storage', error, { operation: 'loadCartFromStorage' })
    clearCartFromStorage()
    return { data: null, error: 'Failed to load cart from storage' }
  }
}

export function clearCartFromStorage(): CartServiceResult<void> {
  try {
    if (typeof window === 'undefined') {
      return { data: null, error: 'Window is not available' }
    }

    localStorage.removeItem(CART_STORAGE_KEY)
    return { data: null, error: null }
  } catch (error) {
    prodLog.error('Failed to clear cart from storage', error, { operation: 'clearCartFromStorage' })
    return { data: null, error: 'Failed to clear cart from storage' }
  }
}

// Database Integration Functions
export async function getMenuItemById(itemId: string): Promise<CartServiceResult<MenuItem>> {
  try {
    // Check if this is a demo item (simple numeric ID) to avoid unnecessary database calls
    const isDemoItem = /^[1-9]\d*$/.test(itemId) && parseInt(itemId) < 20
    
    if (isDemoItem) {
      // For demo items, return null silently to use fallback logic
      return { data: null, error: 'Demo item - not in database' }
    }

    const { data, error } = await supabase
      .from('menu_items')
      .select('*')
      .eq('id', itemId)
      .single()

    if (error) {
      // Check if it's a "not found" error or table doesn't exist
      const errorMessage = error.message?.toLowerCase() || ''
      const isNotFound = error.code === 'PGRST116' || 
                        errorMessage.includes('not found') ||
                        errorMessage.includes('no rows')
      const isTableMissing = error.code === '42P01' || 
                            errorMessage.includes('relation') ||
                            errorMessage.includes('does not exist')
      const isUuidError = error.code === '22P02' || 
                         errorMessage.includes('invalid input syntax for type uuid') ||
                         errorMessage.includes('invalid uuid')
      
      if (isNotFound || isTableMissing || isUuidError) {
        // Don't log for expected missing items
        return { data: null, error: 'Menu item not found' }
      } else if (error.code === 'PGRST301') {
        // Connection error
        prodLog.warn('Database connection issue, using offline mode', { operation: 'getMenuItemById', itemId })
        return { data: null, error: 'Database offline' }
      } else {
        // Only log unexpected errors
        prodLog.error(`Database error fetching menu item ${itemId}`, error, { operation: 'getMenuItemById', itemId, errorCode: error.code })
        return { data: null, error: 'Failed to fetch menu item' }
      }
    }

    return { data, error: null }
  } catch (error) {
    prodLog.error('Error in getMenuItemById', error, { operation: 'getMenuItemById', itemId })
    return { data: null, error: 'Failed to fetch menu item' }
  }
}

export async function getRestaurantById(restaurantId: string): Promise<CartServiceResult<CartRestaurant>> {
  try {
    // Check if this is a demo restaurant (simple numeric ID) to avoid unnecessary database calls
    const isDemoRestaurant = /^[1-9]\d*$/.test(restaurantId) && parseInt(restaurantId) < 20
    
    if (isDemoRestaurant) {
      // For demo restaurants, return null silently to use fallback logic
      return { data: null, error: 'Demo restaurant - not in database' }
    }

    const { data, error } = await supabase
      .from('restaurants')
      .select('*')
      .eq('id', restaurantId)
      .single()

    if (error) {
      // Check if it's a "not found" error or table doesn't exist
      const errorMessage = error.message?.toLowerCase() || ''
      const isNotFound = error.code === 'PGRST116' || 
                        errorMessage.includes('not found') ||
                        errorMessage.includes('no rows')
      const isTableMissing = error.code === '42P01' || 
                            errorMessage.includes('relation') ||
                            errorMessage.includes('does not exist')
      const isUuidError = error.code === '22P02' || 
                         errorMessage.includes('invalid input syntax for type uuid') ||
                         errorMessage.includes('invalid uuid')
      
      if (isNotFound || isTableMissing || isUuidError) {
        // Don't log for expected missing restaurants
        return { data: null, error: 'Restaurant not found' }
      } else if (error.code === 'PGRST301') {
        // Connection error
        prodLog.warn('Database connection issue, using offline mode', { operation: 'getRestaurantById', restaurantId })
        return { data: null, error: 'Database offline' }
      } else {
        // Only log unexpected errors
        prodLog.error(`Database error fetching restaurant ${restaurantId}`, error, { operation: 'getRestaurantById', restaurantId, errorCode: error.code })
        return { data: null, error: 'Failed to fetch restaurant' }
      }
    }

    return { data, error: null }
  } catch (error) {
    prodLog.error('Error in getRestaurantById', error, { operation: 'getRestaurantById', restaurantId })
    return { data: null, error: 'Failed to fetch restaurant' }
  }
}

export async function validateCartItems(cartItems: CartItem[]): Promise<CartServiceResult<CartItem[]>> {
  try {
    const validatedItems: CartItem[] = []
    
    for (const cartItem of cartItems) {
      // Fetch current menu item data
      const menuItemResult = await getMenuItemById(cartItem.id)
      
      if (menuItemResult.error || !menuItemResult.data) {
        // For mock/demo items, keep the original cart item if database lookup fails
        // Only log for non-demo items to reduce console noise
        if (!/^[1-9]\d*$/.test(cartItem.id) || parseInt(cartItem.id) >= 20) {
          devLog.info(`Menu item not found in database, keeping as demo item`, { itemId: cartItem.id, itemName: cartItem.name })
        }
        validatedItems.push(cartItem)
        continue
      }

      const menuItem = menuItemResult.data
      
      // Check if item is still available
      if (!menuItem.is_available) {
        prodLog.warn('Menu item no longer available', { itemId: cartItem.id, itemName: cartItem.name, operation: 'validateCartItems' })
        continue
      }

      // Update price if it has changed
      const validatedItem: CartItem = {
        ...cartItem,
        price: menuItem.base_price,
        name: menuItem.name,
        image: menuItem.image_url || undefined
      }

      validatedItems.push(validatedItem)
    }

    return { data: validatedItems, error: null }
  } catch (error) {
    prodLog.error('Error validating cart items', error, { operation: 'validateCartItems', cartItemsCount: cartItems.length })
    return { data: null, error: 'Failed to validate cart items' }
  }
}

export async function validateRestaurant(restaurantId: string): Promise<CartServiceResult<CartRestaurant>> {
  try {
    const restaurantResult = await getRestaurantById(restaurantId)
    
    if (restaurantResult.error || !restaurantResult.data) {
      // For mock restaurants, return a default restaurant structure
      // Only log for non-demo restaurants to reduce console noise
      if (!/^[1-9]\d*$/.test(restaurantId) || parseInt(restaurantId) >= 20) {
        devLog.info('Restaurant not found in database, using default values', { restaurantId })
      }
      return { 
        data: {
          id: restaurantId,
          name: 'Restaurant',
          deliveryTime: '25 mins',
          deliveryFee: 500,
          minimumOrder: 2000
        }, 
        error: null 
      }
    }

    const restaurant = restaurantResult.data

    // For now, assume all restaurants are available (status field may not exist in current schema)
    // TODO: Add proper status checking when restaurant approval system is implemented

    // Convert to cart restaurant format
    const cartRestaurant: CartRestaurant = {
      id: restaurant.id,
      name: restaurant.name,
      deliveryTime: String((restaurant as any).delivery_time),
      deliveryFee: (restaurant as any).delivery_fee,
      minimumOrder: (restaurant as any).minimum_order,
      image: (restaurant as any).image_url || undefined,
      rating: restaurant.rating || undefined
    }

    return { data: cartRestaurant, error: null }
  } catch (error) {
    prodLog.error('Error validating restaurant', error, { operation: 'validateRestaurant', restaurantId })
    return { data: null, error: 'Failed to validate restaurant' }
  }
}

export async function validatePromoCode(promoCode: string, cartTotal: number): Promise<CartServiceResult<{
  code: string
  discount: number
  type: 'percentage' | 'fixed'
}>> {
  try {
    // For now, return some mock promo codes
    // In the future, this would query a promotions table
    const mockPromoCodes: Record<string, { discount: number; type: 'percentage' | 'fixed'; minOrder?: number }> = {
      'WELCOME10': { discount: 10, type: 'percentage', minOrder: 2000 },
      'SAVE500': { discount: 500, type: 'fixed', minOrder: 3000 },
      'FIRST20': { discount: 20, type: 'percentage', minOrder: 1500 }
    }

    const promo = mockPromoCodes[promoCode.toUpperCase()]
    
    if (!promo) {
      return { data: null, error: 'Invalid promo code' }
    }

    if (promo.minOrder && cartTotal < promo.minOrder) {
      return { 
        data: null, 
        error: `Minimum order of ₦${promo.minOrder.toLocaleString()} required for this promo code` 
      }
    }

    return {
      data: {
        code: promoCode.toUpperCase(),
        discount: promo.discount,
        type: promo.type
      },
      error: null
    }
  } catch (error) {
    prodLog.error('Error validating promo code', error, { operation: 'validatePromoCode', promoCode, cartTotal })
    return { data: null, error: 'Failed to validate promo code' }
  }
}

export async function syncCartWithDatabase(cartState: CartState): Promise<CartServiceResult<CartState>> {
  try {
    if (!cartState.restaurant || cartState.items.length === 0) {
      return { data: cartState, error: null }
    }

    // Validate restaurant
    const restaurantResult = await validateRestaurant(cartState.restaurant.id)
    if (restaurantResult.error) {
      return { data: null, error: restaurantResult.error }
    }

    // Validate cart items
    const itemsResult = await validateCartItems(cartState.items)
    if (itemsResult.error) {
      return { data: null, error: itemsResult.error }
    }

    // Create synced cart state
    const syncedCartState: CartState = {
      ...cartState,
      restaurant: restaurantResult.data!,
      items: itemsResult.data!
    }

    // Save synced cart to storage
    saveCartToStorage(syncedCartState)

    return { data: syncedCartState, error: null }
  } catch (error) {
    prodLog.error('Error syncing cart with database', error, { operation: 'syncCartWithDatabase', restaurantId: cartState.restaurant?.id, cartItemsCount: cartState.items.length })
    return { data: null, error: 'Failed to sync cart with database' }
  }
}

// Helper function to calculate cart totals
export function calculateCartTotals(cartState: CartState): {
  subtotal: number
  deliveryFee: number
  promoDiscount: number
  total: number
} {
  const subtotal = cartState.items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const deliveryFee = cartState.restaurant?.deliveryFee || 0
  
  let promoDiscount = 0
  if (cartState.promoCode && cartState.promoDiscount > 0) {
    // Assuming promoDiscount is stored as the actual discount amount
    promoDiscount = cartState.promoDiscount
  }

  const total = Math.max(0, subtotal + deliveryFee - promoDiscount)

  return {
    subtotal,
    deliveryFee,
    promoDiscount,
    total
  }
}

// Helper function to check minimum order requirements
export function checkMinimumOrder(cartState: CartState): {
  meetsMinimum: boolean
  shortfall: number
} {
  if (!cartState.restaurant) {
    return { meetsMinimum: false, shortfall: 0 }
  }

  const subtotal = cartState.items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const minimumOrder = cartState.restaurant.minimumOrder
  const shortfall = Math.max(0, minimumOrder - subtotal)

  return {
    meetsMinimum: subtotal >= minimumOrder,
    shortfall
  }
}