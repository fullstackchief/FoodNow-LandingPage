/**
 * Resend Email Verification API Route
 * ===================================
 * Handles resending email verification for unverified accounts
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase-client'
import { rateLimiters, applyRateLimit } from '@/lib/rateLimiter'
import { checkBruteForce, recordFailedAttempt } from '@/lib/bruteForceProtection'
import { prodLog } from '@/lib/logger'
import { getClientIP } from '@/lib/security'
import { z } from 'zod'
import { validateData } from '@/lib/validations/utils'

// Validation schema for resend verification request
const resendVerificationSchema = z.object({
  email: z.string()
    .min(1, 'Email is required')
    .email('Invalid email format')
    .max(254, 'Email too long')
    .toLowerCase()
    .trim()
})

export async function POST(request: NextRequest) {
  try {
    // Apply stricter rate limiting for email sending
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
    const validation = validateData(resendVerificationSchema, body, 'Resend Verification API')
    if (!validation.success) {
      const firstError = validation.errors[0]
      return NextResponse.json(
        { error: firstError.message },
        { status: 400 }
      )
    }

    const { email } = validation.data
    const clientIP = getClientIP(request)

    // Check for brute force attempts
    const bruteForceCheck = await checkBruteForce(request, email)
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

    prodLog.info('Resend email verification attempt initiated', { 
      email,
      clientIP,
      action: 'resend_email_verification_attempt' 
    })

    // Check if user exists and needs verification
    // Check if user exists and needs verification - getUser not needed for public endpoint
    
    // For public endpoint, we don't have user context, so attempt resend regardless
    // Supabase will handle checking if the email exists and needs verification
    
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email,
      options: {
        emailRedirectTo: `${request.nextUrl.origin}/auth/verify-email`
      }
    })

    if (error) {
      // Don't record as failed attempt if user doesn't exist or is already verified
      // This prevents enumeration attacks
      if (!error.message?.includes('already confirmed')) {
        recordFailedAttempt(request, email, 'signup')
      }
      
      prodLog.error('Resend email verification failed', error, { 
        email,
        clientIP,
        action: 'resend_email_verification_failure',
        errorType: 'resend_error'
      })

      // Handle specific error types while avoiding user enumeration
      if (error.message?.includes('already confirmed')) {
        return NextResponse.json(
          { 
            success: true,
            message: 'If this email is registered and unverified, a verification email has been sent.',
            alreadyVerified: true
          }
        )
      }

      if (error.message?.includes('rate limit') || error.message?.includes('too many')) {
        return NextResponse.json(
          { 
            error: 'Rate limit exceeded',
            message: 'Please wait before requesting another verification email.',
            retryAfter: 300 // 5 minutes
          },
          { 
            status: 429,
            headers: { 'Retry-After': '300' }
          }
        )
      }

      // Generic success message to prevent enumeration
      return NextResponse.json({
        success: true,
        message: 'If this email is registered and unverified, a verification email has been sent.'
      })
    }

    // Successful resend
    prodLog.info('Resend email verification successful', { 
      email,
      clientIP,
      action: 'resend_email_verification_success'
    })

    const response = NextResponse.json({
      success: true,
      message: 'If this email is registered and unverified, a verification email has been sent.',
      details: 'Please check your inbox and spam folder for the verification email.'
    })

    // Add security headers
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('X-XSS-Protection', '1; mode=block')

    return response

  } catch (error) {
    prodLog.error('Resend email verification exception occurred', error, { 
      clientIP: getClientIP(request),
      action: 'resend_email_verification_exception',
      errorType: 'unexpected_error'
    })

    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: 'An unexpected error occurred while sending verification email.'
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