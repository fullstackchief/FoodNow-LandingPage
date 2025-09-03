/**
 * Rider Location Service
 * ======================
 * Real-time location tracking and geographic analysis for riders
 */

import { createClient } from '@supabase/supabase-js'
import { devLog, prodLog } from '@/lib/logger'

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export interface RiderLocationUpdate {
  riderId: string
  latitude: number
  longitude: number
  accuracy?: number
  timestamp: Date
  orderId?: string
  speed?: number
  heading?: number
}

export interface RiderLocationHistory {
  id: string
  riderId: string
  latitude: number
  longitude: number
  accuracy?: number
  orderId?: string
  recordedAt: Date
}

export interface LocationZone {
  id: string
  name: string
  description: string
  boundaries: GeoJSONPolygon
  isActive: boolean
  deliveryFeeModifier: number
}

export interface GeoJSONPolygon {
  type: 'Polygon'
  coordinates: number[][][]
}

export interface DeliveryMetrics {
  riderId: string
  totalDistance: number
  averageSpeed: number
  timeInDelivery: number
  zonesVisited: string[]
  routeEfficiency: number
}

export class RiderLocationService {
  /**
   * Update rider's current location
   */
  static async updateRiderLocation(update: RiderLocationUpdate): Promise<boolean> {
    try {
      devLog.info('Updating rider location', {
        riderId: update.riderId,
        latitude: update.latitude,
        longitude: update.longitude,
        orderId: update.orderId
      })

      // Validate coordinates
      if (!this.isValidCoordinate(update.latitude, update.longitude)) {
        prodLog.error('Invalid coordinates provided', {
          riderId: update.riderId,
          latitude: update.latitude,
          longitude: update.longitude
        })
        return false
      }

      // Update rider's current location in profile
      const locationData = {
        latitude: update.latitude,
        longitude: update.longitude,
        updated_at: update.timestamp.toISOString(),
        ...(update.accuracy && { accuracy: update.accuracy }),
        ...(update.speed && { speed: update.speed }),
        ...(update.heading && { heading: update.heading })
      }

      const { error: profileError } = await supabase
        .from('rider_profiles')
        .update({
          current_location: locationData,
          updated_at: update.timestamp.toISOString()
        })
        .eq('user_id', update.riderId)

      if (profileError) {
        prodLog.error('Failed to update rider location in profile', profileError, {
          riderId: update.riderId
        })
        return false
      }

      // Log to location history
      const { error: historyError } = await supabase
        .from('rider_location_history')
        .insert({
          rider_id: update.riderId,
          latitude: update.latitude,
          longitude: update.longitude,
          accuracy: update.accuracy,
          order_id: update.orderId,
          recorded_at: update.timestamp.toISOString()
        })

      if (historyError) {
        devLog.warn('Failed to log location to history', historyError, {
          riderId: update.riderId
        })
      }

      devLog.info('Rider location updated successfully', {
        riderId: update.riderId,
        latitude: update.latitude,
        longitude: update.longitude
      })

      return true
    } catch (error) {
      prodLog.error('Error updating rider location', error, {
        riderId: update.riderId
      })
      return false
    }
  }

  /**
   * Get rider's current location
   */
  static async getRiderLocation(riderId: string): Promise<{
    latitude: number
    longitude: number
    lastUpdated: Date
    accuracy?: number
  } | null> {
    try {
      const { data, error } = await supabase
        .from('rider_profiles')
        .select('current_location, updated_at')
        .eq('user_id', riderId)
        .single()

      if (error || !data?.current_location) {
        prodLog.error('Failed to get rider location', error, { riderId })
        return null
      }

      return {
        latitude: data.current_location.latitude,
        longitude: data.current_location.longitude,
        lastUpdated: new Date(data.updated_at),
        accuracy: data.current_location.accuracy
      }
    } catch (error) {
      prodLog.error('Error getting rider location', error, { riderId })
      return null
    }
  }

