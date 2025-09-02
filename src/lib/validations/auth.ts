import { z } from 'zod'

// Email validation with common patterns
const emailSchema = z
  .string()
  .min(1, 'Email is required')
  .email('Invalid email format')
  .max(254, 'Email too long')
  .toLowerCase()
  .trim()

// Password validation with security requirements
const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password too long')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character')

// Phone number validation (Nigerian format)
const phoneSchema = z
  .string()
  .regex(/^(\+234|0)[789]\d{9}$/, 'Invalid Nigerian phone number format')
  .transform(val => val.startsWith('+234') ? val : val.startsWith('0') ? '+234' + val.slice(1) : '+234' + val)

// Name validation
const nameSchema = z
  .string()
  .min(1, 'Name is required')
  .max(50, 'Name too long')
  .regex(/^[a-zA-Z\s\-'\.]+$/, 'Name contains invalid characters')
  .trim()

// Admin Authentication Schemas
export const adminLoginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required').max(128, 'Password too long')
})

export const adminCreateSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  firstName: nameSchema,
  lastName: nameSchema,
  role: z.enum(['super_admin', 'admin', 'moderator', 'staff'], {
    message: 'Role is required'
  }),
  permissions: z.record(z.string(), z.any()).optional()
})

// User Authentication Schemas
export const userLoginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required').max(128, 'Password too long'),
  rememberMe: z.boolean().optional().default(false)
})

export const userSignupSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  firstName: nameSchema,
  lastName: nameSchema,
  phone: phoneSchema.optional(),
  role: z.enum(['customer', 'restaurant_owner', 'rider'], {
    message: 'User role is required'
  }).default('customer')
})

// Password Reset Schemas
export const resetPasswordRequestSchema = z.object({
  email: emailSchema
})

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: passwordSchema
})

// OTP Validation Schemas
export const otpRequestSchema = z.object({
  contact: z.string().min(1, 'Contact (email or phone) is required'),
  type: z.enum(['sms', 'email'], {
    message: 'OTP type is required'
  })
})

export const otpVerifySchema = z.object({
  contact: z.string().min(1, 'Contact is required'),
  otp: z.string().min(4, 'OTP too short').max(8, 'OTP too long').regex(/^\d+$/, 'OTP must be numeric'),
  type: z.enum(['sms', 'email'])
})

// Profile Update Schema
export const profileUpdateSchema = z.object({
  firstName: nameSchema.optional(),
  lastName: nameSchema.optional(),
  phone: phoneSchema.optional(),
  email: emailSchema.optional(),
  avatar: z.string().url('Invalid avatar URL').optional()
})

// Type exports for TypeScript
export type AdminLoginInput = z.infer<typeof adminLoginSchema>
export type AdminCreateInput = z.infer<typeof adminCreateSchema>
export type UserLoginInput = z.infer<typeof userLoginSchema>
export type UserSignupInput = z.infer<typeof userSignupSchema>
export type ResetPasswordRequestInput = z.infer<typeof resetPasswordRequestSchema>
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>
export type OTPRequestInput = z.infer<typeof otpRequestSchema>
export type OTPVerifyInput = z.infer<typeof otpVerifySchema>
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>