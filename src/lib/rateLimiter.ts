/**
 * Rate limiter implementation for FoodNow application
 * Provides in-memory rate limiting with configurable limits and windows
 */

import { NextRequest, NextResponse } from 'next/server'
import { getClientIP, logSecurityEvent } from './security'
import { prodLog } from './logger'

// Rate limit configuration
interface RateLimitConfig {
  requests: number      // Max requests per window
  windowMs: number     // Time window in milliseconds
  skipSuccessfulRequests?: boolean
  skipFailedRequests?: boolean
  keyGenerator?: (request: NextRequest) => string
  onLimitReached?: (request: NextRequest, identifier: string) => void
}

// Rate limit entry
interface RateLimitEntry {
  count: number
  resetTime: number
  firstRequest: number
}

// In-memory store for rate limits
class RateLimitStore {
  private store = new Map<string, RateLimitEntry>()
  private cleanupInterval: NodeJS.Timeout

  constructor() {
    // Clean up expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup()
    }, 5 * 60 * 1000)
  }

  get(key: string): RateLimitEntry | undefined {
    return this.store.get(key)
  }

  set(key: string, entry: RateLimitEntry): void {
    this.store.set(key, entry)
  }

  delete(key: string): void {
    this.store.delete(key)
  }

  private cleanup(): void {
    const now = Date.now()
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.resetTime) {
        this.store.delete(key)
      }
    }
  }

  destroy(): void {
    clearInterval(this.cleanupInterval)
    this.store.clear()
  }
}

// Global rate limit store
const globalStore = new RateLimitStore()

/**
 * Rate limiter class
 */
export class RateLimiter {
  private config: Required<RateLimitConfig>
  private store: RateLimitStore

  constructor(config: RateLimitConfig, store?: RateLimitStore) {
    this.config = {
      requests: config.requests,
      windowMs: config.windowMs,
      skipSuccessfulRequests: config.skipSuccessfulRequests ?? false,
      skipFailedRequests: config.skipFailedRequests ?? false,
      keyGenerator: config.keyGenerator ?? ((req) => getClientIP(req)),
      onLimitReached: config.onLimitReached ?? ((req, id) => {
        logSecurityEvent('rate_limit_exceeded', {
          identifier: id,
          path: req.nextUrl.pathname
        }, req)
      })
    }
    this.store = store ?? globalStore
  }

  /**
   * Check if request should be rate limited
   */
  async check(request: NextRequest): Promise<{
    allowed: boolean
    limit: number
    remaining: number
    resetTime: number
  }> {
    const key = this.config.keyGenerator(request)
    const now = Date.now()
    
    let entry = this.store.get(key)
    
    // Create new entry if doesn't exist or window has expired
    if (!entry || now > entry.resetTime) {
      entry = {
        count: 0,
        resetTime: now + this.config.windowMs,
        firstRequest: now
      }
    }

    // Increment request count
    entry.count++
    this.store.set(key, entry)

    const allowed = entry.count <= this.config.requests
    const remaining = Math.max(0, this.config.requests - entry.count)

    if (!allowed) {
      this.config.onLimitReached(request, key)
    }

    return {
      allowed,
      limit: this.config.requests,
      remaining,
      resetTime: entry.resetTime
    }
  }

  /**
   * Create middleware function for this rate limiter
   */
  middleware() {
    return async (request: NextRequest): Promise<NextResponse | null> => {
      const result = await this.check(request)
      
      if (!result.allowed) {
        const response = NextResponse.json(
          {
            error: 'Too many requests',
            message: 'Rate limit exceeded. Please try again later.',
            retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000)
          },
          { status: 429 }
        )

        // Add rate limit headers
        response.headers.set('X-RateLimit-Limit', result.limit.toString())
        response.headers.set('X-RateLimit-Remaining', result.remaining.toString())
        response.headers.set('X-RateLimit-Reset', Math.ceil(result.resetTime / 1000).toString())
        response.headers.set('Retry-After', Math.ceil((result.resetTime - Date.now()) / 1000).toString())

        return response
      }

      return null // Allow request to continue
    }
  }
}

/**
 * Predefined rate limiters for different use cases
 */
