import { z } from 'zod'
import { NextRequest, NextResponse } from 'next/server'
import { prodLog } from '@/lib/logger'

// Validation result types
export type ValidationResult<T> = {
  success: true
  data: T
} | {
  success: false
  errors: ValidationError[]
}

export interface ValidationError {
  field: string
  message: string
  code?: string
}

/**
 * Validates data against a Zod schema and returns formatted results
 */
export function validateData<T>(
  schema: z.ZodSchema<T>, 
  data: unknown,
  context?: string
): ValidationResult<T> {
  try {
    const result = schema.safeParse(data)
    
    if (result.success) {
      return {
        success: true,
        data: result.data
      }
    }

    const errors: ValidationError[] = result.error.issues.map(issue => ({
      field: issue.path.join('.'),
      message: issue.message,
      code: issue.code
    }))

    // Log validation failures for monitoring
    if (context) {
      prodLog.warn('Validation failed', {
        context,
        errors: errors.map(e => `${e.field}: ${e.message}`)
      })
    }

    return {
      success: false,
      errors
    }
  } catch (error) {
    prodLog.error('Schema validation error', error, { context })
    return {
      success: false,
      errors: [{
        field: 'schema',
        message: 'Internal validation error'
      }]
    }
  }
}

/**
 * Validates JSON request body from Next.js API route
 */
export async function validateRequestBody<T>(
  request: NextRequest,
  schema: z.ZodSchema<T>,
  context?: string
): Promise<ValidationResult<T>> {
  try {
    const body = await request.json()
    return validateData(schema, body, context)
  } catch {
    prodLog.warn('Invalid JSON in request body', { context })
    return {
      success: false,
      errors: [{
        field: 'body',
        message: 'Invalid JSON format'
      }]
    }
  }
}

/**
 * Validates URL search parameters
 */
export function validateSearchParams<T>(
  searchParams: URLSearchParams,
  schema: z.ZodSchema<T>,
  context?: string
): ValidationResult<T> {
  try {
    // Convert URLSearchParams to object
    const params: Record<string, string> = {}
    searchParams.forEach((value, key) => {
      params[key] = value
    })
    
    return validateData(schema, params, context)
  } catch (validationError) {
    prodLog.error('Search params validation error', validationError, { context })
    return {
      success: false,
      errors: [{
        field: 'params',
        message: 'Invalid search parameters'
      }]
    }
  }
}

/**
 * Creates a standardized API error response from validation errors
 */
export function createValidationErrorResponse(
  errors: ValidationError[],
  status: number = 400
): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: 'Validation failed',
      details: errors
    },
    { status }
  )
}

/**
 * Higher-order function to wrap API routes with validation
 */
export function withValidation<T>(
  schema: z.ZodSchema<T>,
  handler: (data: T, request: NextRequest) => Promise<NextResponse> | NextResponse
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const validation = await validateRequestBody(request, schema, 'API Route')
    
    if (!validation.success) {
      return createValidationErrorResponse(validation.errors)
    }

    return handler(validation.data, request)
  }
}

/**
 * Sanitizes data by removing potentially dangerous fields
 */
export function sanitizeInput<T extends Record<string, any>>(
  data: T,
  allowedFields: (keyof T)[]
): Partial<T> {
  const sanitized: Partial<T> = {}
  
  allowedFields.forEach(field => {
    if (field in data) {
      sanitized[field] = data[field]
    }
  })
  
  return sanitized
}

/**
 * Rate limiting validation schema
 */
export const rateLimitSchema = z.object({
  identifier: z.string().min(1, 'Identifier is required'),
  action: z.string().min(1, 'Action is required'),
  timestamp: z.date().default(() => new Date())
})

/**
 * Common validation schemas for IDs and basic types
 */
export const commonSchemas = {
  uuid: z.string().uuid('Invalid ID format'),
  positiveInt: z.number().int().min(1, 'Must be a positive integer'),
  positiveNumber: z.number().min(0, 'Must be a positive number'),
  nonEmptyString: z.string().min(1, 'Field is required').trim(),
  email: z.string().email('Invalid email format').toLowerCase().trim(),
  phone: z.string().regex(/^(\+234|0)[789]\d{9}$/, 'Invalid Nigerian phone number'),
  url: z.string().url('Invalid URL format'),
  date: z.string().datetime('Invalid date format').transform(str => new Date(str)),
  boolean: z.boolean(),
  array: <T>(schema: z.ZodSchema<T>) => z.array(schema),
  optional: <T>(schema: z.ZodSchema<T>) => schema.optional()
}

// Re-export validation schemas
export * from './auth'
export * from './orders'

// Webhook validations - only export when specifically needed
// to avoid loading webhook schemas in auth flows
export * from './webhooks'