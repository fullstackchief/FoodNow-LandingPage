import { createSlice, PayloadAction } from '@reduxjs/toolkit'

// Types
export interface Address {
  id: string
  label: string // 'Home', 'Work', 'Other'
  address: string
  coordinates: {
    lat: number
    lng: number
  }
  instructions?: string
  isDefault: boolean
}

export interface PaymentMethod {
  id: string
  type: 'card' | 'bank' | 'wallet'
  last4?: string
  brand?: string
  expiryMonth?: string
  expiryYear?: string
  isDefault: boolean
  name: string
}

export interface UserPreferences {
  notifications: {
    orderUpdates: boolean
    promotions: boolean
    newRestaurants: boolean
    email: boolean
    sms: boolean
    push: boolean
  }
  dietary: string[] // ['vegetarian', 'halal', 'gluten-free', etc.]
  cuisine: string[] // preferred cuisines
  spiceLevel: 'mild' | 'medium' | 'hot' | 'extra-hot'
  allergens: string[]
}

export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  phone: string
  avatar?: string
  dateOfBirth?: string
  gender?: 'male' | 'female' | 'other'
  loyaltyPoints: number
  tier: 'bronze' | 'silver' | 'gold' | 'platinum'
  totalOrders: number
  joinedAt: string
  preferences: UserPreferences
}

export interface UserState {
  user: User | null
  isAuthenticated: boolean
  addresses: Address[]
  paymentMethods: PaymentMethod[]
  favorites: string[] // restaurant IDs
  recentOrders: string[] // order IDs
  isLoading: boolean
  error: string | null
}

const initialState: UserState = {
  user: null,
  isAuthenticated: false,
  addresses: [],
  paymentMethods: [],
  favorites: [],
  recentOrders: [],
  isLoading: false,
  error: null,
}

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    // Authentication
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload
      state.isAuthenticated = true
      state.error = null
    },

    clearUser: (state) => {
      state.user = null
      state.isAuthenticated = false
      state.addresses = []
      state.paymentMethods = []
      state.favorites = []
      state.recentOrders = []
    },

    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload }
      }
    },

    // Addresses
    addAddress: (state, action: PayloadAction<Address>) => {
      // If this is set as default, remove default from others
      if (action.payload.isDefault) {
        state.addresses.forEach((addr) => {
          addr.isDefault = false
        })
      }
      state.addresses.push(action.payload)
    },

    updateAddress: (state, action: PayloadAction<{ id: string; updates: Partial<Address> }>) => {
      const { id, updates } = action.payload
      const addressIndex = state.addresses.findIndex((addr) => addr.id === id)
      
      if (addressIndex >= 0) {
        // If setting as default, remove default from others
        if (updates.isDefault) {
          state.addresses.forEach((addr) => {
            addr.isDefault = false
          })
        }
        state.addresses[addressIndex] = { ...state.addresses[addressIndex], ...updates }
      }
    },

    removeAddress: (state, action: PayloadAction<string>) => {
      state.addresses = state.addresses.filter((addr) => addr.id !== action.payload)
    },

    setDefaultAddress: (state, action: PayloadAction<string>) => {
      state.addresses.forEach((addr) => {
        addr.isDefault = addr.id === action.payload
      })
    },

    // Payment Methods
    addPaymentMethod: (state, action: PayloadAction<PaymentMethod>) => {
      // If this is set as default, remove default from others
      if (action.payload.isDefault) {
        state.paymentMethods.forEach((method) => {
          method.isDefault = false
        })
      }
      state.paymentMethods.push(action.payload)
    },

    removePaymentMethod: (state, action: PayloadAction<string>) => {
      state.paymentMethods = state.paymentMethods.filter((method) => method.id !== action.payload)
    },

    setDefaultPaymentMethod: (state, action: PayloadAction<string>) => {
      state.paymentMethods.forEach((method) => {
        method.isDefault = method.id === action.payload
      })
    },

    // Preferences
    updatePreferences: (state, action: PayloadAction<Partial<UserPreferences>>) => {
      if (state.user) {
        state.user.preferences = { ...state.user.preferences, ...action.payload }
      }
    },

    // Favorites
    addToFavorites: (state, action: PayloadAction<string>) => {
      if (!state.favorites.includes(action.payload)) {
        state.favorites.push(action.payload)
      }
    },

    removeFromFavorites: (state, action: PayloadAction<string>) => {
      state.favorites = state.favorites.filter((id) => id !== action.payload)
    },

    // Loyalty Points
    addLoyaltyPoints: (state, action: PayloadAction<number>) => {
      if (state.user) {
        state.user.loyaltyPoints += action.payload
      }
    },

    redeemLoyaltyPoints: (state, action: PayloadAction<number>) => {
      if (state.user && state.user.loyaltyPoints >= action.payload) {
        state.user.loyaltyPoints -= action.payload
      }
    },

    // Recent Orders
    addRecentOrder: (state, action: PayloadAction<string>) => {
      // Add to beginning and keep only last 10
      state.recentOrders.unshift(action.payload)
      state.recentOrders = state.recentOrders.slice(0, 10)
    },

    // Loading and Error states
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload
    },

    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload
      state.isLoading = false
    },

    clearError: (state) => {
      state.error = null
    },
  },
})

export const {
  setUser,
  clearUser,
  updateUser,
  addAddress,
  updateAddress,
  removeAddress,
  setDefaultAddress,
  addPaymentMethod,
  removePaymentMethod,
  setDefaultPaymentMethod,
  updatePreferences,
  addToFavorites,
  removeFromFavorites,
  addLoyaltyPoints,
  redeemLoyaltyPoints,
  addRecentOrder,
  setLoading,
  setError,
  clearError,
} = userSlice.actions

export default userSlice.reducer