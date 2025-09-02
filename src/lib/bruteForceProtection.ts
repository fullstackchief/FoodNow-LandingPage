/**
 * Brute Force Protection System
 * =============================
 * Advanced rate limiting with progressive penalties and IP blocking
 */

import { NextRequest } from 'next/server'
import { getClientIP, logSecurityEvent } from './security'
import { prodLog, devLog } from './logger'

// Brute force attempt tracking
interface BruteForceAttempt {
  count: number
  firstAttempt: number
  lastAttempt: number
  isBlocked: boolean
  blockUntil?: number
  progressivePenalty: number
}

// In-memory store for brute force tracking
class BruteForceStore {
  private attempts = new Map<string, BruteForceAttempt>()
  private cleanupInterval: NodeJS.Timeout

  constructor() {
    // Clean up expired entries every 10 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup()
    }, 10 * 60 * 1000)
  }

  get(key: string): BruteForceAttempt | undefined {
    return this.attempts.get(key)
  }

  set(key: string, attempt: BruteForceAttempt): void {
    this.attempts.set(key, attempt)
  }

  delete(key: string): void {
    this.attempts.delete(key)
  }

  private cleanup(): void {
    const now = Date.now()
    const expiredKeys: string[] = []
    
    for (const [key, attempt] of this.attempts.entries()) {
      // Remove expired blocks and old attempts (24 hours)
      const isExpiredBlock = attempt.blockUntil && now > attempt.blockUntil
      const isOldAttempt = (now - attempt.lastAttempt) > (24 * 60 * 60 * 1000)
      
      if (isExpiredBlock || isOldAttempt) {
        expiredKeys.push(key)
      }
    }
    
    expiredKeys.forEach(key => this.attempts.delete(key))
    
    if (expiredKeys.length > 0) {
      devLog.info(`Cleaned up ${expiredKeys.length} expired brute force entries`)
    }
  }

  destroy(): void {
    clearInterval(this.cleanupInterval)
    this.attempts.clear()
  }
}

// Global brute force store
const bruteForceStore = new BruteForceStore()

/**
 * Brute Force Protection Configuration
 */
const BRUTE_FORCE_CONFIG = {
  // Base limits
  maxAttempts: 5,
  timeWindowMs: 15 * 60 * 1000, // 15 minutes
  
  // Progressive blocking (in minutes)
  blockDurations: [5, 15, 30, 60, 120, 240, 480, 960], // Up to 16 hours
  
  // Account lockout after this many failed attempts
  accountLockoutAttempts: 10,
  accountLockoutDurationMs: 60 * 60 * 1000, // 1 hour
  
  // IP blocking after this many attempts across multiple accounts
  ipBlockAttempts: 20,
  ipBlockDurationMs: 2 * 60 * 60 * 1000, // 2 hours
}

/**
 * Generate key for brute force tracking
 */
function generateKey(identifier: string, type: 'ip' | 'email' | 'combined'): string {
  return `bf_${type}_${identifier.toLowerCase()}`
}

/**
 * Check if request should be blocked due to brute force attempts
 */
export async function checkBruteForce(
  request: NextRequest,
  email?: string
): Promise<{
  allowed: boolean
  reason?: string
  retryAfter?: number
  blockType?: 'ip' | 'account' | 'combined'
}> {
  const clientIP = getClientIP(request)
  const now = Date.now()

  try {
    // Check IP-based blocking
    const ipKey = generateKey(clientIP, 'ip')
    const ipAttempts = bruteForceStore.get(ipKey)

    if (ipAttempts?.isBlocked && ipAttempts.blockUntil && now < ipAttempts.blockUntil) {
      const retryAfter = Math.ceil((ipAttempts.blockUntil - now) / 1000)
      
      logSecurityEvent('brute_force_ip_blocked', {
        clientIP,
        blockUntil: new Date(ipAttempts.blockUntil).toISOString(),
        attempts: ipAttempts.count
      }, request)

      return {
        allowed: false,
        reason: 'IP address temporarily blocked due to too many failed attempts',
        retryAfter,
        blockType: 'ip'
      }
    }

    // Check email-based blocking (if email provided)
    if (email) {
      const emailKey = generateKey(email, 'email')
      const emailAttempts = bruteForceStore.get(emailKey)

      if (emailAttempts?.isBlocked && emailAttempts.blockUntil && now < emailAttempts.blockUntil) {
        const retryAfter = Math.ceil((emailAttempts.blockUntil - now) / 1000)
        
        logSecurityEvent('brute_force_account_blocked', {
          email,
          clientIP,
          blockUntil: new Date(emailAttempts.blockUntil).toISOString(),
          attempts: emailAttempts.count
        }, request)

        return {
          allowed: false,
          reason: 'Account temporarily locked due to too many failed attempts',
          retryAfter,
          blockType: 'account'
        }
      }

      // Check combined IP + email blocking for sophisticated attacks
      const combinedKey = generateKey(`${clientIP}_${email}`, 'combined')
      const combinedAttempts = bruteForceStore.get(combinedKey)

      if (combinedAttempts?.isBlocked && combinedAttempts.blockUntil && now < combinedAttempts.blockUntil) {
        const retryAfter = Math.ceil((combinedAttempts.blockUntil - now) / 1000)
        
        return {
          allowed: false,
          reason: 'Too many failed attempts from this IP for this account',
          retryAfter,
          blockType: 'combined'
        }
      }
    }

    return { allowed: true }
  } catch (error) {
    prodLog.error('Error checking brute force protection', error, { clientIP, email })
    // Fail open - allow request if brute force check fails
    return { allowed: true }
  }
}

