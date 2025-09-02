'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { locationService } from '@/lib/locationService'

export interface LocationData {
  coordinates: {
    lat: number
    lng: number
  }
  address: string
  city?: string
  state?: string
  country?: string
}

interface LocationContextType {
  location: LocationData | null
  isLoading: boolean
  error: string | null
  setLocation: (location: LocationData) => void
  getCurrentLocation: () => Promise<void>
  clearLocation: () => void
  hasLocation: boolean
  requestLocationPermission: () => Promise<boolean>
}

const LocationContext = createContext<LocationContextType | undefined>(undefined)

interface LocationProviderProps {
  children: ReactNode
}

export function LocationProvider({ children }: LocationProviderProps) {
  const [location, setLocationState] = useState<LocationData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load persisted location on mount
  useEffect(() => {
    const persistedLocation = locationService.getStoredLocation()
    if (persistedLocation) {
      setLocationState(persistedLocation)
    }
  }, [])

  const setLocation = (newLocation: LocationData) => {
    setLocationState(newLocation)
    locationService.storeLocation(newLocation)
    setError(null)
  }

  const getCurrentLocation = async (): Promise<void> => {
    setIsLoading(true)
    setError(null)

    try {
      console.log('🚀 Getting current location with Google APIs...')
      const currentLocation = await locationService.getCurrentLocation()
      console.log('📍 Current location obtained:', currentLocation)
      setLocation(currentLocation)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get location'
      setError(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const clearLocation = () => {
    setLocationState(null)
    locationService.clearStoredLocation()
    setError(null)
  }

  const requestLocationPermission = async (): Promise<boolean> => {
    try {
      if (!navigator.geolocation) {
        throw new Error('Geolocation is not supported by this browser')
      }

      return await new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(
          () => resolve(true),
          (error) => {
            console.warn('Location permission denied:', error)
            resolve(false)
          },
          {
            timeout: 5000,
            enableHighAccuracy: false
          }
        )
      })
    } catch {
      return false
    }
  }

  const value: LocationContextType = {
    location,
    isLoading,
    error,
    setLocation,
    getCurrentLocation,
    clearLocation,
    hasLocation: Boolean(location),
    requestLocationPermission
  }

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  )
}

export function useLocation() {
  const context = useContext(LocationContext)
  if (!context) {
    throw new Error('useLocation must be used within a LocationProvider')
  }
  return context
}