/**
 * Payment API Endpoint Tests
 * =========================
 * Testing /api/payments/* endpoints with authentication and validation
 */

import { describe, it, expect, beforeAll, vi } from 'vitest'
import { createClient } from '@supabase/supabase-js'

// Mock Next.js request/response
const mockRequest = (data, headers = {}) => ({
  json: () => Promise.resolve(data),
  headers: {
    get: (name) => headers[name] || null
  }
})

const mockNextResponse = {
  json: vi.fn((data, options) => ({
    json: () => Promise.resolve(data),
    status: options?.status || 200
  }))
}

// Mock modules before importing routes
vi.mock('next/server', () => ({
  NextRequest: vi.fn(),
  NextResponse: mockNextResponse
}))

// Mock rate limiter to allow all requests in tests
vi.mock('@/lib/rateLimiter', () => ({
  applyRateLimit: vi.fn().mockResolvedValue(null),
  rateLimiters: {
    api: {},
    webhook: {}
  }
}))

// Mock Supabase auth for tests
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn()
    }
  }))
}))

describe('Payment API Endpoints', () => {
  const mockUser = {
    id: 'test-user-123',
    email: 'test@example.com'
  }

  const validPaymentData = {
    orderId: 'order_test_api_' + Date.now(),
    amount: 2500,
    email: 'customer@example.com',
    customerName: 'Test Customer',
    orderItems: [
      { name: 'Jollof Rice', quantity: 1, price: 2500 }
    ],
    deliveryAddress: {
      street: 'Test Street',
      area: 'Isolo',
      city: 'Lagos',
      state: 'Lagos'
    }
  }

  describe('POST /api/payments/initialize', () => {
    beforeAll(() => {
      // Reset all mocks
      vi.clearAllMocks()
      
      // Mock successful auth
      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: mockUser },
            error: null
          })
        }
      }
      
      vi.mocked(createClient).mockReturnValue(mockSupabase)
    })

    it('should initialize payment with valid authenticated request', async () => {
      // Mock successful Paystack response
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          status: true,
          data: {
            authorization_url: 'https://checkout.paystack.com/test',
            access_code: 'test_access',
            reference: 'test_ref'
          }
        })
      })

      // Mock database insert
      const mockSupabaseService = {
        from: vi.fn(() => ({
          insert: vi.fn(() => ({
            select: vi.fn().mockResolvedValue({ data: {}, error: null })
          }))
        }))
      }

      const request = mockRequest(validPaymentData, {
        'authorization': 'Bearer valid_token'
      })

      const { POST } = await import('@/app/api/payments/initialize/route')
      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(200)
      expect(responseData.success).toBe(true)
      expect(responseData.data).toHaveProperty('authorization_url')
      expect(responseData.data).toHaveProperty('reference')
    })

    it('should reject request without authentication', async () => {
      const request = mockRequest(validPaymentData, {})

      const { POST } = await import('@/app/api/payments/initialize/route')
      const response = await POST(request)

      expect(response.status).toBe(401)
      
      const responseData = await response.json()
      expect(responseData.error).toContain('Authentication required')
    })

    it('should reject request with invalid token', async () => {
      // Mock auth failure
      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: null },
            error: new Error('Invalid token')
          })
        }
      }
      
      vi.mocked(createClient).mockReturnValue(mockSupabase)

      const request = mockRequest(validPaymentData, {
        'authorization': 'Bearer invalid_token'
      })

      const { POST } = await import('@/app/api/payments/initialize/route')
      const response = await POST(request)

      expect(response.status).toBe(401)
      
      const responseData = await response.json()
      expect(responseData.error).toContain('Invalid or expired session')
    })

    it('should validate required payment fields', async () => {
      // Mock successful auth
      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: mockUser },
            error: null
          })
        }
      }
      
      vi.mocked(createClient).mockReturnValue(mockSupabase)

      const incompleteData = {
        orderId: 'test_order',
        // Missing amount, email, customerName
      }

      const request = mockRequest(incompleteData, {
        'authorization': 'Bearer valid_token'
      })

      const { POST } = await import('@/app/api/payments/initialize/route')
      const response = await POST(request)

      expect(response.status).toBe(400)
      
      const responseData = await response.json()
      expect(responseData.error).toContain('Missing required payment data')
    })

    it('should validate positive payment amount', async () => {
      // Mock successful auth
      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: mockUser },
            error: null
          })
        }
      }
      
      vi.mocked(createClient).mockReturnValue(mockSupabase)

      const invalidAmountData = {
        ...validPaymentData,
        amount: -500 // Negative amount
      }

      const request = mockRequest(invalidAmountData, {
        'authorization': 'Bearer valid_token'
      })

      const { POST } = await import('@/app/api/payments/initialize/route')
      const response = await POST(request)

      expect(response.status).toBe(400)
      
      const responseData = await response.json()
      expect(responseData.error).toContain('Invalid payment amount')
    })
  })

  describe('POST /api/payments/verify', () => {
    beforeAll(() => {
      // Reset mocks and setup successful auth
      vi.clearAllMocks()
      
      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: mockUser },
            error: null
          })
        }
      }
      
      vi.mocked(createClient).mockReturnValue(mockSupabase)
    })

    it('should verify payment with valid reference', async () => {
      // Mock successful Paystack verification
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          status: true,
          data: {
            status: 'success',
            reference: 'test_verify_ref',
            amount: 250000,
            currency: 'NGN',
            paid_at: new Date().toISOString(),
            channel: 'card',
            metadata: {
              order_id: 'test_order',
              user_id: mockUser.id
            }
          }
        })
      })

      const request = mockRequest(
        { reference: 'test_verify_ref' },
        { 'authorization': 'Bearer valid_token' }
      )

      const { POST } = await import('@/app/api/payments/verify/route')
      const response = await POST(request)

      expect(response.status).toBe(200)
      
      const responseData = await response.json()
      expect(responseData.success).toBe(true)
      expect(responseData.data.status).toBe('success')
      expect(responseData.data.reference).toBe('test_verify_ref')
    })

    it('should reject verification without reference', async () => {
      const request = mockRequest(
        {}, // Missing reference
        { 'authorization': 'Bearer valid_token' }
      )

      const { POST } = await import('@/app/api/payments/verify/route')
      const response = await POST(request)

      expect(response.status).toBe(400)
      
      const responseData = await response.json()
      expect(responseData.error).toContain('Payment reference is required')
    })

    it('should handle Paystack verification errors', async () => {
      // Mock Paystack API error
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        text: () => Promise.resolve('Transaction not found')
      })

      const request = mockRequest(
        { reference: 'invalid_reference' },
        { 'authorization': 'Bearer valid_token' }
      )

      const { POST } = await import('@/app/api/payments/verify/route')
      const response = await POST(request)

      expect(response.status).toBe(500)
      
      const responseData = await response.json()
      expect(responseData.error).toContain('Payment verification failed')
    })
  })

  describe('HTTP Method Validation', () => {
    it('should reject GET requests on payment endpoints', async () => {
      const initializeModule = await import('@/app/api/payments/initialize/route')
      const verifyModule = await import('@/app/api/payments/verify/route')

      const initResponse = await initializeModule.GET()
      const verifyResponse = await verifyModule.GET()

      expect(initResponse.status).toBe(405)
      expect(verifyResponse.status).toBe(405)

      const initData = await initResponse.json()
      const verifyData = await verifyResponse.json()

      expect(initData.error).toContain('Method not allowed')
      expect(verifyData.error).toContain('Method not allowed')
    })

    it('should reject PUT/DELETE requests on payment endpoints', async () => {
      const initializeModule = await import('@/app/api/payments/initialize/route')
      const verifyModule = await import('@/app/api/payments/verify/route')

      const initPutResponse = await initializeModule.PUT()
      const initDeleteResponse = await initializeModule.DELETE()
      const verifyPutResponse = await verifyModule.PUT()
      const verifyDeleteResponse = await verifyModule.DELETE()

      expect(initPutResponse.status).toBe(405)
      expect(initDeleteResponse.status).toBe(405)
      expect(verifyPutResponse.status).toBe(405)
      expect(verifyDeleteResponse.status).toBe(405)
    })
  })

  describe('Security Features', () => {
    it('should log security events properly', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
      
      // Mock successful auth for security test
      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: mockUser },
            error: null
          })
        }
      }
      
      vi.mocked(createClient).mockReturnValue(mockSupabase)

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          status: true,
          data: { authorization_url: 'test', access_code: 'test', reference: 'test' }
        })
      })

      const request = mockRequest(validPaymentData, {
        'authorization': 'Bearer valid_token',
        'x-forwarded-for': '192.168.1.1'
      })

      const { POST } = await import('@/app/api/payments/initialize/route')
      await POST(request)

      // Verify that security-related information is logged
      expect(consoleSpy).toHaveBeenCalled()
      
      consoleSpy.mockRestore()
    })

    it('should apply rate limiting', async () => {
      // Test that rate limiting is called (mocked to allow requests)
      const { applyRateLimit } = await import('@/lib/rateLimiter')
      
      const request = mockRequest({}, { 'authorization': 'Bearer token' })
      
      const { POST } = await import('@/app/api/payments/initialize/route')
      await POST(request)

      expect(applyRateLimit).toHaveBeenCalled()
    })
  })
})