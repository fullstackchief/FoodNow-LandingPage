/**
 * ADMIN ACTIVITY LOGGING SYSTEM
 * =============================
 * Comprehensive logging system for admin activities and audit trails
 */

import { prodLog, devLog } from '@/lib/logger'
import { supabase } from '@/lib/supabase-client'

export interface AdminActivity {
  id?: string
  admin_id: string
  action: AdminActionType
  resource_type?: string
  resource_id?: string
  details: Record<string, any>
  ip_address?: string
  user_agent?: string
  session_id?: string
  success: boolean
  error_message?: string
  created_at?: string
}

export type AdminActionType = 
  | 'login'
  | 'logout'
  | 'application_view'
  | 'application_status_update'
  | 'application_approve'
  | 'application_reject'
  | 'application_under_review'
  | 'batch_application_update'
  | 'user_role_update'
  | 'admin_settings_update'
  | 'permission_grant'
  | 'permission_revoke'
  | 'document_download'
  | 'document_view'
  | 'notification_send'
  | 'data_export'
  | 'system_configuration'

export interface AdminActivityFilter {
  admin_id?: string
  action?: AdminActionType
  resource_type?: string
  success?: boolean
  date_from?: string
  date_to?: string
  limit?: number
  offset?: number
}

export interface AdminActivitySummary {
  total_activities: number
  activities_today: number
  activities_this_week: number
  activities_this_month: number
  most_active_admin: {
    admin_id: string
    activity_count: number
  } | null
  most_common_action: {
    action: AdminActionType
    count: number
  } | null
  success_rate: number
  recent_activities: AdminActivity[]
}

/**
 * Log admin activity with comprehensive details
 */
export async function logAdminActivity(
  activity: Omit<AdminActivity, 'id' | 'created_at'>
): Promise<boolean> {
  try {
    // Enhanced activity logging with request context
    const logEntry: AdminActivity = {
      ...activity,
      created_at: new Date().toISOString()
    }

    // Log to our production logging system
    prodLog.info('Admin activity logged', {
      ...logEntry,
      component: 'admin_activity_logger',
      action: 'log_activity'
    })

    // In a production environment, you would store this in a dedicated table
    // For now, we'll use detailed console logging with structured data
    devLog.info('Admin Activity Details', {
      timestamp: logEntry.created_at,
      admin_id: logEntry.admin_id,
      action: logEntry.action,
      resource: logEntry.resource_type ? `${logEntry.resource_type}:${logEntry.resource_id}` : 'N/A',
      success: logEntry.success,
      details: logEntry.details,
      ip_address: logEntry.ip_address,
      user_agent: logEntry.user_agent?.substring(0, 100), // Truncate long user agents
      session_id: logEntry.session_id
    })

    // TODO: In production, implement database storage
    // const { error } = await supabase
    //   .from('admin_activity_logs')
    //   .insert(logEntry)
    
    // if (error) {
    //   throw error
    // }

    return true

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    prodLog.error('Failed to log admin activity', {
      error: errorMessage,
      admin_id: activity.admin_id,
      action: activity.action,
      component: 'admin_activity_logger'
    })
    return false
  }
}

/**
 * Log application-specific admin actions with enhanced context
 */
export async function logApplicationActivity(
  adminId: string,
  action: 'view' | 'approve' | 'reject' | 'under_review' | 'update_notes',
  applicationId: string,
  details: {
    applicant_name?: string
    applicant_email?: string
    requested_role?: string
    previous_status?: string
    new_status?: string
    admin_notes?: string
    [key: string]: any
  },
  requestContext?: {
    ip_address?: string
    user_agent?: string
    session_id?: string
  }
): Promise<boolean> {
  
  const actionMap: Record<string, AdminActionType> = {
    'view': 'application_view',
    'approve': 'application_approve',
    'reject': 'application_reject',
    'under_review': 'application_under_review',
    'update_notes': 'application_status_update'
  }

  return logAdminActivity({
    admin_id: adminId,
    action: actionMap[action] || 'application_status_update',
    resource_type: 'application',
    resource_id: applicationId,
    details: {
      action_type: action,
      ...details,
      timestamp: new Date().toISOString()
    },
    success: true,
    ip_address: requestContext?.ip_address,
    user_agent: requestContext?.user_agent,
    session_id: requestContext?.session_id
  })
}

/**
 * Log batch operations with detailed tracking
 */
export async function logBatchActivity(
  adminId: string,
  action: 'batch_approve' | 'batch_reject' | 'batch_under_review',
  applicationIds: string[],
  results: {
    successful: string[]
    failed: Array<{ id: string; error: string }>
  },
  requestContext?: {
    ip_address?: string
    user_agent?: string
    session_id?: string
  }
): Promise<boolean> {
  
  return logAdminActivity({
    admin_id: adminId,
    action: 'batch_application_update',
    resource_type: 'applications',
    resource_id: `batch_${applicationIds.length}`,
    details: {
      batch_action: action,
      total_requested: applicationIds.length,
      successful_count: results.successful.length,
      failed_count: results.failed.length,
      successful_ids: results.successful,
      failed_items: results.failed,
      success_rate: Math.round((results.successful.length / applicationIds.length) * 100)
    },
    success: results.failed.length === 0,
    error_message: results.failed.length > 0 ? `${results.failed.length} applications failed to update` : undefined,
    ip_address: requestContext?.ip_address,
    user_agent: requestContext?.user_agent,
    session_id: requestContext?.session_id
  })
}

/**
 * Log document access for security audit
 */
