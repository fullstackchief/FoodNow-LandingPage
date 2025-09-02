/**
 * OTP SERVICE TESTS
 * =================
 * Basic tests for OTP service functionality
 */

import { validateContact, formatContactForDisplay, getOTPConfig } from '../otpService'

describe('OTP Service', () => {
  describe('validateContact', () => {
    it('validates email addresses correctly', () => {
      expect(validateContact('test@example.com', 'email')).toBe(true)
      expect(validateContact('user.name+tag@domain.com', 'email')).toBe(true)
      expect(validateContact('invalid-email', 'email')).toBe(false)
      expect(validateContact('', 'email')).toBe(false)
    })

    it('validates phone numbers correctly', () => {
      expect(validateContact('+1234567890', 'sms')).toBe(true)
      expect(validateContact('+234801234567', 'sms')).toBe(true)
      expect(validateContact('1234567890', 'sms')).toBe(false) // Missing +
      expect(validateContact('+1', 'sms')).toBe(false) // Too short
      expect(validateContact('', 'sms')).toBe(false)
    })
  })

  describe('formatContactForDisplay', () => {
    it('formats email addresses for display', () => {
      expect(formatContactForDisplay('test@example.com', 'email')).toBe('te***@example.com')
      expect(formatContactForDisplay('a@example.com', 'email')).toBe('a***@example.com')
    })

    it('formats phone numbers for display', () => {
      expect(formatContactForDisplay('+1234567890', 'sms')).toBe('+123***90')
      expect(formatContactForDisplay('+123', 'sms')).toBe('+1***')
    })
  })

  describe('getOTPConfig', () => {
    it('returns correct configuration', () => {
      const config = getOTPConfig()
      expect(config.rateLimitSeconds).toBe(60)
      expect(config.expirySeconds).toBe(3600)
      expect(config.codeLength).toBe(6)
      expect(config.maxAttempts).toBe(5)
    })
  })
})