/**
 * Rating & Review Service
 * =======================
 * Rating system with proper visibility rules for each role
 */

import { createClient } from '@supabase/supabase-js'
import { devLog, prodLog } from '@/lib/logger'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

/**
 * Rating Types
 */
export interface Rating {
  id: string
  orderId: string
  customerId: string
  
  // Target being rated
  targetId: string // Restaurant ID or Rider ID
  targetType: 'restaurant' | 'rider'
  
  // Rating details
  rating: number // 1-5 stars
  comment?: string
  
  // Category-specific ratings
  categories?: {
    foodQuality?: number // For restaurants
    packaging?: number // For restaurants
    preparationTime?: number // For restaurants
    timeliness?: number // For riders
    communication?: number // For riders
    professionalism?: number // For riders
  }
  
  // Metadata
  isAnonymous: boolean
  isVerifiedOrder: boolean
  helpfulVotes?: number
  
  // Timestamps
  createdAt: Date
  updatedAt?: Date
  
  // Moderation
  isHidden: boolean
  hiddenReason?: string
  moderatedBy?: string
}

/**
 * Rating Visibility Settings
 */
export interface RatingVisibility {
  targetId: string
  targetType: 'restaurant' | 'rider'
  
  // Aggregated ratings (public)
  aggregateRating: number
  totalRatings: number
  ratingDistribution: { [key: number]: number } // { 5: 10, 4: 5, 3: 2, 2: 1, 1: 0 }
  
  // Detailed ratings (role-based access)
  detailedRatings: Rating[] // Filtered based on requesting role
  
  // Analytics
  recentTrend: 'improving' | 'declining' | 'stable'
  categoryAverages: {
    foodQuality?: number
    packaging?: number
    preparationTime?: number
    timeliness?: number
    communication?: number
    professionalism?: number
  }
}

/**
 * Rating Service
 */
export class RatingService {
  /**
   * Submit rating for restaurant or rider
   */
  static async submitRating(
    customerId: string,
    orderId: string,
    targetId: string,
    targetType: 'restaurant' | 'rider',
    ratingData: {
      rating: number
      comment?: string
      categories?: any
      isAnonymous?: boolean
    }
  ): Promise<{ success: boolean; ratingId?: string }> {
    try {
      // Verify customer can rate this order
      const canRate = await this.verifyRatingEligibility(customerId, orderId, targetId, targetType)
      if (!canRate) {
        throw new Error('Not eligible to rate this order')
      }

      // Check if already rated
      const { data: existing } = await supabase
        .from('ratings')
        .select('id')
        .eq('customer_id', customerId)
        .eq('order_id', orderId)
        .eq('target_id', targetId)
        .eq('target_type', targetType)
        .single()

      if (existing) {
        throw new Error('Already rated this order')
      }

      // Create rating record
      const rating: Partial<Rating> = {
        id: crypto.randomUUID(),
        orderId,
        customerId,
        targetId,
        targetType,
        rating: ratingData.rating,
        comment: ratingData.comment,
        categories: ratingData.categories,
        isAnonymous: ratingData.isAnonymous || false,
        isVerifiedOrder: true,
        isHidden: false,
        createdAt: new Date()
      }

      // Insert rating
      const { error: insertError } = await supabase
        .from('ratings')
        .insert(rating)

      if (insertError) {
        throw insertError
      }

      // Update aggregate ratings
      await this.updateAggregateRatings(targetId, targetType)

      // Award loyalty points for rating
      if (targetType === 'restaurant') {
        await this.awardRatingPoints(customerId, 'restaurant_rating')
      } else {
        await this.awardRatingPoints(customerId, 'rider_rating')
      }

      devLog.info('Rating submitted successfully', {
        customerId,
        orderId,
        targetId,
        targetType,
        rating: ratingData.rating
      })

      return { success: true, ratingId: rating.id }
    } catch (error) {
      prodLog.error('Failed to submit rating', error, {
        customerId,
        orderId,
        targetId,
        targetType
      })
      return { success: false }
    }
  }

