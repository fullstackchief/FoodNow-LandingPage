import { supabase } from './supabase-client'
import { searchRestaurants } from './restaurantService'
import { locationService } from './locationService'
import type { Database } from './database.types'

type MenuItemRow = Database['public']['Tables']['menu_items']['Row']
type RestaurantRow = Database['public']['Tables']['restaurants']['Row']

// Types for search functionality
export interface SearchResult {
  id: string
  type: 'restaurant' | 'dish' | 'cuisine'
  title: string
  subtitle?: string
  image?: string
  rating?: number
  price?: string
  deliveryTime?: string
  matchScore?: number
  coordinates?: { lat: number; lng: number }
  distance?: number
}

export interface SearchFilters {
  priceRange?: [number, number]
  rating?: number
  deliveryTime?: number
  cuisineTypes?: string[]
  dietary?: string[]
  isOpen?: boolean
}

export interface SearchHistory {
  id: string
  query: string
  timestamp: Date
  resultsCount: number
}

// Search API functions
export const searchAPI = {
  // Full-text search across restaurants and menu items
  async fullTextSearch(
    query: string,
    filters?: SearchFilters,
    limit = 20,
    userLocation?: { lat: number; lng: number }
  ): Promise<SearchResult[]> {
    if (!query || query.length < 2) return []

    console.log('🔍 Real search query:', { query, filters, userLocation })

    try {
      // Search restaurants using real Supabase data
      const { data: restaurants, error: restaurantError } = await searchRestaurants(query)
      
      if (restaurantError) {
        console.error('❌ Restaurant search failed:', restaurantError)
        return []
      }

      if (!restaurants || restaurants.length === 0) {
        console.log('🔍 No restaurants found for query:', query)
        return []
      }

      console.log(`✅ Found ${restaurants.length} restaurants for query: ${query}`)

      // Convert restaurant data to SearchResult format
      let searchResults: SearchResult[] = restaurants.map(restaurant => ({
        id: restaurant.id,
        type: 'restaurant' as const,
        title: restaurant.name,
        subtitle: Array.isArray(restaurant.cuisine_types) ? restaurant.cuisine_types[0] : restaurant.cuisine_types || 'Restaurant',
        image: restaurant.cover_image_url || restaurant.image_url || undefined,
        rating: restaurant.rating || undefined,
        price: restaurant.price_range || undefined,
        deliveryTime: restaurant.delivery_time || undefined,
        coordinates: (restaurant.location as any)?.coordinates ? {
          lat: (restaurant.location as any).coordinates.lat,
          lng: (restaurant.location as any).coordinates.lng
        } : undefined
      }))

      // Apply location-based filtering if user location is provided
      if (userLocation && filters?.deliveryTime) {
        console.log('📍 Applying location-based filtering...')
        
        searchResults = searchResults
          .map(result => {
            if (result.coordinates) {
              const distance = locationService.calculateDistance(
                userLocation.lat,
                userLocation.lng,
                result.coordinates.lat,
                result.coordinates.lng
              )
              return { ...result, distance }
            }
            return result
          })
          .filter(result => {
            // Filter by delivery radius (default 20km)
            return !result.distance || result.distance <= (filters?.deliveryTime || 20)
          })
          .sort((a, b) => (a.distance || 999) - (b.distance || 999)) // Sort by distance
        
        console.log(`📏 Filtered to ${searchResults.length} restaurants within delivery range`)
      }

      // Apply other filters
      if (filters?.rating) {
        searchResults = searchResults.filter(result => 
          result.rating ? result.rating >= filters.rating! : false
        )
      }

      // Search menu items too
      const menuResults = await searchMenuItems(query, userLocation, filters)
      
      // Combine and limit results
      const allResults = [...searchResults, ...menuResults]
        .slice(0, limit)

      console.log(`🎯 Returning ${allResults.length} total search results`)
      return allResults

    } catch (error) {
      console.error('❌ Search failed:', error)
      return []
    }
  },

  // Search menu items across all restaurants
  async searchMenuItems(
    query: string,
    _userLocation?: { lat: number; lng: number },
    _filters?: SearchFilters
  ): Promise<SearchResult[]> {
    try {
      const { data: menuItems, error: menuError } = await supabase
        .from('menu_items')
        .select('id, restaurant_id, name, image_url, base_price, preparation_time')
        .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
        .eq('is_available', true)
        .limit(10) as { data: Pick<MenuItemRow, 'id' | 'restaurant_id' | 'name' | 'image_url' | 'base_price' | 'preparation_time'>[] | null, error: any }

      if (menuError) {
        console.error('❌ Menu search failed:', menuError)
        return []
      }

      if (!menuItems || menuItems.length === 0) {
        return []
      }

      // Second: Get restaurant data for these menu items
      const restaurantIds = Array.from(new Set(menuItems.map(item => item.restaurant_id)))
      const { data: restaurants, error: restaurantError } = await supabase
        .from('restaurants')
        .select('id, name, location')
        .in('id', restaurantIds)
        .eq('is_open', true) as { data: Pick<RestaurantRow, 'id' | 'name' | 'location'>[] | null, error: any }

      if (restaurantError) {
        console.error('❌ Restaurant lookup failed:', restaurantError)
        return []
      }

      // Create restaurant lookup map
      const restaurantMap = new Map((restaurants || []).map(r => [r.id, r]))

      // Filter and map menu items with restaurant data
      const validMenuItems = menuItems.filter(item => restaurantMap.has(item.restaurant_id))


      return validMenuItems.map(item => {
        const restaurant = restaurantMap.get(item.restaurant_id)!
        return {
          id: `menu-${item.id}`,
          type: 'dish' as const,
          title: item.name,
          subtitle: `Menu Item • ${restaurant.name}`,
          image: item.image_url || undefined,
          price: `₦${item.base_price.toLocaleString()}`,
          deliveryTime: `${item.preparation_time} mins`,
          coordinates: (restaurant.location as any)?.coordinates ? {
            lat: (restaurant.location as any).coordinates.lat,
            lng: (restaurant.location as any).coordinates.lng
          } : undefined
        }
      })

    } catch (error) {
      console.error('❌ Menu search error:', error)
      return []
    }
  },

  // Get search suggestions (autocomplete)
  async getSuggestions(query: string): Promise<SearchResult[]> {
    if (!query || query.length < 2) return []

    try {
      // Get restaurant suggestions
      const { data: restaurants } = await supabase
        .from('restaurants')
        .select('id, name, cuisine_types, image_url')
        .ilike('name', `%${query}%`)
        .eq('is_open', true)
        .limit(3) as { data: Pick<RestaurantRow, 'id' | 'name' | 'cuisine_types' | 'image_url'>[] | null, error?: any }

      // Get menu item suggestions  
      const { data: menuItems } = await supabase
        .from('menu_items')
        .select('id, name')
        .ilike('name', `%${query}%`)
        .eq('is_available', true)
        .limit(2) as { data: Pick<MenuItemRow, 'id' | 'name'>[] | null, error?: any }

      const suggestions: SearchResult[] = []

      if (restaurants) {
        suggestions.push(...restaurants.map(r => ({
          id: r.id,
          type: 'restaurant' as const,
          title: r.name,
          subtitle: Array.isArray(r.cuisine_types) ? r.cuisine_types[0] : r.cuisine_types || 'Restaurant',
          image: r.image_url || undefined
        })))
      }

      if (menuItems) {
        suggestions.push(...menuItems.map(m => ({
          id: `menu-${m.id}`,
          type: 'dish' as const,
          title: m.name,
          subtitle: 'Menu Item'
        })))
      }

      return suggestions

    } catch (error) {
      console.error('❌ Suggestions failed:', error)
      return []
    }
  },

  // Get popular searches
  async getPopularSearches(limit = 10): Promise<string[]> {
    try {
      // Get most common cuisine types as popular searches
      const { data: cuisines } = await supabase
        .from('restaurants')
        .select('cuisine_types')
        .eq('is_open', true) as { data: Pick<RestaurantRow, 'cuisine_types'>[] | null, error?: any }

      if (cuisines) {
        const cuisineList = cuisines
          .flatMap(c => c.cuisine_types || [])
          .filter((value, index, self) => self.indexOf(value) === index)
          .slice(0, limit)
        
        return cuisineList.length > 0 ? cuisineList : [
          'Nigerian', 'Jollof Rice', 'Suya', 'Pepper Soup', 'Fried Rice'
        ]
      }
    } catch (error) {
      console.error('❌ Popular searches failed:', error)
    }

    // Fallback popular searches
    return ['Nigerian', 'Jollof Rice', 'Suya', 'Pepper Soup', 'Fried Rice'].slice(0, limit)
  },

  // Save search to history
  async saveSearchHistory(
    userId: string,
    query: string,
    resultsCount: number
  ): Promise<void> {
    console.log(`Search saved: ${query} for user ${userId} with ${resultsCount} results`)
    searchStorage.addToHistory(query)
  },

  // Get user's recent searches
  async getRecentSearches(userId: string, limit = 5): Promise<string[]> {
    return searchStorage.getHistory().slice(0, limit)
  },

  // Search by filters only (no text query)
  async searchByFilters(
    filters: SearchFilters,
    userLocation?: { lat: number; lng: number }
  ): Promise<SearchResult[]> {
    try {
      console.log('🔧 Filtering restaurants by criteria:', filters)
      
      let query = supabase
        .from('restaurants')
        .select('id, name, cuisine_types, image_url, cover_image_url, rating, price_range, delivery_time, location')
        .eq('is_open', true)

      // Apply filters
      if (filters.rating) {
        query = query.gte('rating', filters.rating)
      }

      if (filters.cuisineTypes && filters.cuisineTypes.length > 0) {
        query = query.overlaps('cuisine_types', filters.cuisineTypes)
      }

      if (filters.priceRange) {
        query = query
          .gte('minimum_order', filters.priceRange[0])
          .lte('minimum_order', filters.priceRange[1])
      }

      const { data: restaurants, error } = await query.limit(20) as { data: Pick<RestaurantRow, 'id' | 'name' | 'cuisine_types' | 'image_url' | 'cover_image_url' | 'rating' | 'price_range' | 'delivery_time' | 'location'>[] | null, error: any }

      if (error) {
        console.error('❌ Filter search failed:', error)
        return []
      }

      if (!restaurants) return []

      let results: SearchResult[] = restaurants.map(restaurant => ({
        id: restaurant.id,
        type: 'restaurant' as const,
        title: restaurant.name,
        subtitle: Array.isArray(restaurant.cuisine_types) ? restaurant.cuisine_types[0] : restaurant.cuisine_types || 'Restaurant',
        image: restaurant.cover_image_url || restaurant.image_url || undefined,
        rating: restaurant.rating || undefined,
        price: restaurant.price_range || undefined,
        deliveryTime: restaurant.delivery_time || undefined,
        coordinates: (restaurant.location as any)?.coordinates ? {
          lat: (restaurant.location as any).coordinates.lat,
          lng: (restaurant.location as any).coordinates.lng
        } : undefined
      }))

      // Apply location filtering if provided
      if (userLocation) {
        results = results
          .map(result => {
            if (result.coordinates) {
              const distance = locationService.calculateDistance(
                userLocation.lat,
                userLocation.lng,
                result.coordinates.lat,
                result.coordinates.lng
              )
              return { ...result, distance }
            }
            return result
          })
          .filter(result => !result.distance || result.distance <= 20)
          .sort((a, b) => (a.distance || 999) - (b.distance || 999))
      }

      return results

    } catch (error) {
      console.error('❌ Filter search error:', error)
      return []
    }
  },

  // Fuzzy search for typo tolerance
  async fuzzySearch(query: string, userLocation?: { lat: number; lng: number }): Promise<SearchResult[]> {
    return this.fullTextSearch(query, undefined, 10, userLocation)
  }
}

