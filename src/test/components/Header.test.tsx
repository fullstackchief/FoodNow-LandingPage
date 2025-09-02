import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '../utils'
import Header from '@/components/layout/Header'

// Mock the useAuth hook
const mockUseAuth = vi.fn()
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth()
}))

describe('Header Component', () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: false,
      signOut: vi.fn()
    })
  })

  it('renders header with logo and navigation', () => {
    render(<Header />)
    
    expect(screen.getByText('FoodNow')).toBeInTheDocument()
    expect(screen.getByText('Browse')).toBeInTheDocument()
    expect(screen.getByText('Restaurants')).toBeInTheDocument()
    expect(screen.getByText('Become a Rider')).toBeInTheDocument()
  })

  it('shows login button when user is not authenticated', () => {
    render(<Header />)
    
    expect(screen.getByText('Sign In')).toBeInTheDocument()
  })

  it('shows user menu when user is authenticated', () => {
    mockUseAuth.mockReturnValue({
      user: { id: '1', email: 'test@example.com', first_name: 'John' },
      loading: false,
      signOut: vi.fn()
    })

    render(<Header />)
    
    expect(screen.getByText('John')).toBeInTheDocument()
  })

  it('handles cart icon click', async () => {
    render(<Header />)
    
    const cartButton = screen.getByRole('button', { name: /cart/i })
    fireEvent.click(cartButton)
    
    // Should show cart sidebar or modal
    await waitFor(() => {
      // Add assertion for cart visibility based on your implementation
    })
  })

  it('handles mobile menu toggle', async () => {
    render(<Header />)
    
    const menuButton = screen.getByRole('button', { name: /menu/i })
    fireEvent.click(menuButton)
    
    await waitFor(() => {
      // Add assertion for mobile menu visibility
    })
  })
})