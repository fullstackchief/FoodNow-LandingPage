import { NextRequest, NextResponse } from 'next/server'
import { supabaseServerClient } from '@/lib/supabase-server'
import { devLog, prodLog } from '@/lib/logger'
import { RiderAssignmentService } from '@/lib/riderAssignmentService'

// Automatic rider assignment endpoint
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { orderId, restaurantId, adminId } = body

    if (!orderId) {
      return NextResponse.json({ 
        error: 'Order ID is required' 
      }, { status: 400 })
    }

    devLog.info('Starting automatic rider assignment', { orderId, restaurantId, adminId })

    // Get restaurant ID if not provided
    let actualRestaurantId = restaurantId
    if (!actualRestaurantId) {
      const { data: order, error: orderError } = await supabaseServerClient
        .from('orders')
        .select('restaurant_id')
        .eq('id', orderId)
        .single()

      if (orderError || !order) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 })
      }

      actualRestaurantId = order.restaurant_id
    }

    // Attempt automatic assignment
    const assignmentResult = await RiderAssignmentService.assignRiderToOrder(
      orderId, 
      actualRestaurantId
    )

    if (assignmentResult.success) {
      prodLog.info('Automatic rider assignment successful', {
        orderId,
        riderId: assignmentResult.assignedRiderId,
        restaurantId: actualRestaurantId
      })

      return NextResponse.json({
        success: true,
        message: assignmentResult.message,
        assignedRiderId: assignmentResult.assignedRiderId,
        assignmentType: 'automatic'
      })
    } else {
      // Automatic assignment failed, return candidates for manual assignment
      devLog.info('Automatic assignment failed, providing manual options', {
        orderId,
        reason: assignmentResult.message,
        candidateCount: assignmentResult.candidateRiders?.length || 0
      })

      return NextResponse.json({
        success: false,
        message: assignmentResult.message,
        fallbackToManual: assignmentResult.fallbackToManual,
        candidateRiders: assignmentResult.candidateRiders?.map(rider => ({
          riderId: rider.riderId,
          score: rider.score,
          factors: rider.factors
        }))
      })
    }

  } catch (error) {
    prodLog.error('Exception in POST /api/orders/assign-rider', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Manual rider assignment endpoint
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { orderId, riderId, adminId } = body

    if (!orderId || !riderId || !adminId) {
      return NextResponse.json({ 
        error: 'Order ID, Rider ID, and Admin ID are required' 
      }, { status: 400 })
    }

    devLog.info('Manual rider assignment requested', { orderId, riderId, adminId })

    // Verify admin permissions
    const { data: admin, error: adminError } = await supabaseServerClient
      .from('users')
      .select('user_role')
      .eq('id', adminId)
      .single()

    if (adminError || admin?.user_role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Attempt manual assignment
    const assignmentResult = await RiderAssignmentService.manualAssignRider(
      orderId,
      riderId,
      adminId
    )

    if (assignmentResult.success) {
      prodLog.info('Manual rider assignment successful', {
        orderId,
        riderId,
        adminId
      })

      return NextResponse.json({
        success: true,
        message: assignmentResult.message,
        assignedRiderId: riderId,
        assignmentType: 'manual'
      })
    } else {
      return NextResponse.json({
        success: false,
        message: assignmentResult.message
      }, { status: 409 })
    }

  } catch (error) {
    prodLog.error('Exception in PUT /api/orders/assign-rider', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Get assignment analytics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const timeRange = (searchParams.get('timeRange') as 'day' | 'week' | 'month') || 'day'
    const adminId = searchParams.get('adminId')

    if (!adminId) {
      return NextResponse.json({ error: 'Admin ID required' }, { status: 400 })
    }

    // Verify admin permissions
    const { data: admin, error: adminError } = await supabaseServerClient
      .from('users')
      .select('user_role')
      .eq('id', adminId)
      .single()

    if (adminError || admin?.user_role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    devLog.info('Getting assignment analytics', { timeRange, adminId })

    const analytics = await RiderAssignmentService.getAssignmentAnalytics(timeRange)

    return NextResponse.json({
      success: true,
      timeRange,
      analytics
    })

  } catch (error) {
    prodLog.error('Exception in GET /api/orders/assign-rider', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}