/**
 * Record a failed authentication attempt
 */
export function recordFailedAttempt(
  request: NextRequest,
  email?: string,
  attemptType: 'login' | 'signup' | 'password_reset' = 'login'
): void {
  const clientIP = getClientIP(request)
  const now = Date.now()

  try {
    // Record IP-based attempt
    recordAttemptForKey(generateKey(clientIP, 'ip'), now, 'ip', clientIP)

    // Record email-based attempt (if email provided)
    if (email) {
      recordAttemptForKey(generateKey(email, 'email'), now, 'account', email)
      
      // Record combined IP + email attempt
      recordAttemptForKey(generateKey(`${clientIP}_${email}`, 'combined'), now, 'combined', `${clientIP}_${email}`)
    }

    // Log security event
    logSecurityEvent('authentication_failed', {
      clientIP,
      email,
      attemptType,
      timestamp: new Date().toISOString()
    }, request)

  } catch (error) {
    prodLog.error('Error recording failed attempt', error, { clientIP, email })
  }
}

/**
 * Record attempt for a specific key
 */
function recordAttemptForKey(key: string, now: number, type: 'ip' | 'account' | 'combined', identifier: string): void {
  let attempt = bruteForceStore.get(key)

  if (!attempt) {
    attempt = {
      count: 0,
      firstAttempt: now,
      lastAttempt: now,
      isBlocked: false,
      progressivePenalty: 0
    }
  }

  // Reset if outside time window
  if ((now - attempt.firstAttempt) > BRUTE_FORCE_CONFIG.timeWindowMs) {
    attempt.count = 0
    attempt.firstAttempt = now
    attempt.progressivePenalty = Math.max(0, attempt.progressivePenalty - 1) // Reduce penalty over time
  }

  attempt.count++
  attempt.lastAttempt = now

  // Determine if blocking is needed
  const shouldBlock = type === 'ip' 
    ? attempt.count >= BRUTE_FORCE_CONFIG.ipBlockAttempts
    : attempt.count >= BRUTE_FORCE_CONFIG.maxAttempts

  if (shouldBlock) {
    const penaltyIndex = Math.min(attempt.progressivePenalty, BRUTE_FORCE_CONFIG.blockDurations.length - 1)
    const blockDurationMs = BRUTE_FORCE_CONFIG.blockDurations[penaltyIndex] * 60 * 1000

    attempt.isBlocked = true
    attempt.blockUntil = now + blockDurationMs
    attempt.progressivePenalty++

    devLog.warn(`Blocking ${type} due to brute force attempts`, {
      identifier,
      attempts: attempt.count,
      penaltyLevel: attempt.progressivePenalty,
      blockDurationMinutes: BRUTE_FORCE_CONFIG.blockDurations[penaltyIndex],
      blockUntil: new Date(attempt.blockUntil).toISOString()
    })

    // Log high-severity security event for blocks
    logSecurityEvent('brute_force_block_applied', {
      type,
      identifier,
      attempts: attempt.count,
      penaltyLevel: attempt.progressivePenalty,
      blockDurationMs,
      severity: 'high'
    })
  }

  bruteForceStore.set(key, attempt)
}

/**
 * Record a successful authentication (resets counters)
 */
export function recordSuccessfulAttempt(request: NextRequest, email?: string): void {
  const clientIP = getClientIP(request)

  try {
    // Clear IP-based attempts
    bruteForceStore.delete(generateKey(clientIP, 'ip'))

    // Clear email-based attempts (if email provided)
    if (email) {
      bruteForceStore.delete(generateKey(email, 'email'))
      bruteForceStore.delete(generateKey(`${clientIP}_${email}`, 'combined'))
    }

    devLog.info('Cleared brute force counters after successful authentication', {
      clientIP,
      email
    })

  } catch (error) {
    prodLog.error('Error clearing successful attempt', error, { clientIP, email })
  }
}

/**
 * Get current attempt statistics for monitoring
 */
export function getBruteForceStats(): {
  totalAttempts: number
  blockedIPs: number
  blockedAccounts: number
  activeBlocks: number
} {
  let totalAttempts = 0
  let blockedIPs = 0
  let blockedAccounts = 0
  let activeBlocks = 0
  const now = Date.now()

  for (const [key, attempt] of bruteForceStore['attempts'].entries()) {
    totalAttempts += attempt.count

    if (attempt.isBlocked && attempt.blockUntil && now < attempt.blockUntil) {
      activeBlocks++
      
      if (key.includes('bf_ip_')) {
        blockedIPs++
      } else if (key.includes('bf_email_')) {
        blockedAccounts++
      }
    }
  }

  return {
    totalAttempts,
    blockedIPs,
    blockedAccounts,
    activeBlocks
  }
}

/**
 * Manually unblock an IP or account (admin function)
 */
export function manualUnblock(identifier: string, type: 'ip' | 'email'): boolean {
  try {
    const key = generateKey(identifier, type)
    const attempt = bruteForceStore.get(key)
    
    if (attempt) {
      bruteForceStore.delete(key)
      devLog.info(`Manually unblocked ${type}`, { identifier })
      return true
    }
    
    return false
  } catch (error) {
    prodLog.error('Error manually unblocking', error, { identifier, type })
    return false
  }
}

/**
 * Cleanup function for graceful shutdown
 */
export function cleanup(): void {
  bruteForceStore.destroy()
}

// Export the store for testing purposes
export { bruteForceStore }

export default {
  checkBruteForce,
  recordFailedAttempt,
  recordSuccessfulAttempt,
  getBruteForceStats,
  manualUnblock,
  cleanup
}