/**
 * OTP SERVICE WITH SUPABASE INTEGRATION
 * =====================================
 * Secure OTP authentication using Supabase Auth
 * Supports both email and SMS OTP verification
 */

import { supabase } from '@/lib/supabase-client'

export type OTPType = 'email' | 'sms'

export interface OTPResult {
  success: boolean
  error?: string
  data?: any
}

export interface OTPVerificationResult {
  success: boolean
  error?: string
  session?: any
  user?: any
}

/**
 * Send OTP via email or SMS
 * Uses Supabase Auth signInWithOtp
 */
export async function sendOTP(
  contact: string, 
  type: OTPType = 'email',
  options?: {
    shouldCreateUser?: boolean
    data?: Record<string, any>
  }
): Promise<OTPResult> {
  try {
    let result

    if (type === 'email') {
      // Send email OTP
      result = await supabase.auth.signInWithOtp({
        email: contact,
        options: {
          shouldCreateUser: options?.shouldCreateUser ?? false,
          data: options?.data
        }
      })
    } else if (type === 'sms') {
      // Send SMS OTP
      result = await supabase.auth.signInWithOtp({
        phone: contact,
        options: {
          shouldCreateUser: options?.shouldCreateUser ?? false,
          data: options?.data
        }
      })
    } else {
      return {
        success: false,
        error: 'Invalid OTP type. Must be "email" or "sms".'
      }
    }

    if (result.error) {
      return {
        success: false,
        error: result.error.message
      }
    }

    return {
      success: true,
      data: result.data
    }

  } catch (error) {
    console.error('OTP send error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send OTP'
    }
  }
}

/**
 * Verify OTP code
 * Uses Supabase Auth verifyOtp
 */
export async function verifyOTP(
  contact: string,
  token: string,
  type: OTPType = 'email'
): Promise<OTPVerificationResult> {
  try {
    let result

    if (type === 'email') {
      // Verify email OTP
      result = await supabase.auth.verifyOtp({
        email: contact,
        token: token,
        type: 'email'
      })
    } else if (type === 'sms') {
      // Verify SMS OTP
      result = await supabase.auth.verifyOtp({
        phone: contact,
        token: token,
        type: 'sms'
      })
    } else {
      return {
        success: false,
        error: 'Invalid OTP type. Must be "email" or "sms".'
      }
    }

    if (result.error) {
      return {
        success: false,
        error: result.error.message
      }
    }

    return {
      success: true,
      session: result.data.session,
      user: result.data.user
    }

  } catch (error) {
    console.error('OTP verification error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to verify OTP'
    }
  }
}

/**
 * Resend OTP (with rate limiting built into Supabase)
 * Supabase automatically handles rate limiting (60 seconds between requests)
 */
export async function resendOTP(
  contact: string,
  type: OTPType = 'email',
  options?: {
    shouldCreateUser?: boolean
    data?: Record<string, any>
  }
): Promise<OTPResult> {
  // Same as sendOTP - Supabase handles rate limiting automatically
  return sendOTP(contact, type, options)
}

/**
 * Get OTP configuration for UI display
 */
export function getOTPConfig() {
  return {
    // These are Supabase defaults, can be configured in dashboard
    rateLimitSeconds: 60, // 60 seconds between requests
    expirySeconds: 3600, // 1 hour expiry
    codeLength: 6, // 6 digit codes
    maxAttempts: 5 // Max verification attempts (configurable)
  }
}

/**
 * Validate contact information
 */
export function validateContact(contact: string, type: OTPType): boolean {
  if (type === 'email') {
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(contact)
  } else if (type === 'sms') {
    // Basic phone validation (international format)
    const phoneRegex = /^\+[1-9]\d{1,14}$/
    return phoneRegex.test(contact)
  }
  return false
}

/**
 * Format contact for display (hide sensitive parts)
 */
export function formatContactForDisplay(contact: string, type: OTPType): string {
  if (type === 'email') {
    const [username, domain] = contact.split('@')
    if (username.length <= 2) {
      return `${username[0]}***@${domain}`
    }
    return `${username.substring(0, 2)}***@${domain}`
  } else if (type === 'sms') {
    if (contact.length <= 4) {
      return `${contact.substring(0, 1)}***`
    }
    return `${contact.substring(0, 4)}***${contact.substring(contact.length - 2)}`
  }
  return contact
}