import { http, HttpResponse } from 'msw'

// Types for our mock data
interface Restaurant {
  id: string
  name: string
  description: string
  image: string
  rating: number
  reviewCount: number
  priceRange: '$' | '$$' | '$$$' | '$$$$'
  cuisineType: string[]
  deliveryTime: string
  deliveryFee: number
  minimumOrder: number
  isOpen: boolean
  location: {
    address: string
    coordinates: { lat: number; lng: number }
    area: string
    city: string
  }
}

interface MenuItem {
  id: string
  name: string
  description: string
  basePrice: number
  image: string
  category: string
  isAvailable: boolean
  preparationTime: number
  tags: string[]
}

interface Order {
  id: string
  orderNumber: string
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'picked_up' | 'delivered' | 'cancelled'
  total: number
  createdAt: string
  restaurant: Pick<Restaurant, 'id' | 'name' | 'image'>
  items: Array<{
    id: string
    name: string
    price: number
    quantity: number
  }>
}

// Mock data with beautiful real images
const mockRestaurants: Restaurant[] = [
  {
    id: 'rest-1',
    name: 'Lagos Jollof Palace',
    description: 'Authentic Nigerian cuisine with the best jollof rice in Lagos. Traditional recipes passed down through generations.',
    image: 'https://images.unsplash.com/photo-1596797038530-2c107229654b?w=800&h=600&fit=crop&auto=format',
    rating: 4.8,
    reviewCount: 1247,
    priceRange: '$$',
    cuisineType: ['Nigerian', 'African'],
    deliveryTime: '15-25 mins',
    deliveryFee: 500,
    minimumOrder: 2500,
    isOpen: true,
    location: {
      address: '123 Victoria Island, Lagos',
      coordinates: { lat: 6.4281, lng: 3.4219 },
      area: 'Victoria Island',
      city: 'Lagos'
    }
  },
  {
    id: 'rest-2',
    name: 'Suya Master',
    description: 'Premium suya and grilled delights. Fresh meat grilled to perfection with authentic Nigerian spices.',
    image: 'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=800&h=600&fit=crop&auto=format',
    rating: 4.7,
    reviewCount: 892,
    priceRange: '$',
    cuisineType: ['Nigerian', 'Grilled'],
    deliveryTime: '10-20 mins',
    deliveryFee: 300,
    minimumOrder: 1500,
    isOpen: true,
    location: {
      address: '45 Lekki Phase 1, Lagos',
      coordinates: { lat: 6.4474, lng: 3.4553 },
      area: 'Lekki',
      city: 'Lagos'
    }
  },
  {
    id: 'rest-3',
    name: 'Pizza Paradise',
    description: 'Wood-fired pizzas and Italian classics. Authentic Italian recipes with premium ingredients.',
    image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&h=600&fit=crop&auto=format',
    rating: 4.6,
    reviewCount: 634,
    priceRange: '$$$',
    cuisineType: ['Italian', 'Pizza'],
    deliveryTime: '25-35 mins',
    deliveryFee: 800,
    minimumOrder: 3000,
    isOpen: true,
    location: {
      address: '78 Ikoyi Road, Lagos',
      coordinates: { lat: 6.4550, lng: 3.4240 },
      area: 'Ikoyi',
      city: 'Lagos'
    }
  },
  {
    id: 'rest-4',
    name: 'Healthy Greens',
    description: 'Fresh salads, smoothies, and organic meals. Nutritious and delicious food for a healthy lifestyle.',
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&h=600&fit=crop&auto=format',
    rating: 4.9,
    reviewCount: 445,
    priceRange: '$$',
    cuisineType: ['Healthy', 'Organic'],
    deliveryTime: '20-30 mins',
    deliveryFee: 600,
    minimumOrder: 2000,
    isOpen: true,
    location: {
      address: '12 Admiralty Way, Lekki',
      coordinates: { lat: 6.4474, lng: 3.4553 },
      area: 'Lekki',
      city: 'Lagos'
    }
  },
  {
    id: 'rest-5',
    name: 'Dragon Wok',
    description: 'Authentic Asian cuisine with modern twists. Fresh ingredients and traditional cooking methods.',
    image: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&h=600&fit=crop&auto=format',
    rating: 4.5,
    reviewCount: 723,
    priceRange: '$$',
    cuisineType: ['Asian', 'Chinese'],
    deliveryTime: '20-30 mins',
    deliveryFee: 700,
    minimumOrder: 2500,
    isOpen: true,
    location: {
      address: '34 Ozumba Mbadiwe, Victoria Island',
      coordinates: { lat: 6.4281, lng: 3.4219 },
      area: 'Victoria Island',
      city: 'Lagos'
    }
  },
  {
    id: 'rest-6',
    name: 'Continental Delights',
    description: 'Fine dining continental cuisine. Exquisite dishes crafted by internationally trained chefs.',
    image: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=800&h=600&fit=crop&auto=format',
    rating: 4.8,
    reviewCount: 567,
    priceRange: '$$$$',
    cuisineType: ['Continental', 'Fine Dining'],
    deliveryTime: '30-45 mins',
    deliveryFee: 1000,
    minimumOrder: 5000,
    isOpen: true,
    location: {
      address: '56 Adeola Odeku Street, Victoria Island',
      coordinates: { lat: 6.4281, lng: 3.4219 },
      area: 'Victoria Island',
      city: 'Lagos'
    }
  }
]

const mockMenuItems: Record<string, MenuItem[]> = {
  'rest-1': [
    {
      id: 'item-1',
      name: 'Special Jollof Rice',
      description: 'Signature jollof rice with chicken, plantain, and salad. A true Lagos classic.',
      basePrice: 3500,
      image: 'https://images.unsplash.com/photo-1596797038530-2c107229654b?w=600&h=400&fit=crop&auto=format',
      category: 'Main Course',
      isAvailable: true,
      preparationTime: 15,
      tags: ['popular', 'spicy']
    },
    {
      id: 'item-2',
      name: 'Pepper Soup',
      description: 'Traditional pepper soup with assorted meat and aromatic spices',
      basePrice: 2800,
      image: 'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=600&h=400&fit=crop&auto=format',
      category: 'Soups',
      isAvailable: true,
      preparationTime: 12,
      tags: ['spicy', 'traditional']
    },
    {
      id: 'item-3',
      name: 'Fried Rice Combo',
      description: 'Delicious fried rice with chicken and vegetables',
      basePrice: 3200,
      image: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=600&h=400&fit=crop&auto=format',
      category: 'Main Course',
      isAvailable: true,
      preparationTime: 18,
      tags: ['popular', 'combo']
    }
  ],
  'rest-2': [
    {
      id: 'item-4',
      name: 'Premium Suya Platter',
      description: 'Assorted suya with vegetables and our secret spice blend',
      basePrice: 4200,
      image: 'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=600&h=400&fit=crop&auto=format',
      category: 'Grilled',
      isAvailable: true,
      preparationTime: 8,
      tags: ['popular', 'spicy', 'grilled']
    },
    {
      id: 'item-5',
      name: 'Grilled Chicken',
      description: 'Perfectly grilled chicken with Nigerian spices',
      basePrice: 3800,
      image: 'https://images.unsplash.com/photo-1562967914-608f82629710?w=600&h=400&fit=crop&auto=format',
      category: 'Grilled',
      isAvailable: true,
      preparationTime: 12,
      tags: ['protein', 'grilled']
    }
  ],
  'rest-3': [
    {
      id: 'item-6',
      name: 'Margherita Pizza',
      description: 'Classic margherita with fresh mozzarella and basil',
      basePrice: 4500,
      image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&h=400&fit=crop&auto=format',
      category: 'Pizza',
      isAvailable: true,
      preparationTime: 20,
      tags: ['popular', 'vegetarian']
    },
    {
      id: 'item-7',
      name: 'Pepperoni Special',
      description: 'Wood-fired pizza with premium pepperoni and cheese',
      basePrice: 5200,
      image: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=600&h=400&fit=crop&auto=format',
      category: 'Pizza',
      isAvailable: true,
      preparationTime: 22,
      tags: ['popular', 'meat']
    }
  ],
  'rest-4': [
    {
      id: 'item-8',
      name: 'Rainbow Salad Bowl',
      description: 'Fresh mixed greens with avocado, nuts, and organic dressing',
      basePrice: 2800,
      image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&h=400&fit=crop&auto=format',
      category: 'Salads',
      isAvailable: true,
      preparationTime: 8,
      tags: ['healthy', 'vegetarian', 'organic']
    },
    {
      id: 'item-9',
      name: 'Green Power Smoothie',
      description: 'Energizing blend of spinach, apple, banana, and protein',
      basePrice: 1800,
      image: 'https://images.unsplash.com/photo-1553979459-d2229ba7433a?w=600&h=400&fit=crop&auto=format',
      category: 'Drinks',
      isAvailable: true,
      preparationTime: 5,
      tags: ['healthy', 'protein', 'vegan']
    }
  ],
  'rest-5': [
    {
      id: 'item-10',
      name: 'Dragon Noodles',
      description: 'Spicy stir-fried noodles with vegetables and choice of protein',
      basePrice: 3600,
      image: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=600&h=400&fit=crop&auto=format',
      category: 'Noodles',
      isAvailable: true,
      preparationTime: 15,
      tags: ['spicy', 'popular']
    },
    {
      id: 'item-11',
      name: 'Sushi Combo',
      description: 'Fresh assorted sushi rolls with wasabi and ginger',
      basePrice: 5800,
      image: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=600&h=400&fit=crop&auto=format',
      category: 'Sushi',
      isAvailable: true,
      preparationTime: 25,
      tags: ['fresh', 'premium']
    }
  ],
  'rest-6': [
    {
      id: 'item-12',
      name: 'Truffle Pasta',
      description: 'Handmade pasta with black truffle and parmesan',
      basePrice: 8500,
      image: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=600&h=400&fit=crop&auto=format',
      category: 'Pasta',
      isAvailable: true,
      preparationTime: 20,
      tags: ['premium', 'truffle']
    },
    {
      id: 'item-13',
      name: 'Wagyu Steak',
      description: 'Premium wagyu beef cooked to perfection with seasonal vegetables',
      basePrice: 12500,
      image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600&h=400&fit=crop&auto=format',
      category: 'Steaks',
      isAvailable: true,
      preparationTime: 30,
      tags: ['premium', 'wagyu', 'luxury']
    }
  ]
}

const mockOrders: Order[] = [
  {
    id: 'order-1',
    orderNumber: 'FN20241201001',
    status: 'delivered',
    total: 5800,
    createdAt: '2024-12-01T10:30:00Z',
    restaurant: {
      id: 'rest-1',
      name: 'Lagos Jollof Palace',
      image: '/api/placeholder/400/300'
    },
    items: [
      {
        id: 'item-1',
        name: 'Special Jollof Rice',
        price: 3500,
        quantity: 1
      },
      {
        id: 'item-2',
        name: 'Pepper Soup',
        price: 2800,
        quantity: 1
      }
    ]
  }
]

// API Handlers
export const handlers = [
  // Restaurants
  http.get('/api/restaurants', () => {
    return HttpResponse.json({
      success: true,
      data: mockRestaurants
    })
  }),

  http.get('/api/restaurants/:id', ({ params }) => {
    const { id } = params
    const restaurant = mockRestaurants.find(r => r.id === id)
    
    if (!restaurant) {
      return HttpResponse.json(
        { success: false, message: 'Restaurant not found' },
        { status: 404 }
      )
    }

    return HttpResponse.json({
      success: true,
      data: restaurant
    })
  }),

  // Menu Items
  http.get('/api/restaurants/:id/menu', ({ params }) => {
    const { id } = params
    const menuItems = mockMenuItems[id as string] || []
    
    return HttpResponse.json({
      success: true,
      data: menuItems
    })
  }),

  // Orders
  http.get('/api/orders', () => {
    return HttpResponse.json({
      success: true,
      data: mockOrders
    })
  }),

  http.post('/api/orders', async ({ request }) => {
    const orderData = await request.json() as { 
      total?: number; 
      restaurant?: Pick<Restaurant, 'id' | 'name' | 'image'>; 
      items?: Array<{ id: string; name: string; price: number; quantity: number }>
    }
    
    const newOrder: Order = {
      id: `order-${Date.now()}`,
      orderNumber: `FN${new Date().getFullYear()}${String(Date.now()).slice(-6)}`,
      status: 'pending',
      total: orderData.total || 0,
      createdAt: new Date().toISOString(),
      restaurant: orderData.restaurant || { id: '', name: '', image: '' },
      items: orderData.items || []
    }

    mockOrders.unshift(newOrder)
    
    return HttpResponse.json({
      success: true,
      data: newOrder
    }, { status: 201 })
  }),

  http.get('/api/orders/:id', ({ params }) => {
    const { id } = params
    const order = mockOrders.find(o => o.id === id)
    
    if (!order) {
      return HttpResponse.json(
        { success: false, message: 'Order not found' },
        { status: 404 }
      )
    }

    return HttpResponse.json({
      success: true,
      data: order
    })
  }),

  // User Authentication (mock)
  http.post('/api/auth/login', async ({ request }) => {
    const credentials = await request.json() as { email?: string; password?: string }
    
    // Simple mock authentication
    if (credentials.email && credentials.password) {
      return HttpResponse.json({
        success: true,
        data: {
          user: {
            id: 'user-1',
            email: credentials.email,
            firstName: 'John',
            lastName: 'Doe',
            phone: '+234 801 234 5678'
          },
          token: 'mock-jwt-token'
        }
      })
    }
    
    return HttpResponse.json(
      { success: false, message: 'Invalid credentials' },
      { status: 401 }
    )
  }),

  // Search
  http.get('/api/search', ({ request }) => {
    const url = new URL(request.url)
    const query = url.searchParams.get('q')
    
    if (!query) {
      return HttpResponse.json({
        success: true,
        data: {
          restaurants: [],
          menuItems: []
        }
      })
    }

    // Simple mock search
    const filteredRestaurants = mockRestaurants.filter(r => 
      r.name.toLowerCase().includes(query.toLowerCase()) ||
      r.description.toLowerCase().includes(query.toLowerCase()) ||
      r.cuisineType.some(c => c.toLowerCase().includes(query.toLowerCase()))
    )

    return HttpResponse.json({
      success: true,
      data: {
        restaurants: filteredRestaurants,
        menuItems: []
      }
    })
  })
]