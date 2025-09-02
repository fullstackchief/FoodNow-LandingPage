// Cart persistence utilities for maintaining cart during authentication flow

import { CartState } from '@/store/slices/cartSlice'
import { devLog, prodLog } from '@/lib/logger'

const CART_STORAGE_KEY = 'foodnow_auth_cart_backup'

export function saveCartForAuth(cartState: CartState) {
  if (typeof window === 'undefined') return
  
  try {
    // Only save if cart has items
    if (cartState.items.length > 0) {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify({
        ...cartState,
        savedAt: new Date().toISOString()
      }))
    }
  } catch (error) {
    prodLog.error('Failed to save cart for auth', error, { 
      operation: 'saveCartForAuth',
      cartItemsCount: cartState.items.length 
    })
  }
}

export function getAuthCart(): CartState | null {
  if (typeof window === 'undefined') return null
  
  try {
    const savedCart = localStorage.getItem(CART_STORAGE_KEY)
    if (!savedCart) return null
    
    const parsedCart = JSON.parse(savedCart)
    const savedAtTime = new Date(parsedCart.savedAt)
    const now = new Date()
    
    // Cart backup expires after 1 hour
    if (now.getTime() - savedAtTime.getTime() > 60 * 60 * 1000) {
      clearAuthCart()
      return null
    }
    
    // Remove the savedAt timestamp before returning
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { savedAt: _savedAt, ...cartState } = parsedCart
    return cartState as CartState
  } catch (error) {
    prodLog.error('Failed to restore cart from auth', error, {
      operation: 'getAuthCart'
    })
    clearAuthCart()
    return null
  }
}

export function clearAuthCart() {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.removeItem(CART_STORAGE_KEY)
  } catch (error) {
    prodLog.error('Failed to clear auth cart', error, {
      operation: 'clearAuthCart'
    })
  }
}

export function hasAuthCart(): boolean {
  return getAuthCart() !== null
}