  /**
   * Get riders within a specific area
   */
  static async getRidersInArea(
    centerLat: number,
    centerLng: number,
    radiusKm: number,
    onlineOnly: boolean = true
  ): Promise<Array<{
    riderId: string
    name: string
    latitude: number
    longitude: number
    distance: number
    isOnline: boolean
    activeOrders: number
  }>> {
    try {
      // Get all riders with location data
      const query = supabase
        .from('rider_dashboard_data')
        .select('id, first_name, last_name, is_online, current_location, active_orders')
        .not('current_location', 'is', null)

      if (onlineOnly) {
        query.eq('is_online', true)
      }

      const { data: riders, error } = await query

      if (error) {
        prodLog.error('Failed to get riders for area search', error)
        return []
      }

      // Filter by distance and return sorted results
      const ridersInArea = []

      for (const rider of riders || []) {
        if (!rider.current_location) continue

        const distance = this.calculateDistance(
          centerLat,
          centerLng,
          rider.current_location.latitude,
          rider.current_location.longitude
        )

        if (distance <= radiusKm) {
          ridersInArea.push({
            riderId: rider.id,
            name: `${rider.first_name} ${rider.last_name}`,
            latitude: rider.current_location.latitude,
            longitude: rider.current_location.longitude,
            distance,
            isOnline: rider.is_online,
            activeOrders: rider.active_orders || 0
          })
        }
      }

      // Sort by distance
      ridersInArea.sort((a, b) => a.distance - b.distance)

      devLog.info('Found riders in area', {
        center: { lat: centerLat, lng: centerLng },
        radius: radiusKm,
        foundCount: ridersInArea.length,
        onlineOnly
      })

      return ridersInArea
    } catch (error) {
      prodLog.error('Error getting riders in area', error)
      return []
    }
  }

  /**
   * Get rider's location history for a specific time period
   */
  static async getRiderLocationHistory(
    riderId: string,
    startTime: Date,
    endTime: Date,
    orderId?: string
  ): Promise<RiderLocationHistory[]> {
    try {
      const query = supabase
        .from('rider_location_history')
        .select('*')
        .eq('rider_id', riderId)
        .gte('recorded_at', startTime.toISOString())
        .lte('recorded_at', endTime.toISOString())
        .order('recorded_at', { ascending: true })

      if (orderId) {
        query.eq('order_id', orderId)
      }

      const { data, error } = await query

      if (error) {
        prodLog.error('Failed to get rider location history', error, { riderId, orderId })
        return []
      }

      return (data || []).map(record => ({
        id: record.id,
        riderId: record.rider_id,
        latitude: record.latitude,
        longitude: record.longitude,
        accuracy: record.accuracy,
        orderId: record.order_id,
        recordedAt: new Date(record.recorded_at)
      }))
    } catch (error) {
      prodLog.error('Error getting rider location history', error, { riderId })
      return []
    }
  }

  /**
   * Calculate delivery route metrics
   */
  static async calculateDeliveryMetrics(
    riderId: string,
    orderId: string
  ): Promise<DeliveryMetrics | null> {
    try {
      // Get location history for this order
      const { data: locations, error } = await supabase
        .from('rider_location_history')
        .select('latitude, longitude, recorded_at')
        .eq('rider_id', riderId)
        .eq('order_id', orderId)
        .order('recorded_at', { ascending: true })

      if (error || !locations || locations.length < 2) {
        devLog.warn('Insufficient location data for delivery metrics', {
          riderId,
          orderId,
          locationCount: locations?.length || 0
        })
        return null
      }

      // Calculate total distance
      let totalDistance = 0
      const uniqueZones = new Set<string>()
      
      for (let i = 1; i < locations.length; i++) {
        const prev = locations[i - 1]
        const curr = locations[i]
        
        const segmentDistance = this.calculateDistance(
          prev.latitude,
          prev.longitude,
          curr.latitude,
          curr.longitude
        )
        
        totalDistance += segmentDistance
      }

      // Calculate time in delivery
      const startTime = new Date(locations[0].recorded_at)
      const endTime = new Date(locations[locations.length - 1].recorded_at)
      const timeInDelivery = (endTime.getTime() - startTime.getTime()) / 1000 // seconds

      // Calculate average speed (km/h)
      const averageSpeed = timeInDelivery > 0 ? (totalDistance / (timeInDelivery / 3600)) : 0

      // Calculate route efficiency (straight line vs actual distance)
      const straightLineDistance = this.calculateDistance(
        locations[0].latitude,
        locations[0].longitude,
        locations[locations.length - 1].latitude,
        locations[locations.length - 1].longitude
      )
      
      const routeEfficiency = straightLineDistance > 0 ? 
        (straightLineDistance / totalDistance) * 100 : 0

      // Get zones visited (placeholder - would need actual zone detection)
      const zonesVisited: string[] = ['Zone A'] // Implement actual zone detection

      const metrics: DeliveryMetrics = {
        riderId,
        totalDistance,
        averageSpeed,
        timeInDelivery,
        zonesVisited,
        routeEfficiency
      }

      devLog.info('Calculated delivery metrics', {
        riderId,
        orderId,
        metrics
      })

      return metrics
    } catch (error) {
      prodLog.error('Error calculating delivery metrics', error, { riderId, orderId })
      return null
    }
  }

