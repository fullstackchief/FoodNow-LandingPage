'use client'

/**
 * SSR-Safe Google Maps Integration
 * ================================ 
 * Hydration-safe Google Maps loading with proper environment handling
 */

// Direct console logging to bypass Turbopack import issues

// Client-side only check
const isBrowser = typeof window !== 'undefined'

// SSR-safe API key access function
function getApiKey(): string | null {
  // Only access environment variables in browser after hydration
  if (!isBrowser) return null
  
  // Primary: Next.js public environment variable
  let apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  
  // Fallback: Try Next.js data object
  if (!apiKey) {
    try {
      apiKey = (window as any).__NEXT_DATA__?.env?.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
    } catch (e) {
      try {
        console.warn('Could not access Next.js environment data')
      } catch {
        try {
          console.log('[WARN] Could not access Next.js environment data')
        } catch {}
      }
    }
  }
  
  // Development fallback
  if (!apiKey) {
    apiKey = 'AIzaSyD7UHvXJtUbb8Pwa_E40l8IjhKAykefEoQ'
    try {
      console.warn('⚠️ Using development fallback API key')
    } catch {
      try {
        console.log('[WARN] ⚠️ Using development fallback API key')
      } catch {}
    }
  }
  
  return apiKey
}

// Direct console calls used to avoid Turbopack import issues

// Debug function (only runs in browser) - with safe logging
function debugApiKeyAccess() {
  if (!isBrowser) return
  
  try {
    const apiKey = getApiKey()
    try {
      console.log('🔍 Google Maps API Key Status:')
      console.log('   Available: ' + (!!apiKey))
      console.log('   Length: ' + (apiKey?.length || 0))
      console.log('   Preview: ' + (apiKey ? apiKey.substring(0, 10) + '...' : 'N/A'))
    } catch {}
    
    if (!apiKey) {
      try {
        console.error('❌ Google Maps API key not available')
      } catch {
        try {
          console.log('[ERROR] ❌ Google Maps API key not available')
        } catch {}
      }
    }
  } catch (error) {
    // Silently handle any errors in debug function
  }
}

// Simple loading state
let isGoogleMapsLoaded = false
let isLoading = false
let loadPromise: Promise<any> | null = null

// Lagos coordinates (default center)
export const LAGOS_CENTER = {
  lat: 6.5244,
  lng: 3.3792
}

// Default map options
export const DEFAULT_MAP_OPTIONS = {
  center: LAGOS_CENTER,
  zoom: 12,
  mapTypeControl: false,
  streetViewControl: false,
  fullscreenControl: false,
  zoomControl: true,
  styles: [
    {
      featureType: 'poi',
      elementType: 'labels',
      stylers: [{ visibility: 'off' }]
    },
    {
      featureType: 'transit',
      elementType: 'labels',
      stylers: [{ visibility: 'off' }]
    }
  ]
}

/**
 * Load Google Maps API with SSR-safe script injection
 */
