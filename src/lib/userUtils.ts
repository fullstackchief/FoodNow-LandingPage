// User type utility functions and helpers
import type { 
  UserProfile as User, 
  UserType, 
  RestaurantProfile, 
  RiderProfile, 
  AdminProfile 
} from '@/types/auth'

export interface UserTypeConfig {
  type: UserType
  label: string
  dashboardPath: string
  icon: string
  description: string
  requiredFields: string[]
}

export const USER_TYPE_CONFIGS: Record<UserType, UserTypeConfig> = {
  customer: {
    type: 'customer',
    label: 'Customer',
    dashboardPath: '/explore',
    icon: '👤',
    description: 'Order delicious food from your favorite restaurants',
    requiredFields: ['email', 'firstName', 'lastName', 'phone']
  },
  restaurant: {
    type: 'restaurant',
    label: 'Restaurant',
    dashboardPath: '/dashboard',
    icon: '🍽️',
    description: 'Manage your restaurant, menu, and orders',
    requiredFields: ['email', 'firstName', 'lastName', 'phone', 'businessName', 'businessAddress']
  },
  rider: {
    type: 'rider',
    label: 'Rider',
    dashboardPath: '/dashboard',
    icon: '🏍️',
    description: 'Deliver food and earn money on your schedule',
    requiredFields: ['email', 'firstName', 'lastName', 'phone', 'vehicleType', 'driverLicense']
  },
  admin: {
    type: 'admin',
    label: 'Admin',
    dashboardPath: '/admin-system',
    icon: '⚙️',
    description: 'Manage the platform, users, and operations',
    requiredFields: ['email', 'firstName', 'lastName', 'phone']
  }
}

// User type checking utilities
export const isCustomer = (user: User): boolean => user.userType === 'customer'
export const isRestaurant = (user: User): boolean => user.userType === 'restaurant'
export const isRider = (user: User): boolean => user.userType === 'rider'
export const isAdmin = (user: User): boolean => user.userType === 'admin'

// Role checking utilities
export const hasRole = (user: User, role: UserType): boolean => {
  if (!user?.userType) return false
  return user.userType === role
}

// Profile utilities
export const getRestaurantProfile = (user: User): RestaurantProfile | null => 
  user.restaurantProfile || null

export const getRiderProfile = (user: User): RiderProfile | null => 
  user.riderProfile || null

export const getAdminProfile = (user: User): AdminProfile | null => 
  user.adminProfile || null

// Permission utilities
export const canManageRestaurant = (user: User): boolean => 
  hasRole(user, 'restaurant') || (hasRole(user, 'admin') && user.adminProfile?.permissions.restaurants === true)

export const canManageOrders = (user: User): boolean => 
  hasRole(user, 'restaurant') || hasRole(user, 'rider') || (hasRole(user, 'admin') && user.adminProfile?.permissions.orders === true)

export const canViewAnalytics = (user: User): boolean => 
  hasRole(user, 'restaurant') || (hasRole(user, 'admin') && user.adminProfile?.permissions.analytics === true)

export const canManageUsers = (user: User): boolean => 
  hasRole(user, 'admin') && user.adminProfile?.permissions.users === true

// Get user permissions as array of strings
export const getUserPermissions = (user: User): string[] => {
  const permissions: string[] = []
  
  if (user.userType === 'admin' && user.adminProfile) {
    Object.entries(user.adminProfile.permissions).forEach(([key, value]) => {
      if (value) permissions.push(`admin.${key}`)
    })
  }
  
  if (user.userType === 'restaurant') {
    permissions.push('restaurant.manage_menu', 'restaurant.manage_orders', 'restaurant.view_analytics')
  }
  
  if (user.userType === 'rider') {
    permissions.push('rider.manage_deliveries', 'rider.view_earnings', 'rider.update_location')
  }
  
  if (user.userType === 'customer') {
    permissions.push('customer.place_orders', 'customer.view_history', 'customer.manage_profile')
  }
  
  return permissions
}

// Dashboard utilities
export const getDashboardPath = (user: User): string => {
  if (!user?.userType || !USER_TYPE_CONFIGS[user.userType]) {
    return '/'
  }
  return USER_TYPE_CONFIGS[user.userType].dashboardPath
}

export const getDashboardTitle = (user: User): string => {
  switch (user.userType) {
    case 'customer':
      return 'Explore Restaurants'
    case 'restaurant':
      return user.restaurantProfile?.businessName || 'Restaurant Dashboard'
    case 'rider':
      return 'Rider Dashboard'
    case 'admin':
      return 'Admin Dashboard'
    default:
      return 'Dashboard'
  }
}

