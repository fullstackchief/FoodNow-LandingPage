/**
 * Order Tracking Service
 * ======================
 * Real-time order status tracking and participant visibility management
 */

import { createClient } from '@supabase/supabase-js'
import type { 
  OrderStatus, 
  OrderTracking, 
  ActiveOrderContacts,
  OrderStatusUpdate,
  OrderUpdate,
  OrderTimelineEvent
} from '@/types/order-tracking'
import { devLog, prodLog } from '@/lib/logger'

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

/**
 * Order Status Management
 */
export class OrderTrackingService {
  /**
   * Get current order tracking status
   */
  static async getOrderTracking(orderId: string): Promise<OrderTracking | null> {
    try {
      const { data, error } = await supabase
        .from('order_tracking')
        .select('*')
        .eq('order_id', orderId)
        .single()

      if (error) {
        prodLog.error('Failed to fetch order tracking', error, { orderId })
        return null
      }

      return data as OrderTracking
    } catch (error) {
      prodLog.error('Error in getOrderTracking', error, { orderId })
      return null
    }
  }

  /**
   * Update order status with validation
   */
  static async updateOrderStatus(
    orderId: string,
    newStatus: OrderStatus,
    updatedBy: 'customer' | 'restaurant' | 'rider' | 'admin' | 'system',
    notes?: string
  ): Promise<boolean> {
    try {
      // Get current status
      const tracking = await OrderTrackingService.getOrderTracking(orderId)
      if (!tracking) {
        throw new Error('Order tracking not found')
      }

      // Validate status transition
      if (!this.isValidStatusTransition(tracking.currentStatus, newStatus)) {
        prodLog.warn('Invalid status transition attempted', {
          orderId,
          currentStatus: tracking.currentStatus,
          newStatus,
          updatedBy
        })
        return false
      }

      // Create status update record
      const statusUpdate: OrderStatusUpdate = {
        orderId,
        previousStatus: tracking.currentStatus,
        newStatus,
        timestamp: new Date(),
        updatedBy,
        notes
      }

      // Update tracking record
      const { error: updateError } = await supabase
        .from('order_tracking')
        .update({
          current_status: newStatus,
          status_history: [...(tracking.statusHistory || []), statusUpdate],
          updated_at: new Date().toISOString()
        })
        .eq('order_id', orderId)

      if (updateError) {
        throw updateError
      }

      // Send real-time notification
      await OrderTrackingService.broadcastStatusUpdate(orderId, newStatus, updatedBy)

      // Handle status-specific actions
      await OrderTrackingService.handleStatusActions(orderId, newStatus)

      devLog.info('Order status updated successfully', {
        orderId,
        newStatus,
        updatedBy
      })

      return true
    } catch (error) {
      prodLog.error('Failed to update order status', error, {
        orderId,
        newStatus,
        updatedBy
      })
      return false
    }
  }

  /**
   * Validate status transitions
   */
  private static isValidStatusTransition(
    currentStatus: OrderStatus,
    newStatus: OrderStatus
  ): boolean {
    const validTransitions: Record<OrderStatus, OrderStatus[]> = {
      'order_placed': ['payment_confirmed', 'cancelled'],
      'payment_confirmed': ['restaurant_accepted', 'cancelled'],
      'restaurant_accepted': ['preparing', 'cancelled'],
      'preparing': ['ready_for_pickup', 'cancelled'],
      'ready_for_pickup': ['rider_assigned', 'cancelled'],
      'rider_assigned': ['rider_en_route', 'cancelled'],
      'rider_en_route': ['picked_up', 'cancelled'],
      'picked_up': ['out_for_delivery', 'cancelled'],
      'out_for_delivery': ['delivered', 'cancelled'],
      'delivered': ['completed'],
      'completed': [],
      'cancelled': []
    }

    return validTransitions[currentStatus]?.includes(newStatus) || false
  }

  /**
   * Handle status-specific actions
   */
  private static async handleStatusActions(
    orderId: string,
    status: OrderStatus
  ): Promise<void> {
    switch (status) {
      case 'rider_assigned':
        // Create temporary contact visibility
        await ActiveOrderContactsService.createActiveOrderContacts(orderId)
        break
        
      case 'completed':
      case 'cancelled':
        // Remove temporary contact visibility
        await ActiveOrderContactsService.removeActiveOrderContacts(orderId)
        break
        
      case 'restaurant_accepted':
        // Start preparation timer
        // TODO: Implement preparation timer
        break
        
      case 'delivered':
        // Trigger rating request
        // TODO: Implement rating request
        break
    }
  }

