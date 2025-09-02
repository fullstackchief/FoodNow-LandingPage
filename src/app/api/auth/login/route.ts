/**
 * Authentication Login API Route with Rate Limiting
 * =================================================
 * Handles user login with built-in rate limiting and brute force protection
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase-client'
import { userLoginSchema } from '@/lib/validations/auth'
import { validateData } from '@/lib/validations/utils'
import { rateLimiters, applyRateLimit } from '@/lib/rateLimiter'
import { checkBruteForce, recordFailedAttempt, recordSuccessfulAttempt } from '@/lib/bruteForceProtection'
import { prodLog, devLog } from '@/lib/logger'
import { getClientIP } from '@/lib/security'
import { setSessionCookie, generateCSRFToken, setCookie, COOKIE_NAMES } from '@/lib/cookies'

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting for authentication
    const rateLimitResult = await applyRateLimit(request, rateLimiters.auth)
    if (rateLimitResult) {
      return rateLimitResult
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

    // Validate input data
    const validation = validateData(userLoginSchema, body, 'Login API')
    if (!validation.success) {
      const firstError = validation.errors[0]
      return NextResponse.json(
        { error: firstError.message },
        { status: 400 }
      )
    }

    const { email, password, rememberMe } = validation.data
    const clientIP = getClientIP(request)

    // Check for brute force attempts
    const bruteForceCheck = await checkBruteForce(request, email)
    if (!bruteForceCheck.allowed) {
      return NextResponse.json(
        { 
          error: 'Too many failed attempts',
          message: bruteForceCheck.reason,
          retryAfter: bruteForceCheck.retryAfter,
          blockType: bruteForceCheck.blockType
        },
        { 
          status: 429,
          headers: bruteForceCheck.retryAfter ? {
            'Retry-After': bruteForceCheck.retryAfter.toString()
          } : {}
        }
      )
    }

    prodLog.info('API login attempt initiated', { 
      email, 
      clientIP, 
      rememberMe,
      action: 'api_login_attempt' 
    })

    // Attempt authentication with Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      // Record failed attempt for brute force protection
      recordFailedAttempt(request, email, 'login')
      
      prodLog.error('API authentication failed', error, { 
        email, 
        clientIP, 
        action: 'api_login_failure',
        errorType: 'auth_error'
      })

      return NextResponse.json(
        { 
          error: 'Invalid credentials',
          message: 'Please check your email and password and try again.'
        },
        { status: 401 }
      )
    }

    if (!data?.user || !data?.session) {
      prodLog.error('API login missing user or session', { 
        email, 
        clientIP,
        action: 'api_login_incomplete'
      })

      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 401 }
      )
    }

    // Record successful authentication (clears brute force counters)
    recordSuccessfulAttempt(request, email)
    
    // Successful authentication
    prodLog.info('API authentication successful', { 
      userId: data.user.id,
      email: data.user.email, 
      clientIP,
      rememberMe,
      action: 'api_login_success'
    })

    // Fetch user profile data
    const { data: userProfile } = await supabase
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .single()

    // Create response (no longer sending tokens to client)
    const response = NextResponse.json({
      success: true,
      user: {
        id: data.user.id,
        email: data.user.email,
        firstName: (userProfile as any)?.first_name,
        lastName: (userProfile as any)?.last_name,
        role: (userProfile as any)?.user_role || 'customer',
        isVerified: (userProfile as any)?.is_verified || false,
        phone: (userProfile as any)?.phone,
        avatarUrl: (userProfile as any)?.avatar_url,
      },
      // Don't send tokens to client anymore
      message: 'Login successful'
    })

    // Set httpOnly session cookie
    await setSessionCookie(response, {
      userId: data.user.id,
      email: data.user.email || '',
      role: (userProfile as any)?.user_role || 'customer',
      isVerified: (userProfile as any)?.is_verified || false,
    }, rememberMe)

    // Generate and set CSRF token
    const csrfToken = await generateCSRFToken()
    setCookie(response, COOKIE_NAMES.CSRF_TOKEN, csrfToken)

    // Add security headers
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('X-XSS-Protection', '1; mode=block')

    devLog.info('User logged in with secure session', { 
      userId: data.user.id, 
      rememberMe 
    })

    return response

  } catch (error) {
    prodLog.error('API login exception occurred', error, { 
      clientIP: getClientIP(request),
      action: 'api_login_exception',
      errorType: 'unexpected_error'
    })

    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: 'An unexpected error occurred. Please try again later.'
      },
      { status: 500 }
    )
  }
}

// Handle unsupported methods
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  )
}

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