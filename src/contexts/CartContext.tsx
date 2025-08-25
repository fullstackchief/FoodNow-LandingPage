'use client'

import { createContext, useContext, useReducer, ReactNode } from 'react'

// Types
interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
  restaurantId: string
  restaurantName: string
  customizations?: string[]
  image?: string
}

interface Restaurant {
  id: string
  name: string
  deliveryTime: string
  deliveryFee: number
  minimumOrder: number
}

interface CartState {
  items: CartItem[]
  restaurant: Restaurant | null
  isOpen: boolean
}

type CartAction =
  | { type: 'ADD_ITEM'; payload: { item: CartItem; restaurant: Restaurant } }
  | { type: 'REMOVE_ITEM'; payload: { itemId: string } }
  | { type: 'UPDATE_QUANTITY'; payload: { itemId: string; quantity: number } }
  | { type: 'CLEAR_CART' }
  | { type: 'TOGGLE_CART' }
  | { type: 'SET_CART_OPEN'; payload: { isOpen: boolean } }

// Initial state
const initialState: CartState = {
  items: [],
  restaurant: null,
  isOpen: false
}

// Reducer
function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD_ITEM': {
      const { item, restaurant } = action.payload
      
      // If adding item from different restaurant, clear cart first
      if (state.restaurant && state.restaurant.id !== restaurant.id) {
        return {
          ...state,
          items: [item],
          restaurant
        }
      }
      
      // Check if item already exists
      const existingItemIndex = state.items.findIndex(
        cartItem => cartItem.id === item.id && 
        JSON.stringify(cartItem.customizations) === JSON.stringify(item.customizations)
      )
      
      if (existingItemIndex >= 0) {
        // Update quantity of existing item
        const updatedItems = [...state.items]
        updatedItems[existingItemIndex].quantity += item.quantity
        return {
          ...state,
          items: updatedItems,
          restaurant
        }
      } else {
        // Add new item
        return {
          ...state,
          items: [...state.items, item],
          restaurant
        }
      }
    }
    
    case 'REMOVE_ITEM': {
      const updatedItems = state.items.filter(item => item.id !== action.payload.itemId)
      return {
        ...state,
        items: updatedItems,
        restaurant: updatedItems.length === 0 ? null : state.restaurant
      }
    }
    
    case 'UPDATE_QUANTITY': {
      const { itemId, quantity } = action.payload
      
      if (quantity <= 0) {
        // Remove item if quantity is 0 or negative
        const updatedItems = state.items.filter(item => item.id !== itemId)
        return {
          ...state,
          items: updatedItems,
          restaurant: updatedItems.length === 0 ? null : state.restaurant
        }
      }
      
      const updatedItems = state.items.map(item =>
        item.id === itemId ? { ...item, quantity } : item
      )
      
      return {
        ...state,
        items: updatedItems
      }
    }
    
    case 'CLEAR_CART':
      return initialState
    
    case 'TOGGLE_CART':
      return {
        ...state,
        isOpen: !state.isOpen
      }
    
    case 'SET_CART_OPEN':
      return {
        ...state,
        isOpen: action.payload.isOpen
      }
    
    default:
      return state
  }
}

// Context
const CartContext = createContext<{
  state: CartState
  dispatch: React.Dispatch<CartAction>
  // Helper functions
  addItem: (item: Omit<CartItem, 'quantity'> & { quantity?: number }, restaurant: Restaurant) => void
  removeItem: (itemId: string) => void
  updateQuantity: (itemId: string, quantity: number) => void
  clearCart: () => void
  toggleCart: () => void
  setCartOpen: (isOpen: boolean) => void
  getCartTotal: () => number
  getCartItemCount: () => number
  getItemQuantity: (itemId: string) => number
} | null>(null)

// Provider component
export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, initialState)
  
  const addItem = (item: Omit<CartItem, 'quantity'> & { quantity?: number }, restaurant: Restaurant) => {
    dispatch({
      type: 'ADD_ITEM',
      payload: {
        item: { ...item, quantity: item.quantity || 1 },
        restaurant
      }
    })
  }
  
  const removeItem = (itemId: string) => {
    dispatch({ type: 'REMOVE_ITEM', payload: { itemId } })
  }
  
  const updateQuantity = (itemId: string, quantity: number) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { itemId, quantity } })
  }
  
  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' })
  }
  
  const toggleCart = () => {
    dispatch({ type: 'TOGGLE_CART' })
  }
  
  const setCartOpen = (isOpen: boolean) => {
    dispatch({ type: 'SET_CART_OPEN', payload: { isOpen } })
  }
  
  const getCartTotal = () => {
    return state.items.reduce((total, item) => total + (item.price * item.quantity), 0)
  }
  
  const getCartItemCount = () => {
    return state.items.reduce((total, item) => total + item.quantity, 0)
  }
  
  const getItemQuantity = (itemId: string) => {
    const item = state.items.find(item => item.id === itemId)
    return item ? item.quantity : 0
  }
  
  const value = {
    state,
    dispatch,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    toggleCart,
    setCartOpen,
    getCartTotal,
    getCartItemCount,
    getItemQuantity
  }
  
  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  )
}

// Custom hook to use cart context
export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}