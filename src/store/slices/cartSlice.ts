import { createSlice, PayloadAction } from '@reduxjs/toolkit'

// Types
export interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
  restaurantId: string
  restaurantName: string
  customizations?: string[]
  image?: string
  notes?: string
}

export interface Restaurant {
  id: string
  name: string
  deliveryTime: string
  deliveryFee: number
  minimumOrder: number
  image?: string
  rating?: number
}

export interface CartState {
  items: CartItem[]
  restaurant: Restaurant | null
  isOpen: boolean
  deliveryAddress: string | null
  specialInstructions: string
  scheduledFor: string | null
  promoCode: string | null
  promoDiscount: number
}

const initialState: CartState = {
  items: [],
  restaurant: null,
  isOpen: false,
  deliveryAddress: null,
  specialInstructions: '',
  scheduledFor: null,
  promoCode: null,
  promoDiscount: 0,
}

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    // Add item to cart
    addItem: (state, action: PayloadAction<{ item: CartItem; restaurant: Restaurant }>) => {
      const { item, restaurant } = action.payload

      // If adding from different restaurant, clear cart
      if (state.restaurant && state.restaurant.id !== restaurant.id) {
        state.items = [item]
        state.restaurant = restaurant
        return
      }

      // Check if item exists (same id and customizations)
      const existingIndex = state.items.findIndex(
        (cartItem) =>
          cartItem.id === item.id &&
          JSON.stringify(cartItem.customizations) === JSON.stringify(item.customizations)
      )

      if (existingIndex >= 0) {
        // Update existing item quantity
        state.items[existingIndex].quantity += item.quantity
      } else {
        // Add new item
        state.items.push(item)
      }

      state.restaurant = restaurant
    },

    // Update item quantity
    updateQuantity: (state, action: PayloadAction<{ itemId: string; quantity: number; customizations?: string[] }>) => {
      const { itemId, quantity, customizations } = action.payload
      console.log('Redux updateQuantity action:', { itemId, quantity, customizations, currentItems: state.items.length })

      if (quantity <= 0) {
        // Remove item if quantity is 0
        console.log('Removing item due to zero quantity')
        state.items = state.items.filter(
          (item) =>
            !(item.id === itemId && 
              JSON.stringify(item.customizations) === JSON.stringify(customizations || []))
        )
      } else {
        // Update quantity
        const itemIndex = state.items.findIndex(
          (item) =>
            item.id === itemId &&
            JSON.stringify(item.customizations) === JSON.stringify(customizations || [])
        )
        
        console.log('Found item at index:', itemIndex)
        if (itemIndex >= 0) {
          console.log('Updating quantity from', state.items[itemIndex].quantity, 'to', quantity)
          state.items[itemIndex].quantity = quantity
        } else {
          console.log('Item not found for update')
        }
      }

      // Clear restaurant if no items
      if (state.items.length === 0) {
        state.restaurant = null
      }
    },

    // Remove item from cart
    removeItem: (state, action: PayloadAction<{ itemId: string; customizations?: string[] }>) => {
      const { itemId, customizations } = action.payload
      console.log('Redux removeItem action:', { itemId, customizations, currentItems: state.items.length })
      
      const beforeCount = state.items.length
      state.items = state.items.filter(
        (item) =>
          !(item.id === itemId && 
            JSON.stringify(item.customizations) === JSON.stringify(customizations || []))
      )
      const afterCount = state.items.length
      console.log('Items removed:', beforeCount - afterCount)

      // Clear restaurant if no items
      if (state.items.length === 0) {
        state.restaurant = null
      }
    },

    // Clear entire cart
    clearCart: (state) => {
      state.items = []
      state.restaurant = null
      state.specialInstructions = ''
      state.promoCode = null
      state.promoDiscount = 0
    },

    // Toggle cart visibility
    toggleCart: (state) => {
      state.isOpen = !state.isOpen
    },

    // Set cart visibility
    setCartOpen: (state, action: PayloadAction<boolean>) => {
      state.isOpen = action.payload
    },

    // Update delivery address
    setDeliveryAddress: (state, action: PayloadAction<string>) => {
      state.deliveryAddress = action.payload
    },

    // Update special instructions
    setSpecialInstructions: (state, action: PayloadAction<string>) => {
      state.specialInstructions = action.payload
    },

    // Set scheduled delivery time
    setScheduledFor: (state, action: PayloadAction<string | null>) => {
      state.scheduledFor = action.payload
    },

    // Apply promo code
    applyPromoCode: (state, action: PayloadAction<{ code: string; discount: number }>) => {
      state.promoCode = action.payload.code
      state.promoDiscount = action.payload.discount
    },

    // Remove promo code
    removePromoCode: (state) => {
      state.promoCode = null
      state.promoDiscount = 0
    },

    // Restore entire cart state (for guest-to-auth migration)
    restoreCart: (state, action: PayloadAction<CartState>) => {
      const restoredState = action.payload
      state.items = restoredState.items
      state.restaurant = restoredState.restaurant
      state.deliveryAddress = restoredState.deliveryAddress
      state.specialInstructions = restoredState.specialInstructions
      state.scheduledFor = restoredState.scheduledFor
      state.promoCode = restoredState.promoCode
      state.promoDiscount = restoredState.promoDiscount
      // Keep current isOpen state
    },

    // Add notes to specific item
    addItemNotes: (state, action: PayloadAction<{ itemId: string; notes: string; customizations?: string[] }>) => {
      const { itemId, notes, customizations } = action.payload
      
      const itemIndex = state.items.findIndex(
        (item) =>
          item.id === itemId &&
          JSON.stringify(item.customizations) === JSON.stringify(customizations || [])
      )
      
      if (itemIndex >= 0) {
        state.items[itemIndex].notes = notes
      }
    },
  },
})

export const {
  addItem,
  updateQuantity,
  removeItem,
  clearCart,
  toggleCart,
  setCartOpen,
  setDeliveryAddress,
  setSpecialInstructions,
  setScheduledFor,
  applyPromoCode,
  removePromoCode,
  restoreCart,
  addItemNotes,
} = cartSlice.actions

export default cartSlice.reducer