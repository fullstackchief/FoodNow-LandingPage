/**
 * UNIFIED CART HOOK
 * =================
 * Handles cart functionality for both guest and authenticated users
 * Seamlessly switches between localStorage (guest) and Redux + Supabase (auth)
 */

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useCartRedux } from '@/hooks/useCartRedux'
import { 
  saveGuestCart, 
  loadGuestCart, 
  clearGuestCart as clearGuestCartStorage,
  migrateGuestCartToAuth,
  createEmptyGuestCart,
  getGuestCartItemCount,
  getGuestCartTotal,
  getGuestItemQuantity,
  hasGuestCart
} from '@/lib/guestCartService'
import type { CartState, CartItem } from '@/store/slices/cartSlice'

export interface UnifiedCartResult {
  // Cart state
  cartState: CartState
  isGuestCart: boolean
  itemCount: number
  total: number
  hasItems: boolean
  isCartOpen: boolean

  // Cart actions
  addItem: (item: Omit<CartItem, 'quantity'> & { quantity?: number }, restaurant: any) => void
  updateQuantity: (itemId: string, quantity: number) => void
  removeItem: (itemId: string) => void
  getItemQuantity: (itemId: string, customizations?: string[]) => number
  clearCart: () => void
  applyPromoCode: (code: string) => void
  removePromoCode: () => void
  toggleCart: () => void
  setCartOpen: (isOpen: boolean) => void

  // Guest-specific
  migrateToAuth: () => Promise<void>
  
  // Loading states
  isLoading: boolean
  error: string | null
}

