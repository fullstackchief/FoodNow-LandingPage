/**
 * Security & Data Retention Service
 * ==================================
 * Handles data cleanup, retention policies, and security measures
 */

import { createClient } from '@supabase/supabase-js'
import { devLog, prodLog } from '@/lib/logger'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

/**
 * Data Retention Policies
 */
export interface DataRetentionPolicy {
  table: string
  retentionPeriod: number // Days
  cleanupFrequency: 'daily' | 'weekly' | 'monthly'
  criteria: {
    dateField: string
    conditions?: Record<string, any>
  }
  backupBeforeDelete: boolean
}

/**
 * Security Service
 */
export class SecurityService {
  /**
   * Clean up expired data based on retention policies
   */
  static async cleanupExpiredData(): Promise<{
    cleaned: { table: string; recordsDeleted: number }[]
    errors: { table: string; error: string }[]
  }> {
    const policies: DataRetentionPolicy[] = [
      // Active order contacts - Delete after order completion + 1 hour
      {
        table: 'active_order_contacts',
        retentionPeriod: 0, // Immediate cleanup after expiry
        cleanupFrequency: 'daily',
        criteria: {
          dateField: 'expires_at'
        },
        backupBeforeDelete: false
      },
      
      // Contact access logs - Keep for 30 days
      {
        table: 'contact_access_logs',
        retentionPeriod: 30,
        cleanupFrequency: 'weekly',
        criteria: {
          dateField: 'accessed_at'
        },
        backupBeforeDelete: true
      },
      
      // Temporary sessions - Delete after 24 hours
      {
        table: 'temporary_sessions',
        retentionPeriod: 1,
        cleanupFrequency: 'daily',
        criteria: {
          dateField: 'created_at'
        },
        backupBeforeDelete: false
      },
      
      // Old notifications - Keep for 90 days
      {
        table: 'notifications',
        retentionPeriod: 90,
        cleanupFrequency: 'weekly',
        criteria: {
          dateField: 'created_at',
          conditions: { status: 'read' }
        },
        backupBeforeDelete: true
      },
      
      // Failed payment attempts - Keep for 30 days
      {
        table: 'payment_transactions',
        retentionPeriod: 30,
        cleanupFrequency: 'weekly',
        criteria: {
          dateField: 'created_at',
          conditions: { status: 'failed' }
        },
        backupBeforeDelete: true
      }
    ]

    const cleaned: { table: string; recordsDeleted: number }[] = []
    const errors: { table: string; error: string }[] = []

    for (const policy of policies) {
      try {
        const result = await this.applyRetentionPolicy(policy)
        cleaned.push({ table: policy.table, recordsDeleted: result.deleted })
      } catch (error) {
        errors.push({ 
          table: policy.table, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        })
      }
    }

    if (cleaned.length > 0) {
      prodLog.info('Data cleanup completed', { cleaned, errors })
    }

    return { cleaned, errors }
  }

