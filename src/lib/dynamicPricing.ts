/**
 * DYNAMIC PRICING ENGINE FOR FOODNOW LAGOS
 * ========================================
 * Real-time demand-responsive pricing based on market conditions
 * Compliant with Nigerian food delivery market standards
 */

import { supabaseServerClient } from '@/lib/supabase-server'
import { devLog, prodLog } from '@/lib/logger'

export interface SurgeFactors {
  demandMultiplier: number    // 1.0 - 2.5 (based on order volume)
  riderAvailability: number   // 1.0 - 2.0 (based on rider-to-order ratio)
  peakHours: number          // 1.0 - 1.75 (lunch/dinner rush)
  weatherCondition: number   // 1.0 - 1.5 (rain/weather impact)
  zoneMultiplier: number     // 1.0 - 1.3 (zone-specific demand)
  eventMultiplier: number    // 1.0 - 2.5 (special events/holidays)
}

export interface PricingConfig {
  // Base configuration (from CLAUDE.local.md)
  baseServiceFee: number        // 10% (0.10)
  baseDeliveryFee: number      // Per restaurant default
  minimumOrderAmount: number   // ₦2,000
  deliveryRadius: number       // 5km per outlet
  
  // Surge limits (Lagos market compliance)
  maxSurgeMultiplier: number   // 2.5x maximum (industry standard)
  minDiscountMultiplier: number // 0.8x minimum (20% max discount)
  
  // Peak hour definitions
  peakHours: {
    lunch: { start: 12, end: 14 }      // 12pm - 2pm
    dinner: { start: 18, end: 21 }     // 6pm - 9pm
    weekend: { start: 11, end: 22 }    // 11am - 10pm (Fri-Sun)
  }
  
  // Zone-specific multipliers
  zoneMultipliers: {
    [zoneId: string]: number
  }
}

export interface DynamicPriceResult {
  originalPrice: {
    subtotal: number
    deliveryFee: number
    serviceFee: number
    total: number
  }
  
  adjustedPrice: {
    subtotal: number           // Usually unchanged
    deliveryFee: number        // Surge applied
    serviceFee: number         // Surge applied  
    total: number
    surgeAmount: number        // Extra amount due to surge
  }
  
  surgeInfo: {
    isActive: boolean
    multiplier: number         // Combined surge multiplier
    factors: SurgeFactors     // Breakdown of surge components
    displayMessage: string    // Customer-facing message
    estimatedNormalTime: string // When prices return to normal
  }
}

export class DynamicPricingEngine {
  private config: PricingConfig
  
  constructor() {
    // Initialize with Lagos market standards
    this.config = {
      baseServiceFee: 0.10,           // 10%
      baseDeliveryFee: 500,           // ₦500 default
      minimumOrderAmount: 2000,       // ₦2,000
      deliveryRadius: 5,              // 5km
      maxSurgeMultiplier: 2.5,        // 2.5x max surge
      minDiscountMultiplier: 0.8,     // 20% max discount
      
      peakHours: {
        lunch: { start: 12, end: 14 },
        dinner: { start: 18, end: 21 },
        weekend: { start: 11, end: 22 }
      },
      
      zoneMultipliers: {
        'isolo': 1.0,         // Base zone
        'ikeja': 1.1,         // Higher demand
        'vi': 1.2,            // Victoria Island premium
        'lekki': 1.15,        // Lekki corridor
        'mainland': 0.95      // Lower cost areas
      }
    }
  }

