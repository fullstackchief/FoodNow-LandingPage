import { NextRequest, NextResponse } from 'next/server'
import { supabaseServerClient } from '@/lib/supabase-server'
import { validateAdminSession } from '@/lib/adminService'
import { cookies } from 'next/headers'
import { prodLog } from '@/lib/logger'

/**
 * GET /api/admin/dashboard/alerts
 * Critical system alerts for admin dashboard
 */
export async function GET(request: NextRequest) {
  try {
    // Validate admin session
    const cookieStore = await cookies()
    const adminId = cookieStore.get('admin_id')?.value

    if (!adminId) {
      return NextResponse.json(
        { success: false, error: 'Admin authentication required' },
        { status: 401 }
      )
    }

    const admin = await validateAdminSession(adminId)
    if (!admin) {
      return NextResponse.json(
        { success: false, error: 'Invalid admin session' },
        { status: 401 }
      )
    }

    const alerts = []
    
    // Check for orders older than 45 minutes without rider assignment
    const { data: staleOrders } = await supabaseServerClient
      .from('orders')
      .select('id, created_at, status')
      .in('status', ['confirmed', 'preparing'])
      .lt('created_at', new Date(Date.now() - 45 * 60 * 1000).toISOString())
      .limit(5)

    if (staleOrders && staleOrders.length > 0) {
      alerts.push({
        type: 'warning',
        priority: 'high',
        message: `${staleOrders.length} orders are delayed beyond 45 minutes`,
        action: 'Review order assignments',
        link: '/admin-system/orders?filter=delayed'
      })
    }

    // Check for pending applications older than 24 hours
    const { data: staleApplications } = await supabaseServerClient
      .from('role_applications')
      .select('id, application_type, created_at')
      .eq('status', 'pending')
      .lt('submitted_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

    if (staleApplications && staleApplications.length > 0) {
      alerts.push({
        type: 'info',
        priority: 'medium',
        message: `${staleApplications.length} applications pending review for over 24 hours`,
        action: 'Review applications',
        link: '/admin-system/applications?status=pending'
      })
    }

    // Check for restaurants with no orders today
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    
    const { data: restaurantsWithOrders } = await supabaseServerClient
      .from('orders')
      .select('restaurant_id')
      .gte('created_at', todayStart.toISOString())

    const { data: allRestaurants } = await supabaseServerClient
      .from('restaurants')
      .select('id, name')
      .eq('status', 'approved')
      .eq('is_open', true)

    if (allRestaurants && restaurantsWithOrders) {
      const restaurantIdsWithOrders = new Set(restaurantsWithOrders.map((o: any) => o.restaurant_id))
      const restaurantsWithoutOrders = allRestaurants.filter((r: any) => !restaurantIdsWithOrders.has(r.id))
      
      if (restaurantsWithoutOrders.length > 0) {
        alerts.push({
          type: 'warning',
          priority: 'low',
          message: `${restaurantsWithoutOrders.length} active restaurants have no orders today`,
          action: 'Check restaurant performance',
          link: '/admin-system/restaurants?filter=no-orders-today'
        })
      }
    }

    // Check system health indicators
    const currentHour = new Date().getHours()
    if (currentHour >= 12 && currentHour <= 14) { // Lunch peak
      const { data: lunchOrders } = await supabaseServerClient
        .from('orders')
        .select('id')
        .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString()) // Last hour
      
      if (lunchOrders && lunchOrders.length < 5) {
        alerts.push({
          type: 'warning',
          priority: 'medium',
          message: 'Low order volume during lunch peak hours',
          action: 'Check restaurant availability',
          link: '/admin-system/restaurants'
        })
      }
    }

    return NextResponse.json({
      success: true,
      data: alerts,
      generated_at: new Date().toISOString()
    })

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    prodLog.error('Failed to get dashboard alerts', {
      error: errorMessage,
      action: 'get_dashboard_alerts'
    })
    
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}