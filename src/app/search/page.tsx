'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Navigation from '@/components/layout/Navigation'
import Footer from '@/components/layout/Footer'
import SearchBar from '@/components/ui/SearchBar'
import AdvancedFilters, { AdvancedFiltersState } from '@/components/ui/AdvancedFilters'
import { searchAPI, SearchResult, SearchFilters } from '@/lib/search'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Search, 
  Filter, 
  X, 
  Star, 
  Clock, 
  TrendingUp,
  Loader2,
  Package,
  ChevronRight
} from 'lucide-react'
import OptimizedImage from '@/components/ui/OptimizedImage'
import { cn } from '@/lib/utils'

function SearchResultsContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const query = searchParams.get('q') || ''
  
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState<SearchFilters>({})
  const [advancedFilters, setAdvancedFilters] = useState<AdvancedFiltersState>({
    cuisine: [],
    priceRange: [],
    rating: 0,
    deliveryTime: 0,
    dietary: [],
    features: [],
    distance: 0,
    sortBy: '',
    offers: []
  })
  const [showFilters, setShowFilters] = useState(false)
  const [popularSearches, setPopularSearches] = useState<string[]>([])

  // Perform search when query or filters change
  useEffect(() => {
    const performSearch = async () => {
      if (!query && Object.keys(filters).length === 0) {
        setResults([])
        return
      }

      setLoading(true)
      try {
        const searchResults = query
          ? await searchAPI.fullTextSearch(query, filters)
          : await searchAPI.searchByFilters(filters)
        
        setResults(searchResults)
        
        // Save to history if there's a query
        if (query) {
          const { searchStorage } = await import('@/lib/search')
          searchStorage.addToHistory(query)
        }
      } catch (error) {
        console.error('Search error:', error)
        setResults([])
      } finally {
        setLoading(false)
      }
    }

    performSearch()
  }, [query, filters])

  // Load popular searches
  useEffect(() => {
    searchAPI.getPopularSearches().then(setPopularSearches)
  }, [])

  const handleResultClick = (result: SearchResult) => {
    if (result.type === 'restaurant') {
      router.push(`/restaurant/${result.id}`)
    } else if (result.type === 'cuisine') {
      router.push(`/search?q=${encodeURIComponent(result.title)}`)
    }
  }

  const handlePopularSearch = (search: string) => {
    router.push(`/search?q=${encodeURIComponent(search)}`)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      {/* Search Header */}
      <div className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <SearchBar 
                placeholder="Search for restaurants, dishes, or cuisines..."
                showSuggestions={true}
                onSearch={(q) => router.push(`/search?q=${encodeURIComponent(q)}`)}
              />
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                "px-4 py-3 rounded-xl font-medium flex items-center gap-2 transition-all",
                showFilters
                  ? "bg-orange-500 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              )}
            >
              <Filter className="w-5 h-5" />
              <span className="hidden sm:inline">Filters</span>
              {Object.keys(filters).length > 0 && (
                <span className="ml-1 px-2 py-0.5 bg-white text-orange-500 rounded-full text-xs font-bold">
                  {Object.keys(filters).length}
                </span>
              )}
            </motion.button>
          </div>
        </div>
      </div>

      {/* Filters Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-white border-b overflow-hidden"
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              <AdvancedFilters 
                isOpen={showFilters}
                filters={advancedFilters}
                onFiltersChange={setAdvancedFilters}
                onApply={() => {
                  // Convert AdvancedFiltersState to SearchFilters
                  const searchFilters: SearchFilters = {
                    priceRange: advancedFilters.priceRange.length === 2 
                      ? [parseInt(advancedFilters.priceRange[0]), parseInt(advancedFilters.priceRange[1])] as [number, number]
                      : undefined,
                    rating: advancedFilters.rating || undefined,
                    deliveryTime: advancedFilters.deliveryTime || undefined,
                    cuisineTypes: advancedFilters.cuisine.length > 0 ? advancedFilters.cuisine : undefined,
                    dietary: advancedFilters.dietary.length > 0 ? advancedFilters.dietary : undefined,
                    isOpen: true
                  }
                  setFilters(searchFilters)
                  setShowFilters(false)
                }}
                onClear={() => {
                  setAdvancedFilters({
                    cuisine: [],
                    priceRange: [],
                    rating: 0,
                    deliveryTime: 0,
                    dietary: [],
                    features: [],
                    distance: 0,
                    sortBy: '',
                    offers: []
                  })
                  setFilters({})
                }}
                onClose={() => setShowFilters(false)}
                restaurantCount={results.length}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Status */}
        {query && (
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Search results for &ldquo;{query}&rdquo;
              </h1>
              <p className="text-gray-600 mt-1">
                {loading ? 'Searching...' : `${results.length} results found`}
              </p>
            </div>
            {query && (
              <button
                onClick={() => router.push('/search')}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <Loader2 className="w-10 h-10 text-orange-500 animate-spin mx-auto" />
              <p className="text-gray-600 mt-4">Searching...</p>
            </div>
          </div>
        )}

        {/* Results Grid */}
        {!loading && results.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence mode="popLayout">
              {results.map((result, index) => (
                <motion.div
                  key={result.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ y: -5 }}
                  onClick={() => handleResultClick(result)}
                  className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all cursor-pointer group"
                >
                  {/* Image */}
                  {result.image && (
                    <div className="relative h-48 overflow-hidden">
                      <OptimizedImage
                        src={result.image}
                        alt={result.title}
                        width={400}
                        height={300}
                        className="object-cover group-hover:scale-110 transition-transform duration-300 w-full h-full"
                      />
                      {result.type === 'restaurant' && result.deliveryTime && (
                        <div className="absolute top-3 left-3 px-3 py-1 bg-black/70 backdrop-blur-sm text-white rounded-full text-sm font-medium flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {result.deliveryTime}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="p-5">
                    {/* Type Badge */}
                    <div className="flex items-center justify-between mb-2">
                      <span className={cn(
                        "px-2 py-1 rounded-full text-xs font-medium",
                        result.type === 'restaurant' && "bg-green-100 text-green-700",
                        result.type === 'dish' && "bg-blue-100 text-blue-700",
                        result.type === 'cuisine' && "bg-purple-100 text-purple-700"
                      )}>
                        {result.type.charAt(0).toUpperCase() + result.type.slice(1)}
                      </span>
                      {result.price && (
                        <span className="text-sm font-medium text-gray-900">{result.price}</span>
                      )}
                    </div>

                    {/* Title & Subtitle */}
                    <h3 className="font-bold text-lg text-gray-900 mb-1 line-clamp-1">
                      {result.title}
                    </h3>
                    {result.subtitle && (
                      <p className="text-sm text-gray-600 line-clamp-1">{result.subtitle}</p>
                    )}

                    {/* Rating */}
                    {result.rating && (
                      <div className="flex items-center gap-2 mt-3">
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-500 fill-current" />
                          <span className="text-sm font-medium text-gray-900">
                            {result.rating.toFixed(1)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* No Results State */}
        {!loading && query && results.length === 0 && (
          <div className="text-center py-20">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              No results found
            </h2>
            <p className="text-gray-600 mb-8">
              Try adjusting your search or filters to find what you&apos;re looking for
            </p>

            {/* Popular Searches */}
            {popularSearches.length > 0 && (
              <div>
                <p className="text-sm text-gray-500 mb-4">Popular searches:</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {popularSearches.map((search) => (
                    <motion.button
                      key={search}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handlePopularSearch(search)}
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-full text-sm font-medium text-gray-700 transition-colors"
                    >
                      {search}
                    </motion.button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Empty State (no query) */}
        {!loading && !query && results.length === 0 && (
          <div className="text-center py-20">
            <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Start searching
            </h2>
            <p className="text-gray-600 mb-8">
              Find your favorite restaurants and dishes
            </p>

            {/* Trending Searches */}
            {popularSearches.length > 0 && (
              <div>
                <div className="flex items-center justify-center gap-2 text-orange-500 mb-4">
                  <TrendingUp className="w-5 h-5" />
                  <span className="font-semibold">Trending Now</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-w-2xl mx-auto">
                  {popularSearches.map((search) => (
                    <motion.button
                      key={search}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handlePopularSearch(search)}
                      className="px-4 py-3 bg-white border border-gray-200 hover:border-orange-500 hover:text-orange-500 rounded-xl text-sm font-medium text-gray-700 transition-all group"
                    >
                      <span className="flex items-center justify-between">
                        {search}
                        <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </span>
                    </motion.button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <Footer />
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
      </div>
    }>
      <SearchResultsContent />
    </Suspense>
  )
}