'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  Filter, 
  Grid3X3, 
  List, 
  Clock, 
  Star, 
  Heart,
  X
} from 'lucide-react'
import { useAppSelector, useAppDispatch } from '@/store'
import { 
  updateFilters, 
  clearFilters, 
  setRestaurants,
  setLoading 
} from '@/store/slices/restaurantSlice'
import { addToFavorites, removeFromFavorites } from '@/store/slices/userSlice'
import { api } from '@/lib/api'
import SearchBar from '@/components/ui/SearchBar'
import OptimizedImage from '@/components/ui/OptimizedImage'
import AdvancedFilters, { type AdvancedFiltersState } from '@/components/ui/AdvancedFilters'
import { cn } from '@/lib/utils'

interface SearchResultsContentProps {
  query: string
}

function SearchResultsContent({ query }: SearchResultsContentProps) {
  const dispatch = useAppDispatch()
  const { restaurants, filters, isLoading } = useAppSelector((state) => state.restaurant)
  const { favorites } = useAppSelector((state) => state.user)
  
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showFilters, setShowFilters] = useState(false)
  const [selectedFilters, setSelectedFilters] = useState(filters)
  
  // Advanced filters state
  const [advancedFilters, setAdvancedFilters] = useState<AdvancedFiltersState>({
    cuisine: [],
    priceRange: [],
    rating: 0,
    deliveryTime: 0,
    dietary: [],
    features: [],
    distance: 0,
    sortBy: 'popular',
    offers: []
  })



  const sortOptions = [
    { id: 'popular', label: 'Most Popular' },
    { id: 'rating', label: 'Highest Rated' },
    { id: 'deliveryTime', label: 'Fastest Delivery' },
    { id: 'priceAsc', label: 'Price: Low to High' },
    { id: 'priceDesc', label: 'Price: High to Low' }
  ]

  // Search restaurants based on query and filters
  useEffect(() => {
    const searchRestaurants = async () => {
      if (!query) return

      dispatch(setLoading(true))
      try {
        const results = await api.restaurants.search(query, {
          cuisineTypes: selectedFilters.cuisine.length ? selectedFilters.cuisine : undefined,
          priceRange: selectedFilters.priceRange.length ? selectedFilters.priceRange : undefined,
          rating: selectedFilters.rating || undefined
        })
        
        // Type adapter: API results to Redux store format
        const adaptedResults = results.map((r: Record<string, unknown>) => ({
          ...r,
          reviewCount: r.review_count,
          priceRange: r.price_range,
          cuisineType: (r.cuisine_types as string[])?.[0] || '',
          deliveryTime: r.delivery_time || '30-40 min',
          image: r.image_url || '/api/placeholder/400/300',
          deliveryFee: r.delivery_fee || 0,
          minimumOrder: r.minimum_order || 0,
          isOpen: r.is_available !== false,
          cuisineTypes: r.cuisine_types || []
        }))
        dispatch(setRestaurants(adaptedResults as unknown as Parameters<typeof setRestaurants>[0]))
      } catch (error) {
        console.error('Search error:', error)
        dispatch(setRestaurants([]))
      } finally {
        dispatch(setLoading(false))
      }
    }

    searchRestaurants()
  }, [query, selectedFilters, dispatch])


  // Apply advanced filters
  const applyAdvancedFilters = () => {
    // Convert advanced filters to redux filters format
    const reduxFilters = {
      cuisine: advancedFilters.cuisine,
      priceRange: advancedFilters.priceRange,
      rating: advancedFilters.rating,
      deliveryTime: advancedFilters.deliveryTime,
      features: advancedFilters.features,
      dietary: advancedFilters.dietary,
      sortBy: advancedFilters.sortBy as 'popular' | 'rating' | 'deliveryTime' | 'priceAsc' | 'priceDesc',
      searchQuery: query
    }
    setSelectedFilters(reduxFilters)
    dispatch(updateFilters(reduxFilters))
    setShowFilters(false)
  }

  // Clear all filters
  const clearAllFilters = () => {
    const clearedFilters = {
      cuisine: [],
      priceRange: [],
      rating: 0,
      deliveryTime: 0,
      features: [],
      dietary: [],
      sortBy: 'popular' as const,
      searchQuery: query
    }
    setSelectedFilters(clearedFilters)
    setAdvancedFilters({
      cuisine: [],
      priceRange: [],
      rating: 0,
      deliveryTime: 0,
      dietary: [],
      features: [],
      distance: 0,
      sortBy: 'popular',
      offers: []
    })
    dispatch(clearFilters())
  }

  // Toggle favorite
  const toggleFavorite = (restaurantId: string) => {
    if (favorites.includes(restaurantId)) {
      dispatch(removeFromFavorites(restaurantId))
    } else {
      dispatch(addToFavorites(restaurantId))
    }
  }

  // Active filters count
  const activeFiltersCount = 
    advancedFilters.cuisine.length + 
    advancedFilters.priceRange.length + 
    advancedFilters.dietary.length + 
    advancedFilters.features.length + 
    advancedFilters.offers.length +
    (advancedFilters.rating > 0 ? 1 : 0) +
    (advancedFilters.deliveryTime > 0 ? 1 : 0) +
    (advancedFilters.distance > 0 ? 1 : 0)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-20 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          {/* Search Bar */}
          <div className="mb-4">
            <SearchBar 
              placeholder="Search restaurants, dishes, cuisines..."
              className="max-w-2xl mx-auto"
            />
          </div>

          {/* Results Info & Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">
                {query ? `Results for "${query}"` : 'All Restaurants'}
              </h1>
              <span className="text-gray-500">
                {isLoading ? 'Searching...' : `${restaurants.length} restaurants found`}
              </span>
            </div>

            <div className="flex items-center space-x-3">
              {/* Sort Dropdown */}
              <select
                value={selectedFilters.sortBy}
                onChange={(e) => setSelectedFilters({
                  ...selectedFilters,
                  sortBy: e.target.value as 'popular' | 'rating' | 'deliveryTime' | 'priceAsc' | 'priceDesc'
                })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              >
                {sortOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>

              {/* View Mode Toggle */}
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={cn(
                    "p-2 rounded-md transition-colors",
                    viewMode === 'grid' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'
                  )}
                >
                  <Grid3X3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={cn(
                    "p-2 rounded-md transition-colors",
                    viewMode === 'list' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'
                  )}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>

              {/* Filter Toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center space-x-2 px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors"
              >
                <Filter className="w-4 h-4" />
                <span>Filters</span>
                {activeFiltersCount > 0 && (
                  <span className="bg-white text-brand-600 text-xs font-bold px-2 py-1 rounded-full">
                    {activeFiltersCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Active Filters */}
          {activeFiltersCount > 0 && (
            <div className="flex items-center space-x-2 mt-4">
              <span className="text-sm text-gray-600">Active filters:</span>
              <div className="flex flex-wrap gap-2">
                {/* Cuisine filters */}
                {advancedFilters.cuisine.map((cuisine) => (
                  <span
                    key={`cuisine-${cuisine}`}
                    className="inline-flex items-center px-3 py-1 bg-brand-100 text-brand-800 text-sm rounded-full"
                  >
                    {cuisine.charAt(0).toUpperCase() + cuisine.slice(1)}
                    <button
                      onClick={() => setAdvancedFilters({
                        ...advancedFilters,
                        cuisine: advancedFilters.cuisine.filter(c => c !== cuisine)
                      })}
                      className="ml-2 hover:text-brand-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                
                {/* Price range filters */}
                {advancedFilters.priceRange.map((price) => (
                  <span
                    key={`price-${price}`}
                    className="inline-flex items-center px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full"
                  >
                    {price}
                    <button
                      onClick={() => setAdvancedFilters({
                        ...advancedFilters,
                        priceRange: advancedFilters.priceRange.filter(p => p !== price)
                      })}
                      className="ml-2 hover:text-green-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                
                {/* Dietary filters */}
                {advancedFilters.dietary.map((diet) => (
                  <span
                    key={`diet-${diet}`}
                    className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                  >
                    {diet.charAt(0).toUpperCase() + diet.slice(1).replace('-', ' ')}
                    <button
                      onClick={() => setAdvancedFilters({
                        ...advancedFilters,
                        dietary: advancedFilters.dietary.filter(d => d !== diet)
                      })}
                      className="ml-2 hover:text-blue-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                
                {/* Rating filter */}
                {advancedFilters.rating > 0 && (
                  <span className="inline-flex items-center px-3 py-1 bg-yellow-100 text-yellow-800 text-sm rounded-full">
                    {advancedFilters.rating}+ Stars
                    <button
                      onClick={() => setAdvancedFilters({
                        ...advancedFilters,
                        rating: 0
                      })}
                      className="ml-2 hover:text-yellow-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                
                {/* Clear all button */}
                <button
                  onClick={clearAllFilters}
                  className="text-sm text-gray-500 hover:text-gray-700 underline"
                >
                  Clear all
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Advanced Filters */}
          <AdvancedFilters
            isOpen={showFilters}
            onClose={() => setShowFilters(false)}
            filters={advancedFilters}
            onFiltersChange={setAdvancedFilters}
            onApply={applyAdvancedFilters}
            onClear={clearAllFilters}
            restaurantCount={restaurants.length}
          />

          {/* Results */}
          <div className={cn("flex-1", showFilters ? "" : "")}>
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-white rounded-xl shadow-lg overflow-hidden animate-pulse">
                    <div className="h-48 bg-gray-300"></div>
                    <div className="p-4">
                      <div className="h-4 bg-gray-300 rounded mb-2"></div>
                      <div className="h-3 bg-gray-300 rounded w-3/4"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : restaurants.length > 0 ? (
              <div className={cn(
                "grid gap-6",
                viewMode === 'grid' 
                  ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" 
                  : "grid-cols-1"
              )}>
                {restaurants.map((restaurant) => (
                  <RestaurantCard
                    key={restaurant.id}
                    restaurant={restaurant as unknown as Restaurant}
                    isFavorite={favorites.includes(restaurant.id)}
                    onToggleFavorite={() => toggleFavorite(restaurant.id)}
                    viewMode={viewMode}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                  <OptimizedImage 
                    src="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=200&h=200&fit=crop&auto=format"
                    alt="Search for restaurants"
                    width={96}
                    height={96}
                    className="w-full h-full"
                    objectFit="cover"
                    rounded="full"
                    overlay={true}
                    overlayClass="bg-gray-500/30"
                  />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No restaurants found
                </h3>
                <p className="text-gray-600 mb-4">
                  Try adjusting your search or filters to find more restaurants.
                </p>
                <button
                  onClick={clearAllFilters}
                  className="bg-brand-500 text-white px-6 py-2 rounded-lg hover:bg-brand-600 transition-colors"
                >
                  Clear filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Restaurant Card Component
interface Restaurant {
  id: string
  name: string
  description: string
  image_url?: string
  image?: string
  cover_image_url?: string
  rating: number
  review_count: number
  delivery_time: string
  delivery_fee: number
  cuisine_types: string[]
  price_range: string
  address?: string
  phone?: string
  is_available?: boolean
  opening_hours?: Record<string, string>
  minimum_order?: number
  features?: string[]
  dietary_options?: string[]
  delivery_radius?: number
  estimated_prep_time?: string
  is_premium?: boolean
  promotions?: Record<string, unknown>
}

interface RestaurantCardProps {
  restaurant: Restaurant
  isFavorite: boolean
  onToggleFavorite: () => void
  viewMode: 'grid' | 'list'
}

function RestaurantCard({ restaurant, isFavorite, onToggleFavorite, viewMode }: RestaurantCardProps) {
  const formatPrice = (price: number) => `₦${price.toLocaleString()}`
  
  if (viewMode === 'list') {
    return (
      <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
        <div className="flex">
          <div className="w-48 h-32">
            <OptimizedImage 
              src={restaurant.image_url || restaurant.image || '/api/placeholder/400/300'} 
              alt={restaurant.name}
              width={192}
              height={128}
              className="w-full h-full"
              objectFit="cover"
            />
          </div>
          <div className="flex-1 p-4 flex justify-between">
            <div>
              <h3 className="font-semibold text-lg mb-1">{restaurant.name}</h3>
              <p className="text-gray-600 text-sm mb-2 line-clamp-2">{restaurant.description}</p>
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <div className="flex items-center space-x-1">
                  <Star className="w-4 h-4 text-yellow-400 fill-current" />
                  <span>{restaurant.rating}</span>
                  <span>({restaurant.review_count})</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Clock className="w-4 h-4" />
                  <span>{restaurant.delivery_time}</span>
                </div>
                <span>Delivery: {formatPrice(restaurant.delivery_fee)}</span>
              </div>
            </div>
            <div className="flex flex-col items-end justify-between">
              <button
                onClick={onToggleFavorite}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <Heart 
                  className={cn(
                    "w-5 h-5",
                    isFavorite ? "text-red-500 fill-current" : "text-gray-400"
                  )} 
                />
              </button>
              <div className="text-right">
                <div className="text-sm text-gray-500">
                  {restaurant.cuisine_types.join(', ')}
                </div>
                <div className="font-semibold">
                  {restaurant.price_range}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <motion.div
      layout
      className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 group"
    >
      <div className="relative">
        <OptimizedImage 
          src={restaurant.image_url || restaurant.image || '/api/placeholder/400/300'} 
          alt={restaurant.name}
          width={400}
          height={192}
          className="w-full h-48 group-hover:scale-105 transition-transform duration-300"
          objectFit="cover"
        />
        <button
          onClick={onToggleFavorite}
          className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-colors"
        >
          <Heart 
            className={cn(
              "w-5 h-5",
              isFavorite ? "text-red-500 fill-current" : "text-gray-600"
            )} 
          />
        </button>
      </div>
      
      <div className="p-4">
        <h3 className="font-semibold text-lg mb-1 line-clamp-1">{restaurant.name}</h3>
        <p className="text-gray-600 text-sm mb-3 line-clamp-2">{restaurant.description}</p>
        
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-1">
            <Star className="w-4 h-4 text-yellow-400 fill-current" />
            <span className="font-medium">{restaurant.rating}</span>
            <span className="text-gray-500">({restaurant.review_count})</span>
          </div>
          <div className="flex items-center space-x-1 text-gray-500">
            <Clock className="w-4 h-4" />
            <span>{restaurant.delivery_time}</span>
          </div>
        </div>
        
        <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
          <div className="text-sm">
            <span className="text-gray-500">Delivery: </span>
            <span className="font-medium">{formatPrice(restaurant.delivery_fee)}</span>
          </div>
          <div className="text-sm font-medium text-brand-600">
            {restaurant.price_range}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default function SearchResultsPage() {
  const searchParams = useSearchParams()
  const query = searchParams.get('q') || ''

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SearchResultsContent query={query} />
    </Suspense>
  )
}