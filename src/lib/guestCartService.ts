/**
 * GUEST CART SERVICE
 * ==================
 * Handles cart functionality for unauthenticated users using localStorage
 * Supports seamless migration to authenticated cart when user logs in
 */

import type { CartState, CartItem } from '@/store/slices/cartSlice'

const GUEST_CART_KEY = 'foodnow_guest_cart'
const CART_EXPIRY_HOURS = 24

export interface GuestCartData extends CartState {
  savedAt: string
  isGuest: true
}

export interface GuestCartResult<T = unknown> {
  data: T | null
  error: string | null
}

/**
 * Save guest cart to localStorage
 */
export function saveGuestCart(cartState: CartState): GuestCartResult<void> {
  try {
    if (typeof window === 'undefined') {
      return { data: null, error: 'Window not available' }
    }

    const guestCart: GuestCartData = {
      ...cartState,
      savedAt: new Date().toISOString(),
      isGuest: true
    }

    localStorage.setItem(GUEST_CART_KEY, JSON.stringify(guestCart))
    return { data: null, error: null }
  } catch (error) {
    console.error('Failed to save guest cart:', error)
    return { data: null, error: 'Failed to save cart' }
  }
}

/**
 * Load guest cart from localStorage
 */
export function loadGuestCart(): GuestCartResult<CartState> {
  try {
    if (typeof window === 'undefined') {
      return { data: null, error: 'Window not available' }
    }

    const savedCart = localStorage.getItem(GUEST_CART_KEY)
    if (!savedCart) {
      return { data: null, error: null }
    }

    const guestCart: GuestCartData = JSON.parse(savedCart)
    
    // Check if cart has expired
    const cartSavedAt = new Date(guestCart.savedAt)
    const now = new Date()
    const hoursElapsed = (now.getTime() - cartSavedAt.getTime()) / (1000 * 60 * 60)
    
    if (hoursElapsed > CART_EXPIRY_HOURS) {
      clearGuestCart()
      return { data: null, error: 'Cart expired' }
    }

    // Remove guest-specific fields and return as CartState
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { savedAt, isGuest, ...cartState } = guestCart
    return { data: cartState, error: null }
  } catch (error) {
    console.error('Failed to load guest cart:', error)
    clearGuestCart()
    return { data: null, error: 'Failed to load cart' }
  }
}

/**
 * Clear guest cart from localStorage
 */
export function clearGuestCart(): GuestCartResult<void> {
  try {
    if (typeof window === 'undefined') {
      return { data: null, error: 'Window not available' }
    }

    localStorage.removeItem(GUEST_CART_KEY)
    return { data: null, error: null }
  } catch (error) {
    console.error('Failed to clear guest cart:', error)
    return { data: null, error: 'Failed to clear cart' }
  }
}

/**
 * Check if there's a guest cart available
 */
export function hasGuestCart(): boolean {
  if (typeof window === 'undefined') return false
  
  const savedCart = localStorage.getItem(GUEST_CART_KEY)
  if (!savedCart) return false

  try {
    const guestCart: GuestCartData = JSON.parse(savedCart)
    
    // Check expiry
    const savedAt = new Date(guestCart.savedAt)
    const now = new Date()
    const hoursElapsed = (now.getTime() - savedAt.getTime()) / (1000 * 60 * 60)
    
    if (hoursElapsed > CART_EXPIRY_HOURS) {
      clearGuestCart()
      return false
    }

    return guestCart.items.length > 0
  } catch {
    clearGuestCart()
    return false
  }
}

/**
 * Get quantity of specific item in guest cart
 */
export function getGuestItemQuantity(itemId: string, customizations?: string[]): number {
  const { data: guestCart } = loadGuestCart()
  if (!guestCart) return 0

  const item = guestCart.items.find(item => 
    item.id === itemId && 
    JSON.stringify(item.customizations) === JSON.stringify(customizations || [])
  )
  
  return item ? item.quantity : 0
}

