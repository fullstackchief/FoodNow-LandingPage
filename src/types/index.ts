import { Database } from '@/lib/database.types'

// Base Restaurant type from database
export type RestaurantDB = Database['public']['Tables']['restaurants']['Row']

// Extended Restaurant type for frontend (uses camelCase for consistency)
export interface Restaurant {
  // Base database fields (snake_case from DB)
  id: string
  name: string
  description: string
  image_url: string | null
  cover_image_url: string | null
  rating: number
  review_count: number
  price_range: '$' | '$$' | '$$$' | '$$$$'
  cuisine_types: string[]
  delivery_time: string
  delivery_fee: number
  minimum_order: number
  is_open: boolean
  is_featured: boolean
  status: string
  opening_hours: any
  location: any
  features: string[]
  phone_number: string
  email: string
  total_orders: number
  established_year: number | null
  created_at: string
  updated_at: string
  promotions: any | null
  
  // Additional optional fields that may exist
  delivery_time_minutes?: number // alias for delivery_time
  
  // Computed camelCase aliases for easier frontend use
  reviewCount: number
  deliveryTime: string
  deliveryFee: number
  cuisineTypes: string[]
  priceRange: '$' | '$$' | '$$$' | '$$$$'
}

// Utility function to convert database restaurant to frontend restaurant
export const convertRestaurantDBToFrontend = (dbRestaurant: RestaurantDB): Restaurant => {
  return {
    ...dbRestaurant,
    // Add aliases
    delivery_time_minutes: Number(dbRestaurant.delivery_time), // Add delivery_time_minutes alias
    // Add camelCase aliases
    reviewCount: dbRestaurant.review_count,
    deliveryTime: String(dbRestaurant.delivery_time),
    deliveryFee: dbRestaurant.delivery_fee,
    cuisineTypes: dbRestaurant.cuisine_types,
    priceRange: dbRestaurant.price_range,
    status: (dbRestaurant as any).status || 'active', // Ensure status is always present
  }
}

// Menu Item types
export type MenuItemDB = Database['public']['Tables']['menu_items']['Row']

export interface MenuItem {
  // Base database fields
  id: string
  restaurant_id: string
  name: string
  description: string
  base_price: number
  image_url: string | null
  category_id: string | null
  tags: string[] | null
  is_available: boolean
  preparation_time: number
  dietary_tags: string[]
  spicy_level: number
  created_at: string
  updated_at: string
  
  // Additional optional fields that may exist
  is_featured?: boolean
  is_popular?: boolean
  price?: number // alias for base_price
  customizations?: any
  nutrition_info?: any
  
  // Computed camelCase aliases
  basePrice: number
  imageUrl: string | null
  preparationTime: number
  isAvailable: boolean
  customizationsData?: {
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

// Utility function to convert database menu item to frontend menu item
export const convertMenuItemDBToFrontend = (dbMenuItem: MenuItemDB): MenuItem => {
  return {
    ...dbMenuItem,
    // Add camelCase aliases
    price: dbMenuItem.base_price, // Add price alias
    basePrice: dbMenuItem.base_price,
    imageUrl: dbMenuItem.image_url,
    preparationTime: dbMenuItem.preparation_time,
    isAvailable: dbMenuItem.is_available,
    customizationsData: (dbMenuItem as any).customizations || undefined,
    nutritionInfo: (dbMenuItem as any).nutrition_info || undefined,
    // Add required fields that may be missing
    dietary_tags: (dbMenuItem as any).dietary_tags || [],
    spicy_level: (dbMenuItem as any).spicy_level || 0,
  }
}

// Cart types
export interface CartItemCustomization {
  id: string
  name: string
  selectedOptions: {
    id: string
    name: string
    price: number
  }[]
  additionalPrice: number
}

export interface CartItem {
  id: string
  name: string
  basePrice: number
  price: number // Final price including customizations
  quantity: number
  restaurantId: string
  restaurantName: string
  customizations?: CartItemCustomization[]
  legacyCustomizations?: string[] // For backward compatibility
  image?: string
  notes?: string
  specialRequests?: string
}

// Restaurant for cart (minimal info needed)
export interface CartRestaurant {
  id: string
  name: string
  deliveryTime: string
  deliveryFee: number
  minimumOrder: number
  image?: string
  rating?: number
}

// User types
export type UserDB = Database['public']['Tables']['users']['Row']

export interface User extends UserDB {
  firstName: string
  lastName: string
  loyaltyPoints: number
  totalOrders: number
  avatarUrl?: string
  phoneNumber?: string
  dateOfBirth?: string
}

// Order types  
export type OrderDB = Database['public']['Tables']['orders']['Row']

export interface Order extends OrderDB {
  orderNumber: string
  userId: string
  restaurantId: string
  paymentMethod: string
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded'
  deliveryInfo: any
  riderId?: string
  estimatedDeliveryTime: string
  actualDeliveryTime?: string
  specialInstructions?: string
  promoCode?: string
  trackingUpdates: any[]
}

// Extended order interface for components
export interface OrderWithItems extends Omit<Order, 'status' | 'rating' | 'service_fee' | 'estimated_delivery_time'> {
  id: string
  order_items: OrderItemDB[]
  restaurants: RestaurantDB
  rating?: number | null
  delivery_instructions?: string
  service_fee?: number
  order_number: string
  estimated_delivery_time: string | null
  delivery_info: any
  status: string
  total: number
}

// Order Item types
export type OrderItemDB = Database['public']['Tables']['order_items']['Row']

// Restaurant with menu items for restaurant detail pages
export interface RestaurantWithMenuItems extends Restaurant {
  menu_items: MenuItem[]
}

// Search and filter types
export interface RestaurantFilters {
  search: string
  cuisineTypes: string[]
  priceRange: string[]
  rating: number
  deliveryTime: number
  features: string[]
  sortBy: 'rating' | 'delivery_time' | 'price' | 'popular'
}

export interface SearchState {
  query: string
  filters: RestaurantFilters
  results: Restaurant[]
  isLoading: boolean
  error: string | null
  totalResults: number
  currentPage: number
  totalPages: number
}

// UI State types
export interface UIState {
  isLoading: boolean
  error: string | null
  theme: 'light' | 'dark'
  sidebarOpen: boolean
  modalOpen: boolean
}

// Admin types
export interface AdminUser {
  id: string
  email: string
  firstName: string
  lastName: string
  role: 'super_admin' | 'restaurant_admin' | 'support_admin'
  permissions: string[]
  lastLogin?: string
  isActive: boolean
  createdAt: string
}

// API Response types
export interface ApiResponse<T> {
  data?: T
  error?: string
  success: boolean
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

// Form types
export interface ContactForm {
  name: string
  email: string
  phone?: string
  subject: string
  message: string
}

export interface RestaurantOnboardingForm {
  name: string
  description: string
  cuisineTypes: string[]
  phoneNumber: string
  email: string
  address: string
  businessLicense?: string
  ownerName: string
  ownerPhone: string
}

export interface RiderOnboardingForm {
  firstName: string
  lastName: string
  email: string
  phoneNumber: string
  vehicleType: 'bicycle' | 'motorcycle' | 'car'
  licenseNumber?: string
  bankDetails: {
    accountName: string
    accountNumber: string
    bankName: string
  }
}