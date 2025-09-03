'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Wifi, WifiOff, RefreshCw, Home, Search, User } from 'lucide-react'

export default function OfflinePage() {
  const [isOnline, setIsOnline] = useState(false)
  const [isRetrying, setIsRetrying] = useState(false)

  useEffect(() => {
    const updateOnlineStatus = () => {
      setIsOnline(navigator.onLine)
    }

    updateOnlineStatus()
    window.addEventListener('online', updateOnlineStatus)
    window.addEventListener('offline', updateOnlineStatus)

    return () => {
      window.removeEventListener('online', updateOnlineStatus)
      window.removeEventListener('offline', updateOnlineStatus)
    }
  }, [])

  const handleRetry = async () => {
    setIsRetrying(true)
    
    try {
      const response = await fetch('/api/health')
      if (response.ok) {
        window.location.reload()
      }
    } catch (error) {
      console.log('Still offline')
    } finally {
      setIsRetrying(false)
    }
  }

  if (isOnline) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center">
          <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <Wifi className="w-10 h-10 text-white" />
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            You're Back Online!
          </h1>
          
          <p className="text-gray-600 mb-8">
            Great! Your internet connection has been restored. You can now continue using FoodNow.
          </p>

          <div className="space-y-4">
            <button
              onClick={() => window.location.reload()}
              className="w-full btn-primary flex items-center justify-center space-x-2"
            >
              <RefreshCw className="w-5 h-5" />
              <span>Refresh App</span>
            </button>

            <Link
              href="/"
              className="w-full btn-outline flex items-center justify-center space-x-2"
            >
              <Home className="w-5 h-5" />
              <span>Go to Home</span>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center">
        <div className="w-20 h-20 bg-gray-400 rounded-full flex items-center justify-center mx-auto mb-6">
          <WifiOff className="w-10 h-10 text-white" />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          You're Currently Offline
        </h1>
        
        <p className="text-gray-600 mb-8">
          Don't worry! You can still browse your recent orders and saved restaurants. 
          We'll sync everything once you're back online.
        </p>

        <div className="space-y-4 mb-8">
          <button
            onClick={handleRetry}
            disabled={isRetrying}
            className="w-full btn-primary flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 ${isRetrying ? 'animate-spin' : ''}`} />
            <span>{isRetrying ? 'Checking...' : 'Try Again'}</span>
          </button>

          <div className="grid grid-cols-2 gap-4">
            <Link
              href="/"
              className="flex flex-col items-center p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors"
            >
              <Home className="w-6 h-6 text-gray-600 mb-2" />
              <span className="text-sm font-medium text-gray-700">Home</span>
            </Link>

            <Link
              href="/profile"
              className="flex flex-col items-center p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors"
            >
              <User className="w-6 h-6 text-gray-600 mb-2" />
              <span className="text-sm font-medium text-gray-700">Profile</span>
            </Link>
          </div>
        </div>

        <div className="bg-orange-50 rounded-2xl p-4">
          <h3 className="font-semibold text-orange-800 mb-2">
            Available Offline:
          </h3>
          <ul className="text-sm text-orange-700 space-y-1">
            <li>• View recent orders</li>
            <li>• Browse saved restaurants</li>
            <li>• Check order history</li>
            <li>• Update profile settings</li>
          </ul>
        </div>
      </div>
    </div>
  )
}