  /**
   * Calculate dynamic pricing for an order
   */
  async calculateDynamicPrice(
    restaurantId: string,
    zoneId: string,
    orderValue: number,
    deliveryType: 'delivery' | 'pickup' = 'delivery'
  ): Promise<DynamicPriceResult> {
    try {
      if (deliveryType === 'pickup') {
        // No surge for pickup orders
        return this.getStaticPricing(orderValue, restaurantId)
      }

      // Calculate surge factors
      const surgeFactors = await this.calculateSurgeFactors(restaurantId, zoneId)
      
      // Get base pricing
      const basePrice = await this.getBasePricing(orderValue, restaurantId)
      
      // Apply surge calculations
      const surgeMultiplier = this.calculateSurgeMultiplier(surgeFactors)
      
      // Calculate final pricing
      const adjustedPrice = this.applySurgeToPrice(basePrice, surgeMultiplier)
      
      return {
        originalPrice: basePrice,
        adjustedPrice,
        surgeInfo: {
          isActive: surgeMultiplier > 1.0,
          multiplier: surgeMultiplier,
          factors: surgeFactors,
          displayMessage: this.generateSurgeMessage(surgeMultiplier, surgeFactors),
          estimatedNormalTime: this.estimateNormalTime(surgeFactors)
        }
      }
      
    } catch (error) {
      prodLog.error('Dynamic pricing calculation failed', { error, restaurantId, zoneId })
      // Fallback to static pricing
      return this.getStaticPricing(orderValue, restaurantId)
    }
  }

  /**
   * Calculate real-time surge factors
   */
  private async calculateSurgeFactors(
    restaurantId: string, 
    zoneId: string
  ): Promise<SurgeFactors> {
    const now = new Date()
    const hourOfDay = now.getHours()
    const dayOfWeek = now.getDay()
    
    // Parallel data fetching for real-time calculations
    const [
      demandData,
      riderData,
      weatherData
    ] = await Promise.all([
      this.getCurrentDemand(zoneId),
      this.getRiderAvailability(zoneId),
      this.getWeatherConditions()
    ])

    return {
      demandMultiplier: this.calculateDemandMultiplier(demandData),
      riderAvailability: this.calculateRiderMultiplier(riderData),
      peakHours: this.calculatePeakMultiplier(hourOfDay, dayOfWeek),
      weatherCondition: this.calculateWeatherMultiplier(weatherData),
      zoneMultiplier: this.config.zoneMultipliers[zoneId] || 1.0,
      eventMultiplier: await this.calculateEventMultiplier(now)
    }
  }

  /**
   * Get current demand metrics for zone
   */
  private async getCurrentDemand(zoneId: string) {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
    
    const { data: recentOrders } = await supabaseServerClient
      .from('orders')
      .select('id, created_at, total_amount')
      .gte('created_at', oneHourAgo.toISOString())
      .eq('delivery_zone', zoneId)
      .in('status', ['pending', 'confirmed', 'preparing', 'ready', 'picked_up'])

    const { data: historicalAverage } = await supabaseServerClient
      .from('orders')
      .select('id')
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .eq('delivery_zone', zoneId)

    return {
      currentOrders: recentOrders?.length || 0,
      historicalHourlyAverage: (historicalAverage?.length || 0) / (7 * 24), // 7 days average
      orderValue: recentOrders?.reduce((sum: number, order: any) => sum + (order.total_amount || 0), 0) || 0
    }
  }

  /**
   * Get rider availability in zone
   */
  private async getRiderAvailability(zoneId: string) {
    // Note: In production, this would query active rider tracking
    // For now, simulate based on time and historical patterns
    const hour = new Date().getHours()
    
    // Lagos rider availability patterns
    const riderPatterns = {
      morningRush: hour >= 7 && hour <= 9 ? 0.7 : 1.0,    // Lower availability
      lunchRush: hour >= 12 && hour <= 14 ? 0.6 : 1.0,     // Much lower
      eveningRush: hour >= 18 && hour <= 21 ? 0.5 : 1.0,   // Lowest availability
      lateNight: hour >= 22 || hour <= 6 ? 0.3 : 1.0       // Very low
    }

    const availabilityRatio = Math.min(...Object.values(riderPatterns))
    
    return {
      availableRiders: Math.floor(20 * availabilityRatio), // Base: 20 riders per zone
      busyRiders: Math.floor(10 * (1 - availabilityRatio)),
      totalRiders: 30,
      utilizationRate: 1 - availabilityRatio
    }
  }

