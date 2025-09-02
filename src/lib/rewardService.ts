/**
 * Reward & Incentive Service
 * ==========================
 * Admin-controlled rewards management for all user roles
 */

import { createClient } from '@supabase/supabase-js'
import type {
  CustomerLoyalty,
  CustomerBadge,
  RestaurantRewards,
  RestaurantBadge,
  RiderIncentives,
  RiderBadge,
  RewardTransaction,
  AdminRewardControls
} from '@/types/rewards'
import { devLog, prodLog } from '@/lib/logger'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

/**
 * Customer Loyalty Service
 */
export class CustomerLoyaltyService {
  /**
   * Get customer loyalty data
   */
  static async getCustomerLoyalty(customerId: string): Promise<CustomerLoyalty | null> {
    try {
      const { data, error } = await supabase
        .from('customer_loyalty')
        .select('*')
        .eq('customer_id', customerId)
        .single()

      if (error && error.code !== 'PGRST116') { // Not found error
        throw error
      }

      // Create new loyalty account if doesn't exist
      if (!data) {
        return await this.createLoyaltyAccount(customerId)
      }

      return data as CustomerLoyalty
    } catch (error) {
      prodLog.error('Failed to get customer loyalty', error, { customerId })
      return null
    }
  }

  /**
   * Create new loyalty account
   */
  static async createLoyaltyAccount(customerId: string): Promise<CustomerLoyalty> {
    const newAccount: Partial<CustomerLoyalty> = {
      customerId,
      currentPoints: 0,
      lifetimePoints: 0,
      earnRates: {
        baseRate: 1, // 1 point per ₦100 (admin adjustable)
        bonusMultipliers: {
          firstOrder: 2,
          weekendOrders: 1.5,
          specialEvents: 3
        }
      },
      redemptionTiers: [
        { tierName: 'Bronze', pointsRequired: 100, discountPercentage: 5, maxDiscountAmount: 500 },
        { tierName: 'Silver', pointsRequired: 500, discountPercentage: 10, maxDiscountAmount: 1000 },
        { tierName: 'Gold', pointsRequired: 1000, discountPercentage: 15, maxDiscountAmount: 2000 }
      ],
      badges: [],
      transactions: [],
      stats: {
        totalOrders: 0,
        totalSpent: 0,
        averageOrderValue: 0,
        lastOrderDate: new Date()
      }
    }

    const { data, error } = await supabase
      .from('customer_loyalty')
      .insert(newAccount)
      .select()
      .single()

    if (error) {
      throw error
    }

    return data as CustomerLoyalty
  }

