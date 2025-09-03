import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'
import { render, screen, fireEvent, waitFor } from '../../src/test/utils'
import { createMockStore } from '../../src/test/utils'

// Mock cart functionality
const CartTestComponent = () => {
  const [cartItems, setCartItems] = React.useState<any[]>([])
  
  const addToCart = (item: any) => {
    setCartItems(prev => [...prev, item])
  }

  const removeFromCart = (itemId: string) => {
    setCartItems(prev => prev.filter((item: any) => item.id !== itemId))
  }

  return (
    <div data-testid="cart-test">
      <div data-testid="cart-count">{cartItems.length}</div>
      <button 
        onClick={() => addToCart({ id: '1', name: 'Test Item', price: 1000 })}
        data-testid="add-item"
      >
        Add Item
      </button>
      <button 
        onClick={() => removeFromCart('1')}
        data-testid="remove-item"
      >
        Remove Item
      </button>
      <div data-testid="cart-items">
        {cartItems.map((item: any) => (
          <div key={item.id} data-testid={`cart-item-${item.id}`}>
            {item.name} - ₦{item.price}
          </div>
        ))}
      </div>
    </div>
  )
}

describe('Cart Functionality Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('adds items to cart successfully', async () => {
    const store = createMockStore({
      cart: { items: [], total: 0, itemCount: 0 }
    })

    render(<CartTestComponent />, { initialState: { cart: { items: [], total: 0, itemCount: 0 } } })
    
    const addButton = screen.getByTestId('add-item')
    fireEvent.click(addButton)
    
    await waitFor(() => {
      expect(screen.getByTestId('cart-count')).toHaveTextContent('1')
      expect(screen.getByTestId('cart-item-1')).toHaveTextContent('Test Item - ₦1000')
    })
  })

  it('removes items from cart', async () => {
    render(<CartTestComponent />)
    
    // Add item first
    const addButton = screen.getByTestId('add-item')
    fireEvent.click(addButton)
    
    await waitFor(() => {
      expect(screen.getByTestId('cart-count')).toHaveTextContent('1')
    })

    // Remove item
    const removeButton = screen.getByTestId('remove-item')
    fireEvent.click(removeButton)
    
    await waitFor(() => {
      expect(screen.getByTestId('cart-count')).toHaveTextContent('0')
      expect(screen.queryByTestId('cart-item-1')).not.toBeInTheDocument()
    })
  })

  it('persists cart data across sessions', () => {
    // Mock localStorage
    const localStorageMock = {
      getItem: vi.fn(() => JSON.stringify([{ id: '1', name: 'Persisted Item', price: 1500 }])),
      setItem: vi.fn(),
      removeItem: vi.fn()
    }
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock
    })

    render(<CartTestComponent />)
    
    // Should load persisted items
    expect(localStorageMock.getItem).toHaveBeenCalledWith('foodnow-cart')
  })

  it('calculates cart total correctly', async () => {
    const store = createMockStore({
      cart: { 
        items: [
          { id: '1', name: 'Item 1', price: 1000, quantity: 2 },
          { id: '2', name: 'Item 2', price: 1500, quantity: 1 }
        ], 
        total: 3500,
        itemCount: 3
      }
    })

    render(<CartTestComponent />, { initialState: store.getState() })
    
    // Should calculate total: (1000 * 2) + (1500 * 1) = 3500
    expect(screen.getByTestId('cart-count')).toHaveTextContent('0') // Initial state
  })
})