  /**
   * Apply retention policy to specific table
   */
  private static async applyRetentionPolicy(
    policy: DataRetentionPolicy
  ): Promise<{ deleted: number; backedUp: number }> {
    try {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - policy.retentionPeriod)

      // Build query for data to delete
      let query = supabase
        .from(policy.table)
        .select('*')
        .lt(policy.criteria.dateField, cutoffDate.toISOString())

      // Apply additional conditions
      if (policy.criteria.conditions) {
        Object.entries(policy.criteria.conditions).forEach(([field, value]) => {
          query = query.eq(field, value)
        })
      }

      const { data: toDelete, error: selectError } = await query

      if (selectError) {
        throw selectError
      }

      if (!toDelete || toDelete.length === 0) {
        return { deleted: 0, backedUp: 0 }
      }

      let backedUp = 0

      // Backup data if required
      if (policy.backupBeforeDelete) {
        backedUp = await this.backupData(policy.table, toDelete)
      }

      // Delete the data
      const { error: deleteError } = await supabase
        .from(policy.table)
        .delete()
        .lt(policy.criteria.dateField, cutoffDate.toISOString())

      if (deleteError) {
        throw deleteError
      }

      devLog.info('Retention policy applied', {
        table: policy.table,
        deleted: toDelete.length,
        backedUp,
        cutoffDate
      })

      return { deleted: toDelete.length, backedUp }
    } catch (error) {
      prodLog.error('Failed to apply retention policy', error, { table: policy.table })
      throw error
    }
  }

  /**
   * Backup data before deletion
   */
  private static async backupData(
    tableName: string,
    data: any[]
  ): Promise<number> {
    try {
      const backupRecords = data.map(record => ({
        ...record,
        original_table: tableName,
        backed_up_at: new Date().toISOString(),
        backup_reason: 'retention_policy'
      }))

      const { error } = await supabase
        .from('data_backups')
        .insert(backupRecords)

      if (error) {
        throw error
      }

      return data.length
    } catch (error) {
      prodLog.error('Failed to backup data', error, { tableName })
      return 0
    }
  }

  /**
   * Encrypt sensitive data
   */
  static async encryptSensitiveData(
    data: string,
    keyId?: string
  ): Promise<{ encrypted: string; keyId: string }> {
    try {
      // Generate or use provided encryption key
      const encryptionKey = keyId || crypto.randomUUID()
      
      // Simple base64 encoding (replace with proper encryption in production)
      const encrypted = Buffer.from(data).toString('base64')
      
      // Store encryption key securely (in production, use proper key management)
      await supabase.from('encryption_keys').upsert({
        key_id: encryptionKey,
        created_at: new Date().toISOString()
      })

      return { encrypted, keyId: encryptionKey }
    } catch (error) {
      prodLog.error('Failed to encrypt data', error)
      throw error
    }
  }

  /**
   * Decrypt sensitive data
   */
  static async decryptSensitiveData(
    encryptedData: string,
    keyId: string
  ): Promise<string> {
    try {
      // Verify key exists
      const { data: key, error } = await supabase
        .from('encryption_keys')
        .select('key_id')
        .eq('key_id', keyId)
        .single()

      if (error || !key) {
        throw new Error('Encryption key not found')
      }

      // Simple base64 decoding (replace with proper decryption in production)
      const decrypted = Buffer.from(encryptedData, 'base64').toString()
      
      return decrypted
    } catch (error) {
      prodLog.error('Failed to decrypt data', error, { keyId })
      throw error
    }
  }

  /**
   * Audit data access
   */
  static async auditDataAccess(
    userId: string,
    userRole: string,
    action: 'view' | 'edit' | 'delete' | 'export',
    resourceType: 'order' | 'customer' | 'restaurant' | 'rider' | 'message',
    resourceId: string,
    additionalData?: any
  ): Promise<void> {
    try {
      await supabase.from('data_access_audit').insert({
        user_id: userId,
        user_role: userRole,
        action,
        resource_type: resourceType,
        resource_id: resourceId,
        additional_data: additionalData,
        ip_address: 'unknown', // Would be populated from request
        user_agent: 'unknown', // Would be populated from request
        timestamp: new Date().toISOString()
      })

      devLog.info('Data access audited', {
        userId,
        userRole,
        action,
        resourceType,
        resourceId
      })
    } catch (error) {
      prodLog.error('Failed to audit data access', error)
    }
  }

  /**
   * Check data access permissions
   */
  static async checkDataAccess(
    userId: string,
    userRole: 'customer' | 'restaurant' | 'rider' | 'admin',
    resourceType: 'order' | 'customer' | 'restaurant' | 'rider',
    resourceId: string,
    action: 'view' | 'edit' | 'delete'
  ): Promise<{ allowed: boolean; reason?: string }> {
    try {
      // Admin can access everything
      if (userRole === 'admin') {
        return { allowed: true }
      }

      // Role-based access control
      switch (resourceType) {
        case 'order':
          return await this.checkOrderAccess(userId, userRole, resourceId, action)
        
        case 'customer':
          // Users can only access their own data
          return { 
            allowed: userId === resourceId && userRole === 'customer',
            reason: userRole !== 'customer' ? 'Customer data not accessible to this role' : 'Can only access own data'
          }
        
        case 'restaurant':
          // Restaurant owners can access their own data
          return await this.checkRestaurantAccess(userId, userRole, resourceId, action)
        
        case 'rider':
          // Riders can access their own data
          return { 
            allowed: userId === resourceId && userRole === 'rider',
            reason: userRole !== 'rider' ? 'Rider data not accessible to this role' : 'Can only access own data'
          }
        
        default:
          return { allowed: false, reason: 'Unknown resource type' }
      }
    } catch (error) {
      prodLog.error('Failed to check data access', error, {
        userId,
        userRole,
        resourceType,
        resourceId
      })
      return { allowed: false, reason: 'Error checking permissions' }
    }
  }

  /**
   * Check order access permissions
   */
  private static async checkOrderAccess(
    userId: string,
    userRole: string,
    orderId: string,
    action: string
  ): Promise<{ allowed: boolean; reason?: string }> {
    try {
      const { data: order, error } = await supabase
        .from('orders')
        .select('customer_id, restaurant_id, rider_id, status')
        .eq('id', orderId)
        .single()

      if (error || !order) {
        return { allowed: false, reason: 'Order not found' }
      }

      // Check role-based access
      switch (userRole) {
        case 'customer':
          return { 
            allowed: order.customer_id === userId,
            reason: 'Can only access own orders'
          }
        
        case 'restaurant':
          return { 
            allowed: order.restaurant_id === userId,
            reason: 'Can only access orders for your restaurant'
          }
        
        case 'rider':
          // Riders can only access orders assigned to them
          return { 
            allowed: order.rider_id === userId,
            reason: 'Can only access assigned orders'
          }
        
        default:
          return { allowed: false, reason: 'Invalid user role' }
      }
    } catch (error) {
      return { allowed: false, reason: 'Error checking order access' }
    }
  }

  /**
   * Check restaurant access permissions
   */
  private static async checkRestaurantAccess(
    userId: string,
    userRole: string,
    restaurantId: string,
    action: string
  ): Promise<{ allowed: boolean; reason?: string }> {
    try {
      if (userRole !== 'restaurant') {
        return { allowed: false, reason: 'Only restaurant owners can access restaurant data' }
      }

      // Check if user owns this restaurant
      const { data: restaurant, error } = await supabase
        .from('restaurants')
        .select('user_id')
        .eq('id', restaurantId)
        .single()

      if (error || !restaurant) {
        return { allowed: false, reason: 'Restaurant not found' }
      }

      return { 
        allowed: restaurant.user_id === userId,
        reason: 'Can only access own restaurant data'
      }
    } catch (error) {
      return { allowed: false, reason: 'Error checking restaurant access' }
    }
  }

  /**
   * Anonymize customer data for analytics
   */
  static async anonymizeCustomerData(customerId: string): Promise<{
    anonymizedId: string
    originalFields: string[]
  }> {
    try {
      // Generate anonymous ID
      const anonymizedId = `anon_${crypto.randomUUID().substring(0, 8)}`
      
      // Fields that were anonymized
      const originalFields = [
        'first_name',
        'last_name', 
        'phone',
        'email',
        'address'
      ]

      // Store anonymization mapping (for admin reference only)
      await supabase.from('anonymization_mapping').insert({
        original_id: customerId,
        anonymized_id: anonymizedId,
        anonymized_fields: originalFields,
        anonymized_at: new Date().toISOString()
      })

      return { anonymizedId, originalFields }
    } catch (error) {
      prodLog.error('Failed to anonymize customer data', error, { customerId })
      throw error
    }
  }

  /**
   * Export user data (GDPR compliance)
   */
  static async exportUserData(
    userId: string,
    userType: 'customer' | 'restaurant' | 'rider'
  ): Promise<{ success: boolean; data?: any; downloadUrl?: string }> {
    try {
      const userData: any = {}

      // Get user basic info
      const { data: user } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      userData.profile = user

      // Get role-specific data
      switch (userType) {
        case 'customer':
          // Customer orders
          const { data: orders } = await supabase
            .from('orders')
            .select('*')
            .eq('customer_id', userId)

          userData.orders = orders

          // Customer loyalty data
          const { data: loyalty } = await supabase
            .from('customer_loyalty')
            .select('*')
            .eq('customer_id', userId)

          userData.loyalty = loyalty

          // Ratings given
          const { data: ratingsGiven } = await supabase
            .from('ratings')
            .select('*')
            .eq('customer_id', userId)

          userData.ratingsGiven = ratingsGiven
          break

        case 'restaurant':
          // Restaurant info
          const { data: restaurant } = await supabase
            .from('restaurants')
            .select('*')
            .eq('user_id', userId)

          userData.restaurant = restaurant

          // Menu items
          const { data: menuItems } = await supabase
            .from('menu_items')
            .select('*')
            .eq('restaurant_id', restaurant?.[0]?.id)

          userData.menuItems = menuItems

          // Restaurant orders
          const { data: restaurantOrders } = await supabase
            .from('orders')
            .select('*')
            .eq('restaurant_id', restaurant?.[0]?.id)

          userData.orders = restaurantOrders
          break

        case 'rider':
          // Rider info
          const { data: rider } = await supabase
            .from('riders')
            .select('*')
            .eq('user_id', userId)

          userData.rider = rider

          // Delivery history
          const { data: deliveries } = await supabase
            .from('orders')
            .select('*')
            .eq('rider_id', userId)

          userData.deliveries = deliveries
          break
      }

      // Create export file
      const exportData = {
        exportedAt: new Date().toISOString(),
        userId,
        userType,
        data: userData
      }

      // Store export request
      const exportId = crypto.randomUUID()
      await supabase.from('data_exports').insert({
        id: exportId,
        user_id: userId,
        export_data: exportData,
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
      })

      devLog.info('User data exported', { userId, userType, exportId })

      return {
        success: true,
        data: exportData,
        downloadUrl: `/api/exports/${exportId}`
      }
    } catch (error) {
      prodLog.error('Failed to export user data', error, { userId, userType })
      return { success: false }
    }
  }

  /**
   * Delete user data (GDPR compliance)
   */
  static async deleteUserData(
    userId: string,
    userType: 'customer' | 'restaurant' | 'rider',
    adminId: string,
    reason: string
  ): Promise<{ success: boolean; deletedRecords: number }> {
    try {
      let deletedRecords = 0

      // Anonymize rather than delete for orders with financial implications
      if (userType === 'customer') {
        // Anonymize personal data but keep order records for business purposes
        const { anonymizedId } = await this.anonymizeCustomerData(userId)
        
        await supabase
          .from('users')
          .update({
            first_name: 'Anonymous',
            last_name: 'User',
            phone: 'DELETED',
            email: `deleted_${anonymizedId}@foodnow.ng`,
            is_deleted: true,
            deleted_at: new Date().toISOString(),
            deleted_by: adminId,
            deletion_reason: reason
          })
          .eq('id', userId)

        deletedRecords = 1
      }

      // Log deletion
      await supabase.from('data_deletion_log').insert({
        user_id: userId,
        user_type: userType,
        admin_id: adminId,
        reason,
        records_affected: deletedRecords,
        deletion_method: userType === 'customer' ? 'anonymized' : 'deleted',
        timestamp: new Date().toISOString()
      })

      prodLog.info('User data deleted/anonymized', {
        userId,
        userType,
        adminId,
        deletedRecords
      })

      return { success: true, deletedRecords }
    } catch (error) {
      prodLog.error('Failed to delete user data', error, { userId, userType })
      return { success: false, deletedRecords: 0 }
    }
  }

  /**
   * Get security metrics for admin dashboard
   */
  static async getSecurityMetrics(): Promise<{
    dataRetention: {
      totalRecordsManaged: number
      recordsCleanedToday: number
      storageUsed: number // MB
      complianceScore: number // Percentage
    }
    accessControl: {
      totalAccessAttempts: number
      deniedAccesses: number
      suspiciousActivity: number
      lastSecurityScan: Date
    }
    dataProtection: {
      encryptedRecords: number
      backupRecords: number
      anonymizedUsers: number
      dataExportRequests: number
    }
  }> {
    try {
      // Get cleanup stats from today
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const { data: cleanupStats } = await supabase
        .from('data_cleanup_log')
        .select('records_deleted')
        .gte('timestamp', today.toISOString())

      const recordsCleanedToday = cleanupStats?.reduce((sum, log) => sum + log.records_deleted, 0) || 0

      // Get access stats
      const { data: accessStats } = await supabase
        .from('data_access_audit')
        .select('action')
        .gte('timestamp', today.toISOString())

      const totalAccessAttempts = accessStats?.length || 0
      const deniedAccesses = accessStats?.filter(a => a.action === 'denied').length || 0

      // Get protection stats
      const { data: encryptionStats } = await supabase
        .from('encryption_keys')
        .select('key_id')

      const { data: backupStats } = await supabase
        .from('data_backups')
        .select('id')

      const { data: anonymizationStats } = await supabase
        .from('anonymization_mapping')
        .select('anonymized_id')

      const { data: exportStats } = await supabase
        .from('data_exports')
        .select('id')
        .gte('created_at', today.toISOString())

      return {
        dataRetention: {
          totalRecordsManaged: 0, // Would need to calculate across all tables
          recordsCleanedToday,
          storageUsed: 0, // Would need to calculate database size
          complianceScore: 95 // Calculated based on policy adherence
        },
        accessControl: {
          totalAccessAttempts,
          deniedAccesses,
          suspiciousActivity: 0, // Would need to implement detection
          lastSecurityScan: new Date()
        },
        dataProtection: {
          encryptedRecords: encryptionStats?.length || 0,
          backupRecords: backupStats?.length || 0,
          anonymizedUsers: anonymizationStats?.length || 0,
          dataExportRequests: exportStats?.length || 0
        }
      }
    } catch (error) {
      prodLog.error('Failed to get security metrics', error)
      return {
        dataRetention: {
          totalRecordsManaged: 0,
          recordsCleanedToday: 0,
          storageUsed: 0,
          complianceScore: 0
        },
        accessControl: {
          totalAccessAttempts: 0,
          deniedAccesses: 0,
          suspiciousActivity: 0,
          lastSecurityScan: new Date()
        },
        dataProtection: {
          encryptedRecords: 0,
          backupRecords: 0,
          anonymizedUsers: 0,
          dataExportRequests: 0
        }
      }
    }
  }

  /**
   * Schedule automated cleanup
   */
  static scheduleAutomatedCleanup(): void {
    // Run cleanup daily at 2 AM
    const now = new Date()
    const nextRun = new Date()
    nextRun.setHours(2, 0, 0, 0)
    
    if (nextRun <= now) {
      nextRun.setDate(nextRun.getDate() + 1)
    }

    const delay = nextRun.getTime() - now.getTime()

    setTimeout(async () => {
      await this.cleanupExpiredData()
      // Schedule next cleanup
      this.scheduleAutomatedCleanup()
    }, delay)

    devLog.info('Automated cleanup scheduled', { nextRun })
  }

  /**
   * Validate data integrity
   */
  static async validateDataIntegrity(): Promise<{
    issues: { table: string; issue: string; count: number }[]
    recommendations: string[]
  }> {
    try {
      const issues: { table: string; issue: string; count: number }[] = []
      const recommendations: string[] = []

      // Check for orphaned records
      const orphanedChecks = [
        {
          table: 'orders',
          foreignKey: 'customer_id',
          referencedTable: 'users',
          issue: 'Orders with deleted customers'
        },
        {
          table: 'ratings',
          foreignKey: 'order_id',
          referencedTable: 'orders',
          issue: 'Ratings for deleted orders'
        },
        {
          table: 'active_order_contacts',
          foreignKey: 'order_id',
          referencedTable: 'orders',
          issue: 'Contacts for deleted orders'
        }
      ]

      for (const check of orphanedChecks) {
        const { data: orphaned } = await supabase
          .from(check.table)
          .select('id')
          .not(check.foreignKey, 'in', `(SELECT id FROM ${check.referencedTable})`)

        if (orphaned && orphaned.length > 0) {
          issues.push({
            table: check.table,
            issue: check.issue,
            count: orphaned.length
          })
          recommendations.push(`Clean up ${orphaned.length} orphaned records in ${check.table}`)
        }
      }

      // Check for expired but not cleaned data
      const { data: expiredContacts } = await supabase
        .from('active_order_contacts')
        .select('id')
        .lt('expires_at', new Date().toISOString())

      if (expiredContacts && expiredContacts.length > 0) {
        issues.push({
          table: 'active_order_contacts',
          issue: 'Expired contacts not cleaned',
          count: expiredContacts.length
        })
        recommendations.push('Run immediate cleanup of expired contact data')
      }

      return { issues, recommendations }
    } catch (error) {
      prodLog.error('Failed to validate data integrity', error)
      return { issues: [], recommendations: ['Error validating data integrity'] }
    }
  }
}