  /**
   * Award points to customer
   */
  static async awardPoints(
    customerId: string,
    orderId: string,
    orderAmount: number,
    isFirstOrder: boolean = false
  ): Promise<number> {
    try {
      const loyalty = await this.getCustomerLoyalty(customerId)
      if (!loyalty) {
        throw new Error('Loyalty account not found')
      }

      // Get admin settings
      const settings = await this.getAdminSettings()
      
      // Calculate points
      let points = Math.floor(orderAmount / 100) * (settings?.customerPointsRate || 1)
      
      // Apply multipliers
      if (isFirstOrder) {
        points *= loyalty.earnRates.bonusMultipliers.firstOrder
      }
      
      // Check for weekend bonus
      const dayOfWeek = new Date().getDay()
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        points *= loyalty.earnRates.bonusMultipliers.weekendOrders
      }

      // Update loyalty account
      const newPoints = loyalty.currentPoints + points
      const lifetimePoints = loyalty.lifetimePoints + points

      const { error: updateError } = await supabase
        .from('customer_loyalty')
        .update({
          current_points: newPoints,
          lifetime_points: lifetimePoints,
          updated_at: new Date().toISOString()
        })
        .eq('customer_id', customerId)

      if (updateError) {
        throw updateError
      }

      // Record transaction
      await this.recordTransaction({
        id: crypto.randomUUID(),
        userId: customerId,
        userType: 'customer',
        type: 'earned',
        category: 'points',
        amount: points,
        description: `Earned ${points} points for order #${orderId.slice(0, 8)}`,
        orderId,
        previousBalance: loyalty.currentPoints,
        newBalance: newPoints,
        createdAt: new Date()
      })

      // Check for new badges
      await this.checkAndAwardBadges(customerId, lifetimePoints)

      devLog.info('Points awarded to customer', {
        customerId,
        orderId,
        points,
        newBalance: newPoints
      })

      return points
    } catch (error) {
      prodLog.error('Failed to award points', error, { customerId, orderId })
      return 0
    }
  }

  /**
   * Redeem points for discount
   */
  static async redeemPoints(
    customerId: string,
    pointsToRedeem: number,
    orderId: string
  ): Promise<{ success: boolean; discountAmount: number }> {
    try {
      const loyalty = await this.getCustomerLoyalty(customerId)
      if (!loyalty) {
        throw new Error('Loyalty account not found')
      }

      // Check if customer has enough points
      if (loyalty.currentPoints < pointsToRedeem) {
        return { success: false, discountAmount: 0 }
      }

      // Find applicable tier
      const applicableTier = loyalty.redemptionTiers
        .filter(tier => pointsToRedeem >= tier.pointsRequired)
        .sort((a, b) => b.pointsRequired - a.pointsRequired)[0]

      if (!applicableTier) {
        return { success: false, discountAmount: 0 }
      }

      // Calculate discount
      const discountAmount = Math.min(
        (pointsToRedeem / 100) * applicableTier.discountPercentage,
        applicableTier.maxDiscountAmount
      )

      // Update points
      const newPoints = loyalty.currentPoints - pointsToRedeem

      const { error: updateError } = await supabase
        .from('customer_loyalty')
        .update({
          current_points: newPoints,
          updated_at: new Date().toISOString()
        })
        .eq('customer_id', customerId)

      if (updateError) {
        throw updateError
      }

      // Record transaction
      await this.recordTransaction({
        id: crypto.randomUUID(),
        userId: customerId,
        userType: 'customer',
        type: 'redeemed',
        category: 'discount',
        amount: pointsToRedeem,
        description: `Redeemed ${pointsToRedeem} points for ₦${discountAmount} discount`,
        orderId,
        previousBalance: loyalty.currentPoints,
        newBalance: newPoints,
        createdAt: new Date()
      })

      return { success: true, discountAmount }
    } catch (error) {
      prodLog.error('Failed to redeem points', error, { customerId, pointsToRedeem })
      return { success: false, discountAmount: 0 }
    }
  }

  /**
   * Check and award badges
   */
  static async checkAndAwardBadges(
    customerId: string,
    lifetimePoints: number
  ): Promise<void> {
    const badges: CustomerBadge[] = [
      {
        id: 'first_order',
        name: 'First Order',
        description: 'Completed your first order',
        icon: '🎉',
        category: 'orders',
        criteria: { type: 'order_count', value: 1 },
        isRare: false,
        displayPriority: 1
      },
      {
        id: 'loyal_customer',
        name: 'Loyal Customer',
        description: 'Earned 500 points',
        icon: '⭐',
        category: 'loyalty',
        criteria: { type: 'total_spent', value: 500 },
        isRare: false,
        displayPriority: 2
      },
      {
        id: 'vip_customer',
        name: 'VIP Customer',
        description: 'Earned 1000 points',
        icon: '👑',
        category: 'loyalty',
        criteria: { type: 'total_spent', value: 1000 },
        isRare: true,
        displayPriority: 3
      }
    ]

    // Check which badges to award
    for (const badge of badges) {
      if (badge.criteria.type === 'total_spent' && lifetimePoints >= badge.criteria.value) {
        await this.awardBadge(customerId, badge)
      }
    }
  }

  /**
   * Award badge to customer
   */
  private static async awardBadge(customerId: string, badge: CustomerBadge): Promise<void> {
    try {
      // Check if already has badge
      const { data: existing } = await supabase
        .from('customer_badges')
        .select('id')
        .eq('customer_id', customerId)
        .eq('badge_id', badge.id)
        .single()

      if (existing) {
        return // Already has badge
      }

      // Award badge
      await supabase.from('customer_badges').insert({
        customer_id: customerId,
        badge_id: badge.id,
        badge_data: badge,
        earned_at: new Date().toISOString()
      })

      devLog.info('Badge awarded to customer', {
        customerId,
        badgeId: badge.id,
        badgeName: badge.name
      })
    } catch (error) {
      prodLog.error('Failed to award badge', error, { customerId, badgeId: badge.id })
    }
  }

  /**
   * Get admin settings
   */
  private static async getAdminSettings(): Promise<AdminRewardControls['parameters'] | null> {
    try {
      const { data, error } = await supabase
        .from('admin_reward_settings')
        .select('parameters')
        .single()

      if (error) {
        return null
      }

      return data.parameters
    } catch (error) {
      return null
    }
  }

  /**
   * Record transaction
   */
  private static async recordTransaction(transaction: RewardTransaction): Promise<void> {
    await supabase.from('reward_transactions').insert(transaction)
  }
}