  /**
   * Get ratings for restaurant (restaurant view)
   */
  static async getRestaurantRatings(
    restaurantId: string,
    requestingRole: 'restaurant' | 'admin'
  ): Promise<RatingVisibility> {
    try {
      // Get all ratings for restaurant
      const { data: ratings, error } = await supabase
        .from('ratings')
        .select('*')
        .eq('target_id', restaurantId)
        .eq('target_type', 'restaurant')
        .eq('is_hidden', false)
        .order('created_at', { ascending: false })

      if (error) {
        throw error
      }

      const ratingsData = ratings as Rating[] || []

      // Calculate aggregates
      const totalRatings = ratingsData.length
      const aggregateRating = totalRatings > 0 
        ? ratingsData.reduce((sum, r) => sum + r.rating, 0) / totalRatings 
        : 0

      // Rating distribution
      const distribution: { [key: number]: number } = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      ratingsData.forEach(r => {
        distribution[r.rating] = (distribution[r.rating] || 0) + 1
      })

      // Category averages
      const categoryAverages = RatingService.calculateCategoryAverages(ratingsData, 'restaurant')

      // Trend analysis
      const recentTrend = this.calculateTrend(ratingsData)

      // Filter ratings based on requesting role
      let visibleRatings = ratingsData
      if (requestingRole === 'restaurant') {
        // Restaurants see all their ratings and comments
        visibleRatings = ratingsData
      }

      return {
        targetId: restaurantId,
        targetType: 'restaurant',
        aggregateRating: Math.round(aggregateRating * 10) / 10,
        totalRatings,
        ratingDistribution: distribution,
        detailedRatings: visibleRatings,
        recentTrend,
        categoryAverages
      }
    } catch (error) {
      prodLog.error('Failed to get restaurant ratings', error, { restaurantId })
      return {
        targetId: restaurantId,
        targetType: 'restaurant',
        aggregateRating: 0,
        totalRatings: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        detailedRatings: [],
        recentTrend: 'stable',
        categoryAverages: {}
      }
    }
  }

  /**
   * Get ratings for rider (rider view)
   */
  static async getRiderRatings(
    riderId: string,
    requestingRole: 'rider' | 'admin'
  ): Promise<RatingVisibility> {
    try {
      const { data: ratings, error } = await supabase
        .from('ratings')
        .select('*')
        .eq('target_id', riderId)
        .eq('target_type', 'rider')
        .eq('is_hidden', false)
        .order('created_at', { ascending: false })

      if (error) {
        throw error
      }

      const ratingsData = ratings as Rating[] || []

      // Calculate aggregates
      const totalRatings = ratingsData.length
      const aggregateRating = totalRatings > 0 
        ? ratingsData.reduce((sum, r) => sum + r.rating, 0) / totalRatings 
        : 0

      // Rating distribution
      const distribution: { [key: number]: number } = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      ratingsData.forEach(r => {
        distribution[r.rating] = (distribution[r.rating] || 0) + 1
      })

      // Category averages
      const categoryAverages = RatingService.calculateCategoryAverages(ratingsData, 'rider')

      // Trend analysis
      const recentTrend = this.calculateTrend(ratingsData)

      // Filter ratings based on requesting role
      let visibleRatings = ratingsData
      if (requestingRole === 'rider') {
        // Riders see all their ratings and comments
        visibleRatings = ratingsData
      }

      return {
        targetId: riderId,
        targetType: 'rider',
        aggregateRating: Math.round(aggregateRating * 10) / 10,
        totalRatings,
        ratingDistribution: distribution,
        detailedRatings: visibleRatings,
        recentTrend,
        categoryAverages
      }
    } catch (error) {
      prodLog.error('Failed to get rider ratings', error, { riderId })
      return {
        targetId: riderId,
        targetType: 'rider',
        aggregateRating: 0,
        totalRatings: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        detailedRatings: [],
        recentTrend: 'stable',
        categoryAverages: {}
      }
    }
  }

  /**
   * Get ratings for customer view (ratings only, no comments)
   */
  static async getPublicRatings(
    targetId: string,
    targetType: 'restaurant' | 'rider'
  ): Promise<{
    aggregateRating: number
    totalRatings: number
    categoryAverages: any
  }> {
    try {
      const { data: ratings, error } = await supabase
        .from('ratings')
        .select('rating, categories')
        .eq('target_id', targetId)
        .eq('target_type', targetType)
        .eq('is_hidden', false)

      if (error) {
        throw error
      }

      const ratingsData = ratings || []
      const totalRatings = ratingsData.length
      const aggregateRating = totalRatings > 0 
        ? ratingsData.reduce((sum, r) => sum + r.rating, 0) / totalRatings 
        : 0

      const categoryAverages = RatingService.calculateCategoryAverages(ratingsData as any, targetType)

      return {
        aggregateRating: Math.round(aggregateRating * 10) / 10,
        totalRatings,
        categoryAverages
      }
    } catch (error) {
      prodLog.error('Failed to get public ratings', error, { targetId, targetType })
      return {
        aggregateRating: 0,
        totalRatings: 0,
        categoryAverages: {}
      }
    }
  }

