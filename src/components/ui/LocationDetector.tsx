'use client'

import { useState, useEffect } from 'react'
import { useGeolocation } from '@/hooks/useGeolocation'
import LocationAutocomplete from './LocationAutocomplete'

interface LocationData {
  address: string
  coordinates: {
    lat: number
    lng: number
  }
  isWithinDeliveryZone: boolean
  source: 'geolocation' | 'manual'
}

interface LocationDetectorProps {
  onLocationChange: (location: LocationData | null) => void
  className?: string
  autoDetect?: boolean
}

export default function LocationDetector({
  onLocationChange,
  className = "",
  autoDetect = true
}: LocationDetectorProps) {
  const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(null)
  const [showManualInput, setShowManualInput] = useState(false)
  const [googleMapsError, setGoogleMapsError] = useState<string | null>(null)
  const [showLocationSuccess, setShowLocationSuccess] = useState(false)
  
  const {
    address,
    coordinates,
    isLoading: geoLoading,
    error: geoError,
    isWithinDeliveryZone,
    getCurrentLocation,
    hasPermission
  } = useGeolocation({ autoGeocode: true })

  // Handle geolocation result
  useEffect(() => {
    if (coordinates && address && !showManualInput) {
      const location: LocationData = {
        address,
        coordinates,
        isWithinDeliveryZone,
        source: 'geolocation'
      }
      setSelectedLocation(location)
      onLocationChange(location)
      
      // Show success animation
      setShowLocationSuccess(true)
      setTimeout(() => setShowLocationSuccess(false), 3000)
    }
  }, [coordinates, address, isWithinDeliveryZone, showManualInput, onLocationChange])

  // Handle manual location selection
  const handleManualLocationSelect = (location: { address: string; coordinates: { lat: number; lng: number }; placeId: string }) => {
    // Check if coordinates are within delivery zone (you can enhance this with actual delivery zone data)
    const isWithinZone = location.coordinates.lat >= 6.3 && 
                        location.coordinates.lat <= 6.7 && 
                        location.coordinates.lng >= 3.1 && 
                        location.coordinates.lng <= 3.6

    const locationData: LocationData = {
      address: location.address,
      coordinates: location.coordinates,
      isWithinDeliveryZone: isWithinZone,
      source: 'manual'
    }
    
    setSelectedLocation(locationData)
    onLocationChange(locationData)
  }

  const handleUseCurrentLocation = () => {
    setShowManualInput(false)
    getCurrentLocation()
  }

  const handleEnterManually = () => {
    setShowManualInput(true)
    setSelectedLocation(null)
    onLocationChange(null)
  }

  if (showManualInput) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Enter Delivery Address</h3>
          {hasPermission && (
            <button
              onClick={handleUseCurrentLocation}
              className="text-orange-600 hover:text-orange-700 text-sm font-medium flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              </svg>
              Use current location
            </button>
          )}
        </div>
        
        <LocationAutocomplete
          onLocationSelect={handleManualLocationSelect}
          placeholder="Enter your delivery address"
          className="text-lg"
        />
      </div>
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <h3 className="text-lg font-semibold">Delivery Location</h3>
      
      {/* Auto-detect location */}
      {autoDetect && !selectedLocation && !geoError && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              {geoLoading ? (
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500"></div>
              ) : (
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                </svg>
              )}
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-orange-800">
                {geoLoading ? 'Detecting your location...' : 'Allow location access for faster delivery'}
              </h4>
              <p className="text-sm text-orange-700 mt-1">
                We&apos;ll use your location to find nearby restaurants and calculate delivery fees.
              </p>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={getCurrentLocation}
                  disabled={geoLoading}
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {geoLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    </svg>
                  )}
                  Use Current Location
                </button>
                <button
                  onClick={handleEnterManually}
                  className="px-4 py-2 border border-orange-600 text-orange-600 rounded-lg hover:bg-orange-50"
                >
                  Enter Manually
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Location error */}
      {geoError && !showManualInput && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <svg className="w-6 h-6 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5C3.498 20.333 4.46 22 6 22z" />
            </svg>
            <div className="flex-1">
              <h4 className="font-medium text-red-800">Location access unavailable</h4>
              <p className="text-sm text-red-700 mt-1">{geoError}</p>
              <button
                onClick={handleEnterManually}
                className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Enter Address Manually
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Location Success Notification */}
      {showLocationSuccess && selectedLocation && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 text-green-600 animate-bounce">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-green-800">✨ Location detected successfully!</h4>
              <p className="text-sm text-green-700 mt-1">
                Found you at: {selectedLocation.address}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Selected location display */}
      {selectedLocation && (
        <div className={`border rounded-lg p-4 ${selectedLocation.isWithinDeliveryZone ? 'border-green-200 bg-green-50' : 'border-yellow-200 bg-yellow-50'}`}>
          <div className="flex items-start gap-3">
            <div className={`w-6 h-6 flex-shrink-0 ${selectedLocation.isWithinDeliveryZone ? 'text-green-600' : 'text-yellow-600'}`}>
              {selectedLocation.isWithinDeliveryZone ? (
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5C3.498 20.333 4.46 22 6 22z" />
                </svg>
              )}
            </div>
            <div className="flex-1">
              <h4 className={`font-medium ${selectedLocation.isWithinDeliveryZone ? 'text-green-800' : 'text-yellow-800'}`}>
                {selectedLocation.isWithinDeliveryZone ? 'Delivery Available' : 'Limited Delivery'}
              </h4>
              <p className={`text-sm mt-1 ${selectedLocation.isWithinDeliveryZone ? 'text-green-700' : 'text-yellow-700'}`}>
                {selectedLocation.address}
              </p>
              <p className="text-xs text-gray-600 mt-1 font-mono">
                📍 {selectedLocation.coordinates.lat.toFixed(6)}, {selectedLocation.coordinates.lng.toFixed(6)}
                {selectedLocation.source === 'geolocation' && ' (GPS detected)'}
              </p>
              {!selectedLocation.isWithinDeliveryZone && (
                <p className="text-xs text-yellow-600 mt-1">
                  This location may have limited restaurant options or higher delivery fees.
                </p>
              )}
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => setShowManualInput(true)}
                  className="text-sm text-gray-600 hover:text-gray-800 underline"
                >
                  Change address
                </button>
                {hasPermission && selectedLocation.source === 'manual' && (
                  <button
                    onClick={getCurrentLocation}
                    className="text-sm text-orange-600 hover:text-orange-700 underline"
                  >
                    Use current location
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}