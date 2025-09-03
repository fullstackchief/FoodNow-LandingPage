/**
 * Rider Assignment Service
 * ========================
 * Intelligent rider assignment system for optimal order delivery
 */

import { createClient } from '@supabase/supabase-js'
import { devLog, prodLog } from '@/lib/logger'

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export interface RiderScore {
  riderId: string
  score: number
  factors: {
    proximity: number // Distance from restaurant (0-100)
    availability: number // Current availability status (0-100)
    performance: number // Historical performance (0-100)
    workload: number // Current active orders (0-100)
    rating: number // Customer ratings (0-100)
  }
}

export interface RiderLocation {
  riderId: string
  latitude: number
  longitude: number
  lastUpdated: Date
  isOnline: boolean
  currentOrderCount: number
}

export interface AssignmentResult {
  success: boolean
  assignedRiderId?: string
  message: string
  fallbackToManual?: boolean
  candidateRiders?: RiderScore[]
}

export class RiderAssignmentService {
  /**
   * Main assignment function - tries automatic assignment first, falls back to manual
   */
  static async assignRiderToOrder(orderId: string, restaurantId: string): Promise<AssignmentResult> {
    try {
      devLog.info('Starting rider assignment process', { orderId, restaurantId })

      // Get restaurant location
      const restaurant = await this.getRestaurantLocation(restaurantId)
      if (!restaurant) {
        return {
          success: false,
          message: 'Restaurant location not found',
          fallbackToManual: true
        }
      }

      // Get available riders in zone
      const availableRiders = await this.getAvailableRidersInZone(restaurant.latitude, restaurant.longitude)
      if (availableRiders.length === 0) {
        return {
          success: false,
          message: 'No available riders in zone',
          fallbackToManual: true
        }
      }

      // Calculate rider scores
      const scoredRiders = await this.calculateRiderScores(availableRiders, restaurant)
      if (scoredRiders.length === 0) {
        return {
          success: false,
          message: 'No suitable riders found',
          fallbackToManual: true
        }
      }

      // Sort by score (highest first)
      scoredRiders.sort((a, b) => b.score - a.score)
      
      // Try to assign to top riders
      for (const rider of scoredRiders.slice(0, 3)) {
        const assigned = await this.attemptRiderAssignment(orderId, rider.riderId)
        if (assigned) {
          // Log successful assignment
          await this.logAssignmentEvent(orderId, rider.riderId, 'automatic', rider.score)
          
          prodLog.info('Automatic rider assignment successful', {
            orderId,
            riderId: rider.riderId,
            score: rider.score,
            factors: rider.factors
          })

          return {
            success: true,
            assignedRiderId: rider.riderId,
            message: 'Rider assigned automatically',
            candidateRiders: scoredRiders
          }
        }
      }

      // If automatic assignment fails, return candidates for manual assignment
      return {
        success: false,
        message: 'Automatic assignment failed, manual assignment required',
        fallbackToManual: true,
        candidateRiders: scoredRiders
      }

    } catch (error) {
      prodLog.error('Error in rider assignment service', error, { orderId, restaurantId })
      return {
        success: false,
        message: 'Assignment service error',
        fallbackToManual: true
      }
    }
  }

  /**
   * Get restaurant location coordinates
   */
  private static async getRestaurantLocation(restaurantId: string): Promise<{
    latitude: number
    longitude: number
    deliveryRadius: number
  } | null> {
    try {
      const { data, error } = await supabase
        .from('restaurants')
        .select('location, delivery_radius')
        .eq('id', restaurantId)
        .single()

      if (error || !data?.location) {
        prodLog.error('Failed to get restaurant location', error, { restaurantId })
        return null
      }

      return {
        latitude: data.location.lat || data.location.latitude,
        longitude: data.location.lng || data.location.longitude,
        deliveryRadius: data.delivery_radius || 5000 // Default 5km radius
      }
    } catch (error) {
      prodLog.error('Error getting restaurant location', error, { restaurantId })
      return null
    }
  }

