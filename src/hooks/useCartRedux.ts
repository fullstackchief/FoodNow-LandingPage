import { useCallback } from 'react'
import { useAppDispatch, useAppSelector } from '@/store'
import {
  addItem as addItemAction,
  removeItem as removeItemAction,
  updateQuantity as updateQuantityAction,
  clearCart as clearCartAction,
  toggleCart as toggleCartAction,
  setCartOpen as setCartOpenAction,
  type CartItem,
  type Restaurant,
} from '@/store/slices/cartSlice'

// Redux-compatible cart hook that maintains the same API as the Context version
export function useCartRedux() {
  const dispatch = useAppDispatch()
  const cartState = useAppSelector((state) => state.cart)

  // Helper functions that match the Context API
  const addItem = useCallback((
    item: Omit<CartItem, 'quantity'> & { quantity?: number }, 
    restaurant: Restaurant
  ) => {
    const cartItem: CartItem = { ...item, quantity: item.quantity || 1 }
    dispatch(addItemAction({ item: cartItem, restaurant }))
  }, [dispatch])

  const removeItem = useCallback((itemId: string, customizations?: string[]) => {
    dispatch(removeItemAction({ itemId, customizations }))
  }, [dispatch])

  const updateQuantity = useCallback((itemId: string, quantity: number, customizations?: string[]) => {
    dispatch(updateQuantityAction({ itemId, quantity, customizations }))
  }, [dispatch])

  const clearCart = useCallback(() => {
    dispatch(clearCartAction())
  }, [dispatch])

  const toggleCart = useCallback(() => {
    dispatch(toggleCartAction())
  }, [dispatch])

  const setCartOpen = useCallback((isOpen: boolean) => {
    dispatch(setCartOpenAction(isOpen))
  }, [dispatch])

  // Calculate totals
  const getCartTotal = useCallback(() => {
    return cartState.items.reduce((total, item) => total + (item.price * item.quantity), 0)
  }, [cartState.items])

  const getCartItemCount = useCallback(() => {
    return cartState.items.reduce((total, item) => total + item.quantity, 0)
  }, [cartState.items])

  const getItemQuantity = useCallback((itemId: string, customizations?: string[]) => {
    const item = cartState.items.find(item => 
      item.id === itemId && 
      JSON.stringify(item.customizations) === JSON.stringify(customizations || [])
    )
    return item ? item.quantity : 0
  }, [cartState.items])

  return {
    // State (matches Context API)
    state: cartState,
    
    // Actions
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    toggleCart,
    setCartOpen,
    
    // Helper functions
    getCartTotal,
    getCartItemCount,
    getItemQuantity,
    
    // Direct state access (for easier migration)
    items: cartState.items,
    restaurant: cartState.restaurant,
    isOpen: cartState.isOpen,
    deliveryAddress: cartState.deliveryAddress,
    specialInstructions: cartState.specialInstructions,
    scheduledFor: cartState.scheduledFor,
    promoCode: cartState.promoCode,
    promoDiscount: cartState.promoDiscount,
  }
}