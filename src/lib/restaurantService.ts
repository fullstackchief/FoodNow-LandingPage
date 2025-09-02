/**
 * RESTAURANT DATA SERVICE
 * =======================
 * Service for fetching restaurant and menu data from Supabase
 */

import { supabase } from '@/lib/supabase-client'
import type { Database } from '@/lib/database.types'
import { prodLog } from '@/lib/logger'
import { locationService } from '@/lib/locationService'
import { systemSettings } from '@/lib/systemSettings'

// Helper function to calculate distance between two points
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  return locationService.calculateDistance(lat1, lng1, lat2, lng2)
}

type Restaurant = Database['public']['Tables']['restaurants']['Row']
type MenuItem = Database['public']['Tables']['menu_items']['Row']
// Review type commented out until reviews table is properly defined in database types
// type Review = Database['public']['Tables']['reviews']['Row']

export interface RestaurantWithMenuItems extends Restaurant {
  menu_items?: MenuItem[]
  // reviews?: Review[] // Commented out until properly typed
  avg_rating?: number
}

/**
 * Get featured restaurants (high rating and verified)
 */
export async function getFeaturedRestaurants(): Promise<{ data: Restaurant[] | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('restaurants')
      .select('id, name, description, image_url, cover_image_url, rating, review_count, price_range, cuisine_types, delivery_time, delivery_fee, minimum_order, is_open, opening_hours, location, features, phone_number, email, total_orders, established_year, created_at, updated_at, promotions, is_featured')
      .eq('is_open', true)
      .eq('is_featured', true)
      .gte('rating', 4.0) // Featured restaurants should have good ratings
      .order('rating', { ascending: false })
      .limit(8)

    return { data, error: error?.message || null }
  } catch (error) {
    prodLog.error('Error fetching featured restaurants', error, { operation: 'getFeaturedRestaurants' })
    return { data: null, error: String(error) }
  }
}

/**
 * Get restaurants near a specific location
 */
export async function getRestaurantsNearby(
  latitude: number,
  longitude: number,
  radiusKm?: number
): Promise<{ data: Restaurant[] | null; error: string | null }> {
  try {
    // Get admin-configurable delivery radius if not provided
    const deliveryRadius = radiusKm || await systemSettings.getDeliveryRadius()
    
    // Get all active restaurants
    const { data: restaurants, error } = await supabase
      .from('restaurants')
      .select('id, name, description, image_url, cover_image_url, rating, review_count, price_range, cuisine_types, delivery_time, delivery_fee, minimum_order, is_open, opening_hours, location, features, phone_number, email, total_orders, established_year, created_at, updated_at, promotions, is_featured')
      .eq('is_open', true)
      .order('rating', { ascending: false })

    if (error) {
      return { data: null, error: error.message }
    }

    if (!restaurants) {
      return { data: [], error: null }
    }

    // Filter restaurants by distance using actual coordinates
    const nearbyRestaurants = (restaurants as Restaurant[]).filter((restaurant: Restaurant) => {
      // Skip restaurants without coordinates
      const location = restaurant.location as any
      if (!location?.coordinates?.lat || !location?.coordinates?.lng) {
        console.warn(`⚠️ Restaurant ${restaurant.name} has no coordinates, excluding from results`)
        return false
      }

      // Calculate distance using locationService
      const distance = calculateDistance(
        latitude, 
        longitude, 
        location.coordinates.lat, 
        location.coordinates.lng
      )

      return distance <= deliveryRadius
    })

    // Sort by distance
    nearbyRestaurants.sort((a: Restaurant, b: Restaurant) => {
      const locationA = a.location as any
      const locationB = b.location as any
      const distanceA = calculateDistance(latitude, longitude, locationA.coordinates.lat, locationA.coordinates.lng)
      const distanceB = calculateDistance(latitude, longitude, locationB.coordinates.lat, locationB.coordinates.lng)
      return distanceA - distanceB
    })

    return { data: nearbyRestaurants, error: null }

  } catch (error) {
    prodLog.error('Error fetching nearby restaurants', error, { 
      operation: 'getRestaurantsNearby',
      latitude,
      longitude,
      radiusKm 
    })
    return { data: null, error: String(error) }
  }
}

/**
 * Get all restaurants with optional filters
 */
