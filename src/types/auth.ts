/**
 * AUTHENTICATION TYPES
 * ====================
 * Centralized type definitions for authentication and user management
 * Extracted from mockAuth and aligned with Supabase database types
 */

import type { Database } from '@/lib/database.types'

// User types aligned with database schema
export type UserRole = 'customer' | 'restaurant_owner' | 'rider' | 'admin' | 'super_admin'

// Legacy compatibility for existing code
export type UserType = 'customer' | 'restaurant' | 'rider' | 'admin'

// Map legacy types to database types
export const mapLegacyToDbRole = (legacyType: UserType): UserRole => {
  switch (legacyType) {
    case 'restaurant':
      return 'restaurant_owner'
    case 'customer':
    case 'rider':
    case 'admin':
      return legacyType
    default:
      return 'customer'
  }
}

// Map database types to legacy types for backward compatibility
export const mapDbToLegacyRole = (dbRole: UserRole): UserType => {
  switch (dbRole) {
    case 'restaurant_owner':
      return 'restaurant'
    case 'customer':
    case 'rider':
    case 'admin':
      return dbRole
    case 'super_admin':
      return 'admin'
    default:
      return 'customer'
  }
}

// Base user type from database
export type DatabaseUser = Database['public']['Tables']['users']['Row']

// Extended user profile with parsed metadata
export interface UserProfile extends Omit<DatabaseUser, 'user_role'> {
  // Use legacy naming for compatibility
  userType: UserType
  
  // Parsed metadata fields
  restaurantProfile?: RestaurantProfile
  riderProfile?: RiderProfile
  adminProfile?: AdminProfile
  
  // Compatibility fields
  firstName: string
  lastName: string
  emailVerified: boolean
  phoneVerified: boolean
  verificationStatus: 'pending' | 'email_verified' | 'phone_verified' | 'fully_verified'
  totalSpent?: number
  
  // Add missing field
  isActive: boolean
}

// Restaurant profile interface
export interface RestaurantProfile {
  businessName: string
  businessAddress: string
  businessPhone: string
  businessEmail?: string
  registrationNumber?: string
  taxId?: string
  description?: string
  cuisineTypes: string[]
  estimatedDeliveryTime: string
  averageDeliveryTime?: number // Legacy compatibility  
  minimumOrder: number
  deliveryFee: number
  serviceRadius?: number // in kilometers
  rating: number
  totalReviews: number
  isVerified: boolean
  isActive: boolean
  featuredUntil?: string
  operatingHours?: {
    [key: string]: { open: string; close: string; isOpen: boolean }
  }
}

// Rider profile interface
export interface RiderProfile {
  vehicleType: 'motorcycle' | 'bicycle' | 'car' | 'scooter'
  vehicleModel?: string
  licensePlate?: string
  driverLicense?: string
  isOnline: boolean
  currentLocation?: {
    lat: number
    lng: number
    address: string
  }
  deliveryRadius: number // in kilometers
  totalDeliveries: number
  rating: number
  earnings: {
    today: number
    thisWeek: number
    thisMonth: number
  }
  bankAccount?: {
    bankName: string
    accountNumber: string
    accountName: string
  }
  isVerified: boolean
  isActive: boolean
}

// Admin profile interface
export interface AdminProfile {
  role: 'super_admin' | 'admin' | 'moderator'
  permissions: {
    restaurants: boolean
    orders: boolean
    users: boolean
    analytics: boolean
    settings: boolean
  }
  lastLogin?: string
  sessionTimeout: number
  departmentId?: string
  managedRegions?: string[]
}

// Authentication-related interfaces
export interface SignupData {
  email: string
  password: string
  firstName: string
  lastName: string
  phone?: string
  userType: UserType
  agreeToTerms: boolean
  marketing?: boolean
}

export interface RestaurantSignupData extends Omit<SignupData, 'userType'> {
  userType: 'restaurant'
  restaurantData: {
    businessName: string
    businessAddress: string
    businessPhone: string
    cuisineType: string[]
    operatingHours: RestaurantProfile['operatingHours']
    estimatedDeliveryTime: string
    averageDeliveryTime?: string // Legacy compatibility
    minimumOrder: number
    deliveryFee: number
    serviceRadius?: number
  }
}

