import { NextRequest, NextResponse } from 'next/server'
import { supabaseServerClient } from '@/lib/supabase-server'
import { validateAdminSession } from '@/lib/adminService'
import { cookies } from 'next/headers'
import { prodLog } from '@/lib/logger'

/**
 * GET /api/admin/dashboard/metrics
 * Real-time dashboard metrics for admin system
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

    // Get current date for "today" calculations
    const today = new Date()
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000)

    // Parallel queries for better performance
    const [
      ordersData,
      restaurantsData,
      ridersData,
      customersData,
      applicationsData
    ] = await Promise.all([
      // Orders metrics
      supabaseServerClient
        .from('orders')
        .select('id, total_amount, status, created_at')
        .gte('created_at', todayStart.toISOString())
        .lt('created_at', todayEnd.toISOString()),
        
      // All orders for total count
      supabaseServerClient
        .from('orders')
        .select('id, total_amount, status, created_at'),
        
      // Restaurants metrics
      supabaseServerClient
        .from('restaurants')
        .select('id, name, is_open, status, total_revenue'),
        
      // Users metrics (customers)
      supabaseServerClient
        .from('users')
        .select('id, user_role, created_at, last_login')
        .eq('user_role', 'customer'),
        
      // Role applications
      supabaseServerClient
        .from('role_applications')
        .select('id, application_type, status, created_at')
    ])

    // Process order metrics
    const todayOrders = ordersData.data || []
    const allOrders = restaurantsData.data || []
    
    const orderMetrics = {
      total: allOrders.length,
      today: todayOrders.length,
      pending: todayOrders.filter(o => ['pending', 'confirmed', 'preparing', 'ready'].includes(o.status)).length,
      completed: todayOrders.filter(o => o.status === 'delivered').length,
      cancelled: todayOrders.filter(o => o.status === 'cancelled').length,
      revenue_today: todayOrders
        .filter(o => o.status === 'delivered')
        .reduce((sum, o) => sum + (parseFloat(o.total_amount) || 0), 0),
      average_order_value: todayOrders.length > 0 
        ? todayOrders.reduce((sum, o) => sum + (parseFloat(o.total_amount) || 0), 0) / todayOrders.length 
        : 0
    }

    // Process restaurant metrics
    const restaurants = restaurantsData.data || []
    const restaurantMetrics = {
      total: restaurants.length,
      active: restaurants.filter(r => r.is_open && r.status === 'approved').length,
      pending_approval: (applicationsData.data || [])
        .filter(app => app.application_type === 'restaurant_owner' && app.status === 'pending').length,
      revenue_today: restaurants.reduce((sum, r) => sum + (parseFloat(r.total_revenue) || 0), 0)
    }

    // Process rider metrics
    const riderApplications = (applicationsData.data || [])
      .filter(app => app.application_type === 'rider')
    
    const riderMetrics = {
      total: riderApplications.filter(app => app.status === 'approved').length,
      online: Math.floor(Math.random() * 15) + 5, // Simulated - would come from real-time tracking
      busy: Math.floor(Math.random() * 8) + 2, // Simulated - riders currently on delivery
      applications_pending: riderApplications.filter(app => app.status === 'pending').length
    }

    // Process customer metrics
    const customers = customersData.data || []
    const todayCustomers = customers.filter(c => {
      const createdAt = new Date(c.created_at)
      return createdAt >= todayStart && createdAt < todayEnd
    })
    
    const customerMetrics = {
      total: customers.length,
      active_today: Math.floor(customers.length * 0.15), // Simulated active users
      new_today: todayCustomers.length
    }

    // System performance metrics (simulated for demo)
    const systemMetrics = {
      peak_concurrent_users: Math.floor(Math.random() * 200) + 50,
      average_delivery_time: 28 + Math.floor(Math.random() * 10), // 28-38 minutes
      customer_satisfaction: 0.85 + Math.random() * 0.1, // 85-95%
      uptime_percentage: 0.998 + Math.random() * 0.002 // 99.8-100%
    }

    const metrics = {
      orders: orderMetrics,
      restaurants: restaurantMetrics,
      riders: riderMetrics,
      customers: customerMetrics,
      system: systemMetrics
    }

    prodLog.info('Dashboard metrics retrieved', {
      adminId,
      metrics: {
        orders_today: orderMetrics.today,
        revenue_today: orderMetrics.revenue_today,
        active_restaurants: restaurantMetrics.active
      },
      action: 'get_dashboard_metrics'
    })

    return NextResponse.json({
      success: true,
      data: metrics,
      last_updated: new Date().toISOString()
    })

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    prodLog.error('Failed to get dashboard metrics', {
      error: errorMessage,
      action: 'get_dashboard_metrics'
    })
    
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}