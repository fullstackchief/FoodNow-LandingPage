import { createSlice, PayloadAction } from '@reduxjs/toolkit'

// Types
export interface MenuItem {
  id: string
  name: string
  description: string
  basePrice: number
  image: string
  category: string
  isAvailable: boolean
  preparationTime: number // in minutes
  calories?: number
  tags: string[] // ['spicy', 'vegetarian', 'popular', etc.]
  allergens?: string[]
  customizations?: {
    id: string
    name: string
    options: {
      id: string
      name: string
      price: number
    }[]
    required: boolean
    maxSelections?: number
  }[]
  nutritionInfo?: {
    calories: number
    protein: number
    carbs: number
    fat: number
    sodium: number
  }
}

export interface Restaurant {
  id: string
  name: string
  description: string
  image: string
  coverImage?: string
  rating: number
  reviewCount: number
  priceRange: '$' | '$$' | '$$$' | '$$$$'
  cuisineType: string[]
  deliveryTime: string
  deliveryFee: number
  minimumOrder: number
  isOpen: boolean
  openingHours: {
    [key: string]: { open: string; close: string } | null // null for closed days
  }
  location: {
    address: string
    coordinates: {
      lat: number
      lng: number
    }
    area: string
    city: string
  }
  features: string[] // ['pickup', 'dine-in', 'outdoor-seating', etc.]
  menu: MenuItem[]
  promotions?: {
    id: string
    title: string
    description: string
    discount: number
    validUntil: string
    conditions?: string
  }[]
  totalOrders: number
  establishedYear?: number
  phoneNumber: string
  email: string
}

export interface RestaurantFilters {
  cuisine: string[]
  priceRange: string[]
  rating: number
  deliveryTime: number
  features: string[]
  dietary: string[]
  sortBy: 'popular' | 'rating' | 'deliveryTime' | 'priceAsc' | 'priceDesc'
  searchQuery: string
}

export interface RestaurantState {
  restaurants: Restaurant[]
  featuredRestaurants: Restaurant[]
  nearbyRestaurants: Restaurant[]
  currentRestaurant: Restaurant | null
  filters: RestaurantFilters
  categories: string[]
  isLoading: boolean
  error: string | null
  searchHistory: string[]
  userLocation: {
    lat: number
    lng: number
  } | null
}

const initialFilters: RestaurantFilters = {
  cuisine: [],
  priceRange: [],
  rating: 0,
  deliveryTime: 0,
  features: [],
  dietary: [],
  sortBy: 'popular',
  searchQuery: '',
}

const initialState: RestaurantState = {
  restaurants: [],
  featuredRestaurants: [],
  nearbyRestaurants: [],
  currentRestaurant: null,
  filters: initialFilters,
  categories: [],
  isLoading: false,
  error: null,
  searchHistory: [],
  userLocation: null,
}

