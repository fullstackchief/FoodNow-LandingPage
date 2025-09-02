/**
 * User Registration API Route with Rate Limiting
 * ==============================================
 * Handles user registration with built-in rate limiting
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase-client'
import { userSignupSchema } from '@/lib/validations/auth'
import { validateData } from '@/lib/validations/utils'
import { rateLimiters, applyRateLimit } from '@/lib/rateLimiter'
import { checkBruteForce, recordFailedAttempt, recordSuccessfulAttempt } from '@/lib/bruteForceProtection'
import { prodLog } from '@/lib/logger'
import { getClientIP } from '@/lib/security'

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting for registration
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
    const validation = validateData(userSignupSchema, body, 'Registration API')
    if (!validation.success) {
      const firstError = validation.errors[0]
      return NextResponse.json(
        { error: firstError.message },
        { status: 400 }
      )
    }

    const { email, password, firstName, lastName, phone, role } = validation.data
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

    prodLog.info('API registration attempt initiated', { 
      email, 
      clientIP, 
      role,
      action: 'api_registration_attempt' 
    })

    // Attempt registration with Supabase
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
          phone,
          user_role: role
        }
      }
    })

    if (error) {
      // Record failed attempt for brute force protection
      recordFailedAttempt(request, email, 'signup')
      
      prodLog.error('API registration failed', error, { 
        email, 
        clientIP,
        role,
        action: 'api_registration_failure',
        errorType: 'auth_error'
      })

      // Handle specific error types
      if (error.message?.includes('already registered')) {
        return NextResponse.json(
          { error: 'An account with this email already exists' },
          { status: 409 }
        )
      }

      if (error.message?.includes('Password')) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        )
      }

      return NextResponse.json(
        { error: 'Registration failed. Please try again.' },
        { status: 400 }
      )
    }

    if (!data?.user) {
      prodLog.error('API registration missing user data', { 
        email, 
        clientIP,
        action: 'api_registration_incomplete'
      })

      return NextResponse.json(
        { error: 'Registration failed' },
        { status: 400 }
      )
    }

    // Record successful registration (clears brute force counters)
    recordSuccessfulAttempt(request, email)
    
    // Successful registration
    prodLog.info('API registration successful', { 
      userId: data.user.id,
      email: data.user.email, 
      clientIP,
      role,
      action: 'api_registration_success'
    })

    const response = NextResponse.json({
      success: true,
      message: 'Registration successful. Please check your email for verification.',
      user: {
        id: data.user.id,
        email: data.user.email,
        email_confirmed_at: data.user.email_confirmed_at
      },
      requiresEmailVerification: !data.user.email_confirmed_at
    })

    // Add security headers
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('X-XSS-Protection', '1; mode=block')

    return response

  } catch (error) {
    prodLog.error('API registration exception occurred', error, { 
      clientIP: getClientIP(request),
      action: 'api_registration_exception',
      errorType: 'unexpected_error'
    })

    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: 'An unexpected error occurred during registration.'
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