import '@testing-library/jest-dom'
import { cleanup } from '@testing-library/react'
import { afterEach, beforeAll, afterAll } from 'vitest'
import { server } from './mocks/server'

// Mock Next.js router
import { vi } from 'vitest'

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn()
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/'
}))

vi.mock('next/image', () => ({
  default: ({ src, alt, ...props }: any) => {
    const React = require('react')
    return React.createElement('img', { src, alt, ...props })
  }
}))

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: any) => {
    const React = require('react')
    return React.createElement('a', { href, ...props }, children)
  }
}))

// Setup MSW
beforeAll(() => server.listen())
afterEach(() => {
  server.resetHandlers()
  cleanup()
})
afterAll(() => server.close())

// Mock browser APIs for testing environment
Object.defineProperty(window, 'AudioContext', {
  writable: true,
  value: vi.fn().mockImplementation(() => ({
    createOscillator: vi.fn(() => ({
      connect: vi.fn(),
      frequency: { setValueAtTime: vi.fn() },
      type: 'sine',
      start: vi.fn(),
      stop: vi.fn()
    })),
    createGain: vi.fn(() => ({
      connect: vi.fn(),
      gain: { setValueAtTime: vi.fn() }
    })),
    destination: {},
    currentTime: 0
  }))
})

Object.defineProperty(window, 'webkitAudioContext', {
  writable: true,
  value: window.AudioContext
})

Object.defineProperty(window, 'Notification', {
  writable: true,
  value: vi.fn().mockImplementation(() => ({
    permission: 'granted',
    requestPermission: vi.fn(() => Promise.resolve('granted'))
  }))
})

// Mock environment variables for testing
process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'mock-anon-key-for-tests-only'
process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = 'mock-maps-key-for-tests-only'
process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY = 'mock-paystack-key-for-tests'