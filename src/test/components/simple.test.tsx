import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'

// Simple component for testing
const TestComponent = ({ title }: { title: string }) => (
  <div>
    <h1>{title}</h1>
    <p>This is a test component</p>
  </div>
)

describe('Simple Test Suite', () => {
  it('renders a component correctly', () => {
    render(<TestComponent title="Test Title" />)
    
    expect(screen.getByText('Test Title')).toBeInTheDocument()
    expect(screen.getByText('This is a test component')).toBeInTheDocument()
  })

  it('performs basic math calculations', () => {
    expect(2 + 2).toBe(4)
    expect(10 * 5).toBe(50)
  })

  it('tests string operations', () => {
    const text = 'FoodNow Testing'
    expect(text).toContain('FoodNow')
    expect(text.length).toBe(15)
  })

  it('tests array operations', () => {
    const restaurants = ['Pizza Palace', 'Jollof King', 'Healthy Bites']
    expect(restaurants).toHaveLength(3)
    expect(restaurants).toContain('Jollof King')
  })

  it('tests object properties', () => {
    const restaurant = {
      id: '1',
      name: 'Test Restaurant',
      rating: 4.5,
      isOpen: true
    }
    
    expect(restaurant).toHaveProperty('name', 'Test Restaurant')
    expect(restaurant.rating).toBeGreaterThan(4)
    expect(restaurant.isOpen).toBe(true)
  })
})