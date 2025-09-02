import { http, HttpResponse } from 'msw'

export const handlers = [
  // Mock Supabase auth
  http.post('*/auth/v1/token*', () => {
    return HttpResponse.json({
      access_token: 'mock-token',
      token_type: 'bearer',
      expires_in: 3600,
      refresh_token: 'mock-refresh-token',
      user: {
        id: 'mock-user-id',
        email: 'test@example.com',
        user_metadata: {
          first_name: 'Test',
          last_name: 'User'
        }
      }
    })
  }),

  // Mock Supabase REST API
  http.get('*/rest/v1/restaurants*', () => {
    return HttpResponse.json([
      {
        id: 'restaurant-1',
        name: 'Test Restaurant',
        cuisine_types: ['Nigerian'],
        rating: 4.5,
        delivery_time: '25-35 min',
        image_url: '/test-image.jpg',
        description: 'Test restaurant description'
      }
    ])
  }),

  http.get('*/rest/v1/menu_items*', () => {
    return HttpResponse.json([
      {
        id: 'menu-item-1',
        name: 'Jollof Rice',
        price: 2500,
        description: 'Spicy Nigerian rice dish',
        category: 'Main Course',
        restaurant_id: 'restaurant-1'
      }
    ])
  }),

  // Mock Payment API
  http.post('*/api/payments/initialize', () => {
    return HttpResponse.json({
      success: true,
      authorization_url: 'https://checkout.paystack.com/test',
      reference: 'test-reference'
    })
  }),

  // Mock Google Maps API
  http.get('https://maps.googleapis.com/maps/api/*', () => {
    return HttpResponse.json({
      results: [
        {
          formatted_address: 'Test Address, Lagos, Nigeria',
          geometry: {
            location: {
              lat: 6.5244,
              lng: 3.3792
            }
          }
        }
      ],
      status: 'OK'
    })
  })
]