/**
 * AUTH SERVICE WITH ROLE-BASED ACCESS CONTROL
 * ============================================
 * Service for handling authentication with multiple user roles
 * Supports: customer, restaurant_owner, rider, admin, super_admin
 */

import { supabase } from '@/lib/supabase-client'
import type { User } from '@supabase/supabase-js'
import { devLog, prodLog } from '@/lib/logger'

// User role types
export type UserRole = 'customer' | 'restaurant_owner' | 'rider'

import type { Database } from '@/lib/database.types'

// Use the database type directly for consistency
export type UserProfile = Database['public']['Tables']['users']['Row']

// TODO: Uncomment when role_applications table is added
// export type RoleApplication = Database['public']['Tables']['role_applications']['Row']

// Registration data interface
export interface RegisterData {
  email: string
  password: string
  firstName: string
  lastName: string
  role?: UserRole
  phone?: string
  metadata?: Record<string, any>
}

// Restaurant owner application data
export interface RestaurantOwnerApplicationData {
  // Business Information
  restaurantName: string
  cacRegistrationNumber: string
  taxIdentificationNumber: string
  businessAddress: string
  state: string
  businessDescription: string
  establishedYear: number
  
  // Owner Details  
  ownerFullName: string
  ownerNIN: string
  ownerPhone: string
  ownerEmail: string
  ownerAddress: string
  
  // Document URLs (after upload)
  documents: {
    cacCertificate?: string
    ownerNinFront?: string
    ownerNinBack?: string
    restaurantPhoto1?: string
    restaurantPhoto2?: string
    restaurantPhoto3?: string
    ownerPhoto?: string
  }
  
  // Banking Information
  businessBankName: string
  businessAccountNumber: string
  businessAccountName: string
  businessBVN: string
  
  // Restaurant Details
  cuisineTypes: string[]
  operatingHours: any
  deliveryRadius: number
  minimumOrderAmount: number
  estimatedDeliveryTime: string
  priceRange: '$' | '$$' | '$$$' | '$$$$'
  specialFeatures: string[]
}

// Rider application data
export interface RiderApplicationData {
  vehicleType: 'motorcycle' | 'bicycle' | 'car' | 'scooter'
  licenseNumber: string
  vehicleRegistration: string
  hasInsurance: boolean
  availableAreas: string[]
  workingHours: {
    start: string
    end: string
    days: string[]
  }
  emergencyContact: {
    name: string
    phone: string
    relationship: string
  }
}

export interface AuthServiceResult<T = unknown> {
  data: T | null
  error: string | null
}

/**
 * Register a new user with role
 */
export async function registerUser(userData: RegisterData): Promise<AuthServiceResult<User>> {
  try {
    const { data, error } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
      options: {
        data: {
          first_name: userData.firstName,
          last_name: userData.lastName,
          user_role: userData.role || 'customer',
          phone: userData.phone,
          ...userData.metadata
        }
      }
    })

    if (error) {
      return { data: null, error: error.message }
    }

    return { data: data.user, error: null }
  } catch (error) {
    prodLog.error('User registration failed', error, { 
      email: userData.email, 
      role: userData.role || 'customer',
      action: 'register',
      errorType: 'registration_exception'
    })
    return { data: null, error: 'Failed to register user' }
  }
}

/**
 * Sign in user
 */
export async function signInUser(email: string, password: string): Promise<AuthServiceResult<User>> {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      return { data: null, error: error.message }
    }

    return { data: data.user, error: null }
  } catch (error) {
    prodLog.error('User sign in failed', error, { 
      email,
      action: 'sign_in',
      errorType: 'signin_exception'
    })
    return { data: null, error: 'Failed to sign in' }
  }
}

/**
 * Sign out user
 */
export async function signOutUser(): Promise<AuthServiceResult<void>> {
  try {
    const { error } = await supabase.auth.signOut()

    if (error) {
      return { data: null, error: error.message }
    }

    return { data: null, error: null }
  } catch (error) {
    prodLog.error('User sign out failed', error, { 
      action: 'sign_out',
      errorType: 'signout_exception'
    })
    return { data: null, error: 'Failed to sign out' }
  }
}

/**
 * Get current user profile
 */
