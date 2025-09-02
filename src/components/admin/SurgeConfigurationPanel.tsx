'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  CogIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline'
import Button from '@/components/ui/Button'
import { getSystemWideSurgeStatus } from '@/lib/dynamicPricing'

interface SurgeZoneStatus {
  zone: string
  multiplier: number
  isActive: boolean
  primaryFactor: string
  message: string
}

interface PricingConfig {
  baseServiceFee: number
  baseDeliveryFee: number
  maxSurgeMultiplier: number
  minDiscountMultiplier: number
  zoneMultipliers: Record<string, number>
  peakHours: {
    lunch: { start: number; end: number }
    dinner: { start: number; end: number }
    weekend: { start: number; end: number }
  }
}

export default function SurgeConfigurationPanel() {
  const [surgeStatus, setSurgeStatus] = useState<SurgeZoneStatus[]>([])
  const [config, setConfig] = useState<PricingConfig | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')

  useEffect(() => {
    fetchSurgeData()
    const interval = setInterval(fetchSurgeData, 30000) // Refresh every 30 seconds
    return () => clearInterval(interval)
  }, [])

  const fetchSurgeData = async () => {
    try {
      const [statusResponse, configResponse] = await Promise.all([
        fetch('/api/admin/surge/status'),
        fetch('/api/admin/surge/config')
      ])

      if (statusResponse.ok) {
        const status = await statusResponse.json()
        setSurgeStatus(status)
      }

      if (configResponse.ok) {
        const configData = await configResponse.json()
        setConfig(configData)
      }
    } catch (error) {
      console.error('Failed to fetch surge data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveConfig = async () => {
    if (!config) return
    
    setIsSaving(true)
    try {
      const response = await fetch('/api/admin/surge/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      })

      if (response.ok) {
        setSaveMessage('Configuration saved successfully!')
        setTimeout(() => setSaveMessage(''), 3000)
      } else {
        throw new Error('Save failed')
      }
    } catch (error) {
      setSaveMessage('Failed to save configuration')
      setTimeout(() => setSaveMessage(''), 3000)
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Real-time Surge Status */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
            <ClockIcon className="w-6 h-6 text-orange-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Live Surge Status</h3>
            <p className="text-sm text-gray-600">Real-time pricing across all zones</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {surgeStatus.map((zone) => (
            <motion.div
              key={zone.zone}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-4 rounded-xl border-2 ${
                zone.isActive 
                  ? 'bg-orange-50 border-orange-200' 
                  : 'bg-green-50 border-green-200'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-gray-900 capitalize">{zone.zone}</h4>
                <div className={`flex items-center space-x-1 ${
                  zone.isActive ? 'text-orange-600' : 'text-green-600'
                }`}>
                  {zone.isActive ? (
                    <ExclamationTriangleIcon className="w-4 h-4" />
                  ) : (
                    <CheckCircleIcon className="w-4 h-4" />
                  )}
                  <span className="text-sm font-bold">{zone.multiplier.toFixed(1)}x</span>
                </div>
              </div>
              <p className="text-sm text-gray-700">{zone.message}</p>
              <p className="text-xs text-gray-500 mt-1">Primary: {zone.primaryFactor}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Configuration Panel */}
      {config && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <CogIcon className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Surge Configuration</h3>
                <p className="text-sm text-gray-600">Manage dynamic pricing parameters</p>
              </div>
            </div>
            <Button
              onClick={handleSaveConfig}
              disabled={isSaving}
              variant="primary"
              size="sm"
              loading={isSaving}
            >
              Save Changes
            </Button>
          </div>

          {saveMessage && (
            <div className={`mb-4 p-3 rounded-lg ${
              saveMessage.includes('success') 
                ? 'bg-green-50 border border-green-200 text-green-800'
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}>
              {saveMessage}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Base Settings */}
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900">Base Pricing</h4>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Service Fee (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="0.20"
                  value={config.baseServiceFee}
                  onChange={(e) => setConfig(prev => prev ? {
                    ...prev,
                    baseServiceFee: parseFloat(e.target.value)
                  } : null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Base Delivery Fee (₦)
                </label>
                <input
                  type="number"
                  min="0"
                  step="50"
                  value={config.baseDeliveryFee}
                  onChange={(e) => setConfig(prev => prev ? {
                    ...prev,
                    baseDeliveryFee: parseInt(e.target.value)
                  } : null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Surge Limits */}
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900">Surge Limits</h4>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Maximum Surge Multiplier
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="1.0"
                  max="5.0"
                  value={config.maxSurgeMultiplier}
                  onChange={(e) => setConfig(prev => prev ? {
                    ...prev,
                    maxSurgeMultiplier: parseFloat(e.target.value)
                  } : null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">Lagos market standard: 2.5x maximum</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Minimum Discount Multiplier
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0.5"
                  max="1.0"
                  value={config.minDiscountMultiplier}
                  onChange={(e) => setConfig(prev => prev ? {
                    ...prev,
                    minDiscountMultiplier: parseFloat(e.target.value)
                  } : null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">Minimum pricing (0.8 = 20% discount)</p>
              </div>
            </div>
          </div>

          {/* Zone Multipliers */}
          <div className="mt-6">
            <h4 className="font-semibold text-gray-900 mb-4">Zone Multipliers</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.entries(config.zoneMultipliers).map(([zone, multiplier]) => (
                <div key={zone}>
                  <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">
                    {zone}
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    min="0.5"
                    max="2.0"
                    value={multiplier}
                    onChange={(e) => setConfig(prev => prev ? {
                      ...prev,
                      zoneMultipliers: {
                        ...prev.zoneMultipliers,
                        [zone]: parseFloat(e.target.value)
                      }
                    } : null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Peak Hours Configuration */}
          <div className="mt-6">
            <h4 className="font-semibold text-gray-900 mb-4">Peak Hours</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Lunch Rush</label>
                <div className="flex space-x-2">
                  <input
                    type="number"
                    min="0"
                    max="23"
                    value={config.peakHours.lunch.start}
                    onChange={(e) => setConfig(prev => prev ? {
                      ...prev,
                      peakHours: {
                        ...prev.peakHours,
                        lunch: { ...prev.peakHours.lunch, start: parseInt(e.target.value) }
                      }
                    } : null)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    placeholder="Start"
                  />
                  <input
                    type="number"
                    min="0"
                    max="23"
                    value={config.peakHours.lunch.end}
                    onChange={(e) => setConfig(prev => prev ? {
                      ...prev,
                      peakHours: {
                        ...prev.peakHours,
                        lunch: { ...prev.peakHours.lunch, end: parseInt(e.target.value) }
                      }
                    } : null)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    placeholder="End"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Dinner Rush</label>
                <div className="flex space-x-2">
                  <input
                    type="number"
                    min="0"
                    max="23"
                    value={config.peakHours.dinner.start}
                    onChange={(e) => setConfig(prev => prev ? {
                      ...prev,
                      peakHours: {
                        ...prev.peakHours,
                        dinner: { ...prev.peakHours.dinner, start: parseInt(e.target.value) }
                      }
                    } : null)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    placeholder="Start"
                  />
                  <input
                    type="number"
                    min="0"
                    max="23"
                    value={config.peakHours.dinner.end}
                    onChange={(e) => setConfig(prev => prev ? {
                      ...prev,
                      peakHours: {
                        ...prev.peakHours,
                        dinner: { ...prev.peakHours.dinner, end: parseInt(e.target.value) }
                      }
                    } : null)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    placeholder="End"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Weekend Hours</label>
                <div className="flex space-x-2">
                  <input
                    type="number"
                    min="0"
                    max="23"
                    value={config.peakHours.weekend.start}
                    onChange={(e) => setConfig(prev => prev ? {
                      ...prev,
                      peakHours: {
                        ...prev.peakHours,
                        weekend: { ...prev.peakHours.weekend, start: parseInt(e.target.value) }
                      }
                    } : null)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    placeholder="Start"
                  />
                  <input
                    type="number"
                    min="0"
                    max="23"
                    value={config.peakHours.weekend.end}
                    onChange={(e) => setConfig(prev => prev ? {
                      ...prev,
                      peakHours: {
                        ...prev.peakHours,
                        weekend: { ...prev.peakHours.weekend, end: parseInt(e.target.value) }
                      }
                    } : null)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    placeholder="End"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}