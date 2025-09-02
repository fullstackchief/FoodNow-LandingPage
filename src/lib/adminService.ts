/**
 * ADMIN SERVICE FOR EXISTING SYSTEM
 * =================================
 * Works with the existing admin_users table structure
 * Provides admin authentication and permission management
 */

import { supabase } from '@/lib/supabase-client'
import { devLog, prodLog } from '@/lib/logger'
import { sendApplicationStatusNotification, sendWelcomeNotification } from '@/lib/notificationService'
import { logApplicationActivity } from '@/lib/adminActivityLogger'

// Admin role types (based on existing data)
export type AdminRole = 'super_admin' | 'admin' | 'moderator' | 'staff'

// Existing permission structure (based on current table data)
export interface AdminPermissions {
  restaurants: {
    view: boolean
    create: boolean
    edit: boolean
    delete: boolean
    approve: boolean
  }
  users: {
    view: boolean
    delete: boolean
    suspend: boolean
    viewDetails: boolean
  }
  orders: {
    view: boolean
    edit: boolean
    cancel: boolean
    refund: boolean
  }
  analytics: {
    view: boolean
    export: boolean
  }
  settings: {
    view: boolean
    edit: boolean
  }
  admins: {
    view: boolean
    create: boolean
    edit: boolean
    delete: boolean
  }
}

// Admin user interface (matching existing table)
export interface AdminUser {
  id: string
  email: string
  first_name: string
  last_name: string
  role: AdminRole
  permissions: AdminPermissions
  is_active: boolean
  last_login?: string
  password_hash: string
  password_changed_at: string
  session_timeout: number
  must_change_password: boolean
  failed_login_attempts: number
  locked_until?: string
  created_by?: string
  invite_token?: string
  invite_expires_at?: string
  created_at: string
  updated_at: string
}

/**
 * Admin authentication using API route
 */
export async function authenticateAdmin(
  email: string, 
  password: string
): Promise<{ success: boolean; data?: AdminUser; error?: string }> {
  try {
    const response = await fetch('/api/admin/auth', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    })

    const result = await response.json()
    return result

  } catch (error) {
    prodLog.error('Admin authentication failed', error, { email, action: 'admin_login_attempt' })
    return { success: false, error: 'Authentication failed' }
  }
}

/**
 * Get admin user by ID using API route
 */
export async function getAdminById(adminId: string): Promise<AdminUser | null> {
  try {
    const response = await fetch(`/api/admin/users/${adminId}`)
    
    if (!response.ok) {
      return null
    }

    const { data } = await response.json()
    return data

  } catch (error) {
    prodLog.error('Failed to get admin by ID', error, { adminId, action: 'get_admin_by_id' })
    return null
  }
}

/**
 * Get admin role by admin ID (for compatibility)
 */
export async function getAdminRole(adminId: string): Promise<AdminRole | null> {
  try {
    const admin = await getAdminById(adminId)
    return admin?.role || null
  } catch (error) {
    prodLog.error('Failed to get admin role', error, { adminId, action: 'get_admin_role' })
    return null
  }
}

/**
 * Check if admin has specific permission
 */
export async function hasPermission(
  adminId: string,
  category: keyof AdminPermissions,
  permission: string
): Promise<boolean> {
  try {
    const admin = await getAdminById(adminId)
    
    if (!admin) {
      return false
    }

    // Super admin has all permissions
    if (admin.role === 'super_admin') {
      return true
    }

    const permissions = admin.permissions
    const categoryPerms = permissions[category]
    
    if (!categoryPerms || typeof categoryPerms !== 'object') {
      return false
    }

    return (categoryPerms as any)[permission] === true

  } catch (error) {
    prodLog.error('Permission check failed', error, { adminId, category, permission, action: 'permission_check' })
    return false
  }
}

/**
 * Validate admin session (used by AuthContext)
 */
export async function validateAdminSession(adminId: string): Promise<AdminUser | null> {
  try {
    // Use getAdminById which already uses API route
    const admin = await getAdminById(adminId)
    
    if (!admin) {
      return null
    }

    // Update last login through API
    try {
      await fetch(`/api/admin/users/${adminId}/update-login`, {
        method: 'PATCH'
      })
    } catch (error) {
      // Don't fail validation if login update fails
      const errorMessage = error instanceof Error ? error.message : String(error)
      prodLog.warn('Failed to update admin last login', { error: errorMessage, adminId, action: 'update_last_login' })
    }

    return admin

  } catch (error) {
    prodLog.error('Admin session validation failed', error, { adminId, action: 'validate_admin_session' })
    return null
  }
}