export async function getCurrentUserProfile(): Promise<AuthServiceResult<UserProfile>> {
  try {
    devLog.info('Getting current user profile')
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError) {
      prodLog.error('Failed to get authenticated user', userError, { 
        action: 'get_current_user_profile',
        errorType: 'auth_error'
      })
      return { data: null, error: userError.message }
    }

    if (!user) {
      devLog.info('No user authenticated for profile fetch')
      return { data: null, error: 'User not authenticated' }
    }

    devLog.info('Fetching user profile from database', { userId: user.id })
    
    // Use a simpler query first to test
    const { data: profiles, error: listError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .limit(1)
    
    if (listError) {
      prodLog.error('Database error fetching user profile', listError, { 
        userId: user.id,
        action: 'get_current_user_profile',
        errorType: 'database_error'
      })
      return { data: null, error: listError.message || 'Failed to fetch user profile' }
    }
    
    if (!profiles || profiles.length === 0) {
      prodLog.warn('User profile not found in database', { 
        userId: user.id,
        action: 'get_current_user_profile',
        warningType: 'profile_not_found'
      })
      return { data: null, error: 'User profile not found' }
    }
    
    const profile = profiles[0] as UserProfile
    devLog.info('User profile successfully fetched', { email: profile?.email, userId: user.id })
    return { data: profile as UserProfile, error: null }
  } catch (error) {
    prodLog.error('Exception in getCurrentUserProfile', error, { 
      action: 'get_current_user_profile',
      errorType: 'unexpected_exception'
    })
    return { data: null, error: 'Failed to get user profile' }
  }
}

/**
 * Update user profile
 */
export async function updateUserProfile(updates: Partial<UserProfile>): Promise<AuthServiceResult<UserProfile>> {
  try {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { data: null, error: 'User not authenticated' }
    }

    // Create a safe update object with only valid fields
    const updateData: any = {
      updated_at: new Date().toISOString()
    }
    
    // Add only the fields that are being updated
    Object.keys(updates).forEach(key => {
      if (updates[key as keyof UserProfile] !== undefined) {
        updateData[key] = updates[key as keyof UserProfile]
      }
    })

    const { data, error } = await (supabase as any)
      .from('users')
      .update(updateData)
      .eq('id', user.id)
      .select()
      .single()

    if (error) {
      prodLog.error('Failed to update user profile', error, { 
        userId: user.id,
        action: 'update_user_profile',
        errorType: 'database_update_error',
        updatedFields: Object.keys(updates)
      })
      return { data: null, error: 'Failed to update profile' }
    }

    return { data: data as UserProfile, error: null }
  } catch (error) {
    prodLog.error('Exception in updateUserProfile', error, { 
      action: 'update_user_profile',
      errorType: 'unexpected_exception',
      updatedFields: Object.keys(updates)
    })
    return { data: null, error: 'Failed to update profile' }
  }
}

/**
 * Check if user has specific role
 */
export async function userHasRole(role: UserRole): Promise<boolean> {
  try {
    const { data: profile } = await getCurrentUserProfile()
    return profile?.user_role === role && profile?.is_active === true
  } catch (error) {
    prodLog.error('Failed to check user role', error, { 
      targetRole: role,
      action: 'user_has_role',
      errorType: 'role_check_error'
    })
    return false
  }
}

/**
 * Check if user has any of the specified roles
 */
export async function userHasAnyRole(roles: UserRole[]): Promise<boolean> {
  try {
    const { data: profile } = await getCurrentUserProfile()
    return profile ? roles.includes(profile.user_role || 'customer') && profile.is_active : false
  } catch (error) {
    prodLog.error('Failed to check user roles', error, { 
      targetRoles: roles,
      action: 'user_has_any_role',
      errorType: 'role_check_error'
    })
    return false
  }
}

