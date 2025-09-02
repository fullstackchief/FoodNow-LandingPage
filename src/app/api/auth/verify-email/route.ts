/**
 * Email Verification API Route
 * ============================
 * Handles email verification for new user accounts
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { rateLimiters, applyRateLimit } from '@/lib/rateLimiter'
import { checkBruteForce, recordFailedAttempt } from '@/lib/bruteForceProtection'
import { prodLog, devLog } from '@/lib/logger'
import { getClientIP } from '@/lib/security'

// Server-side only - service role key for database operations
const supabaseService = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting for email verification
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

    const { token } = body

    if (!token || typeof token !== 'string') {
      return NextResponse.json(
        { error: 'Verification token is required' },
        { status: 400 }
      )
    }

    const clientIP = getClientIP(request)

    // Check for brute force attempts
    const bruteForceCheck = await checkBruteForce(request)
    if (!bruteForceCheck.allowed) {
      return NextResponse.json(
        { 
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

    prodLog.info('Email verification attempt initiated', { 
      clientIP,
      action: 'email_verification_attempt' 
    })

    // Verify the email confirmation token
    const { data, error } = await supabaseService.auth.verifyOtp({
      token_hash: token,
      type: 'signup'
    })

    if (error) {
      // Record failed attempt for potential token brute forcing
      recordFailedAttempt(request, undefined, 'signup')
      
      prodLog.error('Email verification failed', error, { 
        clientIP,
        action: 'email_verification_failure',
        errorType: 'verification_error'
      })

      // Handle specific error types
      if (error.message?.includes('expired') || error.message?.includes('invalid')) {
        return NextResponse.json(
          { 
            error: 'Invalid or expired verification token',
            message: 'Please request a new verification email.',
            expired: true
          },
          { status: 400 }
        )
      }

      return NextResponse.json(
        { error: 'Email verification failed. Please try again.' },
        { status: 400 }
      )
    }

    if (!data?.user) {
      prodLog.error('Email verification missing user data', { 
        clientIP,
        action: 'email_verification_incomplete'
      })

      return NextResponse.json(
        { error: 'Verification failed' },
        { status: 400 }
      )
    }

    // Update user profile to mark as verified
    const { error: updateError } = await supabaseService
      .from('users')
      .update({ 
        is_verified: true,
        verification_completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', data.user.id)

    if (updateError) {
      devLog.warn('Failed to update user verification status in database', { 
        userId: data.user.id,
        error: updateError.message 
      })
      // Continue anyway - the auth verification is the primary check
    }

    // Successful email verification
    prodLog.info('Email verification successful', { 
      userId: data.user.id,
      email: data.user.email, 
      clientIP,
      action: 'email_verification_success'
    })

    const response = NextResponse.json({
      success: true,
      message: 'Email verified successfully! You can now sign in to your account.',
      user: {
        id: data.user.id,
        email: data.user.email,
        email_confirmed_at: data.user.email_confirmed_at
      }
    })

    // Add security headers
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('X-XSS-Protection', '1; mode=block')

    return response

  } catch (error) {
    prodLog.error('Email verification exception occurred', error, { 
      clientIP: getClientIP(request),
      action: 'email_verification_exception',
      errorType: 'unexpected_error'
    })

    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: 'An unexpected error occurred during email verification.'
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