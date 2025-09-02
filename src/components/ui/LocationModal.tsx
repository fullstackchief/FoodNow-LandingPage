'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  MapPin, 
  X, 
  Search, 
  Navigation,
  Clock,
  ChevronRight,
  AlertCircle
} from 'lucide-react'
import { useLocation } from '@/contexts/LocationContext'
import { initializePlacesAutocomplete } from '@/lib/googleMaps'
import { locationService } from '@/lib/locationService'

interface LocationModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  subtitle?: string
  showRecentLocations?: boolean
}

const LocationModal = ({
  isOpen,
  onClose,
  title = "Set Your Location",
  subtitle = "We'll use this to show you nearby restaurants and accurate delivery times.",
  showRecentLocations = true
}: LocationModalProps) => {
  const {
    getCurrentLocation,
    setLocation,
    isLoading,
    error,
    requestLocationPermission
  } = useLocation()
  
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showPermissionPriming, setShowPermissionPriming] = useState(false)
  const [autocompleteInitialized, setAutocompleteInitialized] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const autocompleteRef = useRef<any>(null)

  // Mock recent locations - in real app, get from storage
  const recentLocations = [
    {
      address: "Victoria Island, Lagos",
      subtext: "Last used today",
      coordinates: { lat: 6.4281, lng: 3.4219 }
    },
    {
      address: "Ikeja, Lagos",
      subtext: "Used 2 days ago",
      coordinates: { lat: 6.6018, lng: 3.3515 }
    },
    {
      address: "Lekki, Lagos",
      subtext: "Used last week",
      coordinates: { lat: 6.4474, lng: 3.5562 }
    }
  ]

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      // Focus search input when modal opens
      setTimeout(() => {
        searchInputRef.current?.focus()
        initializeGoogleAutocomplete()
      }, 200)
    } else if (!isOpen) {
      // Clean up when modal closes
      if (autocompleteRef.current && typeof google !== 'undefined' && google.maps) {
        // Remove all listeners from the autocomplete instance
        google.maps.event.clearInstanceListeners(autocompleteRef.current)
        autocompleteRef.current = null
      }
      // Reset the initialization flag so it reinitializes next time
      setAutocompleteInitialized(false)
      // Clear search query
      setSearchQuery('')
      setSearchResults([])
    }
  }, [isOpen])
  
  const initializeGoogleAutocomplete = async () => {
    if (!searchInputRef.current) return
    
    // Clean up any existing autocomplete instance first
    if (autocompleteRef.current && typeof google !== 'undefined' && google.maps) {
      google.maps.event.clearInstanceListeners(autocompleteRef.current)
      autocompleteRef.current = null
    }
    
    try {
      console.log('🚀 Initializing Google Places Autocomplete with JavaScript SDK...')
      
      const autocomplete = await initializePlacesAutocomplete(
        searchInputRef.current,
        {
          componentRestrictions: { country: 'ng' }, // Nigeria only
          types: ['geocode'], // addresses and places
        }
      )
      
      autocompleteRef.current = autocomplete
      
      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace()
        console.log('📍 Place selected from Google autocomplete:', place)
        
        if (place.geometry && place.formatted_address) {
          const locationData = {
            coordinates: {
              lat: place.geometry.location.lat(),
              lng: place.geometry.location.lng()
            },
            address: place.formatted_address,
            city: extractCityFromPlace(place),
            state: extractStateFromPlace(place),
            country: 'Nigeria'
          }
          
          console.log('✅ Google autocomplete location selected:', locationData)
          handleLocationSelect(locationData)
        }
      })
      
      setAutocompleteInitialized(true)
      console.log('✅ Google Places Autocomplete initialized successfully')
      
    } catch (error) {
      console.error('❌ Failed to initialize Google Places Autocomplete:', error)
      console.log('🔄 Falling back to manual search with Geocoding API')
      // Continue with manual search as fallback
      setAutocompleteInitialized(false)
    }
  }
  
  const extractCityFromPlace = (place: any): string | undefined => {
    const components = place.address_components || []
    
    for (const component of components) {
      if (component.types.includes('locality')) {
        return component.long_name
      }
      if (component.types.includes('administrative_area_level_2')) {
        return component.long_name
      }
    }
    
    // Fallback: extract from formatted address
    if (place.formatted_address) {
      const parts = place.formatted_address.split(',')
      if (parts.length > 1) {
        return parts[0].trim()
      }
    }
    
    return undefined
  }
  
  const extractStateFromPlace = (place: any): string | undefined => {
    const components = place.address_components || []
    
    for (const component of components) {
      if (component.types.includes('administrative_area_level_1')) {
        return component.long_name
      }
    }
    
    return undefined
  }

  const handleCurrentLocation = async () => {
    try {
      setShowPermissionPriming(false)
      await getCurrentLocation()
      onClose()
    } catch (error) {
      console.error('Location error:', error)
    }
  }

  const handleLocationSelect = (location: any) => {
    setLocation({
      coordinates: location.coordinates,
      address: location.address,
      city: location.city,
      state: location.state,
      country: location.country
    })
    onClose()
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value
    setSearchQuery(query)
    
    // Perform manual search using our location service (which now uses Google APIs)
    if (query.length > 2) {
      performManualSearch(query)
    } else {
      setSearchResults([])
    }
  }
  
  const performManualSearch = async (query: string) => {
    if (query.length < 3) {
      setSearchResults([])
      return
    }
    
    setIsSearching(true)
    
    try {
      console.log(`🔍 Manual search for: ${query}`)
      const results = await locationService.searchLocation(query)
      
      const formattedResults = results.map(result => ({
        address: result.address,
        subtext: `${result.city || ''}, ${result.state || 'Nigeria'}`.replace(/^, /, ''),
        coordinates: result.coordinates,
        city: result.city,
        state: result.state,
        country: result.country
      }))
      
      setSearchResults(formattedResults)
      console.log(`✅ Found ${formattedResults.length} results`)
      
    } catch (error) {
      console.error('Search failed:', error)
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }

  const PermissionPrimingCard = () => (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl p-6 border border-orange-200"
    >
      <div className="flex items-start gap-4">
        <div className="p-3 bg-orange-100 rounded-full">
          <Navigation className="w-6 h-6 text-orange-600" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 mb-2">
            Enable Location for Better Experience
          </h3>
          <p className="text-gray-600 text-sm mb-4">
            We'll use your location to show accurate delivery times, nearby restaurants, and delivery fees. Your location is only used while you're using FoodNow.
          </p>
          <div className="flex gap-3">
            <button
              onClick={handleCurrentLocation}
              disabled={isLoading}
              className="flex items-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-xl font-medium hover:bg-orange-700 transition-colors disabled:opacity-50"
            >
              <Navigation className="w-4 h-4" />
              {isLoading ? 'Getting Location...' : 'Allow Location'}
            </button>
            <button
              onClick={() => setShowPermissionPriming(false)}
              className="text-gray-600 hover:text-gray-800 px-4 py-2 rounded-xl font-medium transition-colors"
            >
              Maybe Later
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  )

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            {/* Modal */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl w-full max-w-lg shadow-2xl"
            >
              {/* Header */}
              <div className="p-6 pb-4 border-b border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-100 rounded-xl">
                      <MapPin className="w-6 h-6 text-orange-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">{title}</h2>
                      <p className="text-gray-600 text-sm">{subtitle}</p>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Search Bar */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={handleSearchChange}
                    placeholder="Search for area, street name, landmark in Nigeria..."
                    className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                    autoComplete="off"
                  />
                </div>
              </div>

              {/* Content */}
              <div className="p-6 pt-4 max-h-96 overflow-y-auto">
                {/* Current Location Button */}
                {!showPermissionPriming && (
                  <button
                    onClick={async () => {
                      const hasPermission = await requestLocationPermission()
                      if (hasPermission) {
                        handleCurrentLocation()
                      } else {
                        setShowPermissionPriming(true)
                      }
                    }}
                    disabled={isLoading}
                    className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 rounded-2xl transition-colors group disabled:opacity-50"
                  >
                    <div className="p-3 bg-blue-100 rounded-full group-hover:bg-blue-200 transition-colors">
                      <Navigation className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-semibold text-gray-900">
                        {isLoading ? 'Getting your location...' : 'Use Current Location'}
                      </div>
                      <div className="text-sm text-gray-600">
                        We'll automatically detect your location
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </button>
                )}

                {/* Permission Priming */}
                {showPermissionPriming && <PermissionPrimingCard />}

                {/* Error Display */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-3 p-3 bg-red-50 rounded-xl border border-red-200 mb-4"
                  >
                    <AlertCircle className="w-5 h-5 text-red-600" />
                    <span className="text-red-800 text-sm">{error}</span>
                  </motion.div>
                )}

                {/* Search Results */}
                {searchQuery && (
                  <div className="mt-4">
                    <h3 className="font-medium text-gray-900 mb-3">Search Results</h3>
                    {isSearching ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500"></div>
                      </div>
                    ) : searchResults.length > 0 ? (
                      <div className="space-y-2">
                        {searchResults.map((result, index) => (
                          <button
                            key={index}
                            onClick={() => handleLocationSelect(result)}
                            className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-xl transition-colors text-left"
                          >
                            <div className="p-2 bg-gray-100 rounded-full">
                              <MapPin className="w-4 h-4 text-gray-600" />
                            </div>
                            <div className="flex-1">
                              <div className="font-medium text-gray-900">{result.address}</div>
                              <div className="text-sm text-gray-600">{result.subtext}</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        No results found. Try a different search term.
                      </div>
                    )}
                  </div>
                )}

                {/* Recent Locations */}
                {!searchQuery && showRecentLocations && recentLocations.length > 0 && (
                  <div className="mt-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Clock className="w-4 h-4 text-gray-600" />
                      <h3 className="font-medium text-gray-900">Recent Locations</h3>
                    </div>
                    <div className="space-y-2">
                      {recentLocations.map((location, index) => (
                        <button
                          key={index}
                          onClick={() => handleLocationSelect(location)}
                          className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-xl transition-colors text-left"
                        >
                          <div className="p-2 bg-gray-100 rounded-full">
                            <Clock className="w-4 h-4 text-gray-600" />
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">{location.address}</div>
                            <div className="text-sm text-gray-600">{location.subtext}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export default LocationModal