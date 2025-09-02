'use client'

import { useEffect, useRef, useState } from 'react'
import { initializeMap, loadGoogleMaps, createRestaurantMarker, createDeliveryMarker, DEFAULT_MAP_OPTIONS } from '@/lib/googleMaps'
// Direct console logging to bypass Turbopack import issues

interface Restaurant {
  id: string
  name: string
  image_url?: string
  rating?: number
  location: {
    lat: number
    lng: number
  }
}

interface DeliveryMarker {
  id: string
  position: {
    lat: number
    lng: number
  }
  type: 'rider' | 'pickup' | 'delivery'
}

interface GoogleMapProps {
  className?: string
  restaurants?: Restaurant[]
  deliveryMarkers?: DeliveryMarker[]
  center?: {
    lat: number
    lng: number
  }
  zoom?: number
  onRestaurantClick?: (restaurant: Restaurant) => void
  showControls?: boolean
  height?: string
}

export default function GoogleMap({
  className = '',
  restaurants = [],
  deliveryMarkers = [],
  center,
  zoom = 12,
  onRestaurantClick,
  showControls = true,
  height = 'h-96'
}: GoogleMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [map, setMap] = useState<google.maps.Map | null>(null)
  const [markers, setMarkers] = useState<google.maps.Marker[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isMounted, setIsMounted] = useState(false)

  // Hydration safety
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Initialize map - only after hydration
  useEffect(() => {
    if (!isMounted) return

    async function initMap() {
      try {
        setIsLoading(true)
        setError(null)

        if (!mapRef.current) return

        const mapOptions = {
          ...DEFAULT_MAP_OPTIONS,
          zoom,
          zoomControl: showControls,
          ...(center && { center })
        }

        const mapInstance = await initializeMap(mapRef.current, mapOptions)
        setMap(mapInstance)

        // Listen for restaurant selection events
        const handleRestaurantSelection = (event: any) => {
          const restaurantName = event.detail.name
          const restaurant = restaurants.find(r => r.name === restaurantName)
          if (restaurant && onRestaurantClick) {
            onRestaurantClick(restaurant)
          }
        }

        window.addEventListener('restaurant-selected', handleRestaurantSelection)

        return () => {
          window.removeEventListener('restaurant-selected', handleRestaurantSelection)
        }

      } catch (err) {
        try {
          console.error('Failed to initialize map: ' + (err instanceof Error ? err.message : 'Unknown error'))
        } catch {
          try {
            console.log('[ERROR] Failed to initialize map: ' + (err instanceof Error ? err.message : 'Unknown error'))
          } catch {}
        }
        setError('Failed to load map. Please check your internet connection.')
      } finally {
        setIsLoading(false)
      }
    }

    initMap()
  }, [isMounted, center, zoom, showControls, onRestaurantClick])

  // Update restaurant markers
  useEffect(() => {
    if (!map) return

    // Clear existing markers
    markers.forEach(marker => marker.setMap(null))
    const newMarkers: google.maps.Marker[] = []

    // Add restaurant markers
    restaurants.forEach(restaurant => {
      try {
        const marker = createRestaurantMarker(
          map, 
          restaurant.location, 
          restaurant
        )
        newMarkers.push(marker)
      } catch (error) {
        try {
          console.error('Failed to create restaurant marker: ' + (error instanceof Error ? error.message : 'Unknown error'))
        } catch {
          try {
            console.log('[ERROR] Failed to create restaurant marker: ' + (error instanceof Error ? error.message : 'Unknown error'))
          } catch {}
        }
      }
    })

    // Add delivery markers
    deliveryMarkers.forEach(deliveryMarker => {
      try {
        const marker = createDeliveryMarker(
          map,
          deliveryMarker.position,
          deliveryMarker.type
        )
        newMarkers.push(marker)
      } catch (error) {
        try {
          console.error('Failed to create delivery marker: ' + (error instanceof Error ? error.message : 'Unknown error'))
        } catch {
          try {
            console.log('[ERROR] Failed to create delivery marker: ' + (error instanceof Error ? error.message : 'Unknown error'))
          } catch {}
        }
      }
    })

    setMarkers(newMarkers)

    // Fit bounds to show all markers if there are any
    if (newMarkers.length > 0) {
      const bounds = new google.maps.LatLngBounds()
      newMarkers.forEach(marker => {
        const position = marker.getPosition()
        if (position) bounds.extend(position)
      })
      map.fitBounds(bounds)
      
      // Prevent over-zooming for single markers
      if (newMarkers.length === 1) {
        const listener = map.addListener('bounds_changed', () => {
          if (map.getZoom()! > 15) map.setZoom(15)
          google.maps.event.removeListener(listener)
        })
      }
    }

  }, [map, restaurants, deliveryMarkers])

  if (error) {
    return (
      <div className={`${height} ${className} flex items-center justify-center bg-gray-100 rounded-lg`}>
        <div className="text-center p-4">
          <div className="text-red-500 mb-2">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5C3.498 20.333 4.46 22 6 22z" />
            </svg>
          </div>
          <p className="text-gray-600">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`${height} ${className} relative rounded-lg overflow-hidden`}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading map...</p>
          </div>
        </div>
      )}
      <div 
        ref={mapRef} 
        className="w-full h-full"
        style={{ minHeight: '200px' }}
      />
      
      {/* Map legend for delivery tracking */}
      {deliveryMarkers.length > 0 && (
        <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-3 text-sm">
          <div className="font-semibold mb-2">Legend</div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded-full"></div>
              <span>Rider</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
              <span>Pickup</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500 rounded-full"></div>
              <span>Delivery</span>
            </div>
          </div>
        </div>
      )}
      
      {/* Restaurant count indicator */}
      {restaurants.length > 0 && (
        <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg px-3 py-2 text-sm font-medium">
          {restaurants.length} restaurant{restaurants.length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  )
}