  /**
   * Verify rating eligibility
   */
  private static async verifyRatingEligibility(
    customerId: string,
    orderId: string,
    targetId: string,
    targetType: 'restaurant' | 'rider'
  ): Promise<boolean> {
    try {
      // Verify order exists and belongs to customer
      const { data: order, error } = await supabase
        .from('orders')
        .select('customer_id, restaurant_id, rider_id, status')
        .eq('id', orderId)
        .eq('customer_id', customerId)
        .single()

      if (error || !order) {
        return false
      }

      // Verify order is completed
      if (order.status !== 'completed') {
        return false
      }

      // Verify target matches order
      if (targetType === 'restaurant' && order.restaurant_id !== targetId) {
        return false
      }
      if (targetType === 'rider' && order.rider_id !== targetId) {
        return false
      }

      return true
    } catch (error) {
      prodLog.error('Failed to verify rating eligibility', error)
      return false
    }
  }

  /**
   * Calculate category averages
   */
  private static calculateCategoryAverages(
    ratings: Rating[],
    targetType: 'restaurant' | 'rider'
  ): any {
    const averages: any = {}
    
    if (ratings.length === 0) return averages

    const categories = targetType === 'restaurant' 
      ? ['foodQuality', 'packaging', 'preparationTime']
      : ['timeliness', 'communication', 'professionalism']

    categories.forEach(category => {
      const categoryRatings = ratings
        .map(r => (r.categories as any)?.[category])
        .filter(rating => rating !== undefined && rating !== null)

      if (categoryRatings.length > 0) {
        averages[category] = categoryRatings.reduce((sum, rating) => sum + rating, 0) / categoryRatings.length
      }
    })

    return averages
  }

  /**
   * Calculate rating trend
   */
  private static calculateTrend(ratings: Rating[]): 'improving' | 'declining' | 'stable' {
    if (ratings.length < 10) return 'stable'

    // Compare recent ratings (last 25%) with older ratings
    const recentCount = Math.ceil(ratings.length * 0.25)
    const recentRatings = ratings.slice(0, recentCount)
    const olderRatings = ratings.slice(recentCount)

    const recentAvg = recentRatings.reduce((sum, r) => sum + r.rating, 0) / recentRatings.length
    const olderAvg = olderRatings.reduce((sum, r) => sum + r.rating, 0) / olderRatings.length

    const difference = recentAvg - olderAvg

    if (difference > 0.2) return 'improving'
    if (difference < -0.2) return 'declining'
    return 'stable'
  }

  /**
   * Update aggregate ratings
   */
  private static async updateAggregateRatings(
    targetId: string,
    targetType: 'restaurant' | 'rider'
  ): Promise<void> {
    try {
      // Get all ratings for target
      const { data: ratings } = await supabase
        .from('ratings')
        .select('rating, categories')
        .eq('target_id', targetId)
        .eq('target_type', targetType)
        .eq('is_hidden', false)

      if (!ratings || ratings.length === 0) return

      // Calculate aggregates
      const totalRatings = ratings.length
      const averageRating = ratings.reduce((sum, r) => sum + r.rating, 0) / totalRatings
      const categoryAverages = RatingService.calculateCategoryAverages(ratings as any, targetType)

      // Update target table
      const tableName = targetType === 'restaurant' ? 'restaurants' : 'riders'
      
      const { error: updateError } = await supabase
        .from(tableName)
        .update({
          avg_rating: Math.round(averageRating * 10) / 10,
          total_ratings: totalRatings,
          category_ratings: categoryAverages,
          updated_at: new Date().toISOString()
        })
        .eq('id', targetId)

      if (updateError) {
        throw updateError
      }

      devLog.info('Aggregate ratings updated', {
        targetId,
        targetType,
        averageRating,
        totalRatings
      })
    } catch (error) {
      prodLog.error('Failed to update aggregate ratings', error, { targetId, targetType })
    }
  }

