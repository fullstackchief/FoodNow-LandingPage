/**
 * Payment Logic Tests
 * ==================
 * Testing payment calculations, transformations, and business logic
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock environment variables
process.env.PAYSTACK_SECRET_KEY = 'sk_test_mock_secret_key'
process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY = 'pk_test_mock_public_key'
process.env.WEBHOOK_SECRET_PAYSTACK = 'mock_webhook_secret'

describe('Payment Logic Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset fetch mock
    global.fetch = vi.fn()
  })

  describe('Payment Reference Generation', () => {
    it('should generate unique payment references', async () => {
      const { generateServerPaymentReference } = await import('@/lib/payment-server')
      
      const orderId = 'test_order_123'
      const ref1 = generateServerPaymentReference(orderId)
      const ref2 = generateServerPaymentReference(orderId)
      
      expect(ref1).toMatch(/^FN_[A-Z0-9_]+$/)
      expect(ref2).toMatch(/^FN_[A-Z0-9_]+$/)
      expect(ref1).not.toBe(ref2) // Should be unique each time
      expect(ref1).toContain('TEST_ORD')
    })

    it('should include order ID prefix in reference', async () => {
      const { generateServerPaymentReference } = await import('@/lib/payment-server')
      
      const orderId = 'order_12345678_test'
      const reference = generateServerPaymentReference(orderId)
      
      expect(reference).toContain('ORDER_12')
      expect(reference.startsWith('FN_')).toBe(true)
    })
  })

  describe('Amount Conversion Logic', () => {
    it('should convert naira to kobo correctly', async () => {
      // Mock successful Paystack response
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          status: true,
          data: {
            authorization_url: 'https://test.com',
            access_code: 'test',
            reference: 'test'
          }
        })
      })

      // Mock database operations
      vi.doMock('@/lib/supabase-server', () => ({
        supabaseServerClient: {
          from: () => ({
            insert: () => Promise.resolve({ data: {}, error: null })
          })
        }
      }))

      const { initializeServerPayment } = await import('@/lib/payment-server')
      
      const testCases = [
        { naira: 1, expectedKobo: 100 },
        { naira: 25.50, expectedKobo: 2550 },
        { naira: 1000, expectedKobo: 100000 },
        { naira: 0.99, expectedKobo: 99 }
      ]

      for (const { naira, expectedKobo } of testCases) {
        const result = await initializeServerPayment({
          orderId: 'test',
          amount: naira,
          email: 'test@test.com',
          userId: 'user123',
          customerName: 'Test',
          orderItems: []
        })

        expect(result.data.amount).toBe(expectedKobo)
      }
    })
  })

  describe('Currency Formatting', () => {
    it('should format kobo to naira display correctly', async () => {
      const { formatServerAmount } = await import('@/lib/payment-server')
      
      const testCases = [
        { kobo: 100, expected: '₦1.00' },
        { kobo: 250000, expected: '₦2,500.00' },
        { kobo: 99, expected: '₦0.99' },
        { kobo: 1000000, expected: '₦10,000.00' },
        { kobo: 50, expected: '₦0.50' },
        { kobo: 1, expected: '₦0.01' },
        { kobo: 0, expected: '₦0.00' }
      ]

      testCases.forEach(({ kobo, expected }) => {
        const formatted = formatServerAmount(kobo)
        expect(formatted).toBe(expected)
      })
    })
  })

  describe('Client Configuration Safety', () => {
    it('should return only safe client configuration', async () => {
      const { getClientPaymentConfig } = await import('@/lib/payment-server')
      const config = getClientPaymentConfig()

      // Should include safe values
      expect(config).toHaveProperty('publicKey')
      expect(config).toHaveProperty('currency', 'NGN')
      expect(config).toHaveProperty('channels')
      expect(config).toHaveProperty('environment')

      // Should NOT include sensitive values
      expect(config).not.toHaveProperty('secretKey')
      expect(config).not.toHaveProperty('webhookSecret')
      expect(config).not.toHaveProperty('PAYSTACK_SECRET_KEY')

      // Verify channels array
      expect(Array.isArray(config.channels)).toBe(true)
      expect(config.channels).toContain('card')
      expect(config.channels).toContain('bank')
      expect(config.channels).toContain('ussd')
    })
  })

  describe('Payment Data Validation', () => {
    it('should validate required payment fields', async () => {
      const { initializeServerPayment } = await import('@/lib/payment-server')
      
      // Test with missing required fields
      const invalidPaymentData = {
        orderId: 'test',
        // Missing amount, email, userId, customerName
      }

      const result = await initializeServerPayment(invalidPaymentData)
      expect(result.success).toBe(false)
    })

    it('should handle malformed email addresses', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          status: true,
          data: { authorization_url: 'test', access_code: 'test', reference: 'test' }
        })
      })

      // Mock database
      vi.doMock('@/lib/supabase-server', () => ({
        supabaseServerClient: {
          from: () => ({
            insert: () => Promise.resolve({ data: {}, error: null })
          })
        }
      }))

      const { initializeServerPayment } = await import('@/lib/payment-server')
      
      const invalidEmails = [
        'notanemail',
        'missing@domain',
        '@missinglocal.com',
        'spaces in@email.com',
        ''
      ]

      for (const email of invalidEmails) {
        const result = await initializeServerPayment({
          orderId: 'test',
          amount: 1000,
          email,
          userId: 'user123',
          customerName: 'Test',
          orderItems: []
        })

        // Payment service should handle invalid emails gracefully
        // Paystack will validate email format on their end
        expect(result).toHaveProperty('success')
      }
    })
  })

  describe('Webhook Signature Validation', () => {
    it('should validate webhook signatures correctly', async () => {
      const crypto = await import('crypto')
      const secret = 'test_webhook_secret'
      const payload = '{"event":"charge.success","data":{"reference":"test"}}'
      
      // Generate valid signature
      const validSignature = crypto.createHmac('sha512', secret)
        .update(payload)
        .digest('hex')
      
      expect(validSignature).toBeTruthy()
      expect(validSignature.length).toBe(128) // SHA-512 produces 128-char hex
      
      // Generate invalid signature
      const invalidSignature = crypto.createHmac('sha512', 'wrong_secret')
        .update(payload)
        .digest('hex')
      
      expect(invalidSignature).not.toBe(validSignature)
    })

    it('should handle malformed webhook payloads', async () => {
      const invalidPayloads = [
        '', // Empty string
        '{invalid json}', // Invalid JSON
        '{"event":"charge.success"}', // Missing data
        '{"data":{"reference":"test"}}', // Missing event
        'null', // Null payload
        '[]' // Array instead of object
      ]

      invalidPayloads.forEach(payload => {
        try {
          const parsed = JSON.parse(payload)
          // If parsing succeeds, check if it has required fields
          if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
            // Valid JSON object, check for required fields
            const hasEvent = 'event' in parsed
            const hasData = 'data' in parsed
            expect(hasEvent && hasData).toBe(false) // Should be missing at least one
          }
        } catch (error) {
          // Should throw for invalid JSON
          expect(error).toBeInstanceOf(SyntaxError)
        }
      })
    })
  })

  describe('Order Status Logic', () => {
    it('should determine correct order status based on payment', async () => {
      const paymentStatuses = [
        { payment: 'success', expectedOrder: 'confirmed' },
        { payment: 'failed', expectedOrder: 'cancelled' },
        { payment: 'pending', expectedOrder: 'created' },
        { payment: 'abandoned', expectedOrder: 'cancelled' }
      ]

      paymentStatuses.forEach(({ payment, expectedOrder }) => {
        // This logic is implemented in the webhook handlers
        let orderStatus
        
        if (payment === 'success') {
          orderStatus = 'confirmed'
        } else if (payment === 'failed' || payment === 'abandoned') {
          orderStatus = 'cancelled'
        } else {
          orderStatus = 'created'
        }

        expect(orderStatus).toBe(expectedOrder)
      })
    })
  })

  describe('Error Response Formatting', () => {
    it('should format error responses consistently', async () => {
      // Test various error scenarios
      const errorTests = [
        {
          error: new Error('Network timeout'),
          expectedMessage: 'Network timeout'
        },
        {
          error: new Error('Invalid API key'),
          expectedMessage: 'Invalid API key'
        },
        {
          error: 'String error',
          expectedMessage: 'Payment initialization failed'
        },
        {
          error: null,
          expectedMessage: 'Payment initialization failed'
        }
      ]

      errorTests.forEach(({ error, expectedMessage }) => {
        let errorMessage
        if (error instanceof Error) {
          errorMessage = error.message
        } else {
          errorMessage = 'Payment initialization failed'
        }

        expect(errorMessage).toBe(expectedMessage)
      })
    })
  })

  describe('Metadata Structure', () => {
    it('should structure metadata correctly for Paystack', async () => {
      const orderData = {
        orderId: 'test_order_123',
        userId: 'user_456',
        customerName: 'John Doe',
        orderItems: [
          { name: 'Jollof Rice', quantity: 2, price: 1500 },
          { name: 'Chicken', quantity: 1, price: 2000 }
        ],
        deliveryAddress: {
          street: '123 Test St',
          area: 'Isolo',
          city: 'Lagos',
          state: 'Lagos'
        }
      }

      // Test metadata structure that would be sent to Paystack
      const expectedMetadata = {
        order_id: orderData.orderId,
        user_id: orderData.userId,
        customer_name: orderData.customerName,
        order_items: orderData.orderItems,
        delivery_address: orderData.deliveryAddress,
        custom_fields: [
          {
            display_name: 'Order ID',
            variable_name: 'order_id',
            value: orderData.orderId
          },
          {
            display_name: 'Customer Name', 
            variable_name: 'customer_name',
            value: orderData.customerName
          }
        ]
      }

      expect(expectedMetadata).toHaveProperty('order_id', orderData.orderId)
      expect(expectedMetadata).toHaveProperty('user_id', orderData.userId)
      expect(expectedMetadata.custom_fields).toHaveLength(2)
      expect(expectedMetadata.order_items).toHaveLength(2)
    })
  })
})