export async function loadGoogleMaps(): Promise<any> {
  // Browser check
  if (!isBrowser) {
    throw new Error('Google Maps can only be loaded in browser environment')
  }

  // Return if already loaded
  if (isGoogleMapsLoaded && window.google?.maps) {
    try {
      console.log('📍 Google Maps already loaded')
    } catch {}
    return window.google.maps
  }

  // Return existing promise if loading
  if (isLoading && loadPromise) {
    try {
      console.log('⏳ Google Maps loading in progress...')
    } catch {}
    return loadPromise
  }

  // Get API key safely
  const apiKey = getApiKey()
  if (!apiKey) {
    const error = new Error('Google Maps API key not available. Please set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY.')
    try {
      console.error('🚫 Google Maps loading failed: ' + error.message)
    } catch {
      try {
        console.log('[ERROR] 🚫 Google Maps loading failed: ' + error.message)
      } catch {}
    }
    throw error
  }

  isLoading = true
  debugApiKeyAccess()
  
  try {
    console.log('🚀 Starting Google Maps script loading...')
  } catch {}

  loadPromise = new Promise((resolve, reject) => {
    // Create unique callback
    const callbackName = 'initGoogleMaps' + Date.now()
    try {
      console.log('   Callback: ' + callbackName)
    } catch {}
    
    // Set up global callback
    (window as any)[callbackName] = () => {
      try {
        console.log('✅ Google Maps API loaded successfully!')
      } catch {}
      isGoogleMapsLoaded = true
      isLoading = false
      delete (window as any)[callbackName]
      resolve(window.google.maps)
    }

    // Create script
    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry&callback=${callbackName}`
    try {
      console.log('   Script URL: ' + script.src.substring(0, 80) + '...')
    } catch {}
    
    script.onerror = (error) => {
      try {
        console.error('❌ Failed to load Google Maps script: ' + error)
      } catch {
        try {
          console.log('[ERROR] ❌ Failed to load Google Maps script: ' + error)
        } catch {}
      }
      isLoading = false
      delete (window as any)[callbackName]
      reject(new Error('Failed to load Google Maps script. Check your API key and internet connection.'))
    }

    script.onload = () => {
      try {
        console.log('📦 Google Maps script downloaded, waiting for callback...')
      } catch {}
    }

    document.head.appendChild(script)
    try {
      console.log('   Script element added to document head')
    } catch {}
  });

  return loadPromise
}

/**
 * Initialize Google Map
 */
export async function initializeMap(
  element: HTMLElement, 
  options: any = DEFAULT_MAP_OPTIONS
): Promise<any> {
  if (!isBrowser) {
    throw new Error('Maps can only be created in browser environment')
  }
  
  const maps = await loadGoogleMaps()
  return new maps.Map(element, options)
}

/**
 * Create custom restaurant marker
 */
export function createRestaurantMarker(
  map: any,
  position: {lat: number, lng: number},
  restaurant: {
    name: string
    image_url?: string
    rating?: number
  }
): any {
  if (!isBrowser || !window.google?.maps) {
    throw new Error('Google Maps not available')
  }

  const marker = new google.maps.Marker({
    position,
    map,
    title: restaurant.name,
    icon: {
      url: '/images/restaurant-marker.svg',
      scaledSize: new google.maps.Size(32, 32),
      anchor: new google.maps.Point(16, 32)
    }
  })

  // Add info window
  const infoWindow = new google.maps.InfoWindow({
    content: `
      <div class="p-2 min-w-[200px]">
        <div class="flex items-center gap-2 mb-2">
          ${restaurant.image_url 
            ? `<img src="${restaurant.image_url}" alt="${restaurant.name}" class="w-12 h-12 object-cover rounded-lg" />`
            : '<div class="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center"><span class="text-2xl">🍽️</span></div>'
          }
          <div>
            <h3 class="font-semibold text-sm">${restaurant.name}</h3>
            ${restaurant.rating 
              ? `<div class="flex items-center gap-1">
                   <span class="text-yellow-500">⭐</span>
                   <span class="text-sm text-gray-600">${restaurant.rating}</span>
                 </div>`
              : ''
            }
          </div>
        </div>
        <button 
          onclick="window.dispatchEvent(new CustomEvent('restaurant-selected', { detail: { name: '${restaurant.name}' } }))"
          class="w-full bg-orange-500 text-white text-sm py-1 px-3 rounded-lg hover:bg-orange-600 transition-colors"
        >
          View Menu
        </button>
      </div>
    `
  })

  marker.addListener('click', () => {
    infoWindow.open(map, marker)
  })

  return marker
}

/**
 * Create delivery tracking marker
 */
export function createDeliveryMarker(
  map: any,
  position: {lat: number, lng: number},
  type: 'rider' | 'pickup' | 'delivery'
): any {
  if (!isBrowser || !window.google?.maps) {
    throw new Error('Google Maps not available')
  }

  const icons = {
    rider: '/images/rider-marker.svg',
    pickup: '/images/pickup-marker.svg',
    delivery: '/images/delivery-marker.svg'
  }

  return new google.maps.Marker({
    position,
    map,
    icon: {
      url: icons[type],
      scaledSize: new google.maps.Size(28, 28),
      anchor: new google.maps.Point(14, 28)
    }
  })
}

/**
 * Calculate distance between two points
 */
export function calculateDistance(
  origin: {lat: number, lng: number},
  destination: {lat: number, lng: number}
): number {
  const R = 6371 // Earth's radius in kilometers
  const dLat = (destination.lat - origin.lat) * Math.PI / 180
  const dLon = (destination.lng - origin.lng) * Math.PI / 180
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(origin.lat * Math.PI / 180) * Math.cos(destination.lat * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}

/**
 * Get distance matrix for delivery calculations
 */
export async function getDistanceMatrix(
  origins: {lat: number, lng: number}[],
  destinations: {lat: number, lng: number}[]
): Promise<any> {
  const maps = await loadGoogleMaps()
  const service = new maps.DistanceMatrixService()
  
  return new Promise((resolve, reject) => {
    service.getDistanceMatrix({
      origins,
      destinations,
      travelMode: google.maps.TravelMode.DRIVING,
      unitSystem: google.maps.UnitSystem.METRIC,
      avoidHighways: false,
      avoidTolls: false
    }, (response: any, status: any) => {
      if (status === google.maps.DistanceMatrixStatus.OK && response) {
        resolve(response)
      } else {
        reject(new Error(`Distance Matrix request failed: ${status}`))
      }
    })
  })
}

/**
 * Initialize Places Autocomplete
 */
export async function initializePlacesAutocomplete(
  input: HTMLInputElement,
  options: {
    componentRestrictions?: { country: string }
    types?: string[]
    bounds?: any
  } = {}
): Promise<any> {
  const maps = await loadGoogleMaps()
  
  const autocomplete = new maps.places.Autocomplete(input, {
    componentRestrictions: options.componentRestrictions || { country: 'ng' }, // Nigeria
    types: options.types || ['address'],
    bounds: options.bounds,
    fields: ['place_id', 'geometry', 'name', 'formatted_address']
  })

  return autocomplete
}

/**
 * Geocode address to coordinates
 */
export async function geocodeAddress(address: string): Promise<{lat: number, lng: number} | null> {
  const maps = await loadGoogleMaps()
  const geocoder = new maps.Geocoder()
  
  return new Promise((resolve) => {
    geocoder.geocode({ address }, (results: any, status: any) => {
      if (status === google.maps.GeocoderStatus.OK && results && results[0]) {
        const location = results[0].geometry.location
        resolve({
          lat: location.lat(),
          lng: location.lng()
        })
      } else {
        resolve(null)
      }
    })
  })
}

/**
 * Reverse geocode coordinates to address
 */
export async function reverseGeocode(
  position: {lat: number, lng: number}
): Promise<string | null> {
  const maps = await loadGoogleMaps()
  const geocoder = new maps.Geocoder()
  
  return new Promise((resolve) => {
    geocoder.geocode({ location: position }, (results: any, status: any) => {
      console.log('🔍 Google reverse geocoding result:', { status, results: results?.[0] })
      
      if (status === maps.GeocoderStatus.OK && results && results[0]) {
        console.log('✅ Reverse geocoding successful:', results[0].formatted_address)
        resolve(results[0].formatted_address)
      } else {
        console.error('❌ Reverse geocoding failed:', status)
        resolve(null)
      }
    })
  })
}

/**
 * Check if coordinates are within Lagos delivery zones
 */
export function isWithinLagos(position: {lat: number, lng: number}): boolean {
  // Lagos approximate bounds
  const LAGOS_BOUNDS = {
    north: 6.7,
    south: 6.3,
    east: 3.6,
    west: 3.1
  }
  
  return (
    position.lat >= LAGOS_BOUNDS.south &&
    position.lat <= LAGOS_BOUNDS.north &&
    position.lng >= LAGOS_BOUNDS.west &&
    position.lng <= LAGOS_BOUNDS.east
  )
}

/**
 * Format distance for display
 */
export function formatDistance(distanceInKm: number): string {
  if (distanceInKm < 1) {
    return `${Math.round(distanceInKm * 1000)}m`
  } else if (distanceInKm < 10) {
    return `${distanceInKm.toFixed(1)}km`
  } else {
    return `${Math.round(distanceInKm)}km`
  }
}

/**
 * Format duration for display
 */
export function formatDuration(durationInMinutes: number): string {
  if (durationInMinutes < 60) {
    return `${Math.round(durationInMinutes)} min`
  } else {
    const hours = Math.floor(durationInMinutes / 60)
    const minutes = Math.round(durationInMinutes % 60)
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`
  }
}