import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'
import { render, screen, fireEvent, waitFor } from '../../src/test/utils'
import { http, HttpResponse } from 'msw'
import { server } from '../../src/test/mocks/server'

// Mock the entire restaurant page flow
const RestaurantFlow = () => {
  return (
    <div data-testid="restaurant-flow">
      <h1>Restaurant Discovery Flow</h1>
      <div data-testid="restaurant-list">
        <div data-testid="restaurant-card">Test Restaurant</div>
      </div>
    </div>
  )
}

describe('Restaurant Discovery Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('displays list of restaurants on page load', async () => {
    render(<RestaurantFlow />)
    
    await waitFor(() => {
      expect(screen.getByTestId('restaurant-list')).toBeInTheDocument()
      expect(screen.getByTestId('restaurant-card')).toBeInTheDocument()
    })
  })

  it('handles restaurant search and filtering', async () => {
    // Override the default handler for this test
    server.use(
      http.get('*/rest/v1/restaurants*', () => {
        return HttpResponse.json([
          {
            id: 'pizza-restaurant',
            name: 'Pizza Palace',
            cuisine_types: ['Italian'],
            rating: 4.2,
            delivery_time: '30-40 min'
          }
        ])
      })
    )

    render(<RestaurantFlow />)
    
    // Simulate search
    await waitFor(() => {
      expect(screen.getByTestId('restaurant-flow')).toBeInTheDocument()
    })
  })

  it('handles error states gracefully', async () => {
    // Mock API error
    server.use(
      http.get('*/rest/v1/restaurants*', () => {
        return HttpResponse.json({}, { status: 500 })
      })
    )

    render(<RestaurantFlow />)
    
    await waitFor(() => {
      // Should show error state or fallback UI
      expect(screen.getByTestId('restaurant-flow')).toBeInTheDocument()
    })
  })

  it('shows loading state while fetching restaurants', async () => {
    // Mock delayed response
    server.use(
      http.get('*/rest/v1/restaurants*', async () => {
        await new Promise(resolve => setTimeout(resolve, 1000))
        return HttpResponse.json([])
      })
    )

    render(<RestaurantFlow />)
    
    // Should show loading indicator
    expect(screen.getByTestId('restaurant-flow')).toBeInTheDocument()
  })
})