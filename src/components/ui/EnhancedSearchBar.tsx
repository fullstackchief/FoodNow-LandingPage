'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Search, X, Clock, TrendingUp, MapPin, Mic, MicOff, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useAppDispatch, useAppSelector } from '@/store'
import { setSearchQuery } from '@/store/slices/uiSlice'
import { searchAPI, voiceSearchAPI, searchStorage, SearchResult } from '@/lib/search'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import OptimizedImage from './OptimizedImage'

interface EnhancedSearchBarProps {
  placeholder?: string
  className?: string
  showSuggestions?: boolean
  onSearch?: (query: string) => void
  autoFocus?: boolean
}

export default function EnhancedSearchBar({ 
  placeholder = "Search restaurants, dishes, cuisines...",
  className = "",
  showSuggestions = true,
  onSearch,
  autoFocus = false
}: EnhancedSearchBarProps) {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const searchInputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)
  const voiceCleanupRef = useRef<(() => void) | null>(null)
  
  const { searchQuery } = useAppSelector((state) => state.ui)
  const [localQuery, setLocalQuery] = useState(searchQuery)
  const [suggestions, setSuggestions] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [isListening, setIsListening] = useState(false)
  const [voiceError, setVoiceError] = useState('')
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const [popularSearches, setPopularSearches] = useState<string[]>([])

  // Load initial data
  useEffect(() => {
    setRecentSearches(searchStorage.getHistory())
    searchAPI.getPopularSearches(8).then(setPopularSearches)
  }, [])

  // Auto focus
  useEffect(() => {
    if (autoFocus && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [autoFocus])

  // Debounced search for suggestions
  const debouncedSearchSuggestions = useCallback(
    async (query: string) => {
      if (!query.trim() || query.length < 2) {
        setSuggestions([])
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      try {
        const results = await searchAPI.getSuggestions(query)
        setSuggestions(results)
      } catch (error) {
        console.error('Search suggestions error:', error)
        setSuggestions([])
      } finally {
        setIsLoading(false)
      }
    },
    []
  )

  // Debounce suggestions
  useEffect(() => {
    const timer = setTimeout(() => {
      if (showSuggestions && localQuery) {
        debouncedSearchSuggestions(localQuery)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [localQuery, showSuggestions, debouncedSearchSuggestions])

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setLocalQuery(value)
    setSelectedIndex(-1)
    setVoiceError('')
    
    if (showSuggestions && value.length >= 2) {
      setShowDropdown(true)
    } else {
      setShowDropdown(false)
      setSuggestions([])
    }
  }

  // Handle search submission
  const handleSearch = (query?: string) => {
    const searchTerm = (query || localQuery).trim()
    if (!searchTerm) return

    // Save to history
    searchStorage.addToHistory(searchTerm)
    setRecentSearches(searchStorage.getHistory())

    // Update Redux state
    dispatch(setSearchQuery(searchTerm))

    // Close dropdown
    setShowDropdown(false)
    setSelectedIndex(-1)

    // Callback or navigation
    if (onSearch) {
      onSearch(searchTerm)
    } else {
      router.push(`/search?q=${encodeURIComponent(searchTerm)}`)
    }

    // Blur input
    searchInputRef.current?.blur()
  }

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: SearchResult) => {
    if (suggestion.type === 'restaurant') {
      router.push(`/restaurant/${suggestion.id}`)
    } else {
      handleSearch(suggestion.title)
    }
    setShowDropdown(false)
  }

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown) return

    const totalItems = suggestions.length + recentSearches.length + popularSearches.length

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => (prev + 1) % totalItems)
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => prev <= 0 ? totalItems - 1 : prev - 1)
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0) {
          if (selectedIndex < suggestions.length) {
            handleSuggestionClick(suggestions[selectedIndex])
          } else if (selectedIndex < suggestions.length + recentSearches.length) {
            const recentIndex = selectedIndex - suggestions.length
            handleSearch(recentSearches[recentIndex])
          } else {
            const popularIndex = selectedIndex - suggestions.length - recentSearches.length
            handleSearch(popularSearches[popularIndex])
          }
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

  // Voice search functions
  const startVoiceSearch = () => {
    if (!voiceSearchAPI.isSupported()) {
      setVoiceError('Voice search is not supported in this browser')
      return
    }

    setIsListening(true)
    setVoiceError('')

    voiceCleanupRef.current = voiceSearchAPI.startListening(
      (transcript) => {
        setLocalQuery(transcript)
        setIsListening(false)
        // Auto-search after voice input
        setTimeout(() => handleSearch(transcript), 500)
      },
      (error) => {
        setVoiceError(error)
        setIsListening(false)
      }
    )
  }

  const stopVoiceSearch = () => {
    if (voiceCleanupRef.current) {
      voiceCleanupRef.current()
      voiceCleanupRef.current = null
    }
    setIsListening(false)
  }

  // Clear search
  const clearSearch = () => {
    setLocalQuery('')
    setShowDropdown(false)
    setSuggestions([])
    setSelectedIndex(-1)
    setVoiceError('')
    dispatch(setSearchQuery(''))
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

  // Cleanup voice search on unmount
  useEffect(() => {
    return () => {
      if (voiceCleanupRef.current) {
        voiceCleanupRef.current()
      }
    }
  }, [])

  const allSuggestions = [
    ...suggestions,
    ...recentSearches.map(search => ({
      id: search,
      type: 'recent' as const,
      title: search,
      subtitle: 'Recent search'
    })),
    ...popularSearches.map(search => ({
      id: search,
      type: 'popular' as const,
      title: search,
      subtitle: 'Popular search'
    }))
  ]

  return (
    <div className={cn("relative", className)}>
      {/* Main Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        
        <input
          ref={searchInputRef}
          type="text"
          value={localQuery}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (showSuggestions && (localQuery.length >= 2 || recentSearches.length > 0)) {
              setShowDropdown(true)
            }
          }}
          placeholder={placeholder}
          className="w-full pl-12 pr-20 py-4 text-gray-900 placeholder-gray-500 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent shadow-lg"
        />

        {/* Right side controls */}
        <div className="absolute inset-y-0 right-0 flex items-center pr-4 gap-2">
          {/* Voice Search Button */}
          {voiceSearchAPI.isSupported() && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={isListening ? stopVoiceSearch : startVoiceSearch}
              className={cn(
                "p-2 rounded-lg transition-colors",
                isListening 
                  ? "bg-red-100 text-red-600" 
                  : "bg-gray-100 hover:bg-gray-200 text-gray-600"
              )}
              title={isListening ? 'Stop listening' : 'Voice search'}
            >
              {isListening ? (
                <MicOff className="w-4 h-4 animate-pulse" />
              ) : (
                <Mic className="w-4 h-4" />
              )}
            </motion.button>
          )}

          {/* Clear Button */}
          {localQuery && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={clearSearch}
              className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </motion.button>
          )}
        </div>

        {/* Voice Error */}
        <AnimatePresence>
          {voiceError && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full left-0 right-0 mt-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm"
            >
              {voiceError}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Suggestions Dropdown */}
      <AnimatePresence>
        {showDropdown && (
          <motion.div
            ref={suggestionsRef}
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 max-h-96 overflow-y-auto"
          >
            {isLoading && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 text-orange-500 animate-spin" />
                <span className="ml-2 text-gray-600">Searching...</span>
              </div>
            )}

            {!isLoading && allSuggestions.length === 0 && localQuery.length >= 2 && (
              <div className="p-4 text-center text-gray-500">
                No suggestions found
              </div>
            )}

            {/* Suggestions List */}
            {!isLoading && allSuggestions.length > 0 && (
              <div className="py-2">
                {allSuggestions.map((suggestion, index) => (
                  <motion.div
                    key={`${suggestion.type}-${suggestion.id}`}
                    whileHover={{ backgroundColor: '#f9fafb' }}
                    onClick={() => {
                      if (suggestion.type === 'recent' || suggestion.type === 'popular') {
                        handleSearch(suggestion.title)
                      } else {
                        handleSuggestionClick(suggestion)
                      }
                    }}
                    className={cn(
                      "px-4 py-3 cursor-pointer transition-colors flex items-center gap-3",
                      selectedIndex === index && "bg-gray-50"
                    )}
                  >
                    {/* Icon based on type */}
                    <div className="flex-shrink-0">
                      {suggestion.type === 'restaurant' && <MapPin className="w-4 h-4 text-green-500" />}
                      {suggestion.type === 'dish' && <Search className="w-4 h-4 text-blue-500" />}
                      {suggestion.type === 'cuisine' && <Search className="w-4 h-4 text-purple-500" />}
                      {suggestion.type === 'recent' && <Clock className="w-4 h-4 text-gray-400" />}
                      {suggestion.type === 'popular' && <TrendingUp className="w-4 h-4 text-orange-500" />}
                    </div>

                    {/* Image for restaurants */}
                    {'image' in suggestion && suggestion.image && (
                      <div className="relative w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
                        <OptimizedImage
                          src={suggestion.image}
                          alt={suggestion.title}
                          width={40}
                          height={40}
                          className="object-cover w-full h-full"
                        />
                      </div>
                    )}

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {suggestion.title}
                      </div>
                      {suggestion.subtitle && (
                        <div className="text-xs text-gray-500 truncate">
                          {suggestion.subtitle}
                        </div>
                      )}
                    </div>

                    {/* Rating for restaurants */}
                    {'rating' in suggestion && suggestion.rating && (
                      <div className="flex items-center gap-1 text-xs text-gray-600 flex-shrink-0">
                        <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                        {suggestion.rating.toFixed(1)}
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            )}

            {/* Show default suggestions when no query */}
            {!isLoading && !localQuery && (
              <div className="py-2">
                {recentSearches.length > 0 && (
                  <div>
                    <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Recent Searches
                    </div>
                    {recentSearches.slice(0, 5).map((search, index) => (
                      <div
                        key={search}
                        onClick={() => handleSearch(search)}
                        className={cn(
                          "px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors flex items-center gap-3",
                          selectedIndex === index && "bg-gray-50"
                        )}
                      >
                        <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span className="text-sm text-gray-900">{search}</span>
                      </div>
                    ))}
                  </div>
                )}

                {popularSearches.length > 0 && (
                  <div>
                    <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider border-t">
                      Popular Searches
                    </div>
                    {popularSearches.slice(0, 5).map((search, index) => (
                      <div
                        key={search}
                        onClick={() => handleSearch(search)}
                        className={cn(
                          "px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors flex items-center gap-3",
                          selectedIndex === recentSearches.length + index && "bg-gray-50"
                        )}
                      >
                        <TrendingUp className="w-4 h-4 text-orange-500 flex-shrink-0" />
                        <span className="text-sm text-gray-900">{search}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}