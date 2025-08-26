// import { supabase } from './supabase' // Commented out until schema is ready

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
    limit = 20
  ): Promise<SearchResult[]> {
    if (!query || query.length < 2) return []

    // For now, return mock results until Supabase schema is properly set up
    const mockResults: SearchResult[] = [
      {
        id: '1',
        type: 'restaurant' as const,
        title: 'Lagos Jollof Palace',
        subtitle: 'Nigerian Cuisine',
        image: 'https://images.unsplash.com/photo-1596797038530-2c107229654b?w=400&h=300&fit=crop&auto=format',
        rating: 4.8,
        price: '₦₦',
        deliveryTime: '15-25 min',
        matchScore: 1.0
      },
      {
        id: '2',
        type: 'restaurant' as const,
        title: 'Dragon Wok',
        subtitle: 'Chinese Cuisine',
        image: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400&h=300&fit=crop&auto=format',
        rating: 4.7,
        price: '₦₦₦',
        deliveryTime: '20-30 min',
        matchScore: 0.9
      },
      {
        id: '3',
        type: 'dish' as const,
        title: 'Jollof Rice Special',
        subtitle: 'Traditional Nigerian dish',
        image: 'https://images.unsplash.com/photo-1596797038530-2c107229654b?w=400&h=300&fit=crop&auto=format',
        price: '₦2,500',
        matchScore: 0.8
      }
    ].filter(result => 
      result.title.toLowerCase().includes(query.toLowerCase()) ||
      result.subtitle?.toLowerCase().includes(query.toLowerCase())
    )

    return mockResults.slice(0, limit)
  },

  // Get search suggestions (autocomplete)
  async getSuggestions(query: string): Promise<SearchResult[]> {
    if (!query || query.length < 2) return []

    // Mock suggestions for now
    const mockSuggestions: SearchResult[] = [
      {
        id: '1',
        type: 'restaurant' as const,
        title: 'Lagos Jollof Palace',
        subtitle: 'Nigerian Cuisine',
        image: 'https://images.unsplash.com/photo-1596797038530-2c107229654b?w=400&h=300&fit=crop&auto=format'
      },
      {
        id: '2',
        type: 'dish' as const,
        title: 'Jollof Rice',
        subtitle: 'Popular Nigerian dish'
      },
      {
        id: '3',
        type: 'cuisine' as const,
        title: 'Nigerian',
        subtitle: 'Cuisine Type'
      }
    ].filter(suggestion =>
      suggestion.title.toLowerCase().includes(query.toLowerCase())
    )

    return mockSuggestions.slice(0, 5)
  },

  // Get popular searches
  async getPopularSearches(limit = 10): Promise<string[]> {
    // In production, this would query from a search_history table
    // For now, return mock popular searches
    return [
      'Jollof Rice',
      'Pizza',
      'Burger',
      'Chinese',
      'Suya',
      'Chicken',
      'Pasta',
      'Shawarma',
      'Ice Cream',
      'Salad'
    ].slice(0, limit)
  },

  // Save search to history
  async saveSearchHistory(
    userId: string,
    query: string,
    resultsCount: number
  ): Promise<void> {
    // For now, just save to localStorage
    console.log(`Search saved: ${query} for user ${userId} with ${resultsCount} results`)
  },

  // Get user's recent searches
  async getRecentSearches(userId: string, limit = 5): Promise<string[]> {
    // For now, return searches from localStorage
    return searchStorage.getHistory().slice(0, limit)
  },

  // Search by filters only (no text query)
  async searchByFilters(filters: SearchFilters): Promise<SearchResult[]> {
    // Mock filtered results for now
    const mockResults: SearchResult[] = [
      {
        id: '1',
        type: 'restaurant' as const,
        title: 'Lagos Jollof Palace',
        subtitle: 'Nigerian Cuisine',
        image: 'https://images.unsplash.com/photo-1596797038530-2c107229654b?w=400&h=300&fit=crop&auto=format',
        rating: 4.8,
        price: '₦₦',
        deliveryTime: '15-25 min'
      },
      {
        id: '2',
        type: 'restaurant' as const,
        title: 'Dragon Wok',
        subtitle: 'Chinese Cuisine',
        image: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400&h=300&fit=crop&auto=format',
        rating: 4.7,
        price: '₦₦₦',
        deliveryTime: '20-30 min'
      }
    ]

    // Apply basic filtering
    let filteredResults = [...mockResults]

    if (filters.rating) {
      filteredResults = filteredResults.filter(r => r.rating && r.rating >= filters.rating!)
    }

    if (filters.cuisineTypes && filters.cuisineTypes.length > 0) {
      filteredResults = filteredResults.filter(r => 
        filters.cuisineTypes!.some(cuisine => 
          r.subtitle?.toLowerCase().includes(cuisine.toLowerCase())
        )
      )
    }

    return filteredResults
  },

  // Fuzzy search for typo tolerance
  async fuzzySearch(query: string): Promise<SearchResult[]> {
    // For now, use simple fuzzy matching
    return this.fullTextSearch(query)
  }
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