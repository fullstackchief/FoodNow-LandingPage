import { NextRequest, NextResponse } from 'next/server'
import { getAllApplications } from '@/lib/adminService'
import { validateAdminSession } from '@/lib/cookies'
import { prodLog } from '@/lib/logger'

/**
 * GET /api/admin/applications
 * Retrieve all applications with filtering options
 */
export async function GET(request: NextRequest) {
  try {
    // Validate admin session from cookie
    const adminSession = await validateAdminSession(request)
    
    if (!adminSession) {
      return NextResponse.json(
        { success: false, error: 'Admin authentication required' },
        { status: 401 }
      )
    }

    // Check admin permissions (super admin has all access)
    if (adminSession.role !== 'super_admin' && 
        !adminSession.permissions?.restaurants?.includes('view_all') && 
        !adminSession.permissions?.riders?.includes('view_all')) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions to view applications' },
        { status: 403 }
      )
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'all'
    const role = searchParams.get('role') || 'all'
    const search = searchParams.get('search') || ''

    // Get all applications
    const result = await getAllApplications()

    if (!result.success || !result.data) {
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to retrieve applications' },
        { status: 500 }
      )
    }

    let applications = result.data

    // Apply filters
    if (status !== 'all') {
      applications = applications.filter(app => app.status === status)
    }

    if (role !== 'all') {
      applications = applications.filter(app => 
        app.application_type === role || 
        (app.application_type === 'restaurant' && role === 'restaurant_owner') ||
        (app.application_type === 'rider' && role === 'rider')
      )
    }

    if (search) {
      const searchLower = search.toLowerCase()
      applications = applications.filter(app => 
        app.user?.first_name?.toLowerCase().includes(searchLower) ||
        app.user?.last_name?.toLowerCase().includes(searchLower) ||
        app.user?.email?.toLowerCase().includes(searchLower) ||
        app.id.toLowerCase().includes(searchLower) ||
        (app.application_type === 'restaurant' && 
         app.restaurant_name?.toLowerCase().includes(searchLower))
      )
    }

    prodLog.info('Applications retrieved by admin', {
      adminId: adminSession.adminId,
      count: applications.length,
      filters: { status, role, search },
      action: 'get_applications'
    })

    return NextResponse.json({
      success: true,
      data: applications,
      meta: {
        total: applications.length,
        filters: { status, role, search }
      }
    })

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    prodLog.error('Failed to get applications', { 
      error: errorMessage, 
      action: 'get_applications_api' 
    })
    
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}