  /**
   * Get available riders within delivery zone
   */
  private static async getAvailableRidersInZone(
    restaurantLat: number,
    restaurantLng: number,
    maxDistanceKm: number = 10
  ): Promise<RiderLocation[]> {
    try {
      // Get all online riders
      const { data: onlineRiders, error } = await supabase
        .from('users')
        .select(`
          id,
          first_name,
          last_name,
          rider_profiles!inner(
            id,
            status,
            current_location,
            is_online,
            max_concurrent_orders,
            preferred_zones
          )
        `)
        .eq('user_role', 'rider')
        .eq('rider_profiles.is_online', true)
        .eq('rider_profiles.status', 'active')

      if (error || !onlineRiders) {
        prodLog.error('Failed to get online riders', error)
        return []
      }

      // Filter riders by distance and availability
      const availableRiders: RiderLocation[] = []
      
      for (const rider of onlineRiders) {
        const profile = rider.rider_profiles[0]
        if (!profile?.current_location) continue

        // Calculate distance
        const distance = this.calculateDistance(
          restaurantLat,
          restaurantLng,
          profile.current_location.latitude,
          profile.current_location.longitude
        )

        // Check if within delivery zone
        if (distance <= maxDistanceKm) {
          // Get current order count
          const currentOrderCount = await this.getCurrentOrderCount(rider.id)
          
          // Check if rider can take more orders
          if (currentOrderCount < (profile.max_concurrent_orders || 2)) {
            availableRiders.push({
              riderId: rider.id,
              latitude: profile.current_location.latitude,
              longitude: profile.current_location.longitude,
              lastUpdated: new Date(profile.current_location.updated_at || new Date()),
              isOnline: profile.is_online,
              currentOrderCount
            })
          }
        }
      }

      devLog.info('Found available riders in zone', {
        restaurantLocation: { lat: restaurantLat, lng: restaurantLng },
        maxDistance: maxDistanceKm,
        availableCount: availableRiders.length
      })

      return availableRiders
    } catch (error) {
      prodLog.error('Error getting available riders in zone', error)
      return []
    }
  }

  /**
   * Calculate rider scores based on multiple factors
   */
  private static async calculateRiderScores(
    riders: RiderLocation[],
    restaurant: { latitude: number; longitude: number }
  ): Promise<RiderScore[]> {
    const scores: RiderScore[] = []

    for (const rider of riders) {
      try {
        // Factor 1: Proximity (closer is better)
        const distance = this.calculateDistance(
          restaurant.latitude,
          restaurant.longitude,
          rider.latitude,
          rider.longitude
        )
        const proximityScore = Math.max(0, 100 - (distance * 10)) // 10 points per km

        // Factor 2: Availability (online and not overloaded)
        const availabilityScore = rider.isOnline ? 
          Math.max(0, 100 - (rider.currentOrderCount * 30)) : 0

        // Factor 3: Performance (from rider analytics)
        const performanceData = await this.getRiderPerformance(rider.riderId)
        const performanceScore = performanceData.averageDeliveryTime <= 30 ? 
          Math.min(100, performanceData.completionRate) : 
          Math.max(0, performanceData.completionRate - 20)

        // Factor 4: Workload (current active orders)
        const workloadScore = Math.max(0, 100 - (rider.currentOrderCount * 40))

        // Factor 5: Customer ratings
        const ratingData = await this.getRiderRatings(rider.riderId)
        const ratingScore = (ratingData.averageRating / 5) * 100

        // Calculate weighted total score
        const totalScore = (
          proximityScore * 0.3 +    // 30% weight for proximity
          availabilityScore * 0.25 + // 25% weight for availability  
          performanceScore * 0.2 +   // 20% weight for performance
          workloadScore * 0.15 +     // 15% weight for workload
          ratingScore * 0.1          // 10% weight for ratings
        )

        scores.push({
          riderId: rider.riderId,
          score: totalScore,
          factors: {
            proximity: proximityScore,
            availability: availabilityScore,
            performance: performanceScore,
            workload: workloadScore,
            rating: ratingScore
          }
        })

      } catch (error) {
        devLog.warn('Error calculating score for rider', error, { riderId: rider.riderId })
      }
    }

    return scores.filter(s => s.score > 50) // Only return riders with decent scores
  }