/**
 * Restaurant Rewards Service
 */
export class RestaurantRewardsService {
  /**
   * Get restaurant rewards data
   */
  static async getRestaurantRewards(restaurantId: string): Promise<RestaurantRewards | null> {
    try {
      const { data, error } = await supabase
        .from('restaurant_rewards')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .single()

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      if (!data) {
        return await this.createRewardsAccount(restaurantId)
      }

      return data as RestaurantRewards
    } catch (error) {
      prodLog.error('Failed to get restaurant rewards', error, { restaurantId })
      return null
    }
  }

  /**
   * Create rewards account for restaurant
   */
  static async createRewardsAccount(restaurantId: string): Promise<RestaurantRewards> {
    const settings = await this.getAdminSettings()
    
    const newAccount: Partial<RestaurantRewards> = {
      restaurantId,
      baseRewards: {
        pointsPerOrder: settings?.restaurantPointsPerOrder || 10,
        revenueSharePercentage: settings?.restaurantRevenueShare || 90,
        minimumPayout: 5000
      },
      performanceBonuses: {
        ratingBonus: {
          minRating: 4.5,
          bonusMultiplier: 1.2
        },
        speedBonus: {
          avgPrepTime: 20,
          bonusPercentage: 5
        },
        volumeBonus: [
          { dailyThreshold: 50, bonusAmount: 2000 },
          { dailyThreshold: 100, bonusAmount: 5000 }
        ]
      },
      badges: [],
      payoutSchedule: 'weekly',
      nextPayoutDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      pendingPayout: 0,
      performanceHistory: []
    }

    const { data, error } = await supabase
      .from('restaurant_rewards')
      .insert(newAccount)
      .select()
      .single()

    if (error) {
      throw error
    }

    return data as RestaurantRewards
  }