const restaurantSlice = createSlice({
  name: 'restaurant',
  initialState,
  reducers: {
    // Restaurants
    setRestaurants: (state, action: PayloadAction<Restaurant[]>) => {
      state.restaurants = action.payload
      state.isLoading = false
      state.error = null
    },

    setFeaturedRestaurants: (state, action: PayloadAction<Restaurant[]>) => {
      state.featuredRestaurants = action.payload
    },

    setNearbyRestaurants: (state, action: PayloadAction<Restaurant[]>) => {
      state.nearbyRestaurants = action.payload
    },

    setCurrentRestaurant: (state, action: PayloadAction<Restaurant | null>) => {
      state.currentRestaurant = action.payload
    },

    updateRestaurant: (state, action: PayloadAction<{ id: string; updates: Partial<Restaurant> }>) => {
      const { id, updates } = action.payload
      
      // Update in main restaurants array
      const restaurantIndex = state.restaurants.findIndex((r) => r.id === id)
      if (restaurantIndex >= 0) {
        state.restaurants[restaurantIndex] = { ...state.restaurants[restaurantIndex], ...updates }
      }

      // Update current restaurant if it matches
      if (state.currentRestaurant?.id === id) {
        state.currentRestaurant = { ...state.currentRestaurant, ...updates }
      }
    },

    // Filters
    updateFilters: (state, action: PayloadAction<Partial<RestaurantFilters>>) => {
      state.filters = { ...state.filters, ...action.payload }
    },

    clearFilters: (state) => {
      state.filters = initialFilters
    },

    toggleCuisineFilter: (state, action: PayloadAction<string>) => {
      const cuisine = action.payload
      const index = state.filters.cuisine.indexOf(cuisine)
      
      if (index >= 0) {
        state.filters.cuisine.splice(index, 1)
      } else {
        state.filters.cuisine.push(cuisine)
      }
    },

    togglePriceRangeFilter: (state, action: PayloadAction<string>) => {
      const priceRange = action.payload
      const index = state.filters.priceRange.indexOf(priceRange)
      
      if (index >= 0) {
        state.filters.priceRange.splice(index, 1)
      } else {
        state.filters.priceRange.push(priceRange)
      }
    },

    toggleFeatureFilter: (state, action: PayloadAction<string>) => {
      const feature = action.payload
      const index = state.filters.features.indexOf(feature)
      
      if (index >= 0) {
        state.filters.features.splice(index, 1)
      } else {
        state.filters.features.push(feature)
      }
    },

    toggleDietaryFilter: (state, action: PayloadAction<string>) => {
      const dietary = action.payload
      const index = state.filters.dietary.indexOf(dietary)
      
      if (index >= 0) {
        state.filters.dietary.splice(index, 1)
      } else {
        state.filters.dietary.push(dietary)
      }
    },

    // Search
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.filters.searchQuery = action.payload
      
      // Add to search history if not empty and not already exists
      if (action.payload.trim() && !state.searchHistory.includes(action.payload)) {
        state.searchHistory.unshift(action.payload)
        state.searchHistory = state.searchHistory.slice(0, 10) // Keep only last 10
      }
    },

    clearSearchHistory: (state) => {
      state.searchHistory = []
    },

    removeFromSearchHistory: (state, action: PayloadAction<string>) => {
      state.searchHistory = state.searchHistory.filter((query) => query !== action.payload)
    },

    // Categories
    setCategories: (state, action: PayloadAction<string[]>) => {
      state.categories = action.payload
    },

    // Location
    setUserLocation: (state, action: PayloadAction<{ lat: number; lng: number }>) => {
      state.userLocation = action.payload
    },

    // Menu Items
    updateMenuItem: (state, action: PayloadAction<{ restaurantId: string; itemId: string; updates: Partial<MenuItem> }>) => {
      const { restaurantId, itemId, updates } = action.payload
      
      // Update in main restaurants array
      const restaurant = state.restaurants.find((r) => r.id === restaurantId)
      if (restaurant) {
        const itemIndex = restaurant.menu.findIndex((item) => item.id === itemId)
        if (itemIndex >= 0) {
          restaurant.menu[itemIndex] = { ...restaurant.menu[itemIndex], ...updates }
        }
      }

      // Update current restaurant if it matches
      if (state.currentRestaurant?.id === restaurantId) {
        const itemIndex = state.currentRestaurant.menu.findIndex((item) => item.id === itemId)
        if (itemIndex >= 0) {
          state.currentRestaurant.menu[itemIndex] = { ...state.currentRestaurant.menu[itemIndex], ...updates }
        }
      }
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
  setRestaurants,
  setFeaturedRestaurants,
  setNearbyRestaurants,
  setCurrentRestaurant,
  updateRestaurant,
  updateFilters,
  clearFilters,
  toggleCuisineFilter,
  togglePriceRangeFilter,
  toggleFeatureFilter,
  toggleDietaryFilter,
  setSearchQuery,
  clearSearchHistory,
  removeFromSearchHistory,
  setCategories,
  setUserLocation,
  updateMenuItem,
  setLoading,
  setError,
  clearError,
} = restaurantSlice.actions

export default restaurantSlice.reducer