/**
 * Get guest cart item count
 */
export function getGuestCartItemCount(): number {
  const { data: cart } = loadGuestCart()
  if (!cart) return 0

  return cart.items.reduce((total, item) => total + item.quantity, 0)
}

/**
 * Get guest cart total
 */
export function getGuestCartTotal(): number {
  const { data: cart } = loadGuestCart()
  if (!cart) return 0

  const subtotal = cart.items.reduce((total, item) => total + (item.price * item.quantity), 0)
  const deliveryFee = cart.restaurant?.deliveryFee || 0
  const promoDiscount = cart.promoDiscount || 0

  return Math.max(0, subtotal + deliveryFee - promoDiscount)
}

/**
 * Migrate guest cart to authenticated cart
 * This function should be called after user logs in
 */
export async function migrateGuestCartToAuth(
  guestCart: CartState,
  authCartState: CartState
): Promise<GuestCartResult<CartState>> {
  try {
    // If authenticated user has no cart, use guest cart
    if (!authCartState.items.length) {
      clearGuestCart()
      return { data: guestCart, error: null }
    }

    // If guest cart is empty, keep auth cart
    if (!guestCart.items.length) {
      clearGuestCart()
      return { data: authCartState, error: null }
    }

    // Both carts have items - need to merge intelligently
    
    // Case 1: Same restaurant - merge items
    if (guestCart.restaurant?.id === authCartState.restaurant?.id) {
      const mergedItems: CartItem[] = [...authCartState.items]
      
      guestCart.items.forEach(guestItem => {
        const existingIndex = mergedItems.findIndex(
          authItem => {
            if (authItem.id !== guestItem.id) return false
            
            // Support customization matching
            if (guestItem.customizations && authItem.customizations) {
              return JSON.stringify(authItem.customizations) === JSON.stringify(guestItem.customizations)
            }
            
            // Both have no customizations
            return !authItem.customizations && !guestItem.customizations
          }
        )
        
        if (existingIndex >= 0) {
          // Item exists, add quantities - create new immutable object
          mergedItems[existingIndex] = {
            ...mergedItems[existingIndex],
            quantity: mergedItems[existingIndex].quantity + guestItem.quantity
          }
        } else {
          // New item, add to cart - create new object to avoid mutation issues
          mergedItems.push({ ...guestItem })
        }
      })

      const mergedCart: CartState = {
        ...authCartState,
        items: mergedItems,
        promoCode: guestCart.promoCode || authCartState.promoCode,
        promoDiscount: guestCart.promoDiscount || authCartState.promoDiscount
      }

      clearGuestCart()
      return { data: mergedCart, error: null }
    }

    // Case 2: Different restaurants - prefer guest cart (more recent)
    clearGuestCart()
    return { 
      data: guestCart, 
      error: 'Switched to cart from your browsing session'
    }
  } catch (error) {
    console.error('Failed to migrate guest cart:', error)
    return { data: authCartState, error: 'Failed to merge carts' }
  }
}

/**
 * Create empty guest cart state
 */
export function createEmptyGuestCart(): CartState {
  return {
    items: [],
    restaurant: null,
    isOpen: false,
    deliveryAddress: null,
    specialInstructions: '',
    scheduledFor: null,
    promoCode: null,
    promoDiscount: 0
  }
}

/**
 * Check if cart needs restaurant validation
 * (for guest carts, we'll validate when they try to checkout)
 */
export function guestCartNeedsValidation(cartState: CartState): boolean {
  if (!cartState.restaurant || cartState.items.length === 0) {
    return false
  }

  // Guest carts always need validation before checkout
  // since we can't validate in real-time without auth
  return true
}

/**
 * Get cart summary for display
 */
export function getGuestCartSummary(): {
  itemCount: number
  total: number
  hasItems: boolean
} {
  const itemCount = getGuestCartItemCount()
  const total = getGuestCartTotal()
  
  return {
    itemCount,
    total,
    hasItems: itemCount > 0
  }
}