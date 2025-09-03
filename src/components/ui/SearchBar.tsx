'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Search, X, Clock, TrendingUp, MapPin } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useAppDispatch, useAppSelector } from '@/store'
import { setSearchQuery } from '@/store/slices/uiSlice'
import { setSearchQuery as setRestaurantSearchQuery } from '@/store/slices/restaurantSlice'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'

interface SearchSuggestion {
  id: string
  type: 'restaurant' | 'dish' | 'cuisine' | 'recent' | 'popular'
  title: string
  subtitle?: string
  icon?: string
}

interface SearchBarProps {
  placeholder?: string
  className?: string
  showSuggestions?: boolean
  onSearch?: (query: string) => void
}

export default function SearchBar({ 
  placeholder = "Search restaurants, dishes, cuisines...",
  className = "",
  showSuggestions = true,
  onSearch
}: SearchBarProps) {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const searchInputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)
  
  const { searchQuery } = useAppSelector((state) => state.ui)
  const [localQuery, setLocalQuery] = useState(searchQuery)
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)

  // Debounced search function - create the debounced function outside useCallback
  const searchSuggestions = async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setSuggestions([])
      return
    }

    setIsLoading(true)
    try {
      // Get search suggestions from API
      const restaurants = await api.restaurants.search(query)
        const recentSearches = getRecentSearches()
        const popularSearches = getPopularSearches()

        const newSuggestions: SearchSuggestion[] = [
          // Recent searches
          ...recentSearches
            .filter(search => search.toLowerCase().includes(query.toLowerCase()))
            .slice(0, 2)
            .map(search => ({
              id: `recent-${search}`,
              type: 'recent' as const,
              title: search,
              subtitle: 'Recent search'
            })),
          
          // Restaurant suggestions
          ...restaurants.slice(0, 4).map(restaurant => ({
            id: `restaurant-${restaurant.id}`,
            type: 'restaurant' as const,
            title: restaurant.name,
            subtitle: `${restaurant.cuisine_types.join(', ')} • ${restaurant.delivery_time}`,
            icon: restaurant.image_url || undefined
          })),
          
          // Popular searches
          ...popularSearches
            .filter(search => search.toLowerCase().includes(query.toLowerCase()))
            .slice(0, 2)
            .map(search => ({
              id: `popular-${search}`,
              type: 'popular' as const,
              title: search,
              subtitle: 'Trending search'
            }))
        ]

        setSuggestions(newSuggestions.slice(0, 6))
      } catch (error) {
        console.error('Search suggestions error:', error)
        setSuggestions([])
      } finally {
        setIsLoading(false)
      }
  }

  const debouncedSearch = useCallback(
    (query: string) => {
      const fn = debounce((q: string) => searchSuggestions(q), 300)
      fn(query)
    },
    []
  )

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setLocalQuery(value)
    dispatch(setSearchQuery(value))
    
    if (showSuggestions) {
      setShowDropdown(true)
      setSelectedIndex(-1)
      debouncedSearch(value)
    }
  }

  // Handle search submission
  const handleSearch = useCallback((query: string = localQuery) => {
    if (!query.trim()) return
    
    // Save to recent searches
    saveRecentSearch(query)
    
    // Update global state
    dispatch(setRestaurantSearchQuery(query))
    
    // Close dropdown
    setShowDropdown(false)
    setSelectedIndex(-1)
    
    // Call onSearch prop if provided
    if (onSearch) {
      onSearch(query)
    } else {
      // Navigate to search results page
      router.push(`/browse?q=${encodeURIComponent(query)}`)
    }
  }, [localQuery, dispatch, router, onSearch])

  // Handle suggestion selection
  const handleSuggestionSelect = (suggestion: SearchSuggestion) => {
    if (suggestion.type === 'restaurant') {
      router.push(`/restaurant/${suggestion.id.replace('restaurant-', '')}`)
    } else {
      setLocalQuery(suggestion.title)
      handleSearch(suggestion.title)
    }
  }

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown || suggestions.length === 0) {
      if (e.key === 'Enter') {
        handleSearch()
      }
      return
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => prev < suggestions.length - 1 ? prev + 1 : -1)
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => prev > -1 ? prev - 1 : suggestions.length - 1)
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0) {
          handleSuggestionSelect(suggestions[selectedIndex])
        } else {
          handleSearch()
        }
        break
      case 'Escape':
        setShowDropdown(false)
        setSelectedIndex(-1)
        searchInputRef.current?.blur()
        break
    }
  }

  // Handle clear search
  const handleClear = () => {
    setLocalQuery('')
    dispatch(setSearchQuery(''))
    setSuggestions([])
    setShowDropdown(false)
    searchInputRef.current?.focus()
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current && 
        !suggestionsRef.current.contains(event.target as Node) &&
        !searchInputRef.current?.contains(event.target as Node)
      ) {
        setShowDropdown(false)
        setSelectedIndex(-1)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Sync with global search state
  useEffect(() => {
    if (searchQuery !== localQuery) {
      setLocalQuery(searchQuery)
    }
  }, [searchQuery, localQuery])

  return (
    <div className={cn("relative w-full max-w-2xl", className)}>
      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-500" />
        </div>
        
        <input
          ref={searchInputRef}
          type="text"
          value={localQuery}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => showSuggestions && localQuery && setShowDropdown(true)}
          placeholder={placeholder}
          className="w-full pl-12 pr-12 py-4 mobile-input border border-gray-200 rounded-2xl 
                   focus:ring-2 focus:ring-brand-500 focus:border-transparent 
                   bg-white shadow-sm transition-all duration-200
                   placeholder-gray-400 text-gray-900"
          aria-label="Search restaurants and dishes"
        />
        
        {localQuery && (
          <button
            onClick={handleClear}
            className="absolute inset-y-0 right-0 pr-4 flex items-center mobile-touch-optimized
                     text-gray-500 hover:text-gray-600 transition-colors"
            aria-label="Clear search"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Search Suggestions Dropdown */}
      {showSuggestions && showDropdown && (
        <div
          ref={suggestionsRef}
          className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 
                   rounded-2xl shadow-lg overflow-hidden z-50 max-h-96 overflow-y-auto"
        >
          {isLoading ? (
            <div className="p-6 text-center text-gray-500">
              <div className="animate-spin h-6 w-6 border-2 border-brand-500 border-t-transparent 
                           rounded-full mx-auto mb-2"></div>
              Searching...
            </div>
          ) : suggestions.length > 0 ? (
            <div className="py-2">
              {suggestions.map((suggestion, index) => (
                <button
                  key={suggestion.id}
                  onClick={() => handleSuggestionSelect(suggestion)}
                  className={cn(
                    "w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center space-x-3 transition-colors",
                    selectedIndex === index && "bg-brand-50"
                  )}
                >
                  {/* Icon */}
                  <div className="flex-shrink-0">
                    {suggestion.icon ? (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img 
                          src={suggestion.icon} 
                          alt="" 
                          className="h-8 w-8 rounded-full object-cover"
                        />
                      </>
                    ) : suggestion.type === 'recent' ? (
                      <Clock className="h-5 w-5 text-gray-500" />
                    ) : suggestion.type === 'popular' ? (
                      <TrendingUp className="h-5 w-5 text-brand-500" />
                    ) : suggestion.type === 'restaurant' ? (
                      <MapPin className="h-5 w-5 text-gray-500" />
                    ) : (
                      <Search className="h-5 w-5 text-gray-500" />
                    )}
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 truncate">
                      {suggestion.title}
                    </div>
                    {suggestion.subtitle && (
                      <div className="text-sm text-gray-500 truncate">
                        {suggestion.subtitle}
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          ) : localQuery.length >= 2 ? (
            <div className="p-6 text-center text-gray-500">
              No suggestions found for &quot;{localQuery}&quot;
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}

// Utility functions for search history
function getRecentSearches(): string[] {
  if (typeof window === 'undefined') return []
  const searches = localStorage.getItem('foodnow-recent-searches')
  return searches ? JSON.parse(searches) : []
}

function saveRecentSearch(query: string): void {
  if (typeof window === 'undefined') return
  const searches = getRecentSearches()
  const updatedSearches = [query, ...searches.filter(s => s !== query)].slice(0, 10)
  localStorage.setItem('foodnow-recent-searches', JSON.stringify(updatedSearches))
}

function getPopularSearches(): string[] {
  // Mock popular searches - would come from analytics in production
  return [
    'Jollof Rice',
    'Pizza',
    'Suya',
    'Chicken',
    'Chinese Food',
    'Burger',
    'Fried Rice',
    'Pasta'
  ]
}

// Debounce utility function
function debounce<T extends unknown[]>(
  func: (...args: T) => unknown,
  wait: number
): (...args: T) => void {
  let timeout: NodeJS.Timeout | null = null
  
  return (...args: T) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}