import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '../utils'
import RestaurantCard from '@/components/ui/RestaurantCard'

const mockRestaurant = {
  id: '1',
  name: 'Test Restaurant',
  description: 'Delicious Nigerian cuisine',
  image_url: 'test-restaurant.jpg',
  cover_image_url: null,
  rating: 4.5,
  review_count: 120,
  price_range: '$$' as const,
  cuisine_types: ['Nigerian', 'Continental'],
  delivery_time: '25-35 min',
  delivery_fee: 500,
  minimum_order: 1000,
  is_open: true,
  is_featured: false,
  status: 'active',
  opening_hours: {},
  location: {},
  features: [],
  phone_number: '+2348012345678',
  email: 'test@restaurant.com',
  total_orders: 50,
  established_year: 2020,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  promotions: null,
  // Computed aliases
  reviewCount: 120,
  deliveryTime: '25-35 min',
  deliveryFee: 500,
  cuisineTypes: ['Nigerian', 'Continental'],
  priceRange: '$$' as const
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

  it('renders restaurant link correctly', () => {
    render(<RestaurantCard restaurant={mockRestaurant} />)
    
    const restaurantLink = screen.getByRole('link')
    expect(restaurantLink).toHaveAttribute('href', '/restaurant/1')
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