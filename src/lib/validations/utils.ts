import { z } from 'zod'
import { NextRequest } from 'next/server'
import { prodLog } from '@/lib/logger'

// Validation result types (isolated from main validation exports)
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
 * ISOLATED validateData function - no schema dependencies
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
 * ISOLATED validateRequestBody function - no schema dependencies
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