export async function logDocumentAccess(
  adminId: string,
  action: 'view' | 'download',
  documentInfo: {
    application_id: string
    document_type: string
    document_name?: string
    applicant_name?: string
  },
  requestContext?: {
    ip_address?: string
    user_agent?: string
    session_id?: string
  }
): Promise<boolean> {
  
  return logAdminActivity({
    admin_id: adminId,
    action: action === 'view' ? 'document_view' : 'document_download',
    resource_type: 'document',
    resource_id: `${documentInfo.application_id}_${documentInfo.document_type}`,
    details: {
      document_action: action,
      application_id: documentInfo.application_id,
      document_type: documentInfo.document_type,
      document_name: documentInfo.document_name,
      applicant_name: documentInfo.applicant_name,
      security_note: 'Document access logged for audit compliance'
    },
    success: true,
    ip_address: requestContext?.ip_address,
    user_agent: requestContext?.user_agent,
    session_id: requestContext?.session_id
  })
}

/**
 * Log admin authentication events
 */
export async function logAuthActivity(
  adminId: string,
  action: 'login' | 'logout' | 'session_expired' | 'access_denied',
  details: {
    email?: string
    role?: string
    permissions?: any
    reason?: string
    [key: string]: any
  },
  success: boolean = true,
  requestContext?: {
    ip_address?: string
    user_agent?: string
    session_id?: string
  }
): Promise<boolean> {
  
  return logAdminActivity({
    admin_id: adminId,
    action: action === 'login' ? 'login' : 'logout',
    resource_type: 'auth_session',
    resource_id: requestContext?.session_id || `auth_${Date.now()}`,
    details: {
      auth_action: action,
      ...details,
      security_event: true
    },
    success,
    error_message: !success ? details.reason : undefined,
    ip_address: requestContext?.ip_address,
    user_agent: requestContext?.user_agent,
    session_id: requestContext?.session_id
  })
}

/**
 * Get admin activity summary for dashboard
 */
export async function getAdminActivitySummary(
  timeframe: 'day' | 'week' | 'month' = 'week'
): Promise<AdminActivitySummary> {
  try {
    // In production, this would query the admin_activity_logs table
    // For now, return a mock summary based on our logging
    
    const mockSummary: AdminActivitySummary = {
      total_activities: 0,
      activities_today: 0,
      activities_this_week: 0,
      activities_this_month: 0,
      most_active_admin: null,
      most_common_action: null,
      success_rate: 100,
      recent_activities: []
    }

    devLog.info('Admin activity summary generated', {
      timeframe,
      summary: mockSummary,
      note: 'Mock data - implement database queries in production'
    })

    return mockSummary

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    prodLog.error('Failed to generate admin activity summary', {
      error: errorMessage,
      timeframe,
      component: 'admin_activity_logger'
    })
    
    throw new Error('Failed to generate activity summary')
  }
}

/**
 * Search admin activities with filters
 */
export async function searchAdminActivities(
  filters: AdminActivityFilter
): Promise<{
  activities: AdminActivity[]
  total: number
  page: number
  total_pages: number
}> {
  try {
    // In production, this would query the database with proper filtering
    // For now, return empty results
    
    const result = {
      activities: [],
      total: 0,
      page: Math.floor((filters.offset || 0) / (filters.limit || 50)) + 1,
      total_pages: 0
    }

    devLog.info('Admin activities searched', {
      filters,
      result_count: result.total,
      note: 'Mock data - implement database queries in production'
    })

    return result

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    prodLog.error('Failed to search admin activities', {
      error: errorMessage,
      filters,
      component: 'admin_activity_logger'
    })
    
    throw new Error('Failed to search activities')
  }
}

/**
 * Export admin activities for compliance audit
 */
export async function exportAdminActivities(
  filters: AdminActivityFilter,
  format: 'json' | 'csv' = 'json'
): Promise<{
  data: string
  filename: string
  mime_type: string
}> {
  try {
    const activities = await searchAdminActivities(filters)
    
    let exportData: string
    let filename: string
    let mime_type: string

    if (format === 'csv') {
      // Convert to CSV format
      const headers = ['Timestamp', 'Admin ID', 'Action', 'Resource', 'Success', 'IP Address', 'Details']
      const csvRows = [headers.join(',')]
      
      activities.activities.forEach(activity => {
        const row = [
          activity.created_at || '',
          activity.admin_id,
          activity.action,
          `${activity.resource_type || ''}:${activity.resource_id || ''}`,
          activity.success ? 'Yes' : 'No',
          activity.ip_address || '',
          JSON.stringify(activity.details).replace(/"/g, '""')
        ]
        csvRows.push(row.map(field => `"${field}"`).join(','))
      })
      
      exportData = csvRows.join('\n')
      filename = `admin_activities_${new Date().toISOString().split('T')[0]}.csv`
      mime_type = 'text/csv'
      
    } else {
      // JSON format
      exportData = JSON.stringify({
        exported_at: new Date().toISOString(),
        filters,
        total_records: activities.total,
        activities: activities.activities
      }, null, 2)
      filename = `admin_activities_${new Date().toISOString().split('T')[0]}.json`
      mime_type = 'application/json'
    }

    prodLog.info('Admin activities exported', {
      format,
      record_count: activities.total,
      filename,
      component: 'admin_activity_logger'
    })

    return {
      data: exportData,
      filename,
      mime_type
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    prodLog.error('Failed to export admin activities', {
      error: errorMessage,
      filters,
      format,
      component: 'admin_activity_logger'
    })
    
    throw new Error('Failed to export activities')
  }
}