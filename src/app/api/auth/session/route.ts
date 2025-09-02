/**
 * Session Management API Route
 * ============================
 * Handles session validation, creation, and deletion using httpOnly cookies
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase-client'
import { 
  validateSession, 
  setSessionCookie, 
  clearAllSessionCookies,
  generateCSRFToken,
  setCookie,
  COOKIE_NAMES 
} from '@/lib/cookies'
import { devLog, prodLog } from '@/lib/logger'
import { applyRateLimit, rateLimiters } from '@/lib/rateLimiter'

/**
 * GET /api/auth/session
 * Validate current session and return user data
 */
export async function GET(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = await applyRateLimit(request, rateLimiters.auth)
    if (rateLimitResult) {
      return rateLimitResult
    }

    // Validate session from cookie
    const sessionData = await validateSession(request)
    
    if (!sessionData) {
      return NextResponse.json(
        { authenticated: false, user: null },
        { status: 401 }
      )
    }

    // Fetch fresh user data from database
    const { data: userData, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', sessionData.userId)
      .single()

    if (error || !userData) {
      prodLog.error('Failed to fetch user data for valid session', error, {
        userId: sessionData.userId
      })
      
      return NextResponse.json(
        { authenticated: false, user: null },
        { status: 401 }
      )
    }

    // Generate new CSRF token
    const csrfToken = await generateCSRFToken()
    
    const response = NextResponse.json({
      authenticated: true,
      user: {
        id: (userData as any).id,
        email: (userData as any).email,
        firstName: (userData as any).first_name,
        lastName: (userData as any).last_name,
        role: (userData as any).user_role,
        isVerified: (userData as any).is_verified,
        phone: (userData as any).phone,
        avatarUrl: (userData as any).avatar_url,
      },
      csrfToken,
    })

    // Set CSRF token as cookie
    setCookie(response, COOKIE_NAMES.CSRF_TOKEN, csrfToken)

    devLog.info('Session validated successfully', { userId: (userData as any).id })
    
    return response
  } catch (error) {
    prodLog.error('Session validation error', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/auth/session
 * Create a new session after successful authentication
 * This should be called from the login endpoint
 */
export async function POST(request: NextRequest) {
  try {
    // This endpoint should only be called internally from login
    // Verify the request is coming from our login endpoint
    const authHeader = request.headers.get('x-internal-auth')
    
    if (authHeader !== (process.env.INTERNAL_AUTH_SECRET || 'dev-secret-change-in-prod')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { userId, email, role, isVerified, rememberMe } = body

    if (!userId || !email) {
      return NextResponse.json(
        { error: 'Missing required session data' },
        { status: 400 }
      )
    }

    // Create session data
    const sessionData = {
      userId,
      email,
      role: role || 'customer',
      isVerified: isVerified || false,
    }

    // Create response with session cookie
    const response = NextResponse.json({
      success: true,
      message: 'Session created',
    })

    // Set session cookie
    await setSessionCookie(response, sessionData, rememberMe)

    // Generate and set CSRF token
    const csrfToken = await generateCSRFToken()
    setCookie(response, COOKIE_NAMES.CSRF_TOKEN, csrfToken)

    devLog.info('Session created', { userId, rememberMe })

    return response
  } catch (error) {
    prodLog.error('Session creation error', error)
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/auth/session
 * Destroy the current session (logout)
 */
export async function DELETE(request: NextRequest) {
  try {
    // Validate existing session first
    const sessionData = await validateSession(request)
    
    if (sessionData) {
      // Log the logout event
      devLog.info('User session terminated', { userId: sessionData.userId })
      
      // Optional: Update last_logout_at in database
      await (supabase
        .from('users') as any)
        .update({ 
          last_logout_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionData.userId)
    }

    // Clear all session cookies
    const response = NextResponse.json({
      success: true,
      message: 'Session terminated',
    })

    clearAllSessionCookies(response)

    return response
  } catch (error) {
    prodLog.error('Session deletion error', error)
    
    // Even if there's an error, clear cookies for security
    const response = NextResponse.json({
      success: true,
      message: 'Session cleared',
    })
    
    clearAllSessionCookies(response)
    
    return response
  }
}

/**
 * PATCH /api/auth/session
 * Extend session expiration (for activity-based extension)
 */
export async function PATCH(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = await applyRateLimit(request, rateLimiters.auth)
    if (rateLimitResult) {
      return rateLimitResult
    }

    // Validate existing session
    const sessionData = await validateSession(request)
    
    if (!sessionData) {
      return NextResponse.json(
        { error: 'No valid session to extend' },
        { status: 401 }
      )
    }

    // Create new session with extended expiration
    const response = NextResponse.json({
      success: true,
      message: 'Session extended',
    })

    // Recreate session with same data but new expiration
    await setSessionCookie(response, {
      userId: sessionData.userId,
      email: sessionData.email,
      role: sessionData.role,
      isVerified: sessionData.isVerified,
    }, false)

    devLog.info('Session extended', { userId: sessionData.userId })

    return response
  } catch (error) {
    prodLog.error('Session extension error', error)
    return NextResponse.json(
      { error: 'Failed to extend session' },
      { status: 500 }
    )
  }
}