export async function getRestaurants(filters?: {
  cuisine?: string
  rating?: number
  searchQuery?: string
  city?: string
  sortBy?: 'popular' | 'rating' | 'preparation_time'
  limit?: number
  offset?: number
}): Promise<{ data: Restaurant[] | null; error: any; count?: number }> {
  try {
    let query = supabase
      .from('restaurants')
      .select('id, name, description, image_url, cover_image_url, rating, review_count, price_range, cuisine_types, delivery_time, delivery_fee, minimum_order, is_open, opening_hours, location, features, phone_number, email, total_orders, established_year, created_at, updated_at, promotions, is_featured', { count: 'exact' })
      .eq('is_open', true)

    // Apply filters based on actual database schema
    if (filters?.cuisine) {
      query = query.contains('cuisine_types', [filters.cuisine])
    }

    if (filters?.rating) {
      query = query.gte('rating', filters.rating)
    }

    // Note: city filtering would need to be implemented with JSON queries on location field
    // if (filters?.city) {
    //   query = query.eq('location->city', filters.city)
    // }

    if (filters?.searchQuery) {
      query = query.or(`name.ilike.%${filters.searchQuery}%,description.ilike.%${filters.searchQuery}%`)
    }

    // Apply sorting
    switch (filters?.sortBy) {
      case 'rating':
        query = query.order('rating', { ascending: false })
        break
      case 'preparation_time':
        query = query.order('delivery_time', { ascending: true })
        break
      case 'popular':
      default:
        query = query.order('total_orders', { ascending: false })
        query = query.order('rating', { ascending: false })
        break
    }

    // Apply secondary sort for consistency
    query = query.order('name', { ascending: true })

    // Apply pagination
    if (filters?.offset) {
      query = query.range(filters.offset, (filters.offset + (filters.limit || 10)) - 1)
    } else if (filters?.limit) {
      query = query.limit(filters.limit)
    }

    const { data, error, count } = await query

    return { data, error, count: count || 0 }
  } catch (error) {
    prodLog.error('Error fetching restaurants', error, { 
      operation: 'getRestaurants',
      filters: filters,
      searchQuery: filters?.searchQuery,
      sortBy: filters?.sortBy
    })
    return { data: null, error, count: 0 }
  }
}

/**
 * Get a single restaurant by ID with menu items
 */
export async function getRestaurantById(id: string): Promise<{ data: RestaurantWithMenuItems | null; error: any }> {
  try {
    const { data: restaurant, error: restaurantError } = await supabase
      .from('restaurants')
      .select('id, name, description, image_url, cover_image_url, rating, review_count, price_range, cuisine_types, delivery_time, delivery_fee, minimum_order, is_open, opening_hours, location, features, phone_number, email, total_orders, established_year, created_at, updated_at, promotions, is_featured')
      .eq('id', id)
      .single()

    if (restaurantError) {
      return { data: null, error: restaurantError }
    }

    // Get menu items for this restaurant
    const { data: menuItems, error: menuError } = await supabase
      .from('menu_items')
      .select('id, restaurant_id, category_id, name, description, base_price, image_url, is_available, is_popular, preparation_time, calories, tags, allergens, customizations, nutrition_info, display_order, created_at, updated_at')
      .eq('restaurant_id', id)
      .eq('is_available', true)
      .order('display_order', { ascending: true })
      .order('name', { ascending: true })

    if (menuError) {
      prodLog.error('Error fetching menu items for restaurant', menuError, { 
        restaurantId: id,
        operation: 'getRestaurantById_menuItems'
      })
    }

    // Get recent reviews - commented out until reviews table is properly defined
    // const { data: reviews, error: reviewsError } = await supabase
    //   .from('reviews')
    //   .select(`
    //     *,
    //     users!inner(first_name, last_name, avatar_url)
    //   `)
    //   .eq('restaurant_id', id)
    //   .eq('is_hidden', false)
    //   .order('created_at', { ascending: false })
    //   .limit(10)

    // if (reviewsError) {
    //   console.error('Error fetching reviews:', reviewsError)
    // }

    return {
      data: restaurant ? {
        ...(restaurant as any), // Type assertion to handle complex spread
        menu_items: menuItems || [],
        // reviews: reviews || [], // Commented out until properly typed
      } : null,
      error: null
    }
  } catch (error) {
    prodLog.error('Error fetching restaurant by ID', error, { 
      restaurantId: id,
      operation: 'getRestaurantById'
    })
    return { data: null, error: String(error) }
  }
}

/**
 * Get menu items for a restaurant
 */
export async function getMenuItems(restaurantId: string): Promise<{ data: MenuItem[] | null; error: any }> {
  try {
    const { data, error } = await supabase
      .from('menu_items')
      .select('id, restaurant_id, category_id, name, description, base_price, image_url, is_available, is_popular, preparation_time, calories, tags, allergens, customizations, nutrition_info, display_order, created_at, updated_at')
      .eq('restaurant_id', restaurantId)
      .eq('is_available', true)
      .order('display_order', { ascending: true })
      .order('name', { ascending: true })

    return { data, error: error?.message || null }
  } catch (error) {
    prodLog.error('Error fetching menu items', error, { 
      restaurantId: restaurantId,
      operation: 'getMenuItems'
    })
    return { data: null, error: String(error) }
  }
}