  /**
   * Process order rewards for restaurant
   */
  static async processOrderRewards(
    restaurantId: string,
    orderId: string,
    orderAmount: number,
    prepTime: number
  ): Promise<number> {
    try {
      const rewards = await this.getRestaurantRewards(restaurantId)
      if (!rewards) {
        throw new Error('Rewards account not found')
      }

      // Calculate base points
      let points = rewards.baseRewards.pointsPerOrder

      // Check for speed bonus
      if (prepTime < rewards.performanceBonuses.speedBonus.avgPrepTime) {
        points *= (1 + rewards.performanceBonuses.speedBonus.bonusPercentage / 100)
      }

      // Get restaurant rating
      const { data: stats } = await supabase
        .from('restaurant_stats')
        .select('avg_rating, daily_orders')
        .eq('restaurant_id', restaurantId)
        .single()

      // Apply rating bonus
      if (stats?.avg_rating >= rewards.performanceBonuses.ratingBonus.minRating) {
        points *= rewards.performanceBonuses.ratingBonus.bonusMultiplier
      }

      // Check volume bonus
      const volumeBonus = rewards.performanceBonuses.volumeBonus
        .filter(bonus => stats?.daily_orders >= bonus.dailyThreshold)
        .sort((a, b) => b.dailyThreshold - a.dailyThreshold)[0]

      if (volumeBonus) {
        points += volumeBonus.bonusAmount / 100 // Convert to points
      }

      // Calculate revenue share
      const revenueShare = orderAmount * (rewards.baseRewards.revenueSharePercentage / 100)

      // Update pending payout
      const newPendingPayout = rewards.pendingPayout + revenueShare

      await supabase
        .from('restaurant_rewards')
        .update({
          pending_payout: newPendingPayout,
          updated_at: new Date().toISOString()
        })
        .eq('restaurant_id', restaurantId)

      // Record transaction
      await this.recordTransaction({
        id: crypto.randomUUID(),
        userId: restaurantId,
        userType: 'restaurant',
        type: 'earned',
        category: 'commission',
        amount: revenueShare,
        description: `Earned ₦${revenueShare} for order #${orderId.slice(0, 8)}`,
        orderId,
        previousBalance: rewards.pendingPayout,
        newBalance: newPendingPayout,
        createdAt: new Date()
      })

      // Check for badges
      await this.checkAndAwardRestaurantBadges(restaurantId, stats)

      return points
    } catch (error) {
      prodLog.error('Failed to process restaurant rewards', error, { restaurantId, orderId })
      return 0
    }
  }

  /**
   * Check and award restaurant badges
   */
  private static async checkAndAwardRestaurantBadges(
    restaurantId: string,
    stats: any
  ): Promise<void> {
    const badges: RestaurantBadge[] = [
      {
        id: 'top_rated',
        type: 'TopRated',
        name: 'Top Rated',
        description: 'Maintained 4.5+ rating',
        icon: '⭐',
        criteria: { metric: 'rating', threshold: 4.5, timeframe: 30 }
      },
      {
        id: 'fast_service',
        type: 'FastService',
        name: 'Lightning Fast',
        description: 'Average prep time under 20 minutes',
        icon: '⚡',
        criteria: { metric: 'speed', threshold: 20, timeframe: 7 }
      },
      {
        id: 'high_volume',
        type: 'HighVolume',
        name: 'High Volume',
        description: 'Processed 100+ orders in a day',
        icon: '🔥',
        criteria: { metric: 'volume', threshold: 100, timeframe: 1 }
      }
    ]

    // Award applicable badges
    for (const badge of badges) {
      if (badge.criteria.metric === 'rating' && stats?.avg_rating >= badge.criteria.threshold) {
        await this.awardRestaurantBadge(restaurantId, badge)
      }
      if (badge.criteria.metric === 'volume' && stats?.daily_orders >= badge.criteria.threshold) {
        await this.awardRestaurantBadge(restaurantId, badge)
      }
    }
  }

  /**
   * Award badge to restaurant
   */
  private static async awardRestaurantBadge(
    restaurantId: string,
    badge: RestaurantBadge
  ): Promise<void> {
    try {
      const { data: existing } = await supabase
        .from('restaurant_badges')
        .select('id')
        .eq('restaurant_id', restaurantId)
        .eq('badge_id', badge.id)
        .single()

      if (existing) return

      await supabase.from('restaurant_badges').insert({
        restaurant_id: restaurantId,
        badge_id: badge.id,
        badge_data: badge,
        earned_at: new Date().toISOString()
      })

      devLog.info('Badge awarded to restaurant', {
        restaurantId,
        badgeId: badge.id
      })
    } catch (error) {
      prodLog.error('Failed to award restaurant badge', error)
    }
  }

  private static async getAdminSettings() {
    try {
      const { data } = await supabase
        .from('admin_reward_settings')
        .select('*')
        .single()
      return data
    } catch {
      return null
    }
  }

  private static async recordTransaction(transaction: RewardTransaction) {
    await supabase.from('reward_transactions').insert(transaction)
  }
}

/**
 * Rider Incentives Service
 */