// TODO: Uncomment when role_applications table and RPC functions are implemented
/*
// Submit application for restaurant owner role
export async function submitRestaurantOwnerApplication(
  applicationData: RestaurantOwnerApplicationData
): Promise<AuthServiceResult<string>> {
  try {
    const { data, error } = await supabase.rpc('submit_role_application', {
      requested_role: 'restaurant_owner',
      application_data: applicationData
    })

    if (error) {
      prodLog.error('Failed to submit restaurant owner application', error, { 
        action: 'submit_restaurant_owner_application',
        errorType: 'application_submission_error',
        businessName: applicationData.businessName
      })
      return { data: null, error: 'Failed to submit application' }
    }

    return { data, error: null }
  } catch (error) {
    prodLog.error('Exception in submitRestaurantOwnerApplication', error, { 
      action: 'submit_restaurant_owner_application',
      errorType: 'unexpected_exception',
      businessName: applicationData.businessName
    })
    return { data: null, error: 'Failed to submit application' }
  }
}

// Submit application for rider role
export async function submitRiderApplication(
  applicationData: RiderApplicationData,
  documentUrls: string[] = []
): Promise<AuthServiceResult<string>> {
  try {
    const { data, error } = await supabase.rpc('submit_role_application', {
      requested_role: 'rider',
      application_data: {
        ...applicationData,
        documents: documentUrls
      }
    })

    if (error) {
      prodLog.error('Failed to submit rider application', error, { 
        action: 'submit_rider_application',
        errorType: 'application_submission_error',
        vehicleType: applicationData.vehicleType
      })
      return { data: null, error: 'Failed to submit application' }
    }

    return { data, error: null }
  } catch (error) {
    prodLog.error('Exception in submitRiderApplication', error, { 
      action: 'submit_rider_application',
      errorType: 'unexpected_exception',
      vehicleType: applicationData.vehicleType
    })
    return { data: null, error: 'Failed to submit application' }
  }
}

// Get user's role applications
export async function getUserRoleApplications(): Promise<AuthServiceResult<RoleApplication[]>> {
  try {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { data: null, error: 'User not authenticated' }
    }

    const { data, error } = await (supabase as any)
      .from('role_applications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      prodLog.error('Failed to fetch user role applications', error, { 
        userId: user.id,
        action: 'get_user_role_applications',
        errorType: 'database_fetch_error'
      })
      return { data: null, error: 'Failed to fetch applications' }
    }

    return { data: data as RoleApplication[], error: null }
  } catch (error) {
    prodLog.error('Exception in getUserRoleApplications', error, { 
      action: 'get_user_role_applications',
      errorType: 'unexpected_exception'
    })
    return { data: null, error: 'Failed to fetch applications' }
  }
}

// Get all role applications (admin only)
export async function getAllRoleApplications(
  status?: string,
  role?: UserRole
): Promise<AuthServiceResult<RoleApplication[]>> {
  try {
    let query = supabase
      .from('role_applications')
      .select('*')

    if (status) {
      query = query.eq('status', status)
    }

    if (role) {
      query = query.eq('requested_role', role)
    }

    query = query.order('created_at', { ascending: false })

    const { data, error } = await query

    if (error) {
      prodLog.error('Failed to fetch all role applications', error, { 
        action: 'get_all_role_applications',
        errorType: 'database_fetch_error',
        filters: { status, role }
      })
      return { data: null, error: 'Failed to fetch applications' }
    }

    return { data: data as RoleApplication[], error: null }
  } catch (error) {
    prodLog.error('Exception in getAllRoleApplications', error, { 
      action: 'get_all_role_applications',
      errorType: 'unexpected_exception',
      filters: { status, role }
    })
    return { data: null, error: 'Failed to fetch applications' }
  }
}

// Approve role application (admin only)
export async function approveRoleApplication(applicationId: string): Promise<AuthServiceResult<boolean>> {
  try {
    const { data, error } = await supabase.rpc('approve_role_application', {
      application_id: applicationId
    })

    if (error) {
      prodLog.error('Failed to approve role application', error, { 
        applicationId,
        action: 'approve_role_application',
        errorType: 'application_approval_error'
      })
      return { data: null, error: 'Failed to approve application' }
    }

    return { data, error: null }
  } catch (error) {
    prodLog.error('Exception in approveRoleApplication', error, { 
      applicationId,
      action: 'approve_role_application',
      errorType: 'unexpected_exception'
    })
    return { data: null, error: 'Failed to approve application' }
  }
}

// Reject role application (admin only)
export async function rejectRoleApplication(
  applicationId: string, 
  adminNotes?: string
): Promise<AuthServiceResult<boolean>> {
  try {
    const { data, error } = await supabase.rpc('reject_role_application', {
      application_id: applicationId,
      admin_notes: adminNotes
    })

    if (error) {
      prodLog.error('Failed to reject role application', error, { 
        applicationId,
        action: 'reject_role_application',
        errorType: 'application_rejection_error',
        hasAdminNotes: !!adminNotes
      })
      return { data: null, error: 'Failed to reject application' }
    }

    return { data, error: null }
  } catch (error) {
    prodLog.error('Exception in rejectRoleApplication', error, { 
      applicationId,
      action: 'reject_role_application',
      errorType: 'unexpected_exception',
      hasAdminNotes: !!adminNotes
    })
    return { data: null, error: 'Failed to reject application' }
  }
}

// Update user role (admin only)
export async function updateUserRole(userId: string, newRole: UserRole): Promise<AuthServiceResult<boolean>> {
  try {
    const { data, error } = await supabase.rpc('update_user_role', {
      target_user_id: userId,
      new_role: newRole
    })

    if (error) {
      prodLog.error('Failed to update user role', error, { 
        targetUserId: userId,
        newRole,
        action: 'update_user_role',
        errorType: 'role_update_error'
      })
      return { data: null, error: 'Failed to update user role' }
    }

    return { data, error: null }
  } catch (error) {
    prodLog.error('Exception in updateUserRole', error, { 
      targetUserId: userId,
      newRole,
      action: 'update_user_role',
      errorType: 'unexpected_exception'
    })
    return { data: null, error: 'Failed to update user role' }
  }
}
*/

