import { NextRequest, NextResponse } from 'next/server'
import { supabaseServerClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'
import { devLog, prodLog } from '@/lib/logger'
import { RiderAssignmentService } from '@/lib/riderAssignmentService'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const riderId = searchParams.get('riderId')
    const latitude = searchParams.get('latitude')
    const longitude = searchParams.get('longitude')
    
    if (!riderId) {
      return NextResponse.json({ error: 'Rider ID required' }, { status: 400 })
    }

    devLog.info('Fetching available orders for rider', { 
      riderId, 
      location: latitude && longitude ? { latitude, longitude } : 'not provided' 
    })

    // Get rider's current location and profile
    const { data: riderProfile, error: profileError } = await supabaseServerClient
      .from('rider_profiles')
      .select('preferred_zones, current_location, max_concurrent_orders')
      .eq('user_id', riderId)
      .single()

    if (profileError) {
      prodLog.error('Failed to get rider profile', profileError, { riderId })
      return NextResponse.json({ error: 'Rider profile not found' }, { status: 404 })
    }

    // Use provided location or rider's stored location
    let riderLat = latitude ? parseFloat(latitude) : (riderProfile as any)?.current_location?.latitude
    let riderLng = longitude ? parseFloat(longitude) : (riderProfile as any)?.current_location?.longitude
    
    // If no location available, use default Lagos coordinates
    if (!riderLat || !riderLng) {
      riderLat = 6.5244 // Default Lagos latitude
      riderLng = 3.3792 // Default Lagos longitude
    }

    // Get available orders with geographic filtering
    const { data: orders, error } = await supabaseServerClient
      .from('available_orders_for_riders')
      .select('*')
      .limit(20) // Get more orders for filtering

    if (error) {
      prodLog.error('Failed to fetch available orders', error, { riderId })
      return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 })
    }

    // Filter and score orders by distance and other factors
    const availableOrders: any[] = []
    const maxDistanceKm = 15 // Maximum delivery distance

    for (const order of orders || []) {
      if (!(order as any).restaurant_location) continue

      // Calculate distance from rider to restaurant
      const distance = calculateDistance(
        riderLat,
        riderLng,
        (order as any).restaurant_location.latitude || (order as any).restaurant_location.lat,
        (order as any).restaurant_location.longitude || (order as any).restaurant_location.lng
      )

      // Only include orders within reasonable distance
      if (distance <= maxDistanceKm) {
        const estimatedEarnings = Math.round((order as any).total * 0.15) // 15% of order value
        const estimatedTime = Math.max(25, Math.round(distance * 3 + 15)) // 3 min per km + 15 min prep
        
        availableOrders.push({
          id: (order as any).id,
          orderNumber: (order as any).order_number,
          restaurant: {
            id: (order as any).restaurant_id,
            name: (order as any).restaurant_name,
            address: (order as any).restaurant_location.address || 'Lagos, Nigeria'
          },
          deliveryArea: (order as any).delivery_info?.area || 'Lagos',
          itemCount: (order as any).item_count || 1,
          items: (order as any).item_count || 1, // For backward compatibility
          totalValue: (order as any).total,
          estimatedEarnings,
          earnings: estimatedEarnings, // For backward compatibility
          distance: `${distance.toFixed(1)} km`,
          time: `${estimatedTime} min`, // For backward compatibility
          estimatedTime: `${estimatedTime} min`,
          createdAt: (order as any).created_at,
          priority: distance <= 5 ? 'high' : distance <= 10 ? 'medium' : 'low'
        })
      }
    }

    // Sort by priority and distance
    availableOrders.sort((a, b) => {
      const priorityScore = (p: string) => p === 'high' ? 3 : p === 'medium' ? 2 : 1
      const aPriority = priorityScore(a.priority)
      const bPriority = priorityScore(b.priority)
      
      if (aPriority !== bPriority) return bPriority - aPriority
      return parseFloat(a.distance) - parseFloat(b.distance)
    })

    // Return top 10 orders
    const topOrders = availableOrders.slice(0, 10)

    devLog.info('Available orders filtered and sorted', {
      riderId,
      totalFound: orders?.length || 0,
      afterFiltering: availableOrders.length,
      returned: topOrders.length,
      riderLocation: { latitude: riderLat, longitude: riderLng }
    })

    return NextResponse.json({ orders: topOrders })

  } catch (error) {
    prodLog.error('Exception in GET /api/riders/orders/available', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * Calculate distance between two coordinates in kilometers
 */
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371 // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1)
  const dLng = toRadians(lng2 - lng1)
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2)
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180)
}