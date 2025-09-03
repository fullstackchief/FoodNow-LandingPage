'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Settings, MapPin, Save, RefreshCw } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { systemSettings } from '@/lib/systemSettings'

export default function DeliverySettingsPage() {
  const { isAdminAuthenticated, adminUser } = useAuth()
  const router = useRouter()
  const [deliveryRadius, setDeliveryRadius] = useState(20)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState('')

  // Authentication check
  useEffect(() => {
    if (!isAdminAuthenticated || !adminUser) {
      router.push('/admin-system')
      return
    }
    
    // Check super admin permission for system settings
    if (adminUser.role !== 'super_admin' && !adminUser.permissions?.system?.includes('system_settings')) {
      router.push('/admin-system/dashboard')
      return
    }
  }, [isAdminAuthenticated, adminUser, router])

  useEffect(() => {
    if (isAdminAuthenticated && adminUser) {
      loadSettings()
    }
  }, [isAdminAuthenticated, adminUser])

  const loadSettings = async () => {
    try {
      setIsLoading(true)
      const radius = await systemSettings.getDeliveryRadius()
      setDeliveryRadius(radius)
    } catch (error) {
      console.error('Failed to load settings:', error)
      setMessage('Failed to load settings')
    } finally {
      setIsLoading(false)
    }
  }

  const saveSettings = async () => {
    try {
      setIsSaving(true)
      setMessage('')
      
      const success = await systemSettings.updateSetting(
        'max_delivery_distance_km', 
        deliveryRadius, 
        'number'
      )
      
      if (success) {
        setMessage('✅ Delivery radius updated successfully!')
        setTimeout(() => setMessage(''), 3000)
      } else {
        setMessage('❌ Failed to update delivery radius')
      }
    } catch (error) {
      console.error('Failed to save settings:', error)
      setMessage('❌ Error saving settings')
    } finally {
      setIsSaving(false)
    }
  }

  // Show loading while checking authentication
  if (!isAdminAuthenticated || !adminUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Checking admin access...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4 flex items-center justify-center gap-3">
            <Settings className="w-10 h-10 text-orange-600" />
            Delivery Settings
          </h1>
          <p className="text-lg text-gray-600">
            Configure delivery radius and zone settings for the platform
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <MapPin className="w-6 h-6 text-orange-600" />
            Delivery Radius Configuration
          </h2>

          {message && (
            <div className={`mb-4 p-3 rounded-lg ${
              message.includes('✅') 
                ? 'bg-green-50 border border-green-200 text-green-800'
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}>
              {message}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Settings Panel */}
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Maximum Delivery Distance (km)
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={deliveryRadius}
                    onChange={(e) => setDeliveryRadius(Number(e.target.value))}
                    disabled={isLoading}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:opacity-50"
                  />
                  <span className="text-gray-600 font-medium">km</span>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  Restaurants beyond this distance won&apos;t be shown to users
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={saveSettings}
                  disabled={isSaving || isLoading}
                  className="flex items-center gap-2 bg-orange-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-orange-700 transition-colors disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {isSaving ? 'Saving...' : 'Save Settings'}
                </button>
                
                <button
                  onClick={loadSettings}
                  disabled={isLoading}
                  className="flex items-center gap-2 border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  <RefreshCw className="w-4 h-4" />
                  Reload
                </button>
              </div>
            </div>

            {/* Preview Panel */}
            <div className="space-y-6">
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Impact Preview</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Current Radius:</span>
                    <span className="font-medium">{deliveryRadius} km</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Coverage Area:</span>
                    <span className="font-medium">~{Math.round(Math.PI * deliveryRadius * deliveryRadius)} km²</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Example Cities:</span>
                    <span className="font-medium">
                      {deliveryRadius >= 50 ? 'Inter-state' : 
                       deliveryRadius >= 25 ? 'Greater Lagos' : 
                       deliveryRadius >= 15 ? 'Lagos Island + Mainland' : 
                       'Lagos Core Areas'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">📍 How It Works</h4>
                <div className="text-sm text-blue-800 space-y-1">
                  <div>• Users see only restaurants within delivery radius</div>
                  <div>• Restaurants are sorted by distance (closest first)</div>
                  <div>• Distance calculated using GPS coordinates</div>
                  <div>• Settings apply immediately to all users</div>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-medium text-yellow-800 mb-2">⚠️ Recommended Values</h4>
                <div className="text-sm text-yellow-700 space-y-1">
                  <div>• <strong>5-10 km:</strong> Dense urban areas (Lagos Island)</div>
                  <div>• <strong>15-20 km:</strong> Metropolitan areas (Greater Lagos)</div>
                  <div>• <strong>25+ km:</strong> Extended coverage areas</div>
                  <div>• <strong>Current default:</strong> {deliveryRadius} km</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Back Navigation */}
        <div className="mt-8 text-center">
          <button
            onClick={() => window.history.back()}
            className="text-orange-600 hover:text-orange-700 font-medium"
          >
            ← Back to Admin Dashboard
          </button>
        </div>
      </div>
    </div>
  )
}