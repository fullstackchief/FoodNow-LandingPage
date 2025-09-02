import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '../utils'
import RestaurantCard from '@/components/ui/RestaurantCard'

const mockRestaurant = {
  id: '1',
  name: 'Test Restaurant',
  description: 'Delicious Nigerian cuisine',
  cuisine_types: ['Nigerian', 'Continental'],
  rating: 4.5,
  delivery_time: '25-35 min',
  delivery_fee: 500,
  image_url: 'test-restaurant.jpg',
  is_open: true,
  total_ratings: 120
}

describe('RestaurantCard Component', () => {
  it('renders restaurant information correctly', () => {
    render(<RestaurantCard restaurant={mockRestaurant} />)
    
    expect(screen.getByText('Test Restaurant')).toBeInTheDocument()
    expect(screen.getByText('Delicious Nigerian cuisine')).toBeInTheDocument()
    expect(screen.getByText('Nigerian, Continental')).toBeInTheDocument()
    expect(screen.getByText('4.5')).toBeInTheDocument()
    expect(screen.getByText('25-35 min')).toBeInTheDocument()
    expect(screen.getByText('₦500')).toBeInTheDocument()
  })

  it('shows closed status when restaurant is closed', () => {
    const closedRestaurant = { ...mockRestaurant, is_open: false }
    render(<RestaurantCard restaurant={closedRestaurant} />)
    
    expect(screen.getByText(/closed/i)).toBeInTheDocument()
  })

  it('handles click to view restaurant', () => {
    const mockOnClick = vi.fn()
    render(<RestaurantCard restaurant={mockRestaurant} onClick={mockOnClick} />)
    
    fireEvent.click(screen.getByText('Test Restaurant'))
    expect(mockOnClick).toHaveBeenCalledWith(mockRestaurant)
  })

  it('shows rating and review count', () => {
    render(<RestaurantCard restaurant={mockRestaurant} />)
    
    expect(screen.getByText('4.5')).toBeInTheDocument()
    expect(screen.getByText('(120)')).toBeInTheDocument()
  })

  it('displays promotional badge when applicable', () => {
    const promoRestaurant = { 
      ...mockRestaurant, 
      has_promotion: true,
      promotion_text: 'Free Delivery'
    }
    render(<RestaurantCard restaurant={promoRestaurant} />)
    
    expect(screen.getByText('Free Delivery')).toBeInTheDocument()
  })
})