export interface RiderSignupData extends Omit<SignupData, 'userType'> {
  userType: 'rider'
  riderData: {
    vehicleType: RiderProfile['vehicleType']
    vehicleModel?: string
    licensePlate?: string
    driverLicense?: string
    deliveryRadius: number
    bankAccount?: RiderProfile['bankAccount']
  }
}

export interface LoginCredentials {
  email: string
  password: string
  rememberMe?: boolean
}

// Session management
export interface AuthSession {
  user: UserProfile
  accessToken?: string
  refreshToken?: string
  expiresAt?: string
}

// Admin role types for autonomous admin system
export type AdminRole = 'super_admin' | 'business_admin' | 'staff_admin' | 'read_only_admin'

// Admin user interface for the autonomous admin system
export interface AdminUser {
  id: string
  user_id: string
  role: AdminRole
  permissions: AdminPermissions
  created_by?: string
  created_at: string
  updated_at: string
  last_login?: string
  is_active: boolean
  notes?: string
  
  // From auth.users
  email?: string
  first_name?: string
  last_name?: string
}

// Hierarchical permission structure
export interface AdminPermissions {
  restaurants: {
    view: boolean
    create: boolean
    edit: boolean
    delete: boolean
    approve: boolean
    suspend: boolean
    financial_reports: boolean
    direct_database_access?: boolean
  }
  users: {
    view: boolean
    create: boolean
    edit: boolean
    delete: boolean
    suspend: boolean
    view_personal_info: boolean
    reset_passwords: boolean
    merge_accounts?: boolean
  }
  orders: {
    view_all: boolean
    create: boolean
    edit: boolean
    delete: boolean
    refunds: boolean
    dispute_resolution: boolean
    financial_adjustments?: boolean
  }
  analytics: {
    view_all: boolean
    export_data: boolean
    create_reports: boolean
    view_financial: boolean
    view_sensitive?: boolean
  }
  system: {
    view_logs: boolean
    modify_settings: boolean
    database_access?: boolean
    maintenance_mode?: boolean
    backup_restore?: boolean
    security_settings?: boolean
  }
  financial: {
    view_all: boolean
    process_refunds: boolean
    adjust_payments: boolean
    view_sensitive_data?: boolean
    manage_payment_methods?: boolean
  }
  admin_management: {
    view_admins: boolean
    create_super_admins?: boolean
    create_business_admins: boolean
    create_staff_admins: boolean
    edit_admin_permissions: boolean
    delete_admins: boolean
    view_audit_logs: boolean
  }
}

// Validation utilities
export const validateUserType = (userType: string): userType is UserType => 
  ['customer', 'restaurant', 'rider', 'admin'].includes(userType)

export const validateAdminRole = (role: string): role is AdminRole =>
  ['super_admin', 'business_admin', 'staff_admin', 'read_only_admin'].includes(role)

export const validateUserRole = (userRole: string): userRole is UserRole => 
  ['customer', 'restaurant_owner', 'rider', 'admin', 'super_admin'].includes(userRole)

// Basic password validation for UI
export const validatePassword = (password: string): { isValid: boolean; errors: string[]; strength: 'weak' | 'medium' | 'strong' } => {
  const errors: string[] = []
  let score = 0

  // Length check
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long')
  } else if (password.length >= 12) {
    score += 2
  } else {
    score += 1
  }

  // Character variety checks
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  } else {
    score += 1
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  } else {
    score += 1
  }

  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number')
  } else {
    score += 1
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character')
  } else {
    score += 1
  }

  // Determine strength
  let strength: 'weak' | 'medium' | 'strong' = 'weak'
  if (score >= 6 && errors.length === 0) {
    strength = 'strong'
  } else if (score >= 4 && errors.length === 0) {
    strength = 'medium'
  }

  return {
    isValid: errors.length === 0,
    errors,
    strength
  }
}