export class RiderIncentivesService {
  /**
   * Get rider incentives data
   */
  static async getRiderIncentives(riderId: string): Promise<RiderIncentives | null> {
    try {
      const { data, error } = await supabase
        .from('rider_incentives')
        .select('*')
        .eq('rider_id', riderId)
        .single()

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      if (!data) {
        return await this.createIncentivesAccount(riderId)
      }

      return data as RiderIncentives
    } catch (error) {
      prodLog.error('Failed to get rider incentives', error, { riderId })
      return null
    }
  }

  /**
   * Create incentives account for rider
   */
  static async createIncentivesAccount(riderId: string): Promise<RiderIncentives> {
    const settings = await this.getAdminSettings()
    
    // Check if rider has own bike
    const { data: rider } = await supabase
      .from('riders')
      .select('bike_type')
      .eq('user_id', riderId)
      .single()

    const hasOwnBike = rider?.bike_type === 'own'

    const newAccount: Partial<RiderIncentives> = {
      riderId,
      commissionStructure: {
        ownBike: {
          basePercentage: settings?.riderOwnBikeCommission || 90,
          minimumFee: 100
        },
        companyBike: {
          basePercentage: settings?.riderCompanyBikeCommission || 80,
          minimumFee: 100,
          bikeMaintenanceDeduction: 5000
        }
      },
      performanceIncentives: {
        ratingBonus: [
          { minRating: 4.0, bonusPerDelivery: 50 },
          { minRating: 4.5, bonusPerDelivery: 100 },
          { minRating: 4.8, bonusPerDelivery: 150 }
        ],
        speedBonus: {
          avgDeliveryTime: 30,
          bonusAmount: 100
        },
        reliabilityBonus: {
          completionRate: 95,
          bonusMultiplier: 1.1
        }
      },
      targets: {
        daily: { deliveries: 10, bonus: 500, progress: 0 },
        weekly: { deliveries: 60, bonus: 3000, progress: 0 },
        monthly: { deliveries: 200, bonus: 15000, progress: 0 }
      },
      badges: [],
      earnings: {
        today: 0,
        thisWeek: 0,
        thisMonth: 0,
        pending: 0,
        nextPayout: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      },
      metrics: {
        totalDeliveries: 0,
        avgDeliveryTime: 0,
        avgRating: 0,
        completionRate: 100,
        peakHoursWorked: 0
      }
    }

    const { data, error } = await supabase
      .from('rider_incentives')
      .insert(newAccount)
      .select()
      .single()

    if (error) {
      throw error
    }

    return data as RiderIncentives
  }

