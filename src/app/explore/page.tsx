'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Navigation from '@/components/layout/Navigation'
import Footer from '@/components/layout/Footer'
import OptimizedImage from '@/components/ui/OptimizedImage'
import LocationGuard from '@/components/guards/LocationGuard'
import GoogleMap from '@/components/ui/GoogleMap'
import { useLocation } from '@/contexts/LocationContext'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Search,
  Clock,
  Star,
  Filter,
  X,
  Heart,
  Zap,
  Award,
  Percent,
  ChevronRight,
  Sparkles,
  MapPin,
  Grid3X3,
  List,
  Map
} from 'lucide-react'
import { searchAPI, SearchResult } from '@/lib/search'
import { getRestaurantsNearby } from '@/lib/restaurantService'
import { calculateDistance, formatDistance } from '@/lib/googleMaps'
import { RESTAURANT_CATEGORIES } from '@/constants/restaurants'
import type { Database } from '@/lib/database.types'

type Restaurant = Database['public']['Tables']['restaurants']['Row']

// Real category data from database
const getCategoriesWithCounts = (restaurants: Restaurant[]) => {
  const categoryMappings: { [key: string]: { description: string; gradient: string; badge: string; image: string } } = {
    'Nigerian': { description: 'Authentic Naija flavors', gradient: 'from-emerald-500 to-green-600', badge: '🇳🇬', image: 'https://images.unsplash.com/photo-1596797038530-2c107229654b?w=800&h=600&fit=crop&auto=format' },
    'Chinese': { description: 'Eastern delights', gradient: 'from-purple-500 to-pink-600', badge: '🥢', image: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&h=600&fit=crop&auto=format' },
    'Italian': { description: 'Italian specialties', gradient: 'from-blue-500 to-indigo-600', badge: '🍝', image: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=800&h=600&fit=crop&auto=format' },
    'Japanese': { description: 'Fresh sushi & more', gradient: 'from-indigo-500 to-purple-600', badge: '🍣', image: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=800&h=600&fit=crop&auto=format' },
    'American': { description: 'Classic American', gradient: 'from-red-500 to-orange-600', badge: '🍔', image: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=800&h=600&fit=crop&auto=format' },
    'Healthy': { description: 'Nutritious choices', gradient: 'from-green-400 to-emerald-500', badge: '🥗', image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&h=600&fit=crop&auto=format' },
    'Fast Food': { description: 'Quick & delicious', gradient: 'from-orange-500 to-red-600', badge: '🍟', image: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=800&h=600&fit=crop&auto=format' },
    'African': { description: 'Continental African', gradient: 'from-yellow-500 to-orange-600', badge: '🍖', image: 'https://images.unsplash.com/photo-1596797038530-2c107229654b?w=800&h=600&fit=crop&auto=format' }
  }
  
  const categoryCounts: { [key: string]: number } = {}
  
  restaurants.forEach(restaurant => {
    if (restaurant.cuisine_types && Array.isArray(restaurant.cuisine_types)) {
      restaurant.cuisine_types.forEach(type => {
        categoryCounts[type] = (categoryCounts[type] || 0) + 1
      })
    }
  })
  
  return Object.keys(categoryCounts)
    .filter(categoryName => categoryMappings[categoryName])
    .map(categoryName => ({
      id: categoryName.toLowerCase().replace(/\s+/g, '-'),
      name: categoryName,
      description: categoryMappings[categoryName].description,
      image: categoryMappings[categoryName].image,
      count: categoryCounts[categoryName],
      gradient: categoryMappings[categoryName].gradient,
      badge: categoryMappings[categoryName].badge
    }))
    .sort((a, b) => b.count - a.count) // Sort by count descending
    .slice(0, 6) // Show top 6 categories
}

interface FilterState {
  priceRange: string[]
  deliveryTime: string
  rating: number
  features: string[]
  sortBy: string
}

const initialFilters: FilterState = {
  priceRange: [],
  deliveryTime: '',
  rating: 0,
  features: [],
  sortBy: 'relevance'
}

interface RestaurantWithDistance extends Restaurant {
  distance?: number
  location: {
    lat: number
    lng: number
  }
}

export default function ConsolidatedExplorePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { location: userLocation, hasLocation } = useLocation()
  
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '')
  const [restaurants, setRestaurants] = useState<RestaurantWithDistance[]>([])
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<FilterState>(initialFilters)
  const [showFilters, setShowFilters] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [recentOrders, setRecentOrders] = useState<RestaurantWithDistance[]>([])
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'map'>('grid')
  const [selectedRestaurant, setSelectedRestaurant] = useState<RestaurantWithDistance | null>(null)
  const [categories, setCategories] = useState<any[]>([])

  // Discovery rails data
  const discoveryRails = [
    {
      id: 'order-again',
      title: 'Order Again',
      subtitle: 'Your recent favorites',
      icon: <Clock className="w-5 h-5" />,
      data: recentOrders
    },
    {
      id: 'fastest',
      title: 'Fastest Delivery',
      subtitle: '≤ 20 minutes',
      icon: <Zap className="w-5 h-5" />,
      data: restaurants.filter(r => {
        const timeStr = r.delivery_time || '30 min'
        const timeNum = parseInt(timeStr.split('-')[0]) || 30
        return timeNum <= 20
      })
    },
    {
      id: 'top-rated',
      title: 'Top Rated',
      subtitle: '4.5+ stars nearby',
      icon: <Award className="w-5 h-5" />,
      data: restaurants.filter(r => r.rating >= 4.5)
    },
    {
      id: 'offers',
      title: 'Special Offers',
      subtitle: 'Great deals today', 
      icon: <Percent className="w-5 h-5" />,
      data: restaurants.filter(r => r.price_range === '$')
    }
  ]

  // Load restaurants based on location
  const loadRestaurants = useCallback(async () => {
    if (!userLocation) return
    
    setIsLoading(true)
    setError(null)
    
    try {
      const { data, error: fetchError } = await getRestaurantsNearby(
        userLocation.coordinates.lat,
        userLocation.coordinates.lng,
        10
      )
      
      if (fetchError) {
        setError('Failed to load nearby restaurants')
        console.error('Error fetching nearby restaurants:', fetchError)
        return
      }

      // Use real coordinates from database and calculate distances
      const restaurantsWithLocation: RestaurantWithDistance[] = (data || []).map((restaurant) => {
        // Use real coordinates from database location.coordinates structure
        const coordinates = restaurant.location && typeof restaurant.location === 'object' && 'coordinates' in restaurant.location ? {
          lat: (restaurant.location as any).coordinates.lat,
          lng: (restaurant.location as any).coordinates.lng
        } : {
          lat: 6.5244, // Default Lagos coordinates
          lng: 3.3792
        }
        
        const distance = calculateDistance(userLocation.coordinates, coordinates)
        
        return {
          ...restaurant,
          location: coordinates,
          distance
        }
      }).sort((a, b) => (a.distance || 0) - (b.distance || 0))

      setRestaurants(restaurantsWithLocation)
      // Set some as recent orders for demo
      setRecentOrders(restaurantsWithLocation.slice(0, 3))
      // Calculate real categories from loaded restaurants
      setCategories(getCategoriesWithCounts(restaurantsWithLocation))
      
    } catch (err) {
      setError('Failed to load nearby restaurants')
      console.error('Error loading restaurants:', err)
    } finally {
      setIsLoading(false)
    }
  }, [userLocation])

  // Search functionality
  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([])
      return
    }

    setIsLoading(true)
    try {
      const results = await searchAPI.fullTextSearch(
        query,
        {
          rating: filters.rating || undefined,
          deliveryTime: filters.deliveryTime ? parseInt(filters.deliveryTime) : undefined,
          cuisineTypes: filters.priceRange.length > 0 ? filters.priceRange : undefined
        },
        20,
        userLocation?.coordinates
      )
      setSearchResults(results)
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setIsLoading(false)
    }
  }, [userLocation, filters])

  const handleRestaurantClick = (restaurant: RestaurantWithDistance) => {
    setSelectedRestaurant(restaurant)
    if (viewMode === 'map') {
      // Center map on selected restaurant
    }
  }

  const getCuisineDisplay = (restaurant: Restaurant) => {
    if (Array.isArray(restaurant.cuisine_types)) {
      return restaurant.cuisine_types.slice(0, 2).join(', ')
    }
    return 'Various'
  }

  useEffect(() => {
    loadRestaurants()
  }, [loadRestaurants])

  useEffect(() => {
    if (hasLocation) {
      loadRestaurants()
    }
  }, [loadRestaurants, hasLocation])

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery) {
        handleSearch(searchQuery)
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchQuery, handleSearch])

  const PremiumRestaurantCard = ({ restaurant }: { restaurant: Restaurant }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, scale: 1.02 }}
      className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer group"
      onClick={() => {
        if (hasLocation) {
          router.push(`/restaurant/${restaurant.id}`)
        }
      }}
    >
      <div className="relative h-48 overflow-hidden">
        <OptimizedImage
          src={restaurant.cover_image_url || restaurant.image_url || '/images/restaurants/default.jpg'}
          alt={restaurant.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        
        {/* Delivery time badge */}
        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {restaurant.delivery_time || '30 min'}
        </div>
        
        {/* Special badges */}
        {restaurant.is_featured && (
          <div className="absolute top-3 left-3 bg-gradient-to-r from-orange-500 to-red-500 text-white px-2 py-1 rounded-full text-xs font-medium">
            Featured
          </div>
        )}
        
        {restaurant.price_range === '$' && (
          <div className="absolute bottom-3 left-3 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium">
            Special Offer
          </div>
        )}
      </div>
      
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold text-lg text-gray-900 group-hover:text-orange-600 transition-colors">
            {restaurant.name}
          </h3>
          <Heart className="w-5 h-5 text-gray-300 hover:text-red-500 transition-colors" />
        </div>
        
        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
          {restaurant.description || getCuisineDisplay(restaurant)}
        </p>
        
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span className="font-medium">{restaurant.rating?.toFixed(1) || '4.5'}</span>
            </div>
            
            <div className="flex items-center gap-1 text-gray-600">
              <Clock className="w-3 h-3" />
              <span>{restaurant.delivery_time || '30 min'}</span>
            </div>
            
            {restaurant.distance && (
              <div className="flex items-center gap-1 text-gray-600">
                <MapPin className="w-3 h-3" />
                <span>{formatDistance(restaurant.distance)}</span>
              </div>
            )}
          </div>
          
          <div className="text-orange-600 font-medium">
            {restaurant.price_range || '$$'}
          </div>
        </div>
      </div>
    </motion.div>
  )

  const CategoryCard = ({ category }: { category: typeof categories[0] }) => (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.98 }}
      className="relative group cursor-pointer overflow-hidden rounded-2xl h-32"
      onClick={() => setSelectedCategory(category.id)}
    >
      <div className={`absolute inset-0 bg-gradient-to-r ${category.gradient} opacity-90`} />
      <div className="absolute inset-0 p-4 flex flex-col justify-between text-white">
        <div className="flex items-center justify-between">
          <span className="text-2xl">{category.badge}</span>
          <span className="text-sm font-medium bg-white/20 px-2 py-1 rounded-full">
            {category.count}+
          </span>
        </div>
        <div>
          <h3 className="font-bold text-lg">{category.name}</h3>
          <p className="text-sm opacity-90">{category.description}</p>
        </div>
      </div>
    </motion.div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      {/* Premium Hero Section */}
      <section className="pt-20 pb-8 bg-gradient-to-br from-orange-50 via-white to-red-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-center gap-2 mb-4"
            >
              <Sparkles className="w-6 h-6 text-orange-500" />
              <span className="text-orange-600 font-medium">Discover Lagos&apos;s Finest</span>
            </motion.div>
            
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-5xl font-bold text-gray-900 mb-4"
            >
              {searchQuery ? 'Search Results' : hasLocation ? 'Restaurants Near You' : 'Explore Restaurants'}
              <span className="bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent"> & More</span>
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xl text-gray-600 max-w-2xl mx-auto"
            >
              {hasLocation 
                ? `Find extraordinary dining experiences in ${userLocation?.city || 'your area'} with real-time delivery tracking and exclusive offers.`
                : 'Set your location to discover amazing restaurants nearby with accurate delivery times.'}
            </motion.p>
          </div>

          {/* Premium Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="max-w-2xl mx-auto"
          >
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search restaurants, cuisines, or dishes..."
                className="w-full pl-12 pr-12 py-4 border-0 rounded-2xl text-lg bg-white shadow-lg focus:shadow-xl focus:ring-2 focus:ring-orange-500 transition-all duration-200"
              />
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center"
              >
                <Filter className="h-5 w-5 text-gray-400 hover:text-orange-500 transition-colors" />
              </button>
            </div>
          </motion.div>

          {/* Location Status */}
          {!hasLocation && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mt-6 flex justify-center"
            >
              <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 max-w-md">
                <p className="text-orange-800 text-sm font-medium mb-2">📍 Set your location to get started</p>
                <p className="text-orange-700 text-sm">Click the location icon in the header to set your delivery address.</p>
              </div>
            </motion.div>
          )}
          
          {hasLocation && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mt-6 flex justify-center"
            >
              <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-2 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-green-600" />
                <span className="text-green-800 text-sm font-medium">
                  Delivering to {userLocation?.city || userLocation?.address?.split(',')[0]}
                </span>
              </div>
            </motion.div>
          )}
        </div>
      </section>

      {/* Category Grid - Only show when no search query and user has location */}
      {!searchQuery && hasLocation && (
        <section className="py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-gray-900">Browse Categories</h2>
              <button className="flex items-center gap-2 text-orange-600 hover:text-orange-700 font-medium">
                View All <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {categories.map((category, index) => (
                <motion.div
                  key={category.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <CategoryCard category={category} />
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Main Content Area */}
      {hasLocation && (
        <section className="py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* View Mode Controls */}
            {(restaurants.length > 0 || searchResults.length > 0) && (
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {searchQuery ? `Search Results (${searchResults.length})` : `${restaurants.length} restaurants found`}
                  </h2>
                  {!searchQuery && userLocation && (
                    <p className="text-gray-600">
                      Near {userLocation.city || userLocation.address}
                    </p>
                  )}
                </div>
                
                <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-md transition-colors ${
                      viewMode === 'grid' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-md transition-colors ${
                      viewMode === 'list' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <List className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('map')}
                    className={`p-2 rounded-md transition-colors ${
                      viewMode === 'map' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Map className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Loading State */}
            {isLoading && (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading restaurants...</p>
                </div>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-red-600 text-2xl">⚠️</span>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Unable to load restaurants</h3>
                <p className="text-gray-600 mb-4">{error}</p>
                <button 
                  onClick={() => {
                    setError(null)
                    loadRestaurants()
                  }}
                  className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
                >
                  Try Again
                </button>
              </div>
            )}

            {/* Map View */}
            {viewMode === 'map' && restaurants.length > 0 && !isLoading && (
              <div className="space-y-6">
                <GoogleMap
                  className="w-full"
                  height="h-96"
                  restaurants={restaurants.map(r => ({
                    id: r.id,
                    name: r.name,
                    image_url: r.cover_image_url || r.image_url || undefined,
                    rating: r.rating,
                    location: r.location
                  }))}
                  center={userLocation?.coordinates}
                  onRestaurantClick={(restaurant) => {
                    const fullRestaurant = restaurants.find(r => r.id === restaurant.id)
                    if (fullRestaurant) handleRestaurantClick(fullRestaurant)
                  }}
                />

                {/* Selected Restaurant Details */}
                {selectedRestaurant && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-lg shadow-lg p-6"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                        <OptimizedImage
                          src={selectedRestaurant.cover_image_url || selectedRestaurant.image_url || '/images/restaurants/default.jpg'}
                          alt={selectedRestaurant.name}
                          width={80}
                          height={80}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-900 mb-2">{selectedRestaurant.name}</h3>
                        <p className="text-gray-600 mb-2">{getCuisineDisplay(selectedRestaurant)}</p>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-yellow-500 fill-current" />
                            <span>{selectedRestaurant.rating?.toFixed(1) || '4.5'}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span>{selectedRestaurant.delivery_time || '30 min'}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            <span>{formatDistance(selectedRestaurant.distance || 0)}</span>
                          </div>
                        </div>

                        <LocationGuard>
                          <button
                            onClick={() => router.push(`/restaurant/${selectedRestaurant.id}`)}
                            className="bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600 transition-colors"
                          >
                            View Menu
                          </button>
                        </LocationGuard>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            )}

            {/* Grid/List View */}
            {(viewMode === 'grid' || viewMode === 'list') && !isLoading && (
              <div className="space-y-12">
                {/* Search Results */}
                {searchQuery && searchResults.length > 0 && (
                  <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6' : 'space-y-4'}>
                    {searchResults.map((result, index) => (
                      <motion.div
                        key={`search-${result.id}-${index}`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer overflow-hidden"
                        onClick={() => {
                          if (result.type === 'restaurant') {
                            router.push(`/restaurant/${result.id}`)
                          }
                        }}
                      >
                        {result.image && (
                          <div className="h-32 overflow-hidden">
                            <OptimizedImage
                              src={result.image}
                              alt={result.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          </div>
                        )}
                        <div className="p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              result.type === 'restaurant' ? 'bg-blue-100 text-blue-700' :
                              result.type === 'dish' ? 'bg-green-100 text-green-700' :
                              'bg-purple-100 text-purple-700'
                            }`}>
                              {result.type}
                            </span>
                            {result.rating && (
                              <div className="flex items-center gap-1">
                                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                <span className="text-xs text-gray-600">{result.rating.toFixed(1)}</span>
                              </div>
                            )}
                          </div>
                          <h3 className="font-semibold text-gray-900 mb-1">{result.title}</h3>
                          <p className="text-gray-600 text-sm mb-2">{result.subtitle}</p>
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            {result.price && <span>{result.price}</span>}
                            {result.deliveryTime && <span>{result.deliveryTime}</span>}
                            {result.distance && <span>{result.distance.toFixed(1)}km away</span>}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}

                {/* Discovery Rails */}
                {!searchQuery && discoveryRails.map((rail) => (
                  rail.data.length > 0 && (
                    <div key={rail.id}>
                      <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-orange-100 rounded-xl text-orange-600">
                          {rail.icon}
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">{rail.title}</h3>
                          <p className="text-gray-600">{rail.subtitle}</p>
                        </div>
                      </div>
                      
                      <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6' : 'space-y-4'}>
                        {rail.data.slice(0, 8).map((restaurant, index) => (
                          <motion.div
                            key={`${rail.id}-${restaurant.id || index}`}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                          >
                            <LocationGuard>
                              <PremiumRestaurantCard restaurant={restaurant} />
                            </LocationGuard>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )
                ))}

                {/* No Results */}
                {!isLoading && !searchQuery && restaurants.length === 0 && (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <MapPin className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No restaurants found nearby</h3>
                    <p className="text-gray-600">Try expanding your search area or check back later.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Advanced Filters Modal */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowFilters(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-6 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">Filters</h3>
                <button
                  onClick={() => setShowFilters(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              {/* Filter content would go here */}
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Price Range</label>
                  <div className="grid grid-cols-4 gap-2">
                    {['$', '$$', '$$$', '$$$$'].map((price) => (
                      <button
                        key={price}
                        className="p-2 text-center border rounded-lg hover:border-orange-500 transition-colors"
                      >
                        {price}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="pt-4">
                  <button
                    onClick={() => setShowFilters(false)}
                    className="w-full bg-orange-600 text-white py-3 rounded-xl font-medium hover:bg-orange-700 transition-colors"
                  >
                    Apply Filters
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  )
}