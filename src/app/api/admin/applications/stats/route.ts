import { NextRequest, NextResponse } from 'next/server'
import { getAllApplications } from '@/lib/adminService'
import { validateAdminSession } from '@/lib/adminService'
import { cookies } from 'next/headers'
import { prodLog } from '@/lib/logger'

/**
 * GET /api/admin/applications/stats
 * Get application statistics for dashboard
 */
export async function GET(_request: NextRequest) {
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
    if (!admin.permissions?.system?.includes('financial_reports') && admin.role !== 'super_admin') {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions to view statistics' },
        { status: 403 }
      )
    }

    // Get all applications
    const result = await getAllApplications()

    if (!result.success || !result.data) {
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to retrieve applications' },
        { status: 500 }
      )
    }

    const applications = result.data

    // Calculate statistics
    const stats = {
      total: applications.length,
      byStatus: {
        pending: applications.filter(app => app.status === 'pending').length,
        under_review: applications.filter(app => app.status === 'under_review').length,
        approved: applications.filter(app => app.status === 'approved').length,
        rejected: applications.filter(app => app.status === 'rejected').length
      },
      byRole: {
        restaurant_owner: applications.filter(app => app.application_type === 'restaurant').length,
        rider: applications.filter(app => app.application_type === 'rider').length
      },
      recent: {
        today: applications.filter(app => {
          const today = new Date()
          const appDate = new Date(app.created_at)
          return appDate.toDateString() === today.toDateString()
        }).length,
        thisWeek: applications.filter(app => {
          const weekAgo = new Date()
          weekAgo.setDate(weekAgo.getDate() - 7)
          const appDate = new Date(app.created_at)
          return appDate >= weekAgo
        }).length,
        thisMonth: applications.filter(app => {
          const monthAgo = new Date()
          monthAgo.setMonth(monthAgo.getMonth() - 1)
          const appDate = new Date(app.created_at)
          return appDate >= monthAgo
        }).length
      },
      approval_rate: {
        restaurant_owner: (() => {
          const restaurantApps = applications.filter(app => app.application_type === 'restaurant')
          const approved = restaurantApps.filter(app => app.status === 'approved').length
          const total = restaurantApps.filter(app => ['approved', 'rejected'].includes(app.status)).length
          return total > 0 ? Math.round((approved / total) * 100) : 0
        })(),
        rider: (() => {
          const riderApps = applications.filter(app => app.application_type === 'rider')
          const approved = riderApps.filter(app => app.status === 'approved').length
          const total = riderApps.filter(app => ['approved', 'rejected'].includes(app.status)).length
          return total > 0 ? Math.round((approved / total) * 100) : 0
        })()
      },
      processing_time: {
        // Average days to process (approved or rejected)
        average_days: (() => {
          const processedApps = applications.filter(app => 
            ['approved', 'rejected'].includes(app.status) && app.reviewed_at
          )
          
          if (processedApps.length === 0) return 0
          
          const totalDays = processedApps.reduce((sum, app) => {
            const submitted = new Date(app.created_at)
            const reviewed = new Date(app.reviewed_at!)
            const days = Math.ceil((reviewed.getTime() - submitted.getTime()) / (1000 * 60 * 60 * 24))
            return sum + days
          }, 0)
          
          return Math.round(totalDays / processedApps.length)
        })()
      },
      queue_depth: {
        pending: applications.filter(app => app.status === 'pending').length,
        under_review: applications.filter(app => app.status === 'under_review').length
      }
    }

    // Calculate trends (comparing with previous periods)
    const trends = {
      applications_this_week: (() => {
        const thisWeek = stats.recent.thisWeek
        const lastWeek = applications.filter(app => {
          const twoWeeksAgo = new Date()
          twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14)
          const weekAgo = new Date()
          weekAgo.setDate(weekAgo.getDate() - 7)
          const appDate = new Date(app.created_at)
          return appDate >= twoWeeksAgo && appDate < weekAgo
        }).length
        
        if (lastWeek === 0) return thisWeek > 0 ? 100 : 0
        return Math.round(((thisWeek - lastWeek) / lastWeek) * 100)
      })(),
      approval_rate_trend: (() => {
        // Simple trend calculation - you could make this more sophisticated
        const recentApprovals = applications.filter(app => 
          app.status === 'approved' && 
          new Date(app.reviewed_at || app.updated_at) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        ).length
        
        const olderApprovals = applications.filter(app => 
          app.status === 'approved' && 
          new Date(app.reviewed_at || app.updated_at) < new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) &&
          new Date(app.reviewed_at || app.updated_at) >= new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
        ).length
        
        if (olderApprovals === 0) return recentApprovals > 0 ? 100 : 0
        return Math.round(((recentApprovals - olderApprovals) / olderApprovals) * 100)
      })()
    }

    prodLog.info('Application statistics generated', {
      adminId,
      total: stats.total,
      pending: stats.byStatus.pending,
      action: 'get_application_stats'
    })

    return NextResponse.json({
      success: true,
      data: {
        ...stats,
        trends,
        generated_at: new Date().toISOString()
      }
    })

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    prodLog.error('Failed to generate application statistics', { 
      error: errorMessage, 
      action: 'get_application_stats_api' 
    })
    
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}