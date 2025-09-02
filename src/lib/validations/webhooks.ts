import { z } from 'zod'

// Paystack webhook event validation
export const paystackWebhookSchema = z.object({
  event: z.string().min(1, 'Event type is required'),
  data: z.object({
    id: z.number().int().positive('Invalid transaction ID'),
    domain: z.string().min(1, 'Domain is required'),
    status: z.enum(['success', 'failed', 'abandoned'], {
      message: 'Transaction status is required'
    }),
    reference: z.string().min(1, 'Reference is required').max(200, 'Reference too long'),
    amount: z.number().int().positive('Amount must be positive'),
    message: z.string().nullable(),
    gateway_response: z.string().min(1, 'Gateway response is required'),
    paid_at: z.string().nullable(),
    created_at: z.string().min(1, 'Creation date is required'),
    channel: z.string().min(1, 'Channel is required'),
    currency: z.string().min(3, 'Currency is required').max(3, 'Invalid currency code'),
    ip_address: z.string()
      .regex(/^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/, 'Invalid IP address')
      .optional(),
    metadata: z.object({
      order_id: z.string().uuid('Invalid order ID').optional(),
      user_id: z.string().uuid('Invalid user ID').optional(),
      customer_name: z.string().max(200).optional(),
      custom_fields: z.array(z.object({
        display_name: z.string().max(100),
        variable_name: z.string().max(100),
        value: z.string().max(500)
      })).optional()
    }).optional(),
    fees: z.number().min(0, 'Fees cannot be negative'),
    fees_split: z.any().optional(),
    authorization: z.object({
      authorization_code: z.string().min(1, 'Authorization code is required'),
      bin: z.string().min(1, 'BIN is required'),
      last4: z.string().length(4, 'Last4 must be 4 digits'),
      exp_month: z.string().length(2, 'Expiry month must be 2 digits'),
      exp_year: z.string().length(4, 'Expiry year must be 4 digits'),
      channel: z.string().min(1, 'Channel is required'),
      card_type: z.string().min(1, 'Card type is required'),
      bank: z.string().min(1, 'Bank is required'),
      country_code: z.string().length(2, 'Country code must be 2 characters'),
      brand: z.string().min(1, 'Brand is required'),
      reusable: z.boolean(),
      signature: z.string().min(1, 'Signature is required'),
      account_name: z.string().nullable()
    }).nullable().optional(),
    customer: z.object({
      id: z.number().int().positive(),
      first_name: z.string().nullable(),
      last_name: z.string().nullable(),
      email: z.string().email('Invalid customer email'),
      customer_code: z.string().min(1, 'Customer code is required'),
      phone: z.string().nullable(),
      metadata: z.any().optional(),
      risk_action: z.string().min(1, 'Risk action is required')
    }),
    plan: z.any().nullable().optional(),
    subaccount: z.any().nullable().optional(),
    order_id: z.string().nullable().optional(),
    paidAt: z.string().nullable().optional(),
    createdAt: z.string().min(1, 'Creation date is required'),
    requested_amount: z.number().int().positive('Requested amount must be positive')
  })
})

// Webhook signature validation
export const webhookSignatureSchema = z.object({
  signature: z.string().min(1, 'Webhook signature is required'),
  payload: z.string().min(1, 'Webhook payload is required')
})

// Transfer webhook event validation
export const transferWebhookSchema = z.object({
  event: z.enum(['transfer.success', 'transfer.failed', 'transfer.reversed']),
  data: z.object({
    reference: z.string().min(1, 'Reference is required'),
    status: z.enum(['success', 'failed', 'reversed']),
    amount: z.number().int().positive('Amount must be positive'),
    paid_at: z.string().nullable(),
    created_at: z.string().min(1, 'Creation date is required'),
    recipient: z.object({
      name: z.string().min(1, 'Recipient name is required'),
      account_number: z.string().min(1, 'Account number is required'),
      bank_code: z.string().min(1, 'Bank code is required')
    }).optional()
  })
})

// Generic webhook validation
export const genericWebhookSchema = z.object({
  event: z.string().min(1, 'Event type is required'),
  data: z.record(z.string(), z.any()),
  created_at: z.string().optional(),
  signature: z.string().optional()
})

// Webhook response validation
export const webhookResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().min(1, 'Response message is required'),
  timestamp: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/, 'Invalid timestamp format')
    .optional(),
  processed_events: z.number().int().min(0).optional()
})

// Type exports
export type PaystackWebhookInput = z.infer<typeof paystackWebhookSchema>
export type WebhookSignatureInput = z.infer<typeof webhookSignatureSchema>
export type TransferWebhookInput = z.infer<typeof transferWebhookSchema>
export type GenericWebhookInput = z.infer<typeof genericWebhookSchema>
export type WebhookResponseInput = z.infer<typeof webhookResponseSchema>