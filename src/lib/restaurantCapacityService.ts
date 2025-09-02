/**
 * Restaurant Capacity Service
 * ===========================
 * Manages restaurant capacity indicators (Available/Busy) with admin controls
 */

import { createClient } from '@supabase/supabase-js'
import type { RestaurantCapacity } from '@/types/order-tracking'
import { devLog, prodLog } from '@/lib/logger'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

/**
 * Restaurant Capacity Management Service
 */
export class RestaurantCapacityService {
  /**
   * Get restaurant capacity status
   */
  static async getRestaurantCapacity(restaurantId: string): Promise<RestaurantCapacity | null> {
    try {
      const { data, error } = await supabase
        .from('restaurant_capacity')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .single()

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      // Create capacity record if doesn't exist
      if (!data) {
        return await this.createCapacityRecord(restaurantId)
      }

      // Update real-time metrics
      await this.updateRealTimeMetrics(restaurantId)

      return data as RestaurantCapacity
    } catch (error) {
      prodLog.error('Failed to get restaurant capacity', error, { restaurantId })
      return null
    }
  }

  /**
   * Create initial capacity record
   */
  static async createCapacityRecord(restaurantId: string): Promise<RestaurantCapacity> {
    try {
      const capacity: Partial<RestaurantCapacity> = {
        restaurantId,
        status: 'Available',
        activeOrders: 0,
        preparingOrders: 0,
        averagePrepTime: 25, // Default from CLAUDE.local.md
        busyThreshold: 10, // Admin-adjustable
        autoRejectThreshold: 20, // Admin-adjustable
        historicalCapacity: []
      }

      const { data, error } = await supabase
        .from('restaurant_capacity')
        .insert(capacity)
        .select()
        .single()

      if (error) {
        throw error
      }

      devLog.info('Restaurant capacity record created', { restaurantId })
      return data as RestaurantCapacity
    } catch (error) {
      prodLog.error('Failed to create capacity record', error, { restaurantId })
      throw error
    }
  }

  /**
   * Update real-time capacity metrics
   */
  static async updateRealTimeMetrics(restaurantId: string): Promise<void> {
    try {
      // Get current order counts
      const { data: orderCounts } = await supabase
        .from('orders')
        .select('status')
        .eq('restaurant_id', restaurantId)
        .in('status', ['restaurant_accepted', 'preparing', 'ready_for_pickup'])

      const activeOrders = orderCounts?.length || 0
      const preparingOrders = orderCounts?.filter(o => o.status === 'preparing').length || 0

      // Calculate average prep time (last 10 orders)
      const { data: recentOrders } = await supabase
        .from('orders')
        .select('created_at, delivered_at')
        .eq('restaurant_id', restaurantId)
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(10)

      let averagePrepTime = 25 // Default
      if (recentOrders && recentOrders.length > 0) {
        const prepTimes = recentOrders
          .filter(order => order.delivered_at)
          .map(order => {
            const created = new Date(order.created_at)
            const delivered = new Date(order.delivered_at!)
            return (delivered.getTime() - created.getTime()) / (1000 * 60) // Minutes
          })

        if (prepTimes.length > 0) {
          averagePrepTime = prepTimes.reduce((sum, time) => sum + time, 0) / prepTimes.length
        }
      }

      // Get current capacity settings
      const { data: capacity } = await supabase
        .from('restaurant_capacity')
        .select('busy_threshold, auto_reject_threshold, manual_status, manual_status_expiry')
        .eq('restaurant_id', restaurantId)
        .single()

      if (!capacity) return

      // Determine status
      let status: 'Available' | 'Busy' = 'Available'

      // Check manual override first
      if (capacity.manual_status && capacity.manual_status_expiry) {
        const expiryDate = new Date(capacity.manual_status_expiry)
        if (expiryDate > new Date()) {
          status = capacity.manual_status as 'Available' | 'Busy'
        } else {
          // Clear expired manual override
          await supabase
            .from('restaurant_capacity')
            .update({
              manual_status: null,
              manual_status_expiry: null
            })
            .eq('restaurant_id', restaurantId)
        }
      } else {
        // Auto-determine status based on thresholds
        if (activeOrders >= capacity.busy_threshold) {
          status = 'Busy'
        }
      }

      // Update capacity record
      await supabase
        .from('restaurant_capacity')
        .update({
          status,
          active_orders: activeOrders,
          preparing_orders: preparingOrders,
          average_prep_time: averagePrepTime,
          updated_at: new Date().toISOString()
        })
        .eq('restaurant_id', restaurantId)

      // Broadcast status change
      await this.broadcastCapacityUpdate(restaurantId, status, activeOrders)

      devLog.info('Restaurant capacity updated', {
        restaurantId,
        status,
        activeOrders,
        averagePrepTime
      })
    } catch (error) {
      prodLog.error('Failed to update real-time metrics', error, { restaurantId })
    }
  }

