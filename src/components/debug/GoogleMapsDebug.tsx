'use client'

import { useState, useEffect } from 'react'

interface DebugInfo {
  timestamp: string
  environment: {
    isBrowser: boolean
    userAgent: string
    envVars: string[]
    apiKey: string | undefined
    apiKeyLength: number
    apiKeySource: string
  }
  googleMaps: {
    scriptLoaded: boolean
    apiAvailable: boolean
    librariesAvailable: string[]
    loadingStatus: string
    errors: string[]
  }
  location: {
    geolocationSupported: boolean
    permissionStatus: string
    lastKnownPosition: any
  }
  connectivity: {
    online: boolean
    googleReachable: boolean
    mapsApiReachable: boolean
  }
}

export default function GoogleMapsDebug() {
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [testResults, setTestResults] = useState<string[]>([])

  const collectDebugInfo = async (): Promise<DebugInfo> => {
    const info: DebugInfo = {
      timestamp: new Date().toISOString(),
      environment: {
        isBrowser: typeof window !== 'undefined',
        userAgent: typeof window !== 'undefined' ? navigator.userAgent : 'N/A',
        envVars: typeof process !== 'undefined' ? Object.keys(process.env).filter(k => k.includes('GOOGLE')) : [],
        apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
        apiKeyLength: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.length || 0,
        apiKeySource: 'process.env'
      },
      googleMaps: {
        scriptLoaded: typeof window !== 'undefined' && !!document.querySelector('script[src*="maps.googleapis.com"]'),
        apiAvailable: typeof window !== 'undefined' && !!(window as any).google?.maps,
        librariesAvailable: typeof window !== 'undefined' ? 
          Object.keys((window as any).google?.maps || {}) : [],
        loadingStatus: 'unknown',
        errors: []
      },
      location: {
        geolocationSupported: typeof navigator !== 'undefined' && !!navigator.geolocation,
        permissionStatus: 'unknown',
        lastKnownPosition: null
      },
      connectivity: {
        online: typeof navigator !== 'undefined' ? navigator.onLine : false,
        googleReachable: false,
        mapsApiReachable: false
      }
    }

    // Check API key from multiple sources
    if (!info.environment.apiKey) {
      // Try window object
      const windowKey = (window as any).__NEXT_DATA__?.env?.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
      if (windowKey) {
        info.environment.apiKey = windowKey
        info.environment.apiKeySource = 'window.__NEXT_DATA__'
        info.environment.apiKeyLength = windowKey.length
      }
    }

    // Check geolocation permission
    if (typeof navigator !== 'undefined' && 'permissions' in navigator) {
      try {
        const permission = await navigator.permissions.query({name: 'geolocation' as PermissionName})
        info.location.permissionStatus = permission.state
      } catch (e) {
        info.location.permissionStatus = 'query failed'
      }
    }

    // Test connectivity - CSP-safe implementation
    if (typeof window !== 'undefined') {
      // Check if Google Maps is already loaded
      info.connectivity.googleReachable = typeof window.google !== 'undefined'
      
      // Test Maps API by checking if we can access the constructor
      if (info.environment.apiKey) {
        if (window.google?.maps) {
          try {
            // Test if Maps API is functional by checking core objects
            info.connectivity.mapsApiReachable = !!(window.google.maps.Map && window.google.maps.LatLng)
          } catch (e) {
            info.connectivity.mapsApiReachable = false
            info.googleMaps.errors.push('Maps API not functional')
          }
        } else {
          // API key exists but Maps not loaded yet
          info.connectivity.mapsApiReachable = false
          info.googleMaps.errors.push('Maps API not loaded yet')
        }
      } else {
        info.googleMaps.errors.push('No API key available for testing')
      }
    }

    return info
  }

  const runDiagnosticTests = async () => {
    const results: string[] = []
    results.push(`🧪 Running diagnostic tests at ${new Date().toLocaleTimeString()}`)

    // Test 1: Environment variables
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
    results.push(`📋 API Key Test: ${apiKey ? '✅ FOUND' : '❌ MISSING'} (${apiKey?.length || 0} chars)`)

    // Test 2: Browser environment
    results.push(`🌐 Browser Environment: ${typeof window !== 'undefined' ? '✅ CLIENT' : '❌ SERVER'}`)

    // Test 3: Google Maps loading
    try {
      if (apiKey) {
        results.push('🚀 Attempting to load Google Maps...')
        
        const script = document.createElement('script')
        const callbackName = 'testGoogleMaps' + Date.now()
        
        const loadPromise = new Promise((resolve, reject) => {
          (window as any)[callbackName] = () => {
            results.push('✅ Google Maps script loaded successfully')
            delete (window as any)[callbackName]
            resolve(true)
          }
          
          script.onerror = () => {
            results.push('❌ Google Maps script failed to load')
            delete (window as any)[callbackName]
            reject(new Error('Script load failed'))
          }
          
          script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=${callbackName}`
          document.head.appendChild(script)
        })

        setTimeout(() => {
          results.push('⏰ Google Maps loading timeout (10s)')
        }, 10000)

        await loadPromise
        results.push('🗺️ Google Maps API is functional!')
        
      } else {
        results.push('❌ Cannot test Google Maps without API key')
      }
    } catch (error) {
      results.push(`❌ Google Maps test failed: ${(error as Error).message}`)
    }

    // Test 4: Location services
    if (navigator.geolocation) {
      results.push('📍 Testing location services...')
      
      const locationPromise = new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          timeout: 5000,
          enableHighAccuracy: false,
          maximumAge: 300000
        })
      })

      try {
        const position = await locationPromise
        results.push(`✅ Location detected: ${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`)
      } catch (error) {
        results.push(`❌ Location failed: ${(error as GeolocationPositionError).message}`)
      }
    } else {
      results.push('❌ Geolocation not supported')
    }

    results.push('🏁 Diagnostic tests completed')
    setTestResults(results)
  }

  useEffect(() => {
    collectDebugInfo().then(setDebugInfo)
  }, [])

  if (!debugInfo) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button 
          onClick={() => collectDebugInfo().then(setDebugInfo)}
          className="bg-blue-600 text-white px-3 py-1 rounded text-sm"
        >
          🔍 Debug
        </button>
      </div>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {!isVisible ? (
        <button
          onClick={() => setIsVisible(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-lg text-sm font-medium"
        >
          🔍 Debug Maps ({debugInfo.googleMaps.errors.length} errors)
        </button>
      ) : (
        <div className="bg-white rounded-lg shadow-xl border max-w-2xl max-h-96 overflow-auto">
          <div className="bg-blue-600 text-white px-4 py-2 flex justify-between items-center">
            <h3 className="font-semibold">Google Maps Debug Info</h3>
            <button 
              onClick={() => setIsVisible(false)}
              className="text-white hover:text-gray-200"
            >
              ✕
            </button>
          </div>
          
          <div className="p-4 space-y-4 text-sm">
            {/* Environment Section */}
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">🌍 Environment</h4>
              <div className="bg-gray-50 p-2 rounded space-y-1">
                <div>Browser: {debugInfo.environment.isBrowser ? '✅' : '❌'}</div>
                <div>API Key: {debugInfo.environment.apiKey ? `✅ (${debugInfo.environment.apiKeyLength} chars)` : '❌ Missing'}</div>
                <div>Source: {debugInfo.environment.apiKeySource}</div>
                <div>Env Vars: {debugInfo.environment.envVars.join(', ') || 'None found'}</div>
              </div>
            </div>

            {/* Google Maps Section */}
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">🗺️ Google Maps</h4>
              <div className="bg-gray-50 p-2 rounded space-y-1">
                <div>Script Loaded: {debugInfo.googleMaps.scriptLoaded ? '✅' : '❌'}</div>
                <div>API Available: {debugInfo.googleMaps.apiAvailable ? '✅' : '❌'}</div>
                <div>Libraries: {debugInfo.googleMaps.librariesAvailable.length > 0 ? 
                  debugInfo.googleMaps.librariesAvailable.join(', ') : 'None'}</div>
                {debugInfo.googleMaps.errors.length > 0 && (
                  <div className="text-red-600">
                    Errors: {debugInfo.googleMaps.errors.join(', ')}
                  </div>
                )}
              </div>
            </div>

            {/* Location Section */}
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">📍 Location</h4>
              <div className="bg-gray-50 p-2 rounded space-y-1">
                <div>Geolocation: {debugInfo.location.geolocationSupported ? '✅' : '❌'}</div>
                <div>Permission: {debugInfo.location.permissionStatus}</div>
              </div>
            </div>

            {/* Connectivity Section */}
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">🌐 Connectivity</h4>
              <div className="bg-gray-50 p-2 rounded space-y-1">
                <div>Online: {debugInfo.connectivity.online ? '✅' : '❌'}</div>
                <div>Google Reachable: {debugInfo.connectivity.googleReachable ? '✅' : '❌'}</div>
                <div>Maps API: {debugInfo.connectivity.mapsApiReachable ? '✅' : '❌'}</div>
              </div>
            </div>

            {/* Test Results */}
            {testResults.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-800 mb-2">🧪 Test Results</h4>
                <div className="bg-black text-green-400 p-2 rounded font-mono text-xs max-h-32 overflow-y-auto">
                  {testResults.map((result, idx) => (
                    <div key={idx}>{result}</div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2 border-t">
              <button
                onClick={() => collectDebugInfo().then(setDebugInfo)}
                className="bg-blue-500 text-white px-3 py-1 rounded text-xs"
              >
                🔄 Refresh
              </button>
              <button
                onClick={runDiagnosticTests}
                className="bg-green-500 text-white px-3 py-1 rounded text-xs"
              >
                🧪 Run Tests
              </button>
              <button
                onClick={() => {
                  const data = JSON.stringify(debugInfo, null, 2)
                  navigator.clipboard?.writeText(data)
                  alert('Debug info copied to clipboard!')
                }}
                className="bg-purple-500 text-white px-3 py-1 rounded text-xs"
              >
                📋 Copy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}