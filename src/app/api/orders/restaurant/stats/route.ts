import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { applyRateLimit, rateLimiters } from '@/lib/rateLimiter'
import { prodLog } from '@/lib/logger'

// Server-side only - service role key for database operations
const supabaseService = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

/**
 * GET - Get restaurant order statistics
 */
export async function GET(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = await applyRateLimit(request, rateLimiters.api)
    if (rateLimitResult) {
      return rateLimitResult
    }

    const { searchParams } = new URL(request.url)
    const restaurantId = searchParams.get('restaurant_id')

    if (!restaurantId) {
      return NextResponse.json(
        { success: false, error: 'Restaurant ID is required' },
        { status: 400 }
      )
    }

    // Get today's date range
    const today = new Date()
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)

    // Get total orders today
    const { count: todayOrders, error: todayError } = await supabaseService
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .eq('restaurant_id', restaurantId)
      .gte('created_at', startOfDay.toISOString())
      .lt('created_at', endOfDay.toISOString())

    // Get today's revenue
    const { data: todayRevenueData, error: revenueError } = await supabaseService
      .from('orders')
      .select('total')
      .eq('restaurant_id', restaurantId)
      .eq('status', 'delivered')
      .gte('created_at', startOfDay.toISOString())
      .lt('created_at', endOfDay.toISOString())

    const todayRevenue = todayRevenueData?.reduce((sum, order) => sum + order.total, 0) || 0

    // Get pending orders count
    const { count: pendingOrders, error: pendingError } = await supabaseService
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .eq('restaurant_id', restaurantId)
      .eq('status', 'pending')

    // Get preparing orders count
    const { count: preparingOrders, error: preparingError } = await supabaseService
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .eq('restaurant_id', restaurantId)
      .eq('status', 'preparing')

    // Get ready orders count
    const { count: readyOrders, error: readyError } = await supabaseService
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .eq('restaurant_id', restaurantId)
      .eq('status', 'ready')

    // Check for any errors
    const errors = [todayError, revenueError, pendingError, preparingError, readyError].filter(Boolean)
    if (errors.length > 0) {
      prodLog.error('Failed to fetch restaurant stats', errors[0], {
        restaurantId,
        errorCount: errors.length
      })
      return NextResponse.json(
        { success: false, error: 'Failed to fetch restaurant statistics' },
        { status: 500 }
      )
    }

    // Get average order response time (orders confirmed within 30 seconds)
    const { data: responseTimeData, error: responseTimeError } = await supabaseService
      .from('orders')
      .select('created_at, confirmed_at')
      .eq('restaurant_id', restaurantId)
      .eq('status', 'confirmed')
      .not('confirmed_at', 'is', null)
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()) // Last 7 days
      .limit(100)

    let avgResponseTime = 0
    let autoAcceptRate = 0

    if (responseTimeData && responseTimeData.length > 0) {
      const responseTimes = responseTimeData.map(order => {
        const created = new Date(order.created_at).getTime()
        const confirmed = new Date(order.confirmed_at!).getTime()
        return (confirmed - created) / 1000 // seconds
      })

      avgResponseTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length
      autoAcceptRate = responseTimes.filter(time => time >= 30).length / responseTimes.length * 100
    }

    const stats = {
      todayOrders: todayOrders || 0,
      todayRevenue,
      pendingOrders: pendingOrders || 0,
      preparingOrders: preparingOrders || 0,
      readyOrders: readyOrders || 0,
      avgResponseTime: Math.round(avgResponseTime),
      autoAcceptRate: Math.round(autoAcceptRate)
    }

    return NextResponse.json({
      success: true,
      data: stats
    })

  } catch (error) {
    prodLog.error('Restaurant stats fetch error', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}