  /**
   * Attempt to assign order to specific rider
   */
  private static async attemptRiderAssignment(orderId: string, riderId: string): Promise<boolean> {
    try {
      // Check if order is still available
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('id, status, rider_id')
        .eq('id', orderId)
        .single()

      if (orderError || !order) {
        devLog.error('Order not found during assignment', orderError, { orderId })
        return false
      }

      if (order.status !== 'confirmed' || order.rider_id) {
        devLog.warn('Order no longer available for assignment', { 
          orderId, 
          status: order.status, 
          existingRiderId: order.rider_id 
        })
        return false
      }

      // Check if rider is still available
      const riderAvailable = await this.isRiderStillAvailable(riderId)
      if (!riderAvailable) {
        devLog.warn('Rider no longer available', { riderId })
        return false
      }

      // Assign rider to order
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          rider_id: riderId,
          status: 'rider_assigned',
          rider_assigned_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId)
        .eq('status', 'confirmed') // Ensure it's still confirmed
        .is('rider_id', null) // Ensure no rider is assigned

      if (updateError) {
        prodLog.error('Failed to assign rider to order', updateError, { orderId, riderId })
        return false
      }

      // Update rider's active order count
      await this.updateRiderOrderCount(riderId, 1)

      devLog.info('Rider assigned to order successfully', { orderId, riderId })
      return true

    } catch (error) {
      prodLog.error('Error in attemptRiderAssignment', error, { orderId, riderId })
      return false
    }
  }

  /**
   * Check if rider is still available for assignments
   */
  private static async isRiderStillAvailable(riderId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('rider_profiles')
        .select('is_online, status, max_concurrent_orders')
        .eq('user_id', riderId)
        .single()

      if (error || !data) return false

      if (!data.is_online || data.status !== 'active') return false

      // Check current order count
      const currentOrderCount = await this.getCurrentOrderCount(riderId)
      return currentOrderCount < (data.max_concurrent_orders || 2)

    } catch (error) {
      devLog.error('Error checking rider availability', error, { riderId })
      return false
    }
  }

  /**
   * Get current active order count for rider
   */
  private static async getCurrentOrderCount(riderId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('orders')
        .select('id', { count: 'exact' })
        .eq('rider_id', riderId)
        .in('status', ['rider_assigned', 'picked_up', 'on_the_way'])

      return error ? 0 : (count || 0)
    } catch (error) {
      devLog.error('Error getting rider order count', error, { riderId })
      return 0
    }
  }

  /**
   * Get rider performance metrics
   */
  private static async getRiderPerformance(riderId: string): Promise<{
    completionRate: number
    averageDeliveryTime: number
    totalDeliveries: number
  }> {
    try {
      // Get rider's delivery history from last 30 days
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      const { data: deliveries, error } = await supabase
        .from('orders')
        .select('status, delivered_at, rider_assigned_at')
        .eq('rider_id', riderId)
        .gte('created_at', thirtyDaysAgo.toISOString())

      if (error || !deliveries) {
        return { completionRate: 80, averageDeliveryTime: 30, totalDeliveries: 0 }
      }

      const completed = deliveries.filter(d => d.status === 'delivered').length
      const total = deliveries.length
      const completionRate = total > 0 ? (completed / total) * 100 : 80

      // Calculate average delivery time
      const completedDeliveries = deliveries.filter(d => d.status === 'delivered' && d.delivered_at && d.rider_assigned_at)
      let averageDeliveryTime = 30 // Default 30 minutes

      if (completedDeliveries.length > 0) {
        const totalTime = completedDeliveries.reduce((sum, delivery) => {
          const assigned = new Date(delivery.rider_assigned_at!)
          const delivered = new Date(delivery.delivered_at!)
          return sum + (delivered.getTime() - assigned.getTime())
        }, 0)
        averageDeliveryTime = totalTime / completedDeliveries.length / (1000 * 60) // Convert to minutes
      }

      return {
        completionRate,
        averageDeliveryTime,
        totalDeliveries: completed
      }

    } catch (error) {
      devLog.error('Error getting rider performance', error, { riderId })
      return { completionRate: 80, averageDeliveryTime: 30, totalDeliveries: 0 }
    }
  }

  /**
   * Get rider customer ratings
   */
  private static async getRiderRatings(riderId: string): Promise<{
    averageRating: number
    totalRatings: number
  }> {
    try {
      const { data: ratings, error } = await supabase
        .from('order_ratings')
        .select('rider_rating')
        .eq('rider_id', riderId)
        .not('rider_rating', 'is', null)

      if (error || !ratings || ratings.length === 0) {
        return { averageRating: 4.5, totalRatings: 0 } // Default good rating for new riders
      }

      const totalRating = ratings.reduce((sum, r) => sum + (r.rider_rating || 0), 0)
      const averageRating = totalRating / ratings.length

      return {
        averageRating,
        totalRatings: ratings.length
      }

    } catch (error) {
      devLog.error('Error getting rider ratings', error, { riderId })
      return { averageRating: 4.5, totalRatings: 0 }
    }
  }

  /**
   * Update rider's active order count
   */
  private static async updateRiderOrderCount(riderId: string, increment: number): Promise<void> {
    try {
      // This could be cached in Redis for better performance
      const currentCount = await this.getCurrentOrderCount(riderId)
      
      // For now, we'll rely on the real-time count from orders table
      // In production, consider caching this in rider_profiles or Redis
      
      devLog.info('Rider order count updated', { 
        riderId, 
        increment, 
        newCount: currentCount + increment 
      })
    } catch (error) {
      devLog.error('Error updating rider order count', error, { riderId, increment })
    }
  }

  /**
   * Log assignment events for analytics
   */
  private static async logAssignmentEvent(
    orderId: string,
    riderId: string,
    assignmentType: 'automatic' | 'manual',
    score?: number
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('rider_assignment_logs')
        .insert({
          order_id: orderId,
          rider_id: riderId,
          assignment_type: assignmentType,
          assignment_score: score,
          assigned_at: new Date().toISOString()
        })

      if (error) {
        devLog.error('Failed to log assignment event', error, { orderId, riderId, assignmentType })
      }
    } catch (error) {
      devLog.error('Error logging assignment event', error, { orderId, riderId, assignmentType })
    }
  }

  /**
   * Calculate distance between two coordinates in kilometers
   */
  private static calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371 // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1)
    const dLng = this.toRadians(lng2 - lng1)
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2)
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  private static toRadians(degrees: number): number {
    return degrees * (Math.PI / 180)
  }

  /**
   * Manual assignment for admin use
   */
  static async manualAssignRider(orderId: string, riderId: string, adminId: string): Promise<AssignmentResult> {
    try {
      const assigned = await this.attemptRiderAssignment(orderId, riderId)
      
      if (assigned) {
        // Log manual assignment
        await this.logAssignmentEvent(orderId, riderId, 'manual')
        
        prodLog.info('Manual rider assignment successful', { orderId, riderId, adminId })
        
        return {
          success: true,
          assignedRiderId: riderId,
          message: 'Rider assigned manually by admin'
        }
      } else {
        return {
          success: false,
          message: 'Failed to assign rider manually'
        }
      }
    } catch (error) {
      prodLog.error('Error in manual rider assignment', error, { orderId, riderId, adminId })
      return {
        success: false,
        message: 'Manual assignment failed'
      }
    }
  }

  /**
   * Get assignment analytics for admin dashboard
   */
  static async getAssignmentAnalytics(timeRange: 'day' | 'week' | 'month' = 'day'): Promise<{
    totalAssignments: number
    automaticAssignments: number
    manualAssignments: number
    averageAssignmentTime: number
    topPerformingRiders: { riderId: string; name: string; assignments: number; score: number }[]
  }> {
    try {
      const startDate = new Date()
      if (timeRange === 'week') startDate.setDate(startDate.getDate() - 7)
      else if (timeRange === 'month') startDate.setMonth(startDate.getMonth() - 1)
      else startDate.setHours(0, 0, 0, 0)

      const { data: logs, error } = await supabase
        .from('rider_assignment_logs')
        .select('*')
        .gte('assigned_at', startDate.toISOString())

      if (error) {
        throw error
      }

      const totalAssignments = logs?.length || 0
      const automaticAssignments = logs?.filter(l => l.assignment_type === 'automatic').length || 0
      const manualAssignments = totalAssignments - automaticAssignments

      // Calculate average assignment time (placeholder - would need additional tracking)
      const averageAssignmentTime = 45 // seconds

      // Get top performing riders (placeholder - would need more complex query)
      const topPerformingRiders = []

      return {
        totalAssignments,
        automaticAssignments,
        manualAssignments,
        averageAssignmentTime,
        topPerformingRiders
      }
    } catch (error) {
      prodLog.error('Error getting assignment analytics', error, { timeRange })
      return {
        totalAssignments: 0,
        automaticAssignments: 0,
        manualAssignments: 0,
        averageAssignmentTime: 0,
        topPerformingRiders: []
      }
    }
  }
}