  /**
   * Set manual restaurant status
   */
  static async setManualStatus(
    restaurantId: string,
    status: 'Available' | 'Busy' | 'Closed',
    reason: string,
    durationHours: number = 2
  ): Promise<boolean> {
    try {
      const expiryTime = new Date(Date.now() + durationHours * 60 * 60 * 1000)

      const { error } = await supabase
        .from('restaurant_capacity')
        .update({
          manual_status: status,
          manual_status_reason: reason,
          manual_status_expiry: expiryTime.toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('restaurant_id', restaurantId)

      if (error) {
        throw error
      }

      // Broadcast status change
      await this.broadcastCapacityUpdate(restaurantId, status as any, null)

      devLog.info('Manual restaurant status set', {
        restaurantId,
        status,
        reason,
        expiryTime
      })

      return true
    } catch (error) {
      prodLog.error('Failed to set manual status', error, { restaurantId })
      return false
    }
  }

  /**
   * Update admin capacity settings
   */
  static async updateCapacitySettings(
    restaurantId: string,
    settings: {
      busyThreshold?: number
      autoRejectThreshold?: number
    }
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('restaurant_capacity')
        .update({
          ...settings,
          updated_at: new Date().toISOString()
        })
        .eq('restaurant_id', restaurantId)

      if (error) {
        throw error
      }

      devLog.info('Restaurant capacity settings updated', {
        restaurantId,
        settings
      })

      return true
    } catch (error) {
      prodLog.error('Failed to update capacity settings', error, { restaurantId })
      return false
    }
  }

  /**
   * Get all restaurants with capacity status
   */
  static async getAllRestaurantsCapacity(): Promise<Array<{
    id: string
    name: string
    status: 'Available' | 'Busy'
    activeOrders: number
    averagePrepTime: number
  }>> {
    try {
      const { data, error } = await supabase
        .from('restaurants')
        .select(`
          id,
          name,
          restaurant_capacity (
            status,
            active_orders,
            average_prep_time
          )
        `)

      if (error) {
        throw error
      }

      return data?.map(restaurant => ({
        id: restaurant.id,
        name: restaurant.name,
        status: (restaurant.restaurant_capacity as any)?.status || 'Available',
        activeOrders: (restaurant.restaurant_capacity as any)?.active_orders || 0,
        averagePrepTime: (restaurant.restaurant_capacity as any)?.average_prep_time || 25
      })) || []
    } catch (error) {
      prodLog.error('Failed to get all restaurants capacity', error)
      return []
    }
  }

  /**
   * Check if restaurant can accept new order
   */
  static async canAcceptOrder(restaurantId: string): Promise<{
    canAccept: boolean
    reason?: string
    estimatedWaitTime?: number
  }> {
    try {
      const capacity = await this.getRestaurantCapacity(restaurantId)
      if (!capacity) {
        return { canAccept: false, reason: 'Capacity information not available' }
      }

      // Check manual override
      if (capacity.manualStatus === 'Closed') {
        return { 
          canAccept: false, 
          reason: capacity.manualStatusReason || 'Restaurant temporarily closed' 
        }
      }

      // Check auto-reject threshold
      if (capacity.activeOrders >= capacity.autoRejectThreshold) {
        return {
          canAccept: false,
          reason: 'Restaurant at maximum capacity',
          estimatedWaitTime: capacity.averagePrepTime * 2
        }
      }

      // Check if busy but still accepting
      if ((capacity as any).status === 'Busy') {
        return {
          canAccept: true,
          reason: 'Restaurant is busy - extended preparation time',
          estimatedWaitTime: capacity.averagePrepTime * 1.5
        }
      }

      return { canAccept: true }
    } catch (error) {
      prodLog.error('Failed to check if restaurant can accept order', error, { restaurantId })
      return { canAccept: false, reason: 'Unable to check capacity' }
    }
  }

  /**
   * Update historical capacity data
   */
  static async updateHistoricalCapacity(restaurantId: string): Promise<void> {
    try {
      const now = new Date()
      const hour = now.getHours()
      const dayOfWeek = now.getDay()

      // Get current day's orders
      const startOfDay = new Date(now)
      startOfDay.setHours(0, 0, 0, 0)

      const { data: todayOrders } = await supabase
        .from('orders')
        .select('created_at')
        .eq('restaurant_id', restaurantId)
        .gte('created_at', startOfDay.toISOString())

      const ordersThisHour = todayOrders?.filter(order => {
        const orderHour = new Date(order.created_at).getHours()
        return orderHour === hour
      }).length || 0

      // Update historical data
      const { data: capacity } = await supabase
        .from('restaurant_capacity')
        .select('historical_capacity')
        .eq('restaurant_id', restaurantId)
        .single()

      if (capacity) {
        const historical = capacity.historical_capacity || []
        
        // Find existing entry for this hour/day combination
        const existingIndex = historical.findIndex((entry: any) => 
          entry.hour === hour && entry.dayOfWeek === dayOfWeek
        )

        if (existingIndex >= 0) {
          // Update existing entry with rolling average
          const existing = historical[existingIndex]
          historical[existingIndex] = {
            ...existing,
            averageOrders: (existing.averageOrders + ordersThisHour) / 2,
            peakCapacity: Math.max(existing.peakCapacity, ordersThisHour)
          }
        } else {
          // Add new entry
          historical.push({
            hour,
            dayOfWeek,
            averageOrders: ordersThisHour,
            peakCapacity: ordersThisHour
          })
        }

        await supabase
          .from('restaurant_capacity')
          .update({ historical_capacity: historical })
          .eq('restaurant_id', restaurantId)
      }
    } catch (error) {
      prodLog.error('Failed to update historical capacity', error, { restaurantId })
    }
  }

  /**
   * Broadcast capacity update to subscribers
   */
  private static async broadcastCapacityUpdate(
    restaurantId: string,
    status: 'Available' | 'Busy',
    activeOrders: number | null
  ): Promise<void> {
    try {
      const channel = supabase.channel(`restaurant:${restaurantId}`)
      
      await channel.send({
        type: 'broadcast',
        event: 'capacity_update',
        payload: {
          restaurantId,
          status,
          activeOrders,
          timestamp: new Date().toISOString()
        }
      })

      devLog.info('Capacity update broadcasted', { restaurantId, status })
    } catch (error) {
      prodLog.error('Failed to broadcast capacity update', error, { restaurantId })
    }
  }

  /**
   * Subscribe to restaurant capacity updates
   */
  static subscribeToCapacityUpdates(
    restaurantId: string,
    onUpdate: (update: { status: string; activeOrders: number }) => void
  ) {
    const channel = supabase
      .channel(`restaurant:${restaurantId}`)
      .on('broadcast', { event: 'capacity_update' }, (payload) => {
        onUpdate(payload.payload)
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }

  /**
   * Get capacity overview for admin dashboard
   */
  static async getCapacityOverview(): Promise<{
    totalRestaurants: number
    availableRestaurants: number
    busyRestaurants: number
    closedRestaurants: number
    totalActiveOrders: number
    averagePrepTime: number
  }> {
    try {
      const { data: capacities } = await supabase
        .from('restaurant_capacity')
        .select('status, active_orders, average_prep_time')

      if (!capacities) {
        return {
          totalRestaurants: 0,
          availableRestaurants: 0,
          busyRestaurants: 0,
          closedRestaurants: 0,
          totalActiveOrders: 0,
          averagePrepTime: 0
        }
      }

      const overview = {
        totalRestaurants: capacities.length,
        availableRestaurants: capacities.filter(c => c.status === 'Available').length,
        busyRestaurants: capacities.filter(c => c.status === 'Busy').length,
        closedRestaurants: capacities.filter(c => c.status === 'Closed').length,
        totalActiveOrders: capacities.reduce((sum, c) => sum + (c.active_orders || 0), 0),
        averagePrepTime: capacities.length > 0 
          ? capacities.reduce((sum, c) => sum + (c.average_prep_time || 0), 0) / capacities.length
          : 0
      }

      return overview
    } catch (error) {
      prodLog.error('Failed to get capacity overview', error)
      return {
        totalRestaurants: 0,
        availableRestaurants: 0,
        busyRestaurants: 0,
        closedRestaurants: 0,
        totalActiveOrders: 0,
        averagePrepTime: 0
      }
    }
  }

  /**
   * Auto-update capacity based on order events
   */
  static async handleOrderEvent(
    restaurantId: string,
    eventType: 'order_created' | 'order_accepted' | 'order_ready' | 'order_completed' | 'order_cancelled'
  ): Promise<void> {
    try {
      await this.updateRealTimeMetrics(restaurantId)

      // Log capacity event for analytics
      await supabase.from('capacity_events').insert({
        restaurant_id: restaurantId,
        event_type: eventType,
        timestamp: new Date().toISOString()
      })

      // Update historical data every hour
      const now = new Date()
      if (now.getMinutes() === 0) { // Top of the hour
        await this.updateHistoricalCapacity(restaurantId)
      }

      devLog.info('Order event processed for capacity', {
        restaurantId,
        eventType
      })
    } catch (error) {
      prodLog.error('Failed to handle order event for capacity', error, {
        restaurantId,
        eventType
      })
    }
  }

  /**
   * Predict busy periods based on historical data
   */
  static async predictBusyPeriods(restaurantId: string): Promise<{
    hour: number
    dayOfWeek: number
    predictedOrders: number
    confidence: number
  }[]> {
    try {
      const { data: capacity } = await supabase
        .from('restaurant_capacity')
        .select('historical_capacity')
        .eq('restaurant_id', restaurantId)
        .single()

      if (!capacity?.historical_capacity) {
        return []
      }

      const historical = capacity.historical_capacity as any[]
      
      // Identify peak periods (orders > average + 1 standard deviation)
      const averageOrders = historical.reduce((sum, entry) => sum + entry.averageOrders, 0) / historical.length
      const variance = historical.reduce((sum, entry) => sum + Math.pow(entry.averageOrders - averageOrders, 2), 0) / historical.length
      const standardDeviation = Math.sqrt(variance)
      const busyThreshold = averageOrders + standardDeviation

      return historical
        .filter(entry => entry.averageOrders > busyThreshold)
        .map(entry => ({
          hour: entry.hour,
          dayOfWeek: entry.dayOfWeek,
          predictedOrders: entry.averageOrders,
          confidence: Math.min(entry.averageOrders / busyThreshold, 1) * 100
        }))
        .sort((a, b) => b.predictedOrders - a.predictedOrders)
    } catch (error) {
      prodLog.error('Failed to predict busy periods', error, { restaurantId })
      return []
    }
  }

  /**
   * Get restaurants sorted by availability and capacity
   */
  static async getRestaurantsByAvailability(): Promise<Array<{
    id: string
    name: string
    status: 'Available' | 'Busy'
    estimatedPrepTime: number
    activeOrders: number
    canAcceptOrders: boolean
  }>> {
    try {
      const { data, error } = await supabase
        .from('restaurants')
        .select(`
          id,
          name,
          restaurant_capacity (
            status,
            active_orders,
            average_prep_time,
            auto_reject_threshold
          )
        `)

      if (error) {
        throw error
      }

      return data?.map(restaurant => {
        const capacity = restaurant.restaurant_capacity
        const canAccept = !capacity || (capacity as any).active_orders < (capacity as any).auto_reject_threshold
        
        return {
          id: restaurant.id,
          name: restaurant.name,
          status: capacity?.status || 'Available',
          estimatedPrepTime: capacity?.average_prep_time || 25,
          activeOrders: capacity?.active_orders || 0,
          canAcceptOrders: canAccept
        }
      }).sort((a, b) => {
        // Sort by availability first, then by prep time
        if (a.canAcceptOrders && !b.canAcceptOrders) return -1
        if (!a.canAcceptOrders && b.canAcceptOrders) return 1
        if (a.status === 'Available' && b.status === 'Busy') return -1
        if (a.status === 'Busy' && b.status === 'Available') return 1
        return a.estimatedPrepTime - b.estimatedPrepTime
      }) || []
    } catch (error) {
      prodLog.error('Failed to get restaurants by availability', error)
      return []
    }
  }
}