// Navigation utilities
export const getNavItems = (user: User): Array<{ label: string; href: string; icon?: string }> => {
  const commonItems = [
    { label: 'Profile', href: '/profile', icon: '👤' }
  ]

  switch (user.userType) {
    case 'customer':
      return [
        { label: 'Explore', href: '/explore', icon: '🔍' },
        { label: 'My Orders', href: '/orders', icon: '📦' },
        { label: 'Favorites', href: '/favorites', icon: '❤️' },
        ...commonItems
      ]
    case 'restaurant':
      return [
        { label: 'Dashboard', href: '/dashboard', icon: '📊' },
        { label: 'Orders', href: '/dashboard/orders', icon: '📦' },
        { label: 'Menu', href: '/dashboard?tab=menu', icon: '📋' },
        { label: 'Analytics', href: '/dashboard?tab=analytics', icon: '📈' },
        ...commonItems
      ]
    case 'rider':
      return [
        { label: 'Dashboard', href: '/dashboard', icon: '📊' },
        { label: 'Deliveries', href: '/dashboard/orders', icon: '🏍️' },
        { label: 'Earnings', href: '/dashboard?tab=earnings', icon: '💰' },
        ...commonItems
      ]
    case 'admin':
      return [
        { label: 'Dashboard', href: '/admin-system/dashboard', icon: '📊' },
        { label: 'Applications', href: '/admin-system/applications', icon: '📋' },
        { label: 'Restaurants', href: '/admin-system?tab=restaurants', icon: '🍽️' },
        { label: 'Users', href: '/admin-system/users', icon: '👥' },
        ...commonItems
      ]
    default:
      return commonItems
  }
}

// User status utilities
export const isUserActive = (user: User): boolean => {
  if (!user) return false
  return user.isActive ?? false
}

export const isUserVerified = (user: User): boolean => {
  switch (user.userType) {
    case 'customer':
      return user.verificationStatus === 'fully_verified' || user.verificationStatus === 'email_verified'
    case 'restaurant':
      return user.restaurantProfile?.isVerified === true
    case 'rider':
      return user.riderProfile?.isVerified === true
    case 'admin':
      return true // Admins are always considered verified
    default:
      return false
  }
}

export const getUserStatus = (user: User): 'active' | 'inactive' | 'pending' | 'suspended' => {
  if (!user.isActive) return 'suspended'
  if (!isUserVerified(user)) return 'pending'
  return 'active'
}

// User display utilities
export const getUserDisplayName = (user: User): string => {
  if (!user?.firstName || !user?.lastName) {
    return 'User'
  }
  return `${user.firstName} ${user.lastName}`
}

export const getUserInitials = (user: User): string => {
  if (!user?.firstName || !user?.lastName) {
    return 'U'
  }
  return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase()
}

export const getUserRole = (user: User): string => {
  if (!user?.userType || !USER_TYPE_CONFIGS[user.userType]) {
    return 'User'
  }
  return USER_TYPE_CONFIGS[user.userType].label
}

export const getUserBusinessName = (user: User): string => {
  if (user.userType === 'restaurant' && user.restaurantProfile) {
    return user.restaurantProfile.businessName
  }
  return getUserDisplayName(user)
}

// Validation utilities
export const validateUserType = (userType: string): userType is UserType => 
  ['customer', 'restaurant', 'rider', 'admin'].includes(userType)

export const validateUserRole = (user: User, requiredRole: UserType): boolean => 
  hasRole(user, requiredRole)

// Access control utilities
export const canAccessRoute = (user: User, route: string): boolean => {
  const routePermissions: Record<string, UserType[]> = {
    '/explore': ['customer'],
    '/dashboard': ['restaurant', 'rider', 'customer', 'admin'],
    '/admin-system': ['admin'],
    '/orders': ['customer'],
    '/profile': ['customer', 'restaurant', 'rider', 'admin'],
    '/settings': ['customer', 'restaurant', 'rider', 'admin']
  }

  const allowedRoles = routePermissions[route]
  if (!allowedRoles) return true // Allow access to public routes

  return allowedRoles.some(role => hasRole(user, role))
}

export const getRedirectPath = (user: User, intendedPath?: string): string => {
  if (intendedPath && canAccessRoute(user, intendedPath)) {
    return intendedPath
  }
  return getDashboardPath(user)
}