export function useUnifiedCartLogic(): UnifiedCartResult {
  const { isAuthenticated } = useAuth()
  
  // Always call hooks in consistent order
  const authenticatedCart = useCartRedux()
  
  const [guestCartState, setGuestCartState] = useState<CartState>(createEmptyGuestCart())
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasMigrated, setHasMigrated] = useState(false)
  
  // Cart visibility state (unified for both guest and auth)
  const [guestCartOpen, setGuestCartOpen] = useState(false)

  // Determine if we're using guest cart
  const isGuestCart = !isAuthenticated

  // Get current cart state
  const cartState = isGuestCart ? guestCartState : authenticatedCart.state

  // Initialize guest cart on mount (client-side only to prevent hydration issues)
  const [isClient, setIsClient] = useState(false)
  
  useEffect(() => {
    setIsClient(true)
  }, [])
  
  useEffect(() => {
    if (isClient && isGuestCart) {
      const { data: savedCart } = loadGuestCart()
      if (savedCart) {
        setGuestCartState(savedCart)
      }
    }
  }, [isClient, isGuestCart])

  // Define migrateCart function BEFORE useEffect to avoid hoisting issues
  const migrateCart = useCallback(async () => {
    // Add comprehensive safety guards to prevent initialization race conditions
    if (!isAuthenticated || hasMigrated || !authenticatedCart.state) {
      console.log('🚫 Cart migration skipped', { 
        isAuthenticated, 
        hasMigrated, 
        hasAuthCart: !!authenticatedCart.state 
      })
      return
    }

    console.log('🚀 Starting cart migration...')
    setIsLoading(true)
    setError(null)

    try {
      const { data: guestCart } = loadGuestCart()
      if (!guestCart) {
        console.log('📭 No guest cart found during migration')
        setHasMigrated(true)
        return
      }

      console.log('📦 Guest cart loaded', { 
        items: guestCart.items.length, 
        restaurant: guestCart.restaurant?.name 
      })
      console.log('🏪 Auth cart state', { 
        items: authenticatedCart?.state?.items?.length || 0, 
        restaurant: authenticatedCart?.state?.restaurant?.name || 'None',
        hasAuthCart: !!authenticatedCart,
        hasAuthState: !!authenticatedCart?.state
      })

      // Ensure authenticated cart state exists before migration
      if (!authenticatedCart || !authenticatedCart.state) {
        console.error('❌ Authenticated cart state is missing - cannot migrate')
        setError('Cart system error - please refresh the page')
        clearGuestCart()
        setHasMigrated(true)
        return
      }

      const { data: mergedCart, error: migrationError } = await migrateGuestCartToAuth(
        guestCart,
        authenticatedCart.state
      )

      if (migrationError) {
        console.error('❌ Cart migration error:', migrationError)
        setError(migrationError)
        
        // Fallback: Keep the authenticated cart and clear guest cart
        console.log('🔄 Using fallback: keeping authenticated cart')
        clearGuestCart()
      } else if (mergedCart) {
        console.log('✅ Cart migration successful', { 
          mergedItems: mergedCart.items.length,
          restaurant: mergedCart.restaurant?.name
        })
        // Update authenticated cart with merged data
        authenticatedCart.restoreCart(mergedCart)
        // Clear guest cart after successful migration
        clearGuestCart()
      }

      setHasMigrated(true)
    } catch (error) {
      console.error('💥 Cart migration failed:', error)
      setError('Failed to merge your cart items')
      
      // Fallback: Clear guest cart to avoid persistent errors
      try {
        clearGuestCart()
        console.log('🔄 Cleared guest cart after migration failure')
      } catch (clearError) {
        console.error('Failed to clear guest cart:', clearError)
      }
    } finally {
      setIsLoading(false)
    }
  }, [isAuthenticated, hasMigrated, authenticatedCart?.state]) // Use specific property to avoid reference issues

  // Migrate guest cart when user logs in
  useEffect(() => {
    if (isAuthenticated && !hasMigrated && hasGuestCart() && authenticatedCart.state) {
      console.log('🔄 Triggering cart migration - guest cart detected')
      migrateCart()
    }
  }, [isAuthenticated, hasMigrated, authenticatedCart.state, migrateCart]) // Add authenticatedCart safety check

  // Cart actions for guest users
  const addGuestItem = useCallback((item: Omit<CartItem, 'quantity'> & { quantity?: number }, restaurant: any) => {
    setGuestCartState(currentCart => {
      const cartItem: CartItem = { ...item, quantity: item.quantity || 1 }
      
      // If adding item from different restaurant, replace cart
      if (currentCart.restaurant && currentCart.restaurant.id !== cartItem.restaurantId) {
        const newCart: CartState = {
          items: [cartItem],
          restaurant: restaurant || {
            id: cartItem.restaurantId,
            name: cartItem.restaurantName || 'Restaurant',
            deliveryTime: '30-40 min',
            deliveryFee: 0,
            minimumOrder: 0
          },
          isOpen: false,
          deliveryAddress: null,
          specialInstructions: '',
          scheduledFor: null,
          promoCode: null,
          promoDiscount: 0
        }
        saveGuestCart(newCart)
        return newCart
      }

      // Check if item already exists
      const existingIndex = currentCart.items.findIndex(
        existingItem => existingItem.id === cartItem.id && 
        JSON.stringify(existingItem.customizations) === JSON.stringify(cartItem.customizations)
      )

      let updatedItems: CartItem[]
      if (existingIndex >= 0) {
        // Update existing item quantity
        updatedItems = currentCart.items.map((existingItem, index) => 
          index === existingIndex 
            ? { ...existingItem, quantity: existingItem.quantity + cartItem.quantity }
            : existingItem
        )
      } else {
        // Add new item
        updatedItems = [...currentCart.items, cartItem]
      }

      const updatedCart: CartState = {
        ...currentCart,
        items: updatedItems,
        restaurant: currentCart.restaurant || restaurant || {
          id: cartItem.restaurantId,
          name: cartItem.restaurantName || 'Restaurant',
          deliveryTime: '30-40 min',
          deliveryFee: 0,
          minimumOrder: 0
        }
      }

      saveGuestCart(updatedCart)
      return updatedCart
    })
  }, [])

  const updateGuestQuantity = useCallback((itemId: string, quantity: number) => {
    setGuestCartState(currentCart => {
      let updatedItems: CartItem[]
      
      if (quantity <= 0) {
        // Remove item if quantity is 0 or negative
        updatedItems = currentCart.items.filter(item => item.id !== itemId)
      } else {
        // Update quantity
        updatedItems = currentCart.items.map(item => 
          item.id === itemId ? { ...item, quantity } : item
        )
      }

      const updatedCart: CartState = {
        ...currentCart,
        items: updatedItems,
        restaurant: updatedItems.length > 0 ? currentCart.restaurant : null
      }

      saveGuestCart(updatedCart)
      return updatedCart
    })
  }, [])

  const removeGuestItem = useCallback((itemId: string) => {
    updateGuestQuantity(itemId, 0)
  }, [updateGuestQuantity])

  const clearGuestCart = useCallback(() => {
    const emptyCart = createEmptyGuestCart()
    setGuestCartState(emptyCart)
    clearGuestCartStorage()
  }, [])

  const applyGuestPromoCode = useCallback((code: string) => {
    // For guest users, we'll just store the promo code
    // Validation will happen at checkout
    setGuestCartState(currentCart => {
      const updatedCart: CartState = {
        ...currentCart,
        promoCode: code,
        promoDiscount: 0 // Will be calculated at checkout
      }

      saveGuestCart(updatedCart)
      return updatedCart
    })
  }, [])

  const removeGuestPromoCode = useCallback(() => {
    setGuestCartState(currentCart => {
      const updatedCart: CartState = {
        ...currentCart,
        promoCode: null,
        promoDiscount: 0
      }

      saveGuestCart(updatedCart)
      return updatedCart
    })
  }, [])

  // Unified cart actions
  const addItem = useCallback((item: Omit<CartItem, 'quantity'> & { quantity?: number }, restaurant: any) => {
    if (isGuestCart) {
      addGuestItem(item, restaurant)
    } else {
      authenticatedCart.addItem(item, restaurant)
    }
  }, [isGuestCart, addGuestItem, authenticatedCart])

  const updateQuantity = useCallback((itemId: string, quantity: number) => {
    if (isGuestCart) {
      updateGuestQuantity(itemId, quantity)
    } else {
      authenticatedCart.updateQuantity(itemId, quantity)
    }
  }, [isGuestCart, updateGuestQuantity, authenticatedCart])

  const removeItem = useCallback((itemId: string) => {
    if (isGuestCart) {
      removeGuestItem(itemId)
    } else {
      authenticatedCart.removeItem(itemId)
    }
  }, [isGuestCart, removeGuestItem, authenticatedCart])

  const clearCart = useCallback(() => {
    if (isGuestCart) {
      clearGuestCart()
    } else {
      authenticatedCart.clearCart()
    }
  }, [isGuestCart, clearGuestCart, authenticatedCart])

  const applyPromoCode = useCallback((code: string) => {
    if (isGuestCart) {
      applyGuestPromoCode(code)
    } else {
      // TODO: Implement promo code for authenticated cart
      console.warn('Promo code not implemented for authenticated cart')
    }
  }, [isGuestCart, applyGuestPromoCode])

  const removePromoCode = useCallback(() => {
    if (isGuestCart) {
      removeGuestPromoCode()
    } else {
      // TODO: Implement promo code removal for authenticated cart
      console.warn('Promo code removal not implemented for authenticated cart')
    }
  }, [isGuestCart, removeGuestPromoCode])

  // Calculate totals
  const getTotal = useCallback(() => {
    if (isGuestCart) {
      return getGuestCartTotal()
    } else {
      return authenticatedCart.getCartTotal()
    }
  }, [isGuestCart, authenticatedCart])

  const getItemCount = useCallback(() => {
    if (isGuestCart) {
      return getGuestCartItemCount()
    } else {
      return cartState.items.reduce((total, item) => total + item.quantity, 0)
    }
  }, [isGuestCart, cartState.items])

  const getItemQuantity = useCallback((itemId: string, customizations?: string[]) => {
    if (isGuestCart) {
      return getGuestItemQuantity(itemId, customizations)
    } else {
      return authenticatedCart.getItemQuantity(itemId, customizations)
    }
  }, [isGuestCart, authenticatedCart])

  // Cart visibility functions
  const toggleCart = useCallback(() => {
    if (isGuestCart) {
      setGuestCartOpen(prev => !prev)
    } else {
      authenticatedCart.toggleCart()
    }
  }, [isGuestCart, authenticatedCart])

  const setCartOpen = useCallback((isOpen: boolean) => {
    if (isGuestCart) {
      setGuestCartOpen(isOpen)
    } else {
      authenticatedCart.setCartOpen(isOpen)
    }
  }, [isGuestCart, authenticatedCart])

  // Get current cart open state
  const currentCartOpenState = isGuestCart ? guestCartOpen : authenticatedCart.state.isOpen

  const itemCount = getItemCount()
  const total = getTotal()
  const hasItems = itemCount > 0

  return {
    cartState,
    isGuestCart,
    itemCount,
    total,
    hasItems,
    isCartOpen: currentCartOpenState,
    addItem,
    updateQuantity,
    removeItem,
    getItemQuantity,
    clearCart,
    applyPromoCode,
    removePromoCode,
    toggleCart,
    setCartOpen,
    migrateToAuth: migrateCart,
    isLoading,
    error
  }
}

// Export with both names for compatibility
// This ensures the hook works regardless of import path
export const useUnifiedCart = useUnifiedCartLogic

// Note: useUnifiedCart is now available from @/contexts/UnifiedCartContext
// Components should import directly from the context to avoid circular dependencies