  /**
   * Broadcast real-time status updates
   */
  private static async broadcastStatusUpdate(
    orderId: string,
    status: OrderStatus,
    updatedBy: string
  ): Promise<void> {
    const channel = supabase.channel(`order:${orderId}`)
    
    await channel.send({
      type: 'broadcast',
      event: 'status_update',
      payload: {
        orderId,
        status,
        updatedBy,
        timestamp: new Date().toISOString()
      }
    })
  }

  /**
   * Subscribe to order updates
   */
  static subscribeToOrderUpdates(
    orderId: string,
    onUpdate: (update: OrderUpdate) => void
  ) {
    const channel = supabase
      .channel(`order:${orderId}`)
      .on('broadcast', { event: 'status_update' }, (payload) => {
        onUpdate(payload.payload as OrderUpdate)
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }
}

/**
 * Active Order Contacts Management
 */
export class ActiveOrderContactsService {
  /**
   * Create temporary contact visibility for active order
   */
  static async createActiveOrderContacts(orderId: string): Promise<boolean> {
    try {
      // Fetch order details
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select(`
          *,
          customer:users!customer_id(*),
          restaurant:restaurants(*),
          rider:users!rider_id(*)
        `)
        .eq('id', orderId)
        .single()

      if (orderError || !order) {
        throw new Error('Order not found')
      }

      // Create contacts record with encryption
      const contacts: ActiveOrderContacts = {
        orderId,
        customer: {
          id: order.customer_id,
          name: `${order.customer.first_name} ${order.customer.last_name}`,
          phone: await ActiveOrderContactsService.encryptData(order.customer.phone),
          address: await ActiveOrderContactsService.encryptData(order.delivery_address),
          deliveryInstructions: order.delivery_instructions
        },
        rider: order.rider ? {
          id: order.rider_id,
          name: `${order.rider.first_name} ${order.rider.last_name}`,
          phone: order.rider.phone, // Not encrypted - visible to customer
          vehicleType: order.rider.vehicle_type || 'bicycle',
          estimatedArrival: order.estimated_delivery_time
        } : undefined,
        restaurant: {
          id: order.restaurant_id,
          name: order.restaurant.name,
          phone: order.restaurant.phone,
          address: order.restaurant.address,
          pickupInstructions: order.restaurant.pickup_instructions
        },
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour after creation
        encryptionKey: await ActiveOrderContactsService.generateEncryptionKey(),
        accessLog: []
      }

      // Store in database
      const { error: insertError } = await supabase
        .from('active_order_contacts')
        .insert(contacts)

      if (insertError) {
        throw insertError
      }

      // Schedule automatic cleanup
      this.scheduleContactsCleanup(orderId, contacts.expiresAt)

      devLog.info('Active order contacts created', { orderId })
      return true
    } catch (error) {
      prodLog.error('Failed to create active order contacts', error, { orderId })
      return false
    }
  }

  /**
   * Get active order contacts with access control
   */
  static async getActiveOrderContacts(
    orderId: string,
    userId: string,
    userRole: 'customer' | 'restaurant' | 'rider' | 'admin'
  ): Promise<Partial<ActiveOrderContacts> | null> {
    try {
      // Fetch contacts
      const { data: contacts, error } = await supabase
        .from('active_order_contacts')
        .select('*')
        .eq('order_id', orderId)
        .single()

      if (error || !contacts) {
        return null
      }

      // Check if expired
      if (new Date(contacts.expires_at) < new Date()) {
        await ActiveOrderContactsService.removeActiveOrderContacts(orderId)
        return null
      }

      // Log access
      await ActiveOrderContactsService.logContactAccess(orderId, userId, userRole)

      // Apply role-based filtering
      return ActiveOrderContactsService.filterContactsByRole(contacts, userRole)
    } catch (error) {
      prodLog.error('Failed to get active order contacts', error, {
        orderId,
        userId,
        userRole
      })
      return null
    }
  }

  /**
   * Filter contacts based on user role
   */
  private static filterContactsByRole(
    contacts: ActiveOrderContacts,
    userRole: 'customer' | 'restaurant' | 'rider' | 'admin'
  ): Partial<ActiveOrderContacts> {
    switch (userRole) {
      case 'customer':
        // Customer sees rider info but not other customer data
        return {
          orderId: contacts.orderId,
          rider: contacts.rider,
          restaurant: {
            ...contacts.restaurant,
            phone: '' // Hide restaurant phone from customer
          }
        }
        
      case 'restaurant':
        // Restaurant sees rider info but not customer data
        return {
          orderId: contacts.orderId,
          rider: contacts.rider,
          customer: undefined // Hide all customer data
        }
        
      case 'rider':
        // Rider sees customer and restaurant data during delivery
        return {
          orderId: contacts.orderId,
          customer: {
            ...contacts.customer,
            phone: this.decryptData(contacts.customer.phone),
            address: this.decryptData(contacts.customer.address)
          },
          restaurant: contacts.restaurant
        }
        
      case 'admin':
        // Admin sees everything
        return {
          ...contacts,
          customer: {
            ...contacts.customer,
            phone: this.decryptData(contacts.customer.phone),
            address: this.decryptData(contacts.customer.address)
          }
        }
        
      default:
        return { orderId: contacts.orderId }
    }
  }

  /**
   * Remove active order contacts
   */
  static async removeActiveOrderContacts(orderId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('active_order_contacts')
        .delete()
        .eq('order_id', orderId)

      if (error) {
        throw error
      }

      devLog.info('Active order contacts removed', { orderId })
      return true
    } catch (error) {
      prodLog.error('Failed to remove active order contacts', error, { orderId })
      return false
    }
  }

  /**
   * Schedule automatic cleanup of contacts
   */
  private static scheduleContactsCleanup(orderId: string, expiryTime: Date): void {
    const delay = expiryTime.getTime() - Date.now()
    
    setTimeout(async () => {
      await ActiveOrderContactsService.removeActiveOrderContacts(orderId)
      devLog.info('Auto-cleaned expired order contacts', { orderId })
    }, delay)
  }

  /**
   * Log contact access for audit
   */
  private static async logContactAccess(
    orderId: string,
    userId: string,
    userRole: string
  ): Promise<void> {
    await supabase.from('contact_access_logs').insert({
      order_id: orderId,
      user_id: userId,
      user_role: userRole,
      accessed_at: new Date().toISOString()
    })
  }

  /**
   * Encryption helpers (simplified - use proper encryption in production)
   */
  private static async encryptData(data: string): Promise<string> {
    // TODO: Implement proper encryption
    return Buffer.from(data).toString('base64')
  }

  private static decryptData(encryptedData: string): string {
    // TODO: Implement proper decryption
    return Buffer.from(encryptedData, 'base64').toString()
  }

  private static async generateEncryptionKey(): Promise<string> {
    // TODO: Generate proper encryption key
    return Math.random().toString(36).substring(2)
  }
}

/**
 * Order Timeline Service
 */
export class OrderTimelineService {
  /**
   * Add event to order timeline
   */
  static async addTimelineEvent(
    orderId: string,
    eventType: 'status_change' | 'message' | 'issue' | 'update',
    eventData: any,
    actor: { id: string; role: 'rider' | 'admin' | 'customer' | 'restaurant' | 'system'; name?: string },
    isPublic: boolean = true
  ): Promise<boolean> {
    try {
      const event: OrderTimelineEvent = {
        orderId,
        eventType,
        eventData,
        timestamp: new Date(),
        actor,
        isPublic
      }

      const { error } = await supabase
        .from('order_timeline')
        .insert(event)

      if (error) {
        throw error
      }

      return true
    } catch (error) {
      prodLog.error('Failed to add timeline event', error, { orderId, eventType })
      return false
    }
  }

  /**
   * Get order timeline
   */
  static async getOrderTimeline(
    orderId: string,
    userRole: 'customer' | 'restaurant' | 'rider' | 'admin'
  ): Promise<OrderTimelineEvent[]> {
    try {
      let query = supabase
        .from('order_timeline')
        .select('*')
        .eq('order_id', orderId)
        .order('timestamp', { ascending: true })

      // Filter public events for non-admin users
      if (userRole !== 'admin') {
        query = query.eq('is_public', true)
      }

      const { data, error } = await query

      if (error) {
        throw error
      }

      return data as OrderTimelineEvent[]
    } catch (error) {
      prodLog.error('Failed to get order timeline', error, { orderId })
      return []
    }
  }
}

// Helper functions
const startPreparationTimer = async (orderId: string) => {
  // Implementation for preparation timer
  devLog.info('Preparation timer started', { orderId })
}

const triggerRatingRequest = async (orderId: string) => {
  // Implementation for rating request
  devLog.info('Rating request triggered', { orderId })
}