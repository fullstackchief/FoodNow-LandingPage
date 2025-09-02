'use client'

import { useState, useEffect } from 'react'
import { reverseGeocode, isWithinLagos } from '@/lib/googleMaps'

interface GeolocationState {
  latitude: number | null
  longitude: number | null
  address: string | null
  accuracy: number | null
  isLoading: boolean
  error: string | null
  isWithinDeliveryZone: boolean
}

interface GeolocationOptions {
  enableHighAccuracy?: boolean
  timeout?: number
  maximumAge?: number
  watchPosition?: boolean
  autoGeocode?: boolean
}

export function useGeolocation(options: GeolocationOptions = {}) {
  const {
    enableHighAccuracy = true,
    timeout = 10000,
    maximumAge = 300000, // 5 minutes
    watchPosition = false,
    autoGeocode = true
  } = options

  const [state, setState] = useState<GeolocationState>({
    latitude: null,
    longitude: null,
    address: null,
    accuracy: null,
    isLoading: false,
    error: null,
    isWithinDeliveryZone: false
  })

  const updatePosition = async (position: GeolocationPosition) => {
    const { latitude, longitude, accuracy } = position.coords
    
    const coordinates = { lat: latitude, lng: longitude }
    const withinLagos = isWithinLagos(coordinates)
    
    // Get address if geocoding is enabled
    let address = null
    if (autoGeocode) {
      try {
        address = await reverseGeocode(coordinates)
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        // Direct console call to bypass Turbopack import issue
        try {
          console.warn(`Failed to reverse geocode position: ${errorMessage}`)
        } catch {
          try {
            console.log(`[WARN] Failed to reverse geocode position: ${errorMessage}`)
          } catch {
            // Silently fail if console is completely unavailable
          }
        }
      }
    }

    setState(prev => ({
      ...prev,
      latitude,
      longitude,
      accuracy,
      address,
      isLoading: false,
      error: null,
      isWithinDeliveryZone: withinLagos
    }))
  }

  const handleError = (error: GeolocationPositionError) => {
    let errorMessage = 'Unable to retrieve location'

    switch (error.code) {
      case error.PERMISSION_DENIED:
        errorMessage = 'Location access denied by user'
        break
      case error.POSITION_UNAVAILABLE:
        errorMessage = 'Location information unavailable'
        break
      case error.TIMEOUT:
        errorMessage = 'Location request timed out'
        break
      default:
        errorMessage = 'Unknown location error occurred'
        break
    }

    setState(prev => ({
      ...prev,
      isLoading: false,
      error: errorMessage
    }))
  }

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setState(prev => ({
        ...prev,
        error: 'Geolocation is not supported by this browser'
      }))
      return
    }

    setState(prev => ({
      ...prev,
      isLoading: true,
      error: null
    }))

    const positionOptions: PositionOptions = {
      enableHighAccuracy,
      timeout,
      maximumAge
    }

    if (watchPosition) {
      const watchId = navigator.geolocation.watchPosition(
        updatePosition,
        handleError,
        positionOptions
      )

      return () => {
        navigator.geolocation.clearWatch(watchId)
      }
    } else {
      navigator.geolocation.getCurrentPosition(
        updatePosition,
        handleError,
        positionOptions
      )
    }
  }

  const clearLocation = () => {
    setState({
      latitude: null,
      longitude: null,
      address: null,
      accuracy: null,
      isLoading: false,
      error: null,
      isWithinDeliveryZone: false
    })
  }

  // Auto-request location on mount if watch is enabled
  useEffect(() => {
    if (watchPosition) {
      const cleanup = getCurrentLocation()
      return cleanup
    }
  }, [watchPosition, enableHighAccuracy, timeout, maximumAge])

  return {
    ...state,
    getCurrentLocation,
    clearLocation,
    coordinates: state.latitude && state.longitude ? {
      lat: state.latitude,
      lng: state.longitude
    } : null,
    isLocationAvailable: state.latitude !== null && state.longitude !== null,
    hasPermission: state.error !== 'Location access denied by user'
  }
}