  /**
   * Award loyalty points for rating
   */
  private static async awardRatingPoints(
    customerId: string,
    ratingType: 'restaurant_rating' | 'rider_rating'
  ): Promise<void> {
    try {
      // Import loyalty service
      const { CustomerLoyaltyService } = await import('./rewardService')
      
      // Award 10 points for restaurant rating, 5 for rider rating
      const points = ratingType === 'restaurant_rating' ? 10 : 5
      
      await CustomerLoyaltyService.awardPoints(customerId, 'rating', points, false)
      
      devLog.info('Rating points awarded', {
        customerId,
        ratingType,
        points
      })
    } catch (error) {
      prodLog.error('Failed to award rating points', error, { customerId, ratingType })
    }
  }

  /**
   * Flag inappropriate rating (admin only)
   */
  static async flagRating(
    ratingId: string,
    reason: string,
    adminId: string
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('ratings')
        .update({
          is_hidden: true,
          hidden_reason: reason,
          moderated_by: adminId,
          updated_at: new Date().toISOString()
        })
        .eq('id', ratingId)

      if (error) {
        throw error
      }

      // Log moderation action
      await supabase.from('rating_moderation_log').insert({
        rating_id: ratingId,
        action: 'hidden',
        reason,
        admin_id: adminId,
        timestamp: new Date().toISOString()
      })

      // Recalculate aggregates
      const { data: rating } = await supabase
        .from('ratings')
        .select('target_id, target_type')
        .eq('id', ratingId)
        .single()

      if (rating) {
        await this.updateAggregateRatings(rating.target_id, rating.target_type)
      }

      devLog.info('Rating flagged by admin', { ratingId, reason, adminId })
      return true
    } catch (error) {
      prodLog.error('Failed to flag rating', error, { ratingId })
      return false
    }
  }

  /**
   * Get rating analytics for admin dashboard
   */
  static async getRatingAnalytics(): Promise<{
    overview: {
      totalRatings: number
      averageRating: number
      ratingsToday: number
      flaggedRatings: number
    }
    byCategory: {
      restaurants: { count: number; average: number }
      riders: { count: number; average: number }
    }
    trends: {
      dailyRatings: { date: string; count: number; average: number }[]
      topRatedRestaurants: { id: string; name: string; rating: number }[]
      topRatedRiders: { id: string; name: string; rating: number }[]
      concerningRatings: { id: string; type: string; rating: number; comment: string }[]
    }
  }> {
    try {
      // Get all ratings
      const { data: allRatings } = await supabase
        .from('ratings')
        .select('*')
        .eq('is_hidden', false)

      if (!allRatings) {
        return this.getEmptyAnalytics()
      }

      // Basic overview
      const totalRatings = allRatings.length
      const averageRating = totalRatings > 0 
        ? allRatings.reduce((sum, r) => sum + r.rating, 0) / totalRatings 
        : 0

      // Today's ratings
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const ratingsToday = allRatings.filter(r => 
        new Date(r.createdAt) >= today
      ).length

      // Flagged ratings
      const { data: flaggedRatings } = await supabase
        .from('ratings')
        .select('id')
        .eq('is_hidden', true)

      // Category breakdown
      const restaurantRatings = allRatings.filter(r => r.targetType === 'restaurant')
      const riderRatings = allRatings.filter(r => r.targetType === 'rider')

      // Get top performers
      const { data: topRestaurants } = await supabase
        .from('restaurants')
        .select('id, name, avg_rating, total_ratings')
        .gte('total_ratings', 5)
        .order('avg_rating', { ascending: false })
        .limit(5)

      const { data: topRiders } = await supabase
        .from('riders')
        .select('id, first_name, last_name, avg_rating, total_ratings')
        .gte('total_ratings', 5)
        .order('avg_rating', { ascending: false })
        .limit(5)

      // Concerning ratings (low ratings with comments)
      const concerningRatings = allRatings
        .filter(r => r.rating <= 2 && r.comment)
        .slice(0, 10)
        .map(r => ({
          id: r.id,
          type: r.targetType,
          rating: r.rating,
          comment: r.comment || ''
        }))

      return {
        overview: {
          totalRatings,
          averageRating: Math.round(averageRating * 10) / 10,
          ratingsToday,
          flaggedRatings: flaggedRatings?.length || 0
        },
        byCategory: {
          restaurants: {
            count: restaurantRatings.length,
            average: restaurantRatings.length > 0 
              ? Math.round((restaurantRatings.reduce((sum, r) => sum + r.rating, 0) / restaurantRatings.length) * 10) / 10
              : 0
          },
          riders: {
            count: riderRatings.length,
            average: riderRatings.length > 0 
              ? Math.round((riderRatings.reduce((sum, r) => sum + r.rating, 0) / riderRatings.length) * 10) / 10
              : 0
          }
        },
        trends: {
          dailyRatings: this.getDailyRatingTrends(allRatings),
          topRatedRestaurants: topRestaurants?.map(r => ({
            id: r.id,
            name: r.name,
            rating: r.avg_rating
          })) || [],
          topRatedRiders: topRiders?.map(r => ({
            id: r.id,
            name: `${r.first_name} ${r.last_name}`,
            rating: r.avg_rating
          })) || [],
          concerningRatings
        }
      }
    } catch (error) {
      prodLog.error('Failed to get rating analytics', error)
      return this.getEmptyAnalytics()
    }
  }

  /**
   * Get daily rating trends
   */
  private static getDailyRatingTrends(ratings: Rating[]): { date: string; count: number; average: number }[] {
    const trends = new Map<string, { count: number; total: number }>()
    
    ratings.forEach(rating => {
      const date = new Date(rating.createdAt).toISOString().split('T')[0]
      const existing = trends.get(date) || { count: 0, total: 0 }
      trends.set(date, {
        count: existing.count + 1,
        total: existing.total + rating.rating
      })
    })

    return Array.from(trends.entries())
      .map(([date, data]) => ({
        date,
        count: data.count,
        average: Math.round((data.total / data.count) * 10) / 10
      }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 30) // Last 30 days
  }

  /**
   * Empty analytics fallback
   */
  private static getEmptyAnalytics() {
    return {
      overview: {
        totalRatings: 0,
        averageRating: 0,
        ratingsToday: 0,
        flaggedRatings: 0
      },
      byCategory: {
        restaurants: { count: 0, average: 0 },
        riders: { count: 0, average: 0 }
      },
      trends: {
        dailyRatings: [],
        topRatedRestaurants: [],
        topRatedRiders: [],
        concerningRatings: []
      }
    }
  }

  /**
   * Get customer's rating history
   */
  static async getCustomerRatingHistory(customerId: string): Promise<Rating[]> {
    try {
      const { data: ratings, error } = await supabase
        .from('ratings')
        .select(`
          *,
          orders:order_id (
            restaurant:restaurants (name),
            rider:users!rider_id (first_name, last_name)
          )
        `)
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false })

      if (error) {
        throw error
      }

      return ratings as Rating[] || []
    } catch (error) {
      prodLog.error('Failed to get customer rating history', error, { customerId })
      return []
    }
  }

  /**
   * Send rating reminder notification
   */
  static async sendRatingReminder(
    customerId: string,
    orderId: string,
    restaurantName: string,
    riderName?: string
  ): Promise<void> {
    try {
      // Check if already rated
      const { data: existingRatings } = await supabase
        .from('ratings')
        .select('id')
        .eq('customer_id', customerId)
        .eq('order_id', orderId)

      if (existingRatings && existingRatings.length > 0) {
        return // Already rated
      }

      // Create rating reminder notification
      const notification = {
        id: crypto.randomUUID(),
        user_id: customerId,
        user_type: 'customer',
        title: 'Rate Your Recent Order',
        body: `How was your experience with ${restaurantName}?`,
        type: 'system',
        category: 'action_required',
        channels: {
          inApp: true,
          push: true,
          sms: false,
          email: false
        },
        action: {
          type: 'navigate',
          target: `/orders/${orderId}/rate`,
          label: 'Rate Order'
        },
        metadata: {
          order_id: orderId,
          restaurant_name: restaurantName,
          rider_name: riderName
        },
        status: 'sent',
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // Expires in 7 days
      }

      await supabase.from('notifications').insert(notification)

      devLog.info('Rating reminder sent', {
        customerId,
        orderId,
        restaurantName
      })
    } catch (error) {
      prodLog.error('Failed to send rating reminder', error, {
        customerId,
        orderId
      })
    }
  }
}