/**
 * Admin Brute Force Monitoring API
 * ================================
 * Provides brute force protection statistics and management for admins
 */

import { NextRequest, NextResponse } from 'next/server'
import { getBruteForceStats, manualUnblock } from '@/lib/bruteForceProtection'
import { validateAdminSession } from '@/lib/adminService'
import { prodLog } from '@/lib/logger'
import { getClientIP } from '@/lib/security'

/**
 * GET - Retrieve brute force protection statistics
 */
export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Admin authentication required' },
        { status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const adminUser = await validateAdminSession(token)
    
    if (!adminUser || !adminUser.is_active) {
      return NextResponse.json(
        { error: 'Invalid admin session' },
        { status: 401 }
      )
    }

    // Get brute force statistics
    const stats = getBruteForceStats()
    
    prodLog.info('Admin retrieved brute force statistics', {
      adminId: adminUser.id,
      adminEmail: adminUser.email,
      clientIP: getClientIP(request),
      stats,
      action: 'admin_brute_force_stats'
    })

    return NextResponse.json({
      success: true,
      data: {
        statistics: stats,
        timestamp: new Date().toISOString(),
        adminInfo: {
          id: adminUser.id,
          email: adminUser.email,
          role: adminUser.role
        }
      }
    })

  } catch (error) {
    prodLog.error('Error retrieving brute force statistics', error, {
      clientIP: getClientIP(request),
      action: 'admin_brute_force_stats_error'
    })

    return NextResponse.json(
      { error: 'Failed to retrieve statistics' },
      { status: 500 }
    )
  }
}

/**
 * POST - Manually unblock IP or account
 */
export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Admin authentication required' },
        { status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const adminUser = await validateAdminSession(token)
    
    if (!adminUser || !adminUser.is_active) {
      return NextResponse.json(
        { error: 'Invalid admin session' },
        { status: 401 }
      )
    }

    // Parse request body
    let body
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      )
    }

    const { identifier, type } = body

    if (!identifier || !type || !['ip', 'email'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid identifier or type. Type must be "ip" or "email"' },
        { status: 400 }
      )
    }

    // Attempt to unblock
    const success = manualUnblock(identifier, type)

    prodLog.info('Admin manual unblock attempt', {
      adminId: adminUser.id,
      adminEmail: adminUser.email,
      clientIP: getClientIP(request),
      identifier,
      type,
      success,
      action: 'admin_manual_unblock'
    })

    if (success) {
      return NextResponse.json({
        success: true,
        message: `Successfully unblocked ${type}: ${identifier}`,
        data: {
          identifier,
          type,
          unblockedAt: new Date().toISOString(),
          adminInfo: {
            id: adminUser.id,
            email: adminUser.email
          }
        }
      })
    } else {
      return NextResponse.json({
        success: false,
        message: `No active block found for ${type}: ${identifier}`,
        data: { identifier, type }
      })
    }

  } catch (error) {
    prodLog.error('Error during manual unblock', error, {
      clientIP: getClientIP(request),
      action: 'admin_manual_unblock_error'
    })

    return NextResponse.json(
      { error: 'Failed to process unblock request' },
      { status: 500 }
    )
  }
}

// Handle unsupported methods
export async function PUT() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  )
}

export async function DELETE() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  )
}