/**
 * Get restaurants by cuisine type
 */
export async function getRestaurantsByCuisine(cuisineType: string): Promise<{ data: Restaurant[] | null; error: any }> {
  try {
    const { data, error } = await supabase
      .from('restaurants')
      .select('id, name, description, image_url, cover_image_url, rating, review_count, price_range, cuisine_types, delivery_time, delivery_fee, minimum_order, is_open, opening_hours, location, features, phone_number, email, total_orders, established_year, created_at, updated_at, promotions, is_featured')
      .contains('cuisine_types', [cuisineType])
      .eq('is_open', true)
      .order('rating', { ascending: false })
      .limit(12)

    return { data, error: error?.message || null }
  } catch (error) {
    prodLog.error('Error fetching restaurants by cuisine', error, { 
      cuisineType: cuisineType,
      operation: 'getRestaurantsByCuisine'
    })
    return { data: null, error: String(error) }
  }
}

/**
 * Search restaurants by text query
 */
export async function searchRestaurants(query: string): Promise<{ data: Restaurant[] | null; error: any }> {
  try {
    const { data, error } = await supabase
      .from('restaurants')
      .select('id, name, description, image_url, cover_image_url, rating, review_count, price_range, cuisine_types, delivery_time, delivery_fee, minimum_order, is_open, opening_hours, location, features, phone_number, email, total_orders, established_year, created_at, updated_at, promotions, is_featured')
      .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
      .eq('is_open', true)
      .order('rating', { ascending: false })
      .limit(20)

    return { data, error: error?.message || null }
  } catch (error) {
    prodLog.error('Error searching restaurants', error, { 
      searchQuery: query,
      operation: 'searchRestaurants'
    })
    return { data: null, error: String(error) }
  }
}

/**
 * Get restaurant categories/cuisine types
 */
export async function getRestaurantCategories(): Promise<{ data: string[] | null; error: any }> {
  try {
    const { data, error } = await supabase
      .from('restaurants')
      .select('cuisine_types')
      .eq('is_open', true)

    if (error) {
      return { data: null, error: String(error) }
    }

    // Extract and deduplicate cuisine types from arrays
    const allCuisines = data?.flatMap((r: any) => r.cuisine_types || []).filter(Boolean) || []
    const uniqueCuisines = [...new Set(allCuisines)].sort()

    return { data: uniqueCuisines, error: null }
  } catch (error) {
    prodLog.error('Error fetching restaurant categories', error, { operation: 'getRestaurantCategories' })
    return { data: null, error: String(error) }
  }
}

/**
 * Get popular restaurants (high rating and order count)
 */
export async function getPopularRestaurants(): Promise<{ data: Restaurant[] | null; error: any }> {
  try {
    const { data, error } = await supabase
      .from('restaurants')
      .select('id, name, description, image_url, cover_image_url, rating, review_count, price_range, cuisine_types, delivery_time, delivery_fee, minimum_order, is_open, opening_hours, location, features, phone_number, email, total_orders, established_year, created_at, updated_at, promotions, is_featured')
      .eq('is_open', true)
      .gte('rating', 4.0)
      .order('rating', { ascending: false })
      .limit(8)

    return { data, error: error?.message || null }
  } catch (error) {
    prodLog.error('Error fetching popular restaurants', error, { operation: 'getPopularRestaurants' })
    return { data: null, error: String(error) }
  }
}

/**
 * Get restaurants near a location (placeholder for now)
 */
export async function getNearbyRestaurants(lat?: number, lng?: number, _radius = 10): Promise<{ data: Restaurant[] | null; error: string | null }> {
  // For now, just return all restaurants ordered by rating
  // TODO: Implement actual geospatial queries when location is provided
  try {
    const { data, error } = await supabase
      .from('restaurants')
      .select('id, name, description, image_url, cover_image_url, rating, review_count, price_range, cuisine_types, delivery_time, delivery_fee, minimum_order, is_open, opening_hours, location, features, phone_number, email, total_orders, established_year, created_at, updated_at, promotions, is_featured')
      .eq('is_open', true)
      .order('rating', { ascending: false })
      .limit(12)

    return { data, error: error?.message || null }
  } catch (error) {
    prodLog.error('Error fetching nearby restaurants', error, { 
      lat: lat,
      lng: lng,
      operation: 'getNearbyRestaurants'
    })
    return { data: null, error: String(error) }
  }
}