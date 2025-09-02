/**
 * NOTIFICATION SERVICE
 * ===================
 * Service for handling real-time notifications and sounds
 */

import { supabase } from '@/lib/supabase-client'
import { devLog, prodLog } from '@/lib/logger'

export interface NotificationConfig {
  soundEnabled: boolean
  vibrationEnabled: boolean
  desktopEnabled: boolean
}

export interface OrderNotification {
  type: 'new_order' | 'order_update' | 'payment_received' | 'rider_assigned'
  orderId: string
  orderNumber: string
  message: string
  urgency: 'low' | 'medium' | 'high'
  data?: any
}

class NotificationService {
  private config: NotificationConfig = {
    soundEnabled: true,
    vibrationEnabled: true,
    desktopEnabled: false
  }
  
  private audioContext: AudioContext | null = null
  private notificationPermission: NotificationPermission = 'default'

  constructor() {
    if (typeof window !== 'undefined') {
      this.initializeService()
    }
  }

  private async initializeService() {
    // Request notification permission
    if ('Notification' in window) {
      this.notificationPermission = await Notification.requestPermission()
    }

    // Initialize audio context for notification sounds
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    } catch (error) {
      console.warn('Audio context not available:', error)
    }
  }

  /**
   * Play notification sound based on urgency
   */
  private playNotificationSound(urgency: 'low' | 'medium' | 'high') {
    if (!this.config.soundEnabled || !this.audioContext) return

    try {
      const oscillator = this.audioContext.createOscillator()
      const gainNode = this.audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(this.audioContext.destination)

      // Different frequencies for different urgencies
      const frequencies = {
        low: 400,
        medium: 600,
        high: 800
      }

      oscillator.frequency.setValueAtTime(frequencies[urgency], this.audioContext.currentTime)
      oscillator.type = 'sine'

      // Volume and duration based on urgency
      const volumes = { low: 0.1, medium: 0.2, high: 0.3 }
      const durations = { low: 200, medium: 300, high: 500 }

      gainNode.gain.setValueAtTime(volumes[urgency], this.audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + durations[urgency] / 1000)

      oscillator.start(this.audioContext.currentTime)
      oscillator.stop(this.audioContext.currentTime + durations[urgency] / 1000)
    } catch (error) {
      console.warn('Failed to play notification sound:', error)
    }
  }

  /**
   * Show desktop notification
   */
  private showDesktopNotification(notification: OrderNotification) {
    if (!this.config.desktopEnabled || this.notificationPermission !== 'granted') return

    try {
      const desktopNotification = new Notification(`FoodNow - ${notification.type}`, {
        body: notification.message,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: notification.orderId, // Prevent duplicate notifications
        requireInteraction: notification.urgency === 'high'
      })

      // Auto close after 5 seconds unless high urgency
      if (notification.urgency !== 'high') {
        setTimeout(() => {
          desktopNotification.close()
        }, 5000)
      }

      desktopNotification.onclick = () => {
        window.focus()
        // Could navigate to specific order
        desktopNotification.close()
      }
    } catch (error) {
      console.warn('Failed to show desktop notification:', error)
    }
  }

  /**
   * Trigger vibration for mobile devices
   */
  private triggerVibration(urgency: 'low' | 'medium' | 'high') {
    if (!this.config.vibrationEnabled || !navigator.vibrate) return

    const patterns = {
      low: [100],
      medium: [100, 100, 100],
      high: [200, 100, 200, 100, 200]
    }

    navigator.vibrate(patterns[urgency])
  }

  /**
   * Send notification
   */
  public notify(notification: OrderNotification) {
    devLog.info('Sending notification', {
      type: notification.type,
      orderId: notification.orderId,
      urgency: notification.urgency
    })

    this.playNotificationSound(notification.urgency)
    this.showDesktopNotification(notification)
    this.triggerVibration(notification.urgency)

    // Log notification for analytics
    prodLog.info('Notification sent', {
      type: notification.type,
      orderId: notification.orderId,
      urgency: notification.urgency,
      timestamp: new Date().toISOString()
    })
  }

  /**
   * Update configuration
   */
  public updateConfig(newConfig: Partial<NotificationConfig>) {
    this.config = { ...this.config, ...newConfig }
    localStorage.setItem('restaurant_notification_config', JSON.stringify(this.config))
  }

  /**
   * Get current configuration
   */
  public getConfig(): NotificationConfig {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('restaurant_notification_config')
      if (saved) {
        this.config = { ...this.config, ...JSON.parse(saved) }
      }
    }
    return this.config
  }

  /**
   * Subscribe to order updates for a restaurant
   */
  public subscribeToRestaurantNotifications(
    restaurantId: string,
    onNewOrder: (order: any) => void,
    onOrderUpdate: (order: any) => void
  ) {
    const subscription = supabase
      .channel(`restaurant-notifications-${restaurantId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders',
          filter: `restaurant_id=eq.${restaurantId}`
        },
        (payload: any) => {
          const order = payload.new
          devLog.info('New order notification', {
            restaurantId,
            orderId: order.id,
            orderNumber: order.order_number
          })

          // Send notification
          this.notify({
            type: 'new_order',
            orderId: order.id,
            orderNumber: order.order_number,
            message: `New order received: ${order.order_number}`,
            urgency: 'high',
            data: order
          })

          onNewOrder(order)
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `restaurant_id=eq.${restaurantId}`
        },
        (payload: any) => {
          const order = payload.new
          const oldOrder = payload.old

          // Only notify for status changes
          if (order.status !== oldOrder.status) {
            let urgency: 'low' | 'medium' | 'high' = 'medium'
            let message = `Order ${order.order_number} is now ${order.status}`

            // Special cases
            if (order.status === 'cancelled') {
              urgency = 'low'
              message = `Order ${order.order_number} was cancelled`
            } else if (order.status === 'ready') {
              urgency = 'medium'
              message = `Order ${order.order_number} is ready for pickup`
            }

            this.notify({
              type: 'order_update',
              orderId: order.id,
              orderNumber: order.order_number,
              message,
              urgency,
              data: { oldStatus: oldOrder.status, newStatus: order.status }
            })
          }

          onOrderUpdate(order)
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }

  /**
   * Test notification system
   */
  public testNotification() {
    this.notify({
      type: 'new_order',
      orderId: 'test-123',
      orderNumber: 'TEST-001',
      message: 'This is a test notification',
      urgency: 'medium'
    })
  }
}

// Export singleton instance
export const notificationService = new NotificationService()

// Export notification helpers
export const playOrderNotification = (urgency: 'low' | 'medium' | 'high' = 'medium') => {
  notificationService.notify({
    type: 'new_order',
    orderId: 'notification',
    orderNumber: 'SOUND',
    message: 'Order notification',
    urgency
  })
}

export const subscribeToRestaurantNotifications = (
  restaurantId: string,
  onNewOrder: (order: any) => void,
  onOrderUpdate: (order: any) => void
) => {
  return notificationService.subscribeToRestaurantNotifications(
    restaurantId,
    onNewOrder,
    onOrderUpdate
  )
}

/**
 * Send notification about application status update
 */
export const sendApplicationStatusNotification = async (
  applicationId: string,
  userId: string,
  status: 'pending' | 'approved' | 'rejected' | 'under_review',
  adminNotes?: string
) => {
  try {
    devLog.info('Sending application status notification', {
      applicationId,
      userId,
      status,
      adminNotes
    })

    // Create notification record in database
    const { data, error } = await (supabase as any)
      .from('notifications')
      .insert({
        user_id: userId,
        type: 'application_status',
        title: `Application ${status === 'approved' ? 'Approved' : status === 'rejected' ? 'Rejected' : 'Update'}`,
        message: status === 'approved' 
          ? 'Congratulations! Your application has been approved. You can now access your dashboard.'
          : status === 'rejected'
          ? `Your application has been rejected. ${adminNotes ? `Reason: ${adminNotes}` : 'Please contact support for more information.'}`
          : 'Your application status has been updated.',
        data: {
          application_id: applicationId,
          status,
          admin_notes: adminNotes
        },
        read: false,
        created_at: new Date().toISOString()
      })

    if (error) {
      prodLog.error('Failed to create notification record', { error, userId, applicationId })
      // Don't throw error, notification is not critical
    }

    // If approved, show success notification in UI if user is online
    if (status === 'approved' && typeof window !== 'undefined') {
      notificationService.notify({
        type: 'order_update',
        orderId: applicationId,
        orderNumber: 'APPLICATION',
        message: 'Your application has been approved!',
        urgency: 'high'
      })
    }

    prodLog.info('Application status notification sent', {
      applicationId,
      userId,
      status,
      timestamp: new Date().toISOString()
    })

    return { success: true }
  } catch (error) {
    prodLog.error('Error sending application status notification', { error, applicationId, userId })
    return { success: false, error }
  }
}

/**
 * Send welcome notification to newly approved user
 */
export const sendWelcomeNotification = async (
  userId: string,
  userRole: 'rider' | 'restaurant',
  userData?: {
    applicant_name?: string
    business_name?: string
    vehicle_type?: string
  }
) => {
  try {
    devLog.info('Sending welcome notification', {
      userId,
      userRole,
      userData
    })

    const title = userRole === 'rider' 
      ? 'Welcome to FoodNow Riders!' 
      : 'Welcome to FoodNow Partners!'

    const message = userRole === 'rider'
      ? `Welcome ${userData?.applicant_name || 'Rider'}! You can now start accepting delivery orders. Check your dashboard for available deliveries in your zone.`
      : `Welcome ${userData?.business_name || 'Partner'}! Your restaurant is now live on FoodNow. Start receiving orders by ensuring your menu is up to date.`

    // Create welcome notification in database
    const { data, error } = await (supabase as any)
      .from('notifications')
      .insert({
        user_id: userId,
        type: 'welcome',
        title,
        message,
        data: {
          user_role: userRole,
          ...userData
        },
        read: false,
        created_at: new Date().toISOString()
      })

    if (error) {
      prodLog.error('Failed to create welcome notification', { error, userId, userRole })
      // Don't throw error, notification is not critical
    }

    // Show welcome notification in UI if user is online
    if (typeof window !== 'undefined') {
      notificationService.notify({
        type: 'order_update',
        orderId: `welcome-${userId}`,
        orderNumber: 'WELCOME',
        message: title,
        urgency: 'medium'
      })
    }

    prodLog.info('Welcome notification sent', {
      userId,
      userRole,
      timestamp: new Date().toISOString()
    })

    return { success: true }
  } catch (error) {
    prodLog.error('Error sending welcome notification', { error, userId, userRole })
    return { success: false, error }
  }
}