export const rateLimiters = {
  // General API rate limiting
  api: new RateLimiter({
    requests: 100,
    windowMs: 15 * 60 * 1000, // 15 minutes
  }),

  // Admin authentication - stricter limits
  adminAuth: new RateLimiter({
    requests: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
    onLimitReached: (req, id) => {
      logSecurityEvent('admin_auth_rate_limit_exceeded', {
        identifier: id,
        path: req.nextUrl.pathname,
        severity: 'high'
      }, req)
    }
  }),

  // Payment endpoints - very strict
  payment: new RateLimiter({
    requests: 10,
    windowMs: 5 * 60 * 1000, // 5 minutes
    onLimitReached: (req, id) => {
      logSecurityEvent('payment_rate_limit_exceeded', {
        identifier: id,
        path: req.nextUrl.pathname,
        severity: 'high'
      }, req)
    }
  }),

  // Order creation
  orders: new RateLimiter({
    requests: 20,
    windowMs: 10 * 60 * 1000, // 10 minutes
  }),

  // User registration and login
  auth: new RateLimiter({
    requests: 10,
    windowMs: 15 * 60 * 1000, // 15 minutes
  }),

  // Search and browsing
  search: new RateLimiter({
    requests: 200,
    windowMs: 15 * 60 * 1000, // 15 minutes
  }),

  // Webhooks - higher limits for legitimate services
  webhook: new RateLimiter({
    requests: 1000,
    windowMs: 15 * 60 * 1000, // 15 minutes
  })
}

/**
 * Helper function to apply rate limiting to API routes
 */
export async function applyRateLimit(
  request: NextRequest,
  limiter: RateLimiter
): Promise<NextResponse | null> {
  try {
    return await limiter.middleware()(request)
  } catch (error) {
    prodLog.error('Rate limiter error', error, {
      path: request.nextUrl.pathname,
      ip: getClientIP(request)
    })
    
    // Fail open - allow request if rate limiter fails
    return null
  }
}

/**
 * Enhanced rate limiter with user-based limiting
 */
export class UserRateLimiter extends RateLimiter {
  constructor(config: RateLimitConfig) {
    super({
      ...config,
      keyGenerator: (request: NextRequest) => {
        // Try to get user ID from Authorization header or session
        const auth = request.headers.get('authorization')
        if (auth) {
          // Extract user ID from JWT token (simplified)
          try {
            const token = auth.replace('Bearer ', '')
            const payload = JSON.parse(atob(token.split('.')[1]))
            return `user:${payload.sub || payload.user_id}`
          } catch {
            // Fall back to IP if token parsing fails
            return `ip:${getClientIP(request)}`
          }
        }
        return `ip:${getClientIP(request)}`
      }
    })
  }
}

/**
 * Rate limiter with progressive penalties
 */
export class ProgressiveRateLimiter {
  private baseLimiter: RateLimiter
  private violationStore = new Map<string, { count: number; lastViolation: number }>()

  constructor(config: RateLimitConfig) {
    this.baseLimiter = new RateLimiter(config)
  }

  async check(request: NextRequest): Promise<{
    allowed: boolean
    limit: number
    remaining: number
    resetTime: number
    penaltyMultiplier?: number
  }> {
    const key = this.baseLimiter['config'].keyGenerator(request)
    const baseResult = await this.baseLimiter.check(request)
    
    // Check for previous violations
    const violation = this.violationStore.get(key)
    const now = Date.now()
    
    if (violation && (now - violation.lastViolation) < 24 * 60 * 60 * 1000) {
      // Apply progressive penalty (reduce limits by violation count)
      const penaltyMultiplier = Math.max(0.1, 1 - (violation.count * 0.2))
      const penalizedLimit = Math.floor(baseResult.limit * penaltyMultiplier)
      
      if (baseResult.remaining > penalizedLimit) {
        // Update violation count
        this.violationStore.set(key, {
          count: violation.count + 1,
          lastViolation: now
        })
        
        return {
          ...baseResult,
          allowed: false,
          penaltyMultiplier
        }
      }
      
      return { ...baseResult, penaltyMultiplier }
    }
    
    if (!baseResult.allowed) {
      // Record new violation
      this.violationStore.set(key, {
        count: (violation?.count || 0) + 1,
        lastViolation: now
      })
    }
    
    return baseResult
  }
}

/**
 * Cleanup function for graceful shutdown
 */
export function cleanup(): void {
  globalStore.destroy()
}

// Export commonly used rate limiters
export default rateLimiters