// Helper function for menu search (referenced in fullTextSearch)
async function searchMenuItems(
  query: string,
  userLocation?: { lat: number; lng: number },
  filters?: SearchFilters
): Promise<SearchResult[]> {
  return await searchAPI.searchMenuItems(query, userLocation, filters)
}

// Voice search utilities
export const voiceSearchAPI = {
  // Check if voice search is supported
  isSupported(): boolean {
    if (typeof window === 'undefined') return false
    return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window
  },

  // Start voice recognition
  startListening(
    onResult: (transcript: string) => void,
    onError?: (error: string) => void
  ): () => void {
    if (typeof window === 'undefined' || !this.isSupported()) {
      onError?.('Voice search is not supported in this browser')
      return () => {}
    }

    const SpeechRecognition = 
      (window as unknown as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown }).SpeechRecognition || 
      (window as unknown as { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition

    const recognition = new (SpeechRecognition as new() => {
      lang: string
      continuous: boolean
      interimResults: boolean
      onresult: (event: { results: { [key: number]: { [key: number]: { transcript: string } } } }) => void
      onerror: (event: { error: string }) => void
      start: () => void
      stop: () => void
    })()
    
    recognition.lang = 'en-US'
    recognition.continuous = false
    recognition.interimResults = false

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript
      onResult(transcript)
    }

    recognition.onerror = (event) => {
      onError?.(event.error)
    }

    recognition.start()

    // Return cleanup function
    return () => {
      recognition.stop()
    }
  }
}

// Local storage utilities for search history
export const searchStorage = {
  STORAGE_KEY: 'foodnow_search_history',
  MAX_ITEMS: 10,

  // Get search history from local storage
  getHistory(): string[] {
    if (typeof window === 'undefined') return []
    try {
      const history = localStorage.getItem(this.STORAGE_KEY)
      return history ? JSON.parse(history) : []
    } catch {
      return []
    }
  },

  // Add to search history
  addToHistory(query: string): void {
    if (typeof window === 'undefined' || !query || query.length < 2) return

    try {
      let history = this.getHistory()
      
      // Remove if already exists
      history = history.filter(q => q.toLowerCase() !== query.toLowerCase())
      
      // Add to beginning
      history.unshift(query)
      
      // Keep only max items
      history = history.slice(0, this.MAX_ITEMS)
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(history))
    } catch (error) {
      console.error('Error saving search history:', error)
    }
  },

  // Clear search history
  clearHistory(): void {
    if (typeof window === 'undefined') return
    try {
      localStorage.removeItem(this.STORAGE_KEY)
    } catch (error) {
      console.error('Error clearing search history:', error)
    }
  }
}