  /**
   * Get weather conditions affecting delivery
   */
  private async getWeatherConditions() {
    // Simulate Lagos weather impact
    // In production, integrate with weather API
    const weatherScenarios = [
      { condition: 'clear', multiplier: 1.0, weight: 60 },
      { condition: 'light_rain', multiplier: 1.25, weight: 25 },
      { condition: 'heavy_rain', multiplier: 1.5, weight: 10 },
      { condition: 'storm', multiplier: 2.0, weight: 5 }
    ]
    
    const random = Math.random() * 100
    let cumulative = 0
    
    for (const scenario of weatherScenarios) {
      cumulative += scenario.weight
      if (random <= cumulative) {
        return {
          condition: scenario.condition,
          multiplier: scenario.multiplier,
          description: scenario.condition.replace('_', ' ')
        }
      }
    }
    
    return weatherScenarios[0] // Default to clear
  }

  /**
   * Calculate demand-based multiplier
   */
  private calculateDemandMultiplier(demandData: any): number {
    const { currentOrders, historicalHourlyAverage } = demandData
    
    if (historicalHourlyAverage === 0) return 1.0
    
    const demandRatio = currentOrders / historicalHourlyAverage
    
    // Progressive surge based on demand
    if (demandRatio > 3.0) return 2.0      // 200% of normal demand
    if (demandRatio > 2.5) return 1.75     // 175% surge
    if (demandRatio > 2.0) return 1.5      // 150% surge
    if (demandRatio > 1.5) return 1.25     // 125% surge
    if (demandRatio < 0.7) return 0.9      // 10% discount for low demand
    
    return 1.0 // Normal pricing
  }

  /**
   * Calculate rider availability multiplier
   */
  private calculateRiderMultiplier(riderData: any): number {
    const { availableRiders, totalRiders } = riderData
    const availabilityRatio = availableRiders / totalRiders
    
    // Higher surge when fewer riders available
    if (availabilityRatio < 0.3) return 2.0      // Critical shortage
    if (availabilityRatio < 0.5) return 1.5      // Low availability
    if (availabilityRatio < 0.7) return 1.25     // Moderate shortage
    if (availabilityRatio > 0.9) return 0.95     // Abundant riders
    
    return 1.0
  }

  /**
   * Calculate peak hour multiplier
   */
  private calculatePeakMultiplier(hour: number, dayOfWeek: number): number {
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6 // Sunday or Saturday
    
    if (isWeekend) {
      // Weekend pricing (Friday 6pm - Sunday 10pm)
      if (hour >= this.config.peakHours.weekend.start && 
          hour <= this.config.peakHours.weekend.end) {
        return 1.3 // 30% weekend surge
      }
    }
    
    // Weekday peak hours
    if (hour >= this.config.peakHours.lunch.start && 
        hour <= this.config.peakHours.lunch.end) {
      return 1.5 // 50% lunch rush surge
    }
    
    if (hour >= this.config.peakHours.dinner.start && 
        hour <= this.config.peakHours.dinner.end) {
      return 1.75 // 75% dinner rush surge
    }
    
    // Off-peak discount
    if (hour >= 14 && hour <= 17) {
      return 0.9 // 10% afternoon discount
    }
    
    return 1.0
  }

  /**
   * Calculate weather impact multiplier
   */
  private calculateWeatherMultiplier(weatherData: any): number {
    return weatherData.multiplier
  }