  /**
   * Process delivery earnings and incentives
   */
  static async processDeliveryEarnings(
    riderId: string,
    orderId: string,
    deliveryFee: number,
    deliveryTime: number
  ): Promise<number> {
    try {
      const incentives = await this.getRiderIncentives(riderId)
      if (!incentives) {
        throw new Error('Incentives account not found')
      }

      // Check if rider has own bike
      const { data: rider } = await supabase
        .from('riders')
        .select('bike_type')
        .eq('user_id', riderId)
        .single()

      const hasOwnBike = rider?.bike_type === 'own'
      const commission = hasOwnBike
        ? incentives.commissionStructure.ownBike
        : incentives.commissionStructure.companyBike

      // Calculate base earnings
      let earnings = Math.max(
        deliveryFee * (commission.basePercentage / 100),
        commission.minimumFee
      )

      // Get rider stats
      const { data: stats } = await supabase
        .from('rider_stats')
        .select('avg_rating, daily_deliveries, completion_rate')
        .eq('rider_id', riderId)
        .single()

      // Apply performance bonuses
      if (stats?.avg_rating) {
        const ratingBonus = incentives.performanceIncentives.ratingBonus
          .filter(bonus => stats.avg_rating >= bonus.minRating)
          .sort((a, b) => b.minRating - a.minRating)[0]

        if (ratingBonus) {
          earnings += ratingBonus.bonusPerDelivery
        }
      }

      // Speed bonus
      if (deliveryTime < incentives.performanceIncentives.speedBonus.avgDeliveryTime) {
        earnings += incentives.performanceIncentives.speedBonus.bonusAmount
      }

      // Reliability bonus
      if (stats?.completion_rate >= incentives.performanceIncentives.reliabilityBonus.completionRate) {
        earnings *= incentives.performanceIncentives.reliabilityBonus.bonusMultiplier
      }

      // Update targets progress
      const newDailyProgress = incentives.targets.daily.progress + 1
      const newWeeklyProgress = incentives.targets.weekly.progress + 1
      const newMonthlyProgress = incentives.targets.monthly.progress + 1

      // Check if targets met
      if (newDailyProgress === incentives.targets.daily.deliveries) {
        earnings += incentives.targets.daily.bonus
      }

      // Update earnings
      const newPending = incentives.earnings.pending + earnings

      await supabase
        .from('rider_incentives')
        .update({
          'earnings.pending': newPending,
          'earnings.today': incentives.earnings.today + earnings,
          'targets.daily.progress': newDailyProgress,
          'targets.weekly.progress': newWeeklyProgress,
          'targets.monthly.progress': newMonthlyProgress,
          updated_at: new Date().toISOString()
        })
        .eq('rider_id', riderId)

      // Record transaction
      await this.recordTransaction({
        id: crypto.randomUUID(),
        userId: riderId,
        userType: 'rider',
        type: 'earned',
        category: 'commission',
        amount: earnings,
        description: `Earned ₦${earnings} for delivery #${orderId.slice(0, 8)}`,
        orderId,
        previousBalance: incentives.earnings.pending,
        newBalance: newPending,
        createdAt: new Date()
      })

      // Check for badges
      await this.checkAndAwardRiderBadges(riderId, stats)

      return earnings
    } catch (error) {
      prodLog.error('Failed to process rider earnings', error, { riderId, orderId })
      return 0
    }
  }

  /**
   * Check and award rider badges
   */
  private static async checkAndAwardRiderBadges(riderId: string, stats: any): Promise<void> {
    const badges: RiderBadge[] = [
      {
        id: 'speedy_delivery',
        type: 'SpeedyDelivery',
        name: 'Speed Demon',
        description: 'Average delivery under 30 minutes',
        icon: '🚀',
        criteria: { metric: 'speed', value: 30 }
      },
      {
        id: 'top_rated',
        type: 'TopRated',
        name: 'Customer Favorite',
        description: 'Maintained 4.5+ rating',
        icon: '⭐',
        criteria: { metric: 'rating', value: 4.5 }
      },
      {
        id: 'perfect_week',
        type: 'PerfectWeek',
        name: 'Perfect Week',
        description: '100% completion rate for a week',
        icon: '💯',
        criteria: { metric: 'consistency', value: 100 }
      }
    ]

    for (const badge of badges) {
      if (badge.criteria.metric === 'rating' && stats?.avg_rating >= badge.criteria.value) {
        await this.awardRiderBadge(riderId, badge)
      }
    }
  }

  /**
   * Award badge to rider
   */
  private static async awardRiderBadge(riderId: string, badge: RiderBadge): Promise<void> {
    try {
      const { data: existing } = await supabase
        .from('rider_badges')
        .select('id')
        .eq('rider_id', riderId)
        .eq('badge_id', badge.id)
        .single()

      if (existing) return

      await supabase.from('rider_badges').insert({
        rider_id: riderId,
        badge_id: badge.id,
        badge_data: badge,
        earned_at: new Date().toISOString()
      })

      devLog.info('Badge awarded to rider', {
        riderId,
        badgeId: badge.id
      })
    } catch (error) {
      prodLog.error('Failed to award rider badge', error)
    }
  }

  private static async getAdminSettings() {
    try {
      const { data } = await supabase
        .from('admin_reward_settings')
        .select('*')
        .single()
      return data
    } catch {
      return null
    }
  }

  private static async recordTransaction(transaction: RewardTransaction) {
    await supabase.from('reward_transactions').insert(transaction)
  }
}