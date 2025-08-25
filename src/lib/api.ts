import { supabase, handleSupabaseError } from './supabase'
import { Database } from './database.types'

// Type aliases for easier usage
type Restaurant = Database['public']['Tables']['restaurants']['Row']
type MenuItem = Database['public']['Tables']['menu_items']['Row']
type Order = Database['public']['Tables']['orders']['Row']
type User = Database['public']['Tables']['users']['Row']
type Address = Database['public']['Tables']['addresses']['Row']
type PaymentMethod = Database['public']['Tables']['payment_methods']['Row']

// API service layer
export const api = {
  // Restaurant operations
  restaurants: {
    getAll: async (): Promise<Restaurant[]> => {
      const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .eq('is_open', true)
        .order('rating', { ascending: false })
      
      if (error) throw new Error(handleSupabaseError(error))
      return data || []
    },

    getById: async (id: string): Promise<Restaurant | null> => {
      const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .eq('id', id)
        .single()
      
      if (error) {
        if (error.code === 'PGRST116') return null // Not found
        throw new Error(handleSupabaseError(error))
      }
      return data
    },

    getFeatured: async (limit = 6): Promise<Restaurant[]> => {
      const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .eq('is_open', true)
        .gte('rating', 4.5)
        .order('total_orders', { ascending: false })
        .limit(limit)
      
      if (error) throw new Error(handleSupabaseError(error))
      return data || []
    },

    getNearby: async (lat: number, lng: number, _radius = 5000): Promise<Restaurant[]> => {
      // This would require PostGIS extension for geolocation queries
      // For now, return all restaurants (can be enhanced later)
      // Note: lat, lng parameters available for future geolocation implementation
      console.log(`Searching near coordinates: ${lat}, ${lng}`)
      
      const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .eq('is_open', true)
        .order('rating', { ascending: false })
        .limit(20)
      
      if (error) throw new Error(handleSupabaseError(error))
      return data || []
    },

    search: async (query: string, filters?: {
      cuisineTypes?: string[]
      priceRange?: string[]
      rating?: number
    }): Promise<Restaurant[]> => {
      let queryBuilder = supabase
        .from('restaurants')
        .select('*')
        .eq('is_open', true)
      
      // Search by name or cuisine
      if (query.trim()) {
        queryBuilder = queryBuilder.or(
          `name.ilike.%${query}%,description.ilike.%${query}%,cuisine_types.cs.{${query}}`
        )
      }
      
      // Apply filters
      if (filters?.cuisineTypes?.length) {
        queryBuilder = queryBuilder.overlaps('cuisine_types', filters.cuisineTypes)
      }
      
      if (filters?.priceRange?.length) {
        queryBuilder = queryBuilder.in('price_range', filters.priceRange)
      }
      
      if (filters?.rating) {
        queryBuilder = queryBuilder.gte('rating', filters.rating)
      }
      
      const { data, error } = await queryBuilder
        .order('rating', { ascending: false })
        .limit(50)
      
      if (error) throw new Error(handleSupabaseError(error))
      return data || []
    }
  },

  // Menu operations
  menu: {
    getByRestaurantId: async (restaurantId: string): Promise<MenuItem[]> => {
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .eq('is_available', true)
        .order('category', { ascending: true })
      
      if (error) throw new Error(handleSupabaseError(error))
      return data || []
    },

    getById: async (id: string): Promise<MenuItem | null> => {
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .eq('id', id)
        .single()
      
      if (error) {
        if (error.code === 'PGRST116') return null
        throw new Error(handleSupabaseError(error))
      }
      return data
    }
  },

  // Order operations
  orders: {
    create: async (orderData: Database['public']['Tables']['orders']['Insert']): Promise<Order> => {
      const { data, error } = await supabase
        .from('orders')
        .insert(orderData as never)
        .select()
        .single()
      
      if (error) throw new Error(handleSupabaseError(error))
      return data
    },

    getByUserId: async (userId: string, limit = 20): Promise<Order[]> => {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          restaurants:restaurant_id(name, image_url),
          order_items(*, menu_items(name, image_url))
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit)
      
      if (error) throw new Error(handleSupabaseError(error))
      return data || []
    },

    getById: async (id: string): Promise<Order | null> => {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          restaurants:restaurant_id(name, image_url, phone_number),
          order_items(*, menu_items(name, image_url))
        `)
        .eq('id', id)
        .single()
      
      if (error) {
        if (error.code === 'PGRST116') return null
        throw new Error(handleSupabaseError(error))
      }
      return data
    },

    updateStatus: async (
      orderId: string, 
      status: Order['status'], 
      trackingUpdate?: {
        status: string
        message: string
        location?: { lat: number; lng: number }
      }
    ): Promise<void> => {
      const updateData: Record<string, unknown> = { status, updated_at: new Date().toISOString() }
      
      if (trackingUpdate) {
        const { data: currentOrder } = await supabase
          .from('orders')
          .select('tracking_updates')
          .eq('id', orderId)
          .single()
        
        if (currentOrder) {
          const updates = (currentOrder as Record<string, unknown>).tracking_updates as unknown[] || []
          updates.push({
            ...trackingUpdate,
            timestamp: new Date().toISOString()
          })
          updateData.tracking_updates = updates
        }
      }
      
      const { error } = await supabase
        .from('orders')
        .update(updateData as never)
        .eq('id', orderId)
      
      if (error) throw new Error(handleSupabaseError(error))
    },

    addReview: async (orderId: string, rating: number, review: string): Promise<void> => {
      const { error } = await supabase
        .from('orders')
        .update({ rating, review, updated_at: new Date().toISOString() } as never)
        .eq('id', orderId)
      
      if (error) throw new Error(handleSupabaseError(error))
    }
  },

  // User operations
  users: {
    create: async (userData: Database['public']['Tables']['users']['Insert']): Promise<User> => {
      const { data, error } = await supabase
        .from('users')
        .insert(userData as never)
        .select()
        .single()
      
      if (error) throw new Error(handleSupabaseError(error))
      return data
    },

    getById: async (id: string): Promise<User | null> => {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single()
      
      if (error) {
        if (error.code === 'PGRST116') return null
        throw new Error(handleSupabaseError(error))
      }
      return data
    },

    update: async (id: string, updates: Database['public']['Tables']['users']['Update']): Promise<void> => {
      const { error } = await supabase
        .from('users')
        .update({ ...updates, updated_at: new Date().toISOString() } as never)
        .eq('id', id)
      
      if (error) throw new Error(handleSupabaseError(error))
    },

    addLoyaltyPoints: async (id: string, points: number): Promise<void> => {
      const { error } = await supabase.rpc('add_loyalty_points', {
        user_id: id,
        points_to_add: points
      } as never)
      
      if (error) throw new Error(handleSupabaseError(error))
    }
  },

  // Address operations
  addresses: {
    getByUserId: async (userId: string): Promise<Address[]> => {
      const { data, error } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', userId)
        .order('is_default', { ascending: false })
      
      if (error) throw new Error(handleSupabaseError(error))
      return data || []
    },

    create: async (addressData: Database['public']['Tables']['addresses']['Insert']): Promise<Address> => {
      const { data, error } = await supabase
        .from('addresses')
        .insert(addressData as never)
        .select()
        .single()
      
      if (error) throw new Error(handleSupabaseError(error))
      return data
    },

    update: async (id: string, updates: Database['public']['Tables']['addresses']['Update']): Promise<void> => {
      const { error } = await supabase
        .from('addresses')
        .update({ ...updates, updated_at: new Date().toISOString() } as never)
        .eq('id', id)
      
      if (error) throw new Error(handleSupabaseError(error))
    },

    delete: async (id: string): Promise<void> => {
      const { error } = await supabase
        .from('addresses')
        .delete()
        .eq('id', id)
      
      if (error) throw new Error(handleSupabaseError(error))
    }
  },

  // Payment methods
  paymentMethods: {
    getByUserId: async (userId: string): Promise<PaymentMethod[]> => {
      const { data, error } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('user_id', userId)
        .order('is_default', { ascending: false })
      
      if (error) throw new Error(handleSupabaseError(error))
      return data || []
    },

    create: async (paymentData: Database['public']['Tables']['payment_methods']['Insert']): Promise<PaymentMethod> => {
      const { data, error } = await supabase
        .from('payment_methods')
        .insert(paymentData as never)
        .select()
        .single()
      
      if (error) throw new Error(handleSupabaseError(error))
      return data
    },

    delete: async (id: string): Promise<void> => {
      const { error } = await supabase
        .from('payment_methods')
        .delete()
        .eq('id', id)
      
      if (error) throw new Error(handleSupabaseError(error))
    }
  },

  // Favorites
  favorites: {
    getByUserId: async (userId: string): Promise<string[]> => {
      const { data, error } = await supabase
        .from('favorites')
        .select('restaurant_id')
        .eq('user_id', userId)
      
      if (error) throw new Error(handleSupabaseError(error))
      return data?.map(f => (f as Record<string, unknown>).restaurant_id as string) || []
    },

    add: async (userId: string, restaurantId: string): Promise<void> => {
      const { error } = await supabase
        .from('favorites')
        .insert({ user_id: userId, restaurant_id: restaurantId } as never)
      
      if (error) throw new Error(handleSupabaseError(error))
    },

    remove: async (userId: string, restaurantId: string): Promise<void> => {
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('user_id', userId)
        .eq('restaurant_id', restaurantId)
      
      if (error) throw new Error(handleSupabaseError(error))
    }
  }
}

// Export types for use throughout the app
export type {
  Restaurant,
  MenuItem,
  Order,
  User,
  Address,
  PaymentMethod
}