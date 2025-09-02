import type { LocationData } from '@/contexts/LocationContext'
import { geocodeAddress, reverseGeocode } from '@/lib/googleMaps'

const LOCATION_STORAGE_KEY = 'foodnow_user_location'
const LOCATION_EXPIRY_HOURS = 24 // Location expires after 24 hours

interface StoredLocationData extends LocationData {
  timestamp: number
}

class LocationService {
  /**
   * Get current position using browser geolocation
   */
  async getCurrentLocation(): Promise<LocationData> {
    if (!navigator.geolocation) {
      throw new Error('Geolocation is not supported by this browser')
    }

    return new Promise((resolve, reject) => {
      const options: PositionOptions = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords
            console.log('📍 GPS coordinates obtained:', { latitude, longitude, accuracy: position.coords.accuracy })
            
            // Use real Google reverse geocoding API
            console.log('🌍 Calling Google reverse geocoding API...')
            const formattedAddress = await reverseGeocode({ lat: latitude, lng: longitude })
            console.log('🗺️ Google reverse geocoding response:', formattedAddress)
            
            if (!formattedAddress) {
              console.error('❌ Google reverse geocoding returned null')
              throw new Error('Could not determine address for current location')
            }
            
            // Parse the formatted address to extract components
            console.log('🔍 Parsing address components from:', formattedAddress)
            const city = this.extractCityFromAddress(formattedAddress)
            const state = this.extractStateFromAddress(formattedAddress)
            const country = this.extractCountryFromAddress(formattedAddress) || 'Nigeria'
            
            console.log('🏷️ Extracted components:', { city, state, country })
            
            const locationData = {
              coordinates: {
                lat: latitude,
                lng: longitude
              },
              address: formattedAddress,
              city: city,
              state: state,
              country: country
            }
            
            console.log('✅ Final location data:', locationData)
            resolve(locationData)
          } catch (error) {
            console.error('❌ Error in getCurrentLocation:', error)
            reject(new Error(`Failed to get location details: ${error instanceof Error ? error.message : 'Unknown error'}`))
          }
        },
        (error) => {
          let message = 'Failed to get location'
          
          switch (error.code) {
            case error.PERMISSION_DENIED:
              message = 'Location access denied. Please enable location permissions.'
              break
            case error.POSITION_UNAVAILABLE:
              message = 'Location information unavailable.'
              break
            case error.TIMEOUT:
              message = 'Location request timed out.'
              break
          }
          
          reject(new Error(message))
        },
        options
      )
    })
  }

  /**
   * Search for locations by address
   */
  async searchLocation(query: string): Promise<LocationData[]> {
    try {
      console.log(`🔍 Searching for address: ${query}`)
      
      // Use Google Geocoding API to find address
      const coordinates = await geocodeAddress(query + ', Nigeria')
      
      if (!coordinates) {
        console.log(`❌ No results found for: ${query}`)
        return []
      }
      
      // Get formatted address using reverse geocoding
      const formattedAddress = await reverseGeocode(coordinates)
      
      const result: LocationData = {
        coordinates,
        address: formattedAddress || query,
        // Parse city/state from formatted address
        city: this.extractCityFromAddress(formattedAddress || query),
        state: this.extractStateFromAddress(formattedAddress || query),
        country: 'Nigeria'
      }
      
      console.log(`✅ Found location:`, result)
      return [result]
      
    } catch (error) {
      console.error('❌ Address search failed:', error)
      
      // Provide helpful fallback for common Nigerian locations
      const fallbackLocations = {
        'victoria island': { lat: 6.4281, lng: 3.4219, city: 'Victoria Island', state: 'Lagos' },
        'ikeja': { lat: 6.6018, lng: 3.3515, city: 'Ikeja', state: 'Lagos' },
        'lekki': { lat: 6.4641, lng: 3.6006, city: 'Lekki', state: 'Lagos' },
        'surulere': { lat: 6.5042, lng: 3.3615, city: 'Surulere', state: 'Lagos' },
        'abuja': { lat: 9.0579, lng: 7.4951, city: 'Abuja', state: 'FCT' },
        'port harcourt': { lat: 4.8156, lng: 7.0498, city: 'Port Harcourt', state: 'Rivers' }
      }
      
      const queryLower = query.toLowerCase()
      for (const [key, location] of Object.entries(fallbackLocations)) {
        if (queryLower.includes(key)) {
          console.log(`🎯 Using fallback location for: ${key}`)
          return [{
            coordinates: { lat: location.lat, lng: location.lng },
            address: `${location.city}, ${location.state}, Nigeria`,
            city: location.city,
            state: location.state,
            country: 'Nigeria'
          }]
        }
      }
      
      // Default Lagos fallback
      console.log('🏙️ Using default Lagos fallback')
      return [{
        coordinates: { lat: 6.5244, lng: 3.3792 },
        address: `${query}, Lagos, Nigeria`,
        city: 'Lagos',
        state: 'Lagos',
        country: 'Nigeria'
      }]
    }
  }

  /**
   * @deprecated - Now using real Google reverse geocoding from googleMaps.ts
   * Kept for reference only - the real reverseGeocode is imported from '@/lib/googleMaps'
   */
  private async DEPRECATED_reverseGeocode(lat: number, lng: number): Promise<{
    formatted_address: string
    city?: string
    state?: string
    country?: string
  }> {
    // This method is no longer used - we now use the real Google API
    // from googleMaps.ts which provides accurate street-level addresses
    return {
      formatted_address: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
      country: 'Nigeria'
    }
  }

  /**
   * Store location in localStorage with timestamp
   */
  storeLocation(location: LocationData): void {
    try {
      const storedData: StoredLocationData = {
        ...location,
        timestamp: Date.now()
      }
      
      localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(storedData))
    } catch (error) {
      console.warn('Failed to store location:', error)
    }
  }

  /**
   * Get stored location from localStorage
   */
  getStoredLocation(): LocationData | null {
    try {
      const stored = localStorage.getItem(LOCATION_STORAGE_KEY)
      if (!stored) return null

      const storedData: StoredLocationData = JSON.parse(stored)
      
      // Check if location has expired
      const hoursAgo = (Date.now() - storedData.timestamp) / (1000 * 60 * 60)
      if (hoursAgo > LOCATION_EXPIRY_HOURS) {
        this.clearStoredLocation()
        return null
      }

      // Remove timestamp before returning
      const { timestamp, ...location } = storedData
      return location
    } catch (error) {
      console.warn('Failed to retrieve stored location:', error)
      return null
    }
  }

  /**
   * Clear stored location
   */
  clearStoredLocation(): void {
    try {
      localStorage.removeItem(LOCATION_STORAGE_KEY)
    } catch (error) {
      console.warn('Failed to clear stored location:', error)
    }
  }

  /**
   * Check if user has granted location permission
   */
  async hasLocationPermission(): Promise<boolean> {
    try {
      if (!navigator.permissions) return false
      
      const permission = await navigator.permissions.query({ name: 'geolocation' })
      return permission.state === 'granted'
    } catch {
      return false
    }
  }

  /**
   * Calculate distance between two points in kilometers
   */
  calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
  ): number {
    const R = 6371 // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1)
    const dLng = this.toRadians(lng2 - lng1)
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2)
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180)
  }

  /**
   * Extract city from formatted address
   */
  private extractCityFromAddress(address: string): string | undefined {
    // Common Nigerian city patterns
    const cityPatterns = [
      /Lagos/i,
      /Abuja/i,
      /Port Harcourt/i,
      /Kano/i,
      /Ibadan/i,
      /Benin City/i,
      /Kaduna/i,
      /Enugu/i,
      /Jos/i,
      /Ilorin/i
    ]
    
    for (const pattern of cityPatterns) {
      const match = address.match(pattern)
      if (match) {
        return match[0]
      }
    }
    
    // Extract first part before comma as potential city
    const parts = address.split(',')
    if (parts.length > 1) {
      return parts[0].trim()
    }
    
    return undefined
  }
  
  /**
   * Extract state from formatted address
   */
  private extractStateFromAddress(address: string): string | undefined {
    // Common Nigerian state patterns
    const statePatterns = [
      /Lagos State/i,
      /Lagos/i,
      /FCT|Federal Capital Territory/i,
      /Abuja/i,
      /Rivers State/i,
      /Kano State/i,
      /Oyo State/i,
      /Edo State/i,
      /Kaduna State/i,
      /Enugu State/i,
      /Plateau State/i,
      /Kwara State/i
    ]
    
    for (const pattern of statePatterns) {
      const match = address.match(pattern)
      if (match) {
        return match[0]
      }
    }
    
    return undefined
  }
  
  /**
   * Extract country from formatted address
   */
  private extractCountryFromAddress(address: string): string | undefined {
    if (/Nigeria/i.test(address)) {
      return 'Nigeria'
    }
    return undefined
  }

  /**
   * Validate coordinates
   */
  isValidCoordinates(lat: number, lng: number): boolean {
    return (
      typeof lat === 'number' &&
      typeof lng === 'number' &&
      lat >= -90 &&
      lat <= 90 &&
      lng >= -180 &&
      lng <= 180
    )
  }
}

export const locationService = new LocationService()