/**
 * APPLICATION MANAGEMENT FUNCTIONS
 * ================================
 * Functions for managing rider and restaurant applications
 */

// Application interfaces
export interface ApplicationData {
  id: string
  user_id: string
  requested_role: 'restaurant_owner' | 'rider'
  application_data: any
  status: 'pending' | 'approved' | 'rejected' | 'under_review'
  admin_notes?: string
  reviewed_by?: string
  reviewed_at?: string
  created_at: string
  updated_at: string
  user?: {
    first_name: string
    last_name: string
    email: string
    phone?: string
  }
}

export interface ApplicationUpdateData {
  status: 'pending' | 'approved' | 'rejected' | 'under_review'
  admin_notes?: string
  reviewed_by?: string
}

/**
 * Get all applications with user information
 */
export async function getAllApplications(): Promise<{
  success: boolean
  data?: ApplicationData[]
  error?: string
}> {
  try {
    const { data: applications, error } = await (supabase as any)
      .from('role_applications')
      .select(`
        id,
        user_id,
        requested_role,
        application_data,
        status,
        admin_notes,
        reviewed_by,
        reviewed_at,
        created_at,
        updated_at,
        user:users!role_applications_user_id_fkey(
          first_name,
          last_name,
          email,
          phone
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    devLog.info('Retrieved applications', { count: applications?.length || 0 })
    return { success: true, data: applications || [] }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    prodLog.error('Failed to get applications', { error: errorMessage, action: 'get_all_applications' })
    return { success: false, error: errorMessage }
  }
}

/**
 * Get application by ID with user information
 */
export async function getApplicationById(applicationId: string): Promise<{
  success: boolean
  data?: ApplicationData
  error?: string
}> {
  try {
    const { data: application, error } = await (supabase as any)
      .from('role_applications')
      .select(`
        id,
        user_id,
        requested_role,
        application_data,
        status,
        admin_notes,
        reviewed_by,
        reviewed_at,
        created_at,
        updated_at,
        user:users!role_applications_user_id_fkey(
          first_name,
          last_name,
          email,
          phone
        )
      `)
      .eq('id', applicationId)
      .single()

    if (error) {
      throw error
    }

    if (!application) {
      return { success: false, error: 'Application not found' }
    }

    devLog.info('Retrieved application', { applicationId, role: (application as any).requested_role })
    return { success: true, data: application }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    prodLog.error('Failed to get application', { error: errorMessage, applicationId, action: 'get_application_by_id' })
    return { success: false, error: errorMessage }
  }
}

/**
 * Update application status and add admin notes
 */
export async function updateApplicationStatus(
  applicationId: string,
  updateData: ApplicationUpdateData,
  adminId: string
): Promise<{
  success: boolean
  data?: ApplicationData
  error?: string
}> {
  try {
    // Prepare update data
    const updatePayload = {
      status: updateData.status,
      admin_notes: updateData.admin_notes,
      reviewed_by: adminId,
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { data: updatedApplication, error } = await (supabase as any)
      .from('role_applications')
      .update(updatePayload)
      .eq('id', applicationId)
      .select(`
        id,
        user_id,
        requested_role,
        application_data,
        status,
        admin_notes,
        reviewed_by,
        reviewed_at,
        created_at,
        updated_at,
        user:users!role_applications_user_id_fkey(
          first_name,
          last_name,
          email,
          phone
        )
      `)
      .single()

    if (error) {
      throw error
    }

    // If approved, update user role and send welcome notification
    if (updateData.status === 'approved') {
      const roleUpdateSuccess = await updateUserRole(updatedApplication.user_id, updatedApplication.requested_role)
      
      if (roleUpdateSuccess) {
        // Send welcome notification after successful role update
        await sendWelcomeNotification(
          updatedApplication.user_id,
          updatedApplication.requested_role,
          {
            applicant_name: `${updatedApplication.user?.first_name || ''} ${updatedApplication.user?.last_name || ''}`.trim(),
            business_name: updatedApplication.application_data?.business_name,
            vehicle_type: updatedApplication.application_data?.vehicle_type
          }
        )
      }
    }

    // Send application status notification
    await sendApplicationStatusNotification(
      applicationId,
      updatedApplication.user_id,
      updateData.status,
      updateData.admin_notes
    )

    // Log detailed admin activity
    await logApplicationActivity(
      adminId,
      updateData.status === 'approved' ? 'approve' : 
      updateData.status === 'rejected' ? 'reject' : 'under_review',
      applicationId,
      {
        applicant_name: `${updatedApplication.user?.first_name || ''} ${updatedApplication.user?.last_name || ''}`.trim(),
        applicant_email: updatedApplication.user?.email,
        requested_role: updatedApplication.requested_role,
        previous_status: 'unknown', // Could fetch this if needed
        new_status: updateData.status,
        admin_notes: updateData.admin_notes,
        business_name: updatedApplication.application_data?.business_name,
        vehicle_type: updatedApplication.application_data?.vehicle_type
      }
    )

    prodLog.info('Application status updated', {
      applicationId,
      status: updateData.status,
      adminId,
      action: 'update_application_status'
    })

    return { success: true, data: updatedApplication }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    prodLog.error('Failed to update application status', {
      error: errorMessage,
      applicationId,
      status: updateData.status,
      adminId,
      action: 'update_application_status'
    })
    return { success: false, error: errorMessage }
  }
}

/**
 * Update user role after application approval
 */
async function updateUserRole(userId: string, role: 'restaurant_owner' | 'rider'): Promise<boolean> {
  try {
    const { error } = await (supabase as any)
      .from('users')
      .update({
        user_role: role,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)

    if (error) {
      throw error
    }

    devLog.info('User role updated after approval', { userId, role })
    return true

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    prodLog.error('Failed to update user role', { error: errorMessage, userId, role, action: 'update_user_role' })
    return false
  }
}

/**
 * Get applications by status
 */
export async function getApplicationsByStatus(status: string): Promise<{
  success: boolean
  data?: ApplicationData[]
  error?: string
}> {
  try {
    let query = (supabase as any)
      .from('role_applications')
      .select(`
        id,
        user_id,
        requested_role,
        application_data,
        status,
        admin_notes,
        reviewed_by,
        reviewed_at,
        created_at,
        updated_at,
        user:users!role_applications_user_id_fkey(
          first_name,
          last_name,
          email,
          phone
        )
      `)
      .order('created_at', { ascending: false })

    if (status !== 'all') {
      query = query.eq('status', status)
    }

    const { data: applications, error } = await query

    if (error) {
      throw error
    }

    devLog.info('Retrieved applications by status', { status, count: applications?.length || 0 })
    return { success: true, data: applications || [] }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    prodLog.error('Failed to get applications by status', { error: errorMessage, status, action: 'get_applications_by_status' })
    return { success: false, error: errorMessage }
  }
}

/**
 * Get applications by role
 */
export async function getApplicationsByRole(role: string): Promise<{
  success: boolean
  data?: ApplicationData[]
  error?: string
}> {
  try {
    let query = (supabase as any)
      .from('role_applications')
      .select(`
        id,
        user_id,
        requested_role,
        application_data,
        status,
        admin_notes,
        reviewed_by,
        reviewed_at,
        created_at,
        updated_at,
        user:users!role_applications_user_id_fkey(
          first_name,
          last_name,
          email,
          phone
        )
      `)
      .order('created_at', { ascending: false })

    if (role !== 'all') {
      query = query.eq('requested_role', role)
    }

    const { data: applications, error } = await query

    if (error) {
      throw error
    }

    devLog.info('Retrieved applications by role', { role, count: applications?.length || 0 })
    return { success: true, data: applications || [] }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    prodLog.error('Failed to get applications by role', { error: errorMessage, role, action: 'get_applications_by_role' })
    return { success: false, error: errorMessage }
  }
}

/**
 * ADMIN ACTIVITY LOGGING
 * ======================
 */

export interface AdminActivityLog {
  id?: string
  admin_id: string
  action: string
  details: any
  ip_address?: string
  user_agent?: string
  created_at?: string
}

/**
 * Log admin activity
 */
export async function logAdminActivity(
  adminId: string,
  action: string,
  details: any,
  ipAddress?: string,
  userAgent?: string
): Promise<boolean> {
  try {
    // For now, we'll use console logging and could extend to a dedicated admin_activity_logs table later
    const logEntry = {
      admin_id: adminId,
      action,
      details,
      ip_address: ipAddress,
      user_agent: userAgent,
      timestamp: new Date().toISOString()
    }

    prodLog.info('Admin activity logged', logEntry)
    
    // In a production environment, you might want to store this in a dedicated table
    // const { error } = await supabase
    //   .from('admin_activity_logs')
    //   .insert(logEntry)

    return true

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    prodLog.error('Failed to log admin activity', { error: errorMessage, adminId, action })
    return false
  }
}


// End of admin service