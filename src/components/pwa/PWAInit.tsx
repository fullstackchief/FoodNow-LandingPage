'use client'

import { useEffect, useState } from 'react'
import { Download, X } from 'lucide-react'
import { 
  initializePWA, 
  canInstallPWA, 
  installPWA, 
  isPWAInstalled,
  setupNetworkStatusHandling,
  requestNotificationPermission 
} from '@/lib/pwa'

export default function PWAInit() {
  const [showInstallPrompt, setShowInstallPrompt] = useState(false)
  const [isInstallable, setIsInstallable] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    // Initialize PWA functionality
    initializePWA()
    setupNetworkStatusHandling()
    
    // Check initial PWA state
    setIsInstalled(isPWAInstalled())
    
    // Listen for PWA install availability
    const handleInstallAvailable = () => {
      setIsInstallable(true)
      // Show install prompt after 30 seconds if not installed
      setTimeout(() => {
        if (!isPWAInstalled() && canInstallPWA()) {
          setShowInstallPrompt(true)
        }
      }, 30000)
    }

    window.addEventListener('pwa-install-available', handleInstallAvailable)
    
    // Request notification permission after user interaction
    const handleFirstInteraction = () => {
      requestNotificationPermission()
      document.removeEventListener('click', handleFirstInteraction)
      document.removeEventListener('touchstart', handleFirstInteraction)
    }
    
    document.addEventListener('click', handleFirstInteraction)
    document.addEventListener('touchstart', handleFirstInteraction)

    return () => {
      window.removeEventListener('pwa-install-available', handleInstallAvailable)
      document.removeEventListener('click', handleFirstInteraction)
      document.removeEventListener('touchstart', handleFirstInteraction)
    }
  }, [])

  const handleInstall = async () => {
    const result = await installPWA()
    
    if (result === 'accepted') {
      setShowInstallPrompt(false)
      setIsInstalled(true)
      
      // Track installation
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'pwa_install_accepted', {
          event_category: 'PWA',
          event_label: 'User Accepted Install'
        })
      }
    }
  }

  const handleDismiss = () => {
    setShowInstallPrompt(false)
    
    // Don't show again for 24 hours
    localStorage.setItem('pwa-install-dismissed', Date.now().toString())
    
    // Track dismissal
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'pwa_install_dismissed', {
        event_category: 'PWA',
        event_label: 'User Dismissed Install'
      })
    }
  }

  // Don't show if already installed or recently dismissed
  if (isInstalled || !showInstallPrompt || !isInstallable) {
    return null
  }

  // Check if recently dismissed
  const dismissedTime = localStorage.getItem('pwa-install-dismissed')
  if (dismissedTime && Date.now() - parseInt(dismissedTime) < 24 * 60 * 60 * 1000) {
    return null
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 bg-white rounded-2xl shadow-xl border border-gray-200 p-4 z-50 md:bottom-6 md:left-6 md:right-auto md:max-w-sm">
      <div className="flex items-start space-x-3">
        <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
          <Download className="w-5 h-5 text-white" />
        </div>
        
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-gray-900 text-sm">
            Install FoodNow App
          </h4>
          <p className="text-xs text-gray-600 mt-1 line-clamp-2">
            Get faster access and offline features. Install our app for the best experience!
          </p>
          
          <div className="flex space-x-2 mt-3">
            <button
              onClick={handleInstall}
              className="text-xs bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors font-medium"
            >
              Install App
            </button>
            <button
              onClick={handleDismiss}
              className="text-xs text-gray-500 hover:text-gray-700 transition-colors px-2"
            >
              Not now
            </button>
          </div>
        </div>
        
        <button
          onClick={handleDismiss}
          className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}