  /**
   * Calculate event-based multiplier (holidays, special events)
   */
  private async calculateEventMultiplier(date: Date): Promise<number> {
    // Lagos special events and holidays
    const month = date.getMonth() + 1
    const day = date.getDate()
    const hour = date.getHours()
    
    // Nigerian holidays surge
    const holidays = [
      { month: 1, day: 1, multiplier: 1.5 },   // New Year
      { month: 10, day: 1, multiplier: 1.3 },  // Independence Day
      { month: 12, day: 25, multiplier: 2.0 }, // Christmas
      { month: 12, day: 26, multiplier: 1.8 }, // Boxing Day
      { month: 12, day: 31, multiplier: 1.5 }  // New Year's Eve
    ]
    
    const todayHoliday = holidays.find(h => h.month === month && h.day === day)
    if (todayHoliday) {
      return todayHoliday.multiplier
    }
    
    // Friday/Saturday night surge (Lagos nightlife)
    const dayOfWeek = date.getDay()
    if ((dayOfWeek === 5 || dayOfWeek === 6) && hour >= 20 && hour <= 23) {
      return 1.4 // 40% weekend night surge
    }
    
    return 1.0
  }

  /**
   * Combine all surge factors into final multiplier
   */
  private calculateSurgeMultiplier(factors: SurgeFactors): number {
    const combined = 
      factors.demandMultiplier * 
      factors.riderAvailability * 
      factors.peakHours * 
      factors.weatherCondition * 
      factors.zoneMultiplier * 
      factors.eventMultiplier

    // Apply surge limits
    return Math.max(
      this.config.minDiscountMultiplier,
      Math.min(this.config.maxSurgeMultiplier, combined)
    )
  }

  /**
   * Apply surge to pricing structure
   */
  private applySurgeToPrice(
    basePrice: any, 
    surgeMultiplier: number
  ) {
    const surgedDeliveryFee = Math.round(basePrice.deliveryFee * surgeMultiplier)
    const surgedServiceFee = Math.round(basePrice.serviceFee * Math.min(surgeMultiplier, 1.5)) // Cap service fee surge at 1.5x
    
    const newTotal = basePrice.subtotal + surgedDeliveryFee + surgedServiceFee
    const surgeAmount = (surgedDeliveryFee - basePrice.deliveryFee) + (surgedServiceFee - basePrice.serviceFee)
    
    return {
      subtotal: basePrice.subtotal,
      deliveryFee: surgedDeliveryFee,
      serviceFee: surgedServiceFee,
      total: newTotal,
      surgeAmount
    }
  }

  /**
   * Get base pricing without surge
   */
  private async getBasePricing(orderValue: number, restaurantId: string) {
    // Get restaurant's base delivery fee
    const { data: restaurant } = await supabaseServerClient
      .from('restaurants')
      .select('delivery_fee')
      .eq('id', restaurantId)
      .single()

    const baseDeliveryFee = (restaurant as any)?.delivery_fee || this.config.baseDeliveryFee
    const serviceFee = Math.round(orderValue * this.config.baseServiceFee)
    
    return {
      subtotal: orderValue,
      deliveryFee: baseDeliveryFee,
      serviceFee,
      total: orderValue + baseDeliveryFee + serviceFee
    }
  }

  /**
   * Fallback static pricing
   */
  private getStaticPricing(orderValue: number, restaurantId: string): DynamicPriceResult {
    const serviceFee = Math.round(orderValue * this.config.baseServiceFee)
    const deliveryFee = this.config.baseDeliveryFee
    const total = orderValue + deliveryFee + serviceFee
    
    return {
      originalPrice: {
        subtotal: orderValue,
        deliveryFee,
        serviceFee,
        total
      },
      adjustedPrice: {
        subtotal: orderValue,
        deliveryFee,
        serviceFee,
        total,
        surgeAmount: 0
      },
      surgeInfo: {
        isActive: false,
        multiplier: 1.0,
        factors: {
          demandMultiplier: 1.0,
          riderAvailability: 1.0,
          peakHours: 1.0,
          weatherCondition: 1.0,
          zoneMultiplier: 1.0,
          eventMultiplier: 1.0
        },
        displayMessage: 'Standard pricing',
        estimatedNormalTime: 'Now'
      }
    }
  }

