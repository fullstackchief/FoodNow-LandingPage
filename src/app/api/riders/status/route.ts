import { NextRequest, NextResponse } from 'next/server'
import { supabaseServerClient } from '@/lib/supabase-server'
import { devLog, prodLog } from '@/lib/logger'

// Update rider online/offline status
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { riderId, isOnline, latitude, longitude } = body

    if (!riderId || typeof isOnline !== 'boolean') {
      return NextResponse.json({ 
        error: 'Rider ID and online status are required' 
      }, { status: 400 })
    }

    devLog.info('Updating rider status', { 
      riderId, 
      isOnline,
      location: latitude && longitude ? { latitude, longitude } : 'not provided'
    })

    // Update rider status
    const updateData: any = {
      is_online: isOnline,
      updated_at: new Date().toISOString()
    }

    // Update location if provided
    if (latitude && longitude) {
      updateData.current_location = {
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        updated_at: new Date().toISOString()
      }
    }

    const { error: updateError } = await (supabaseServerClient
      .from('rider_profiles') as any)
      .update(updateData)
      .eq('user_id', riderId)

    if (updateError) {
      prodLog.error('Failed to update rider status', updateError, { riderId })
      return NextResponse.json({ error: 'Failed to update status' }, { status: 500 })
    }

    // If going offline, check for active orders
    if (!isOnline) {
      const { data: activeOrders, error: ordersError } = await supabaseServerClient
        .from('orders')
        .select('id, order_number, status')
        .eq('rider_id', riderId)
        .in('status', ['rider_assigned', 'picked_up', 'on_the_way'])

      if (ordersError) {
        devLog.warn('Failed to check active orders when going offline', ordersError, { riderId })
      } else if (activeOrders && activeOrders.length > 0) {
        devLog.warn('Rider going offline with active orders', { 
          riderId, 
          activeOrderCount: activeOrders.length,
          orderIds: activeOrders.map((o: any) => o.id)
        })
        
        return NextResponse.json({ 
          success: true,
          message: 'Status updated but you have active orders',
          warning: `You have ${activeOrders.length} active order(s). Please complete them before going offline.`,
          activeOrders: activeOrders.length
        })
      }
    }

    prodLog.info('Rider status updated successfully', { riderId, isOnline })

    return NextResponse.json({ 
      success: true,
      message: `Rider is now ${isOnline ? 'online' : 'offline'}`,
      isOnline
    })

  } catch (error) {
    prodLog.error('Exception in POST /api/riders/status', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Get rider status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const riderId = searchParams.get('riderId')

    if (!riderId) {
      return NextResponse.json({ error: 'Rider ID required' }, { status: 400 })
    }

    const { data: riderData, error } = await supabaseServerClient
      .from('rider_dashboard_data')
      .select('*')
      .eq('id', riderId)
      .single()

    if (error) {
      prodLog.error('Failed to get rider status', error, { riderId })
      return NextResponse.json({ error: 'Rider not found' }, { status: 404 })
    }

    return NextResponse.json({
      riderId: riderData.id,
      name: `${riderData.first_name} ${riderData.last_name}`,
      isOnline: riderData.is_online,
      status: riderData.status,
      currentLocation: riderData.current_location,
      activeOrders: riderData.active_orders,
      maxConcurrentOrders: riderData.max_concurrent_orders,
      performance: {
        totalDeliveries: riderData.total_deliveries,
        completionRate: riderData.completion_rate,
        averageRating: riderData.average_rating,
        totalEarnings: riderData.total_earnings,
        earningsToday: riderData.earnings_today,
        earningsThisWeek: riderData.earnings_this_week,
        earningsThisMonth: riderData.earnings_this_month
      }
    })

  } catch (error) {
    prodLog.error('Exception in GET /api/riders/status', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}