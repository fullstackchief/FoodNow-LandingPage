import { NextRequest, NextResponse } from 'next/server'
import { getApplicationById, updateApplicationStatus } from '@/lib/adminService'
import { sendApplicationStatusNotification } from '@/lib/notificationService'
import { validateAdminSession } from '@/lib/adminService'
import { cookies } from 'next/headers'
import { prodLog } from '@/lib/logger'

/**
 * GET /api/admin/applications/[id]
 * Get specific application by ID
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params
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

    // Validate admin exists and is active
    const admin = await validateAdminSession(adminId)
    if (!admin) {
      return NextResponse.json(
        { success: false, error: 'Invalid admin session' },
        { status: 401 }
      )
    }

    // Check admin permissions
    if (!admin.permissions?.restaurants?.includes('view_all') && !admin.permissions?.riders?.includes('view_all') && admin.role !== 'super_admin') {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const applicationId = params.id

    // Get application
    const result = await getApplicationById(applicationId)

    if (!result.success || !result.data) {
      return NextResponse.json(
        { success: false, error: result.error || 'Application not found' },
        { status: result.error === 'Application not found' ? 404 : 500 }
      )
    }

    prodLog.info('Application retrieved by admin', {
      adminId,
      applicationId,
      action: 'get_application_by_id'
    })

    return NextResponse.json({
      success: true,
      data: result.data
    })

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    prodLog.error('Failed to get application', { 
      error: errorMessage, 
      applicationId: params.id,
      action: 'get_application_by_id_api' 
    })
    
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/admin/applications/[id]
 * Update application status and notes
 */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params
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

    // Validate admin exists and is active
    const admin = await validateAdminSession(adminId)
    if (!admin) {
      return NextResponse.json(
        { success: false, error: 'Invalid admin session' },
        { status: 401 }
      )
    }

    // Check admin permissions
    if (!admin.permissions?.restaurants?.includes('approve_applications') && !admin.permissions?.riders?.includes('approve_applications') && admin.role !== 'super_admin') {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions to update applications' },
        { status: 403 }
      )
    }

    const applicationId = params.id

    // Parse request body
    const body = await request.json()
    const { status, review_notes } = body

    // Validate required fields
    if (!status) {
      return NextResponse.json(
        { success: false, error: 'Status is required' },
        { status: 400 }
      )
    }

    // Validate status values
    const validStatuses = ['pending', 'approved', 'rejected', 'under_review']
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Invalid status value' },
        { status: 400 }
      )
    }

    // Get current application to check previous status
    const currentApp = await getApplicationById(applicationId)
    if (!currentApp.success || !currentApp.data) {
      return NextResponse.json(
        { success: false, error: 'Application not found' },
        { status: 404 }
      )
    }

    // Update application
    const updateResult = await updateApplicationStatus(
      applicationId,
      {
        status: status as 'pending' | 'approved' | 'rejected' | 'under_review',
        review_notes
      },
      adminId
    )

    if (!updateResult.success || !updateResult.data) {
      return NextResponse.json(
        { success: false, error: updateResult.error || 'Failed to update application' },
        { status: 500 }
      )
    }

    // Send notification to user if status changed
    if (currentApp.data.status !== status) {
      await sendApplicationStatusNotification(
        applicationId,
        updateResult.data.user_id,
        status,
        review_notes
      )
    }

    prodLog.info('Application status updated by admin', {
      adminId,
      applicationId,
      previousStatus: currentApp.data.status,
      newStatus: status,
      hasNotes: !!review_notes,
      action: 'update_application_status'
    })

    return NextResponse.json({
      success: true,
      data: updateResult.data,
      message: 'Application updated successfully'
    })

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    prodLog.error('Failed to update application', { 
      error: errorMessage, 
      applicationId: params.id,
      action: 'update_application_api' 
    })
    
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/applications/[id]
 * Delete application (for super admins only)
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params
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

    // Validate admin exists and is active
    const admin = await validateAdminSession(adminId)
    if (!admin) {
      return NextResponse.json(
        { success: false, error: 'Invalid admin session' },
        { status: 401 }
      )
    }

    // Only super admins can delete applications
    if (admin.role !== 'super_admin') {
      return NextResponse.json(
        { success: false, error: 'Only super administrators can delete applications' },
        { status: 403 }
      )
    }

    // For now, we'll just return a placeholder response
    // In production, you might want to implement soft deletion
    return NextResponse.json(
      { success: false, error: 'Application deletion not implemented' },
      { status: 501 }
    )

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    prodLog.error('Failed to delete application', { 
      error: errorMessage, 
      applicationId: params.id,
      action: 'delete_application_api' 
    })
    
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}