  /**
   * Check if rider is in a specific zone
   */
  static async isRiderInZone(
    riderId: string,
    zoneId: string
  ): Promise<boolean> {
    try {
      // Get rider location
      const location = await this.getRiderLocation(riderId)
      if (!location) return false

      // Get zone boundaries
      const { data: zone, error } = await supabase
        .from('rider_zones')
        .select('boundaries')
        .eq('id', zoneId)
        .single()

      if (error || !zone) {
        prodLog.error('Failed to get zone data', error, { zoneId })
        return false
      }

      // Check if point is in polygon (simplified - would use proper GeoJSON library)
      const isInZone = this.isPointInPolygon(
        location.latitude,
        location.longitude,
        zone.boundaries
      )

      devLog.info('Zone check result', {
        riderId,
        zoneId,
        isInZone,
        location: { lat: location.latitude, lng: location.longitude }
      })

      return isInZone
    } catch (error) {
      prodLog.error('Error checking rider zone', error, { riderId, zoneId })
      return false
    }
  }

  /**
   * Get active delivery zones
   */
  static async getActiveZones(): Promise<LocationZone[]> {
    try {
      const { data: zones, error } = await supabase
        .from('rider_zones')
        .select('*')
        .eq('is_active', true)
        .order('name')

      if (error) {
        prodLog.error('Failed to get active zones', error)
        return []
      }

      return (zones || []).map(zone => ({
        id: zone.id,
        name: zone.name,
        description: zone.description || '',
        boundaries: zone.boundaries,
        isActive: zone.is_active,
        deliveryFeeModifier: zone.delivery_fee_modifier || 1.0
      }))
    } catch (error) {
      prodLog.error('Error getting active zones', error)
      return []
    }
  }

  /**
   * Estimate arrival time based on current location and destination
   */
  static async estimateArrivalTime(
    riderId: string,
    destinationLat: number,
    destinationLng: number
  ): Promise<{ estimatedMinutes: number; distance: number } | null> {
    try {
      const location = await this.getRiderLocation(riderId)
      if (!location) return null

      const distance = this.calculateDistance(
        location.latitude,
        location.longitude,
        destinationLat,
        destinationLng
      )

      // Estimate time based on distance (assuming average urban speed of 20 km/h)
      const averageSpeedKmh = 20
      const estimatedMinutes = Math.round((distance / averageSpeedKmh) * 60)

      devLog.info('Estimated arrival time', {
        riderId,
        distance,
        estimatedMinutes,
        destination: { lat: destinationLat, lng: destinationLng }
      })

      return { estimatedMinutes, distance }
    } catch (error) {
      prodLog.error('Error estimating arrival time', error, { riderId })
      return null
    }
  }

  /**
   * Validate coordinates
   */
  private static isValidCoordinate(lat: number, lng: number): boolean {
    return !isNaN(lat) && !isNaN(lng) && 
           lat >= -90 && lat <= 90 && 
           lng >= -180 && lng <= 180
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
   * Check if a point is inside a polygon (simplified point-in-polygon algorithm)
   */
  private static isPointInPolygon(
    lat: number, 
    lng: number, 
    polygon: GeoJSONPolygon
  ): boolean {
    try {
      if (!polygon.coordinates || polygon.coordinates.length === 0) return false
      
      const points = polygon.coordinates[0] // First ring of the polygon
      let inside = false
      
      for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
        const xi = points[i][1], yi = points[i][0] // Note: GeoJSON is [lng, lat]
        const xj = points[j][1], yj = points[j][0]
        
        if (((yi > lat) !== (yj > lat)) &&
            (lng < (xj - xi) * (lat - yi) / (yj - yi) + xi)) {
          inside = !inside
        }
      }
      
      return inside
    } catch (error) {
      devLog.error('Error in point-in-polygon calculation', error)
      return false
    }
  }

  /**
   * Cleanup old location history data
   */
  static async cleanupLocationHistory(daysToKeep: number = 30): Promise<void> {
    try {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep)

      const { error } = await supabase
        .from('rider_location_history')
        .delete()
        .lt('recorded_at', cutoffDate.toISOString())

      if (error) {
        prodLog.error('Failed to cleanup location history', error)
      } else {
        devLog.info('Location history cleanup completed', { cutoffDate, daysToKeep })
      }
    } catch (error) {
      prodLog.error('Error during location history cleanup', error)
    }
  }
}