  /**
   * Generate customer-facing surge message
   */
  private generateSurgeMessage(multiplier: number, factors: SurgeFactors): string {
    if (multiplier <= 1.0) {
      return 'Standard pricing'
    }
    
    const primaryFactor = this.getPrimaryFactor(factors)
    const surgePercentage = Math.round((multiplier - 1) * 100)
    
    switch (primaryFactor) {
      case 'demandMultiplier':
        return `High demand in area (+${surgePercentage}%)`
      case 'peakHours':
        return `Peak hour pricing (+${surgePercentage}%)`
      case 'riderAvailability':
        return `Limited riders available (+${surgePercentage}%)`
      case 'weatherCondition':
        return `Weather impact pricing (+${surgePercentage}%)`
      case 'eventMultiplier':
        return `Special event pricing (+${surgePercentage}%)`
      default:
        return `Dynamic pricing (+${surgePercentage}%)`
    }
  }

  /**
   * Find the primary factor driving surge
   */
  private getPrimaryFactor(factors: SurgeFactors): keyof SurgeFactors {
    const factorValues: [keyof SurgeFactors, number][] = [
      ['demandMultiplier', factors.demandMultiplier],
      ['riderAvailability', factors.riderAvailability],
      ['peakHours', factors.peakHours],
      ['weatherCondition', factors.weatherCondition],
      ['eventMultiplier', factors.eventMultiplier]
    ]
    
    return factorValues.reduce((max, current) => 
      current[1] > max[1] ? current : max
    )[0]
  }

  /**
   * Estimate when prices return to normal
   */
  private estimateNormalTime(factors: SurgeFactors): string {
    const hour = new Date().getHours()
    
    // Peak hour surge - estimate end time
    if (factors.peakHours > 1.0) {
      if (hour >= 12 && hour <= 14) return '3:00 PM'
      if (hour >= 18 && hour <= 21) return '10:00 PM'
    }
    
    // High demand surge - estimate 30-60 minutes
    if (factors.demandMultiplier > 1.3) {
      const normalTime = new Date(Date.now() + 45 * 60 * 1000)
      return normalTime.toLocaleTimeString('en-NG', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      })
    }
    
    return 'Soon'
  }

  /**
   * Admin configuration update
   */
  async updateSurgeConfiguration(newConfig: Partial<PricingConfig>): Promise<void> {
    this.config = { ...this.config, ...newConfig }
    
    // Store configuration in database for persistence
    await supabaseServerClient
      .from('system_settings')
      .upsert({
        key: 'dynamic_pricing_config',
        value: this.config,
        updated_at: new Date().toISOString()
      } as any)
    
    prodLog.info('Dynamic pricing configuration updated', { newConfig })
  }

  /**
   * Get current surge status for admin monitoring
   */
  async getCurrentSurgeStatus() {
    const zones = ['isolo', 'ikeja', 'vi', 'lekki', 'mainland']
    const surgeStatus = []
    
    for (const zone of zones) {
      const factors = await this.calculateSurgeFactors('', zone)
      const multiplier = this.calculateSurgeMultiplier(factors)
      
      surgeStatus.push({
        zone,
        multiplier,
        isActive: multiplier > 1.0,
        primaryFactor: this.getPrimaryFactor(factors),
        message: this.generateSurgeMessage(multiplier, factors)
      })
    }
    
    return surgeStatus
  }
}

// Export singleton instance
export const dynamicPricing = new DynamicPricingEngine()

/**
 * Quick utility function for checkout integration
 */
export async function calculateOrderPricing(
  restaurantId: string,
  zoneId: string,
  orderValue: number,
  deliveryType: 'delivery' | 'pickup' = 'delivery'
): Promise<DynamicPriceResult> {
  return dynamicPricing.calculateDynamicPrice(restaurantId, zoneId, orderValue, deliveryType)
}

/**
 * Admin utility for surge monitoring
 */
export async function getSystemWideSurgeStatus() {
  return dynamicPricing.getCurrentSurgeStatus()
}