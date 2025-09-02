/**
 * Reward & Incentive System Types
 * ================================
 * Admin-controlled rewards for all user roles
 */

/**
 * Customer Loyalty System
 */
export interface CustomerLoyalty {
  customerId: string
  
  // Points system
  currentPoints: number
  lifetimePoints: number
  pointsExpiry?: Date[]
  
  // Admin-adjustable earning rates
  earnRates: {
    baseRate: number // Points per ₦100 spent
    bonusMultipliers: {
      firstOrder: number // e.g., 2x for first order
      weekendOrders: number // e.g., 1.5x on weekends
      specialEvents: number // e.g., 3x during promotions
    }
  }
  
  // Discount redemption tiers (admin-configurable)
  redemptionTiers: {
    tierName: string // "Bronze", "Silver", "Gold"
    pointsRequired: number // 100, 500, 1000
    discountPercentage: number // 5%, 10%, 15%
    maxDiscountAmount: number // Cap at ₦500, ₦1000, etc
  }[]
  
  // Customer badges (gamification)
  badges: CustomerBadge[]
  
  // Transaction history
  transactions: {
    type: 'earned' | 'redeemed' | 'expired'
    points: number
    orderId?: string
    description: string
    date: Date
  }[]
  
  // Stats for engagement
  stats: {
    totalOrders: number
    totalSpent: number
    averageOrderValue: number
    favoriteRestaurant?: string
    lastOrderDate: Date
  }
}

/**
 * Customer Badges for Gamification
 */
export interface CustomerBadge {
  id: string
  name: string
  description: string
  icon: string // Icon name or URL
  category: 'orders' | 'spending' | 'loyalty' | 'special'
  
  // Earning criteria
  criteria: {
    type: 'order_count' | 'total_spent' | 'consecutive_days' | 'special_event'
    value: number
    timeframe?: 'lifetime' | 'monthly' | 'weekly'
  }
  
  // Badge details
  earnedAt?: Date
  isRare: boolean
  displayPriority: number // For sorting in UI
}

/**
 * Restaurant Rewards System (Admin-Adjustable)
 */
export interface RestaurantRewards {
  restaurantId: string
  
  // Base rewards (admin-set)
  baseRewards: {
    pointsPerOrder: number // e.g., 10 points per order
    revenueSharePercentage: number // e.g., 90% after commission
    minimumPayout: number // Minimum amount for payout
  }
  
  // Performance bonuses (admin-configurable)
  performanceBonuses: {
    ratingBonus: {
      minRating: number // e.g., 4.5 stars
      bonusMultiplier: number // e.g., 1.2x points
      bonusAmount?: number // Fixed bonus amount
    }
    
    speedBonus: {
      avgPrepTime: number // Minutes
      bonusPercentage: number // Extra percentage
    }
    
    volumeBonus: {
      dailyThreshold: number // Number of orders
      bonusAmount: number // Fixed bonus
      bonusPercentage?: number // Or percentage bonus
    }[]
  }
  
  // Restaurant badges
  badges: RestaurantBadge[]
  
  // Payout information
  payoutSchedule: 'daily' | 'weekly' | 'bi-weekly' | 'monthly'
  nextPayoutDate: Date
  pendingPayout: number
  
  // Historical performance
  performanceHistory: {
    date: Date
    orders: number
    revenue: number
    avgRating: number
    avgPrepTime: number
    bonusEarned: number
  }[]
}

/**
 * Restaurant Badges
 */
export interface RestaurantBadge {
  id: string
  type: 'TopRated' | 'FastService' | 'HighVolume' | 'CustomerFavorite' | 'BestNewRestaurant' | 'ConsistentQuality'
  name: string
  description: string
  icon: string
  
  // Earning criteria (admin-defined)
  criteria: {
    metric: 'rating' | 'speed' | 'volume' | 'consistency' | 'growth'
    threshold: number
    timeframe: number // Days to maintain criteria
  }
  
  earnedAt?: Date
  expiresAt?: Date // Some badges may be temporary
  benefits?: {
    commissionReduction?: number // e.g., 1% less commission
    priorityListing?: boolean // Show higher in search
    marketingBoost?: boolean // Featured restaurant
  }
}

/**
 * Rider Incentive System (Admin-Configurable)
 */
export interface RiderIncentives {
  riderId: string
  
  // Base commission structure (admin-adjustable)
  commissionStructure: {
    ownBike: {
      basePercentage: number // e.g., 90% of delivery fee
      minimumFee: number // Minimum earning per delivery
    }
    companyBike: {
      basePercentage: number // e.g., 80% of delivery fee
      minimumFee: number
      bikeMaintenanceDeduction?: number // Monthly deduction
    }
  }
  
  // Performance incentives (admin-set)
  performanceIncentives: {
    ratingBonus: {
      minRating: number // e.g., 4.5 stars
      bonusPerDelivery: number // Extra ₦ per delivery
      bonusPercentage?: number // Or percentage bonus
    }[]
    
    speedBonus: {
      avgDeliveryTime: number // Minutes
      bonusAmount: number
    }
    
    reliabilityBonus: {
      completionRate: number // Percentage
      bonusMultiplier: number
    }
  }
  
  // Daily/Weekly targets
  targets: {
    daily: {
      deliveries: number
      bonus: number
      progress: number // Current progress
    }
    weekly: {
      deliveries: number
      bonus: number
      progress: number
    }
    monthly: {
      deliveries: number
      bonus: number
      progress: number
    }
  }
  
  // Rider badges
  badges: RiderBadge[]
  
  // Earnings summary
  earnings: {
    today: number
    thisWeek: number
    thisMonth: number
    pending: number
    nextPayout: Date
  }
  
  // Performance metrics
  metrics: {
    totalDeliveries: number
    avgDeliveryTime: number
    avgRating: number
    completionRate: number
    peakHoursWorked: number
  }
}

/**
 * Rider Badges
 */
export interface RiderBadge {
  id: string
  type: 'SpeedyDelivery' | 'TopRated' | 'MostDeliveries' | 'PerfectWeek' | 'NightOwl' | 'WeatherWarrior' | 'CustomerChampion'
  name: string
  description: string
  icon: string
  
  // Earning criteria
  criteria: {
    metric: 'speed' | 'rating' | 'volume' | 'consistency' | 'special'
    value: number
    condition?: string // Special conditions
  }
  
  earnedAt?: Date
  benefits?: {
    priorityOrders?: boolean // Get first pick of orders
    bonusMultiplier?: number // Earning multiplier
    equipmentUpgrade?: boolean // Eligible for better equipment
  }
}

/**
 * Admin Reward Controls
 */
export interface AdminRewardControls {
  // Global settings
  globalSettings: {
    customerLoyaltyEnabled: boolean
    restaurantRewardsEnabled: boolean
    riderIncentivesEnabled: boolean
    badgeSystemEnabled: boolean
  }
  
  // Adjustable parameters
  parameters: {
    // Customer loyalty
    customerPointsRate: number // Points per ₦100
    customerPointsExpiry: number // Days until expiry
    maxDiscountPercentage: number // Maximum discount allowed
    
    // Restaurant rewards
    restaurantBaseCommission: number // Platform commission %
    restaurantBonusPool: number // Monthly bonus budget
    
    // Rider incentives  
    riderBaseCommission: number // Base delivery fee share
    riderBonusPool: number // Daily/weekly bonus budget
    riderPeakHourMultiplier: number // Rush hour multiplier
  }
  
  // Special promotions
  activePromotions: {
    id: string
    name: string
    type: 'double_points' | 'bonus_earnings' | 'reduced_commission'
    target: 'customers' | 'restaurants' | 'riders' | 'all'
    multiplier: number
    startDate: Date
    endDate: Date
    budget?: number
    currentSpend?: number
  }[]
  
  // Analytics
  rewardAnalytics: {
    totalPointsIssued: number
    totalPointsRedeemed: number
    totalBonusesPaid: number
    avgCustomerPoints: number
    avgRestaurantBonus: number
    avgRiderBonus: number
    roi: number // Return on investment
  }
}

/**
 * Gamification Leaderboard
 */
export interface Leaderboard {
  type: 'customers' | 'restaurants' | 'riders'
  timeframe: 'daily' | 'weekly' | 'monthly' | 'all-time'
  
  entries: {
    userId: string
    userName: string
    score: number // Points, orders, or deliveries
    rank: number
    change: number // Position change from last period
    badges: string[] // Badge IDs
    avatar?: string
  }[]
  
  // Rewards for top performers
  rewards: {
    rank: number
    reward: {
      type: 'points' | 'cash' | 'discount' | 'badge'
      value: number | string
    }
  }[]
  
  lastUpdated: Date
  nextUpdate: Date
}

/**
 * Reward Transaction
 */
export interface RewardTransaction {
  id: string
  userId: string
  userType: 'customer' | 'restaurant' | 'rider'
  
  type: 'earned' | 'redeemed' | 'bonus' | 'penalty' | 'expired'
  category: 'points' | 'cash' | 'commission' | 'discount'
  
  amount: number
  description: string
  
  // Related entities
  orderId?: string
  promotionId?: string
  badgeId?: string
  
  // Transaction details
  previousBalance: number
  newBalance: number
  
  createdAt: Date
  processedAt?: Date
  
  // Admin tracking
  approvedBy?: string
  notes?: string
}