/**
 * Submit restaurant owner application
 */
export async function submitRestaurantOwnerApplication(
  userId: string,
  applicationData: RestaurantOwnerApplicationData
): Promise<AuthServiceResult<string>> {
  try {
    prodLog.info('Starting restaurant owner application submission', {
      userId,
      restaurantName: applicationData.restaurantName,
      ownerEmail: applicationData.ownerEmail
    })

    // Insert application into role_applications table
    const { data, error } = await (supabase as any)
      .from('role_applications')
      .insert({
        user_id: userId,
        requested_role: 'restaurant_owner',
        application_data: applicationData,
        status: 'pending'
      })
      .select()
      .single()

    if (error) {
      prodLog.error('Failed to submit restaurant owner application', error, {
        userId,
        restaurantName: applicationData.restaurantName,
        action: 'submit_restaurant_owner_application',
        errorType: 'database_insert_error'
      })
      return { data: null, error: 'Failed to submit application. Please try again.' }
    }

    prodLog.info('Restaurant owner application submitted successfully', {
      userId,
      applicationId: data.id,
      restaurantName: applicationData.restaurantName
    })

    return { data: data.id, error: null }
  } catch (error) {
    prodLog.error('Exception in submitRestaurantOwnerApplication', error, {
      userId,
      restaurantName: applicationData.restaurantName,
      action: 'submit_restaurant_owner_application',
      errorType: 'unexpected_exception'
    })
    return { data: null, error: 'An unexpected error occurred. Please try again.' }
  }
}

export async function submitRiderApplication(
  applicationData: RiderApplicationData,
  documentUrls: string[] = []
): Promise<AuthServiceResult<string>> {
  return { data: null, error: 'Feature not yet implemented' }
}

/**
 * Get user's role applications
 */
export async function getUserRoleApplications(): Promise<AuthServiceResult<any[]>> {
  try {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { data: null, error: 'User not authenticated' }
    }

    const { data, error } = await (supabase as any)
      .from('role_applications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      prodLog.error('Failed to fetch user role applications', error, {
        userId: user.id,
        action: 'get_user_role_applications',
        errorType: 'database_fetch_error'
      })
      return { data: null, error: 'Failed to fetch applications' }
    }

    return { data: data || [], error: null }
  } catch (error) {
    prodLog.error('Exception in getUserRoleApplications', error, {
      action: 'get_user_role_applications',
      errorType: 'unexpected_exception'
    })
    return { data: null, error: 'Failed to fetch applications' }
  }
}

export async function getAllRoleApplications(
  status?: string,
  role?: UserRole
): Promise<AuthServiceResult<any[]>> {
  return { data: [], error: null }
}

export async function approveRoleApplication(applicationId: string): Promise<AuthServiceResult<boolean>> {
  return { data: null, error: 'Feature not yet implemented' }
}

export async function rejectRoleApplication(
  applicationId: string, 
  adminNotes?: string
): Promise<AuthServiceResult<boolean>> {
  return { data: null, error: 'Feature not yet implemented' }
}

export async function updateUserRole(userId: string, newRole: UserRole): Promise<AuthServiceResult<boolean>> {
  return { data: null, error: 'Feature not yet implemented' }
}

/**
 * Get dashboard route based on user role
 */
export function getDashboardRoute(role: UserRole): string {
  const routes: Record<UserRole, string> = {
    customer: '/dashboard',
    restaurant_owner: '/partner/dashboard',
    rider: '/rider/dashboard'
  }

  return routes[role] || '/dashboard'
}

/**
 * Check if role requires verification
 */
export function roleRequiresVerification(role: UserRole): boolean {
  return ['restaurant_owner', 'rider'].includes(role)
}

/**
 * Get role display name
 */
export function getRoleDisplayName(role: UserRole): string {
  const displayNames: Record<UserRole, string> = {
    customer: 'Customer',
    restaurant_owner: 'Restaurant Partner',
    rider: 'Delivery Rider'
  }

  return displayNames[role] || role
}