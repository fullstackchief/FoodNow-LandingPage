import { NextRequest, NextResponse } from 'next/server'
import { updateApplicationStatus, getApplicationById } from '@/lib/adminService'
import { sendApplicationStatusNotification } from '@/lib/notificationService'
import { validateAdminSession } from '@/lib/adminService'
import { cookies } from 'next/headers'
import { prodLog } from '@/lib/logger'

/**
 * POST /api/admin/applications/batch
 * Batch update multiple applications
 */
export async function POST(request: NextRequest) {
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
    if (!admin.permissions?.restaurants?.approve && admin.role !== 'super_admin') {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions to update applications' },
        { status: 403 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { applications, action, admin_notes } = body

    // Validate required fields
    if (!applications || !Array.isArray(applications) || applications.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Applications array is required' },
        { status: 400 }
      )
    }

    if (!action) {
      return NextResponse.json(
        { success: false, error: 'Action is required' },
        { status: 400 }
      )
    }

    // Validate action
    const validActions = ['approve', 'reject', 'under_review']
    if (!validActions.includes(action)) {
      return NextResponse.json(
        { success: false, error: 'Invalid action. Must be approve, reject, or under_review' },
        { status: 400 }
      )
    }

    // Convert action to status
    let status: 'approved' | 'rejected' | 'under_review'
    switch (action) {
      case 'approve':
        status = 'approved'
        break
      case 'reject':
        status = 'rejected'
        break
      case 'under_review':
        status = 'under_review'
        break
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action type' },
          { status: 400 }
        )
    }

    // Batch process applications
    const results = []
    const errors = []

    for (const applicationId of applications) {
      try {
        // Get current application
        const currentApp = await getApplicationById(applicationId)
        if (!currentApp.success || !currentApp.data) {
          errors.push({
            applicationId,
            error: 'Application not found'
          })
          continue
        }

        // Update application
        const updateResult = await updateApplicationStatus(
          applicationId,
          { status, review_notes: admin_notes },
          adminId
        )

        if (!updateResult.success || !updateResult.data) {
          errors.push({
            applicationId,
            error: updateResult.error || 'Failed to update application'
          })
          continue
        }

        // Send notification if status changed
        if (currentApp.data.status !== status) {
          await sendApplicationStatusNotification(
            applicationId,
            updateResult.data.user_id,
            status,
            admin_notes
          )
        }

        results.push({
          applicationId,
          success: true,
          previousStatus: currentApp.data.status,
          newStatus: status
        })

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        errors.push({
          applicationId,
          error: errorMessage
        })
      }
    }

    const successCount = results.length
    const errorCount = errors.length

    prodLog.info('Batch application update completed', {
      adminId,
      action,
      totalRequested: applications.length,
      successCount,
      errorCount,
      operation: 'batch_update_applications'
    })

    return NextResponse.json({
      success: true,
      data: {
        processed: applications.length,
        successful: successCount,
        failed: errorCount,
        results,
        errors: errorCount > 0 ? errors : undefined
      },
      message: `Batch update completed. ${successCount} successful, ${errorCount} failed.`
    })

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    prodLog.error('Failed to process batch application update', { 
      error: errorMessage, 
      action: 'batch_update_applications_api' 
    })
    
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}