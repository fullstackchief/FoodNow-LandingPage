import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { validateRequestBody, adminLoginSchema, createValidationErrorResponse } from '@/lib/validations'
import { prodLog } from '@/lib/logger'
import { applyRateLimit, rateLimiters } from '@/lib/rateLimiter'
import { checkBruteForce, recordFailedAttempt, recordSuccessfulAttempt } from '@/lib/bruteForceProtection'
import { logSecurityEvent } from '@/lib/security'
import { supabaseServerClient } from '@/lib/supabase-server'
import { setAdminSessionCookie } from '@/lib/cookies'

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting for admin authentication
    const rateLimitResult = await applyRateLimit(request, rateLimiters.adminAuth)
    if (rateLimitResult) {
      logSecurityEvent('admin_auth_rate_limited', {
        path: request.nextUrl.pathname,
        reason: 'Too many authentication attempts'
      }, request)
      return rateLimitResult
    }

    // Validate request body using Zod schema
    const validation = await validateRequestBody(request, adminLoginSchema, 'Admin Authentication')
    
    if (!validation.success) {
      return createValidationErrorResponse(validation.errors)
    }

    const { email, password } = validation.data

    // Check for brute force attempts
    const bruteForceCheck = await checkBruteForce(request, email)
    if (!bruteForceCheck.allowed) {
      logSecurityEvent('admin_auth_brute_force_blocked', {
        email,
        blockType: bruteForceCheck.blockType,
        retryAfter: bruteForceCheck.retryAfter
      }, request)
      
      return NextResponse.json(
        { 
          success: false,
          error: 'Too many failed attempts',
          message: bruteForceCheck.reason,
          retryAfter: bruteForceCheck.retryAfter
        },
        { 
          status: 429,
          headers: bruteForceCheck.retryAfter ? {
            'Retry-After': bruteForceCheck.retryAfter.toString()
          } : {}
        }
      )
    }

    // Get admin user by email from admin_users table
    const { data: admin, error } = await supabaseServerClient
      .from('admin_users')
      .select('*')
      .eq('email', email)
      .eq('is_active', true)
      .single()

    if (error || !admin) {
      // Record failed attempt for brute force protection
      recordFailedAttempt(request, email, 'login')
      
      logSecurityEvent('admin_login_failed', { 
        email, 
        error: error?.message,
        reason: 'user_not_found'
      }, request)
      
      return NextResponse.json(
        { success: false, error: 'Invalid admin credentials' },
        { status: 401 }
      )
    }

    // Check if account is locked
    if ((admin as any).locked_until && new Date((admin as any).locked_until) > new Date()) {
      logSecurityEvent('admin_login_blocked', { 
        email, 
        adminId: (admin as any).id,
        lockedUntil: (admin as any).locked_until,
        reason: 'account_locked'
      }, request)
      
      return NextResponse.json(
        { success: false, error: 'Account is temporarily locked' },
        { status: 423 }
      )
    }

    // Verify password
    const isValid = await bcrypt.compare(password, (admin as any).password_hash || '')
    
    if (!isValid) {
      // Record failed attempt for brute force protection
      recordFailedAttempt(request, email, 'login')
      
      // Increment failed attempts and lock account if needed
      await (supabaseServerClient
        .from('admin_users') as any)
        .update({ 
          failed_login_attempts: ((admin as any).failed_login_attempts || 0) + 1,
          locked_until: ((admin as any).failed_login_attempts || 0) >= 4 ? 
            new Date(Date.now() + 15 * 60 * 1000).toISOString() : // Lock for 15 minutes
            null
        })
        .eq('id', (admin as any).id)

      logSecurityEvent('admin_invalid_password', { 
        email, 
        adminId: (admin as any).id,
        failedAttempts: ((admin as any).failed_login_attempts || 0) + 1
      }, request)

      return NextResponse.json(
        { success: false, error: 'Invalid admin credentials' },
        { status: 401 }
      )
    }

    // Record successful authentication (clears brute force counters)
    recordSuccessfulAttempt(request, email)
    
    // Reset failed attempts and update last login
    await (supabaseServerClient
      .from('admin_users') as any)
      .update({
        failed_login_attempts: 0,
        locked_until: null,
        last_login: new Date().toISOString()
      })
      .eq('id', (admin as any).id)

    // Log successful authentication
    logSecurityEvent('admin_login_success', { 
      email, 
      adminId: (admin as any).id,
      role: (admin as any).role
    }, request)

    // Don't send password_hash to client
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password_hash, ...adminData } = admin as any

    // Create response
    const response = NextResponse.json({
      success: true,
      data: adminData
    })

    // Set admin session cookie
    const clientIP = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1'
    const userAgent = request.headers.get('user-agent') || 'unknown'
    
    await setAdminSessionCookie(response, {
      adminId: (admin as any).id,
      email: (admin as any).email,
      role: (admin as any).role,
      permissions: (admin as any).permissions,
      ipAddress: clientIP,
      userAgent: userAgent
    })

    return response

  } catch (error) {
    prodLog.error('Admin authentication error', error, {
      path: request.nextUrl.pathname
    })
    
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}