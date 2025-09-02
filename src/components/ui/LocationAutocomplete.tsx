'use client'

import { useEffect, useRef, useState } from 'react'
import { initializePlacesAutocomplete } from '@/lib/googleMaps'

interface LocationResult {
  address: string
  coordinates: {
    lat: number
    lng: number
  }
  placeId: string
}

interface LocationAutocompleteProps {
  onLocationSelect: (location: LocationResult) => void
  placeholder?: string
  className?: string
  defaultValue?: string
  restrictToNigeria?: boolean
}

export default function LocationAutocomplete({
  onLocationSelect,
  placeholder = "Enter delivery address",
  className = "",
  defaultValue = "",
  restrictToNigeria = true
}: LocationAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [value, setValue] = useState(defaultValue)

  useEffect(() => {
    async function initAutocomplete() {
      if (!inputRef.current) return

      try {
        setIsLoading(true)
        setError(null)

        const autocompleteInstance = await initializePlacesAutocomplete(
          inputRef.current,
          {
            componentRestrictions: restrictToNigeria ? { country: 'ng' } : undefined,
            types: ['address', 'establishment'],
          }
        )

        // Listen for place selection
        autocompleteInstance.addListener('place_changed', () => {
          const place = autocompleteInstance.getPlace()
          
          if (!place.geometry || !place.geometry.location) {
            setError('Please select a valid address from the dropdown')
            return
          }

          const location: LocationResult = {
            address: place.formatted_address || place.name || '',
            coordinates: {
              lat: place.geometry.location.lat(),
              lng: place.geometry.location.lng()
            },
            placeId: place.place_id || ''
          }

          setValue(location.address)
          setError(null)
          onLocationSelect(location)
        })

        setAutocomplete(autocompleteInstance)

      } catch (err) {
        // Enhanced fallback with better error handling
        const errorMessage = err instanceof Error ? err.message : 'Unknown error'
        setError('Maps autocomplete unavailable. Enter your address and press Tab or Enter.')
        
        // Create enhanced fallback functionality
        if (inputRef.current) {
          const handleFallbackSubmit = () => {
            const address = inputRef.current?.value.trim()
            if (address && address.length > 5) {
              let coordinates = { lat: 6.5244, lng: 3.3792 } // Default: Lagos center
              
              // Simple address parsing for better coordinate estimation
              const addressLower = address.toLowerCase()
              if (addressLower.includes('victoria island') || addressLower.includes('vi')) {
                coordinates = { lat: 6.4281, lng: 3.4219 }
              } else if (addressLower.includes('lekki')) {
                coordinates = { lat: 6.4698, lng: 3.5852 }
              } else if (addressLower.includes('ikeja')) {
                coordinates = { lat: 6.6018, lng: 3.3515 }
              } else if (addressLower.includes('mainland')) {
                coordinates = { lat: 6.5355, lng: 3.3087 }
              }
              
              const fallbackLocation = {
                address: address,
                coordinates,
                placeId: 'manual-entry-' + Date.now()
              }
              setValue(address)
              setError(null)
              onLocationSelect(fallbackLocation)
            } else if (address) {
              setError('Please enter a more specific address (at least 5 characters)')
            }
          }
          
          // Handle Enter key and Tab key
          const keyHandler = (e: KeyboardEvent) => {
            if (e.key === 'Enter' || e.key === 'Tab') {
              e.preventDefault()
              handleFallbackSubmit()
            }
          }
          
          // Handle blur event
          inputRef.current.addEventListener('keydown', keyHandler)
          inputRef.current.addEventListener('blur', handleFallbackSubmit)
          
          // Cleanup function
          return () => {
            if (inputRef.current) {
              inputRef.current.removeEventListener('keydown', keyHandler)
              inputRef.current.removeEventListener('blur', handleFallbackSubmit)
            }
          }
        }
      } finally {
        setIsLoading(false)
      }
    }

    initAutocomplete()
  }, [restrictToNigeria, onLocationSelect])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value)
    setError(null)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Prevent form submission when pressing Enter in autocomplete
    if (e.key === 'Enter') {
      e.preventDefault()
    }
  }

  return (
    <div className="relative">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent pl-12 ${className}`}
          disabled={isLoading}
        />
        
        {/* Location icon */}
        <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
          {isLoading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-orange-500"></div>
          ) : (
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          )}
        </div>
      </div>
      
      {error && (
        <div className="mt-2 p-3 bg-orange-50 border border-orange-200 rounded-lg">
          <p className="text-sm text-orange-800 flex items-center gap-2">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </p>
          {error.includes('unavailable') && (
            <p className="text-xs text-orange-600 mt-1">
              💡 Type your address and press <kbd className="px-1 py-0.5 bg-orange-100 rounded text-xs">Enter</kbd> or <kbd className="px-1 py-0.5 bg-orange-100 rounded text-xs">Tab</kbd>
            </p>
          )}
        </div>
      )}
      
      {restrictToNigeria && (
        <p className="mt-1 text-xs text-gray-500">
          📍 Delivery available in Lagos, Nigeria
        </p>
      )}
    </div>
  )
}