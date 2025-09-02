import { z } from 'zod'

// Common validation patterns
const uuidSchema = z.string().uuid('Invalid ID format')
const positiveNumberSchema = z.number().min(0, 'Must be a positive number')
const positiveIntSchema = z.number().int().min(1, 'Must be a positive integer')

// Address validation schema
export const addressSchema = z.object({
  street: z.string().min(1, 'Street address is required').max(200, 'Street address too long').trim(),
  city: z.string().min(1, 'City is required').max(100, 'City name too long').trim(),
  state: z.string().min(1, 'State is required').max(100, 'State name too long').trim(),
  postal_code: z.string().max(20, 'Postal code too long').optional(),
  country: z.string().min(1, 'Country is required').max(100, 'Country name too long').default('Nigeria'),
  landmark: z.string().max(200, 'Landmark description too long').optional(),
  coordinates: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180)
  }).optional()
})

// Cart item validation
export const cartItemSchema = z.object({
  menu_item_id: uuidSchema,
  quantity: positiveIntSchema.max(99, 'Quantity too large'),
  unit_price: positiveNumberSchema,
  special_instructions: z.string().max(500, 'Instructions too long').optional(),
  customizations: z.array(z.object({
    name: z.string().min(1, 'Customization name required').max(100),
    price: positiveNumberSchema,
    selected: z.boolean()
  })).optional()
})

// Order creation schema
export const createOrderSchema = z.object({
  restaurant_id: uuidSchema,
  items: z.array(cartItemSchema).min(1, 'Order must contain at least one item'),
  delivery_address: addressSchema,
  delivery_type: z.enum(['delivery', 'pickup'], {
    message: 'Delivery type is required'
  }),
  payment_method: z.enum(['card'], {
    message: 'Payment method is required'
  }),
  special_instructions: z.string().max(1000, 'Instructions too long').optional(),
  delivery_time_preference: z.enum(['asap', 'scheduled']).default('asap'),
  scheduled_delivery_time: z.date().optional(),
  contact_phone: z.string()
    .regex(/^(\+234|0)[789]\d{9}$/, 'Invalid Nigerian phone number')
    .optional(),
  subtotal: positiveNumberSchema,
  delivery_fee: positiveNumberSchema,
  service_fee: positiveNumberSchema,
  total: positiveNumberSchema
}).refine(
  (data) => {
    // Validate that scheduled delivery time is provided when needed
    if (data.delivery_time_preference === 'scheduled' && !data.scheduled_delivery_time) {
      return false
    }
    return true
  },
  {
    message: 'Scheduled delivery time is required when delivery preference is scheduled',
    path: ['scheduled_delivery_time']
  }
).refine(
  (data) => {
    // Validate total calculation (basic check)
    const expectedTotal = data.subtotal + data.delivery_fee + data.service_fee
    return Math.abs(data.total - expectedTotal) < 0.01 // Allow for small floating point differences
  },
  {
    message: 'Order total does not match calculated amount',
    path: ['total']
  }
)

// Order status update schema
export const updateOrderStatusSchema = z.object({
  status: z.enum([
    'pending',
    'confirmed',
    'preparing',
    'ready_for_pickup',
    'picked_up',
    'delivered',
    'cancelled'
  ]),
  notes: z.string().max(500, 'Notes too long').optional(),
  estimated_delivery_time: z.date().optional(),
  rider_id: uuidSchema.optional()
})

// Order review schema
export const orderReviewSchema = z.object({
  order_id: uuidSchema,
  rating: z.number().int().min(1, 'Rating must be at least 1').max(5, 'Rating cannot exceed 5'),
  comment: z.string().max(1000, 'Review comment too long').optional(),
  delivery_rating: z.number().int().min(1).max(5).optional(),
  food_quality_rating: z.number().int().min(1).max(5).optional()
})

// Payment verification schema
export const paymentVerificationSchema = z.object({
  reference: z.string().min(1, 'Payment reference is required').max(200),
  order_id: uuidSchema,
  amount: positiveNumberSchema,
  payment_method: z.enum(['card'])
})

// Restaurant menu item schema
export const menuItemSchema = z.object({
  name: z.string().min(1, 'Item name is required').max(200, 'Item name too long').trim(),
  description: z.string().max(1000, 'Description too long').optional(),
  price: positiveNumberSchema.max(1000000, 'Price too high'),
  category: z.string().min(1, 'Category is required').max(100),
  is_available: z.boolean().default(true),
  preparation_time: z.number().int().min(1, 'Preparation time must be at least 1 minute').max(180, 'Preparation time too long').optional(),
  ingredients: z.array(z.string().max(100)).optional(),
  allergens: z.array(z.string().max(100)).optional(),
  nutritional_info: z.object({
    calories: z.number().int().min(0).optional(),
    protein: z.number().min(0).optional(),
    carbs: z.number().min(0).optional(),
    fat: z.number().min(0).optional()
  }).optional(),
  images: z.array(z.string().url('Invalid image URL')).max(5, 'Too many images').optional()
})

// Search and filter schemas
export const restaurantSearchSchema = z.object({
  query: z.string().max(200, 'Search query too long').optional(),
  cuisine: z.string().max(50).optional(),
  location: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
    radius: z.number().min(0.1).max(50).default(5) // km
  }).optional(),
  price_range: z.object({
    min: z.number().min(0).optional(),
    max: z.number().min(0).optional()
  }).optional(),
  rating_min: z.number().min(1).max(5).optional(),
  sort_by: z.enum(['relevance', 'rating', 'distance', 'delivery_time']).default('relevance'),
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0)
})

// Type exports
export type AddressInput = z.infer<typeof addressSchema>
export type CartItemInput = z.infer<typeof cartItemSchema>
export type CreateOrderInput = z.infer<typeof createOrderSchema>
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>
export type OrderReviewInput = z.infer<typeof orderReviewSchema>
export type PaymentVerificationInput = z.infer<typeof paymentVerificationSchema>
export type MenuItemInput = z.infer<typeof menuItemSchema>
export type RestaurantSearchInput = z.infer<typeof restaurantSearchSchema>