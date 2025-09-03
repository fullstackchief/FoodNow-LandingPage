/**
 * Progressive Web App (PWA) Utilities
 * ===================================
 * Service worker registration, push notifications, and PWA features
 */

import { devLog, prodLog } from '@/lib/logger'

export interface PWAInstallPrompt {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export interface NotificationOptions {
  title: string
  body: string
  icon?: string
  badge?: string
  image?: string
  data?: any
  tag?: string
  requireInteraction?: boolean
  silent?: boolean
  actions?: Array<{
    action: string
    title: string
    icon?: string
  }>
}

// PWA installation state
let deferredPrompt: PWAInstallPrompt | null = null
let isServiceWorkerRegistered = false

/**
 * Register service worker for PWA functionality
 */
export async function registerServiceWorker(): Promise<boolean> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    devLog.warn('Service Worker not supported')
    return false
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
      updateViaCache: 'none'
    })

    devLog.info('Service Worker registered successfully', {
      scope: registration.scope,
      installing: !!registration.installing,
      waiting: !!registration.waiting,
      active: !!registration.active
    })

    // Handle updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed') {
            if (navigator.serviceWorker.controller) {
              // New update available
              showUpdateNotification()
            } else {
              // First time installation
              devLog.info('Service Worker installed for first time')
            }
          }
        })
      }
    })

    isServiceWorkerRegistered = true
    return true
  } catch (error) {
    prodLog.error('Service Worker registration failed', error)
    return false
  }
}

/**
 * Check if app can be installed as PWA
 */
export function canInstallPWA(): boolean {
  return deferredPrompt !== null
}

/**
 * Show PWA install prompt
 */
export async function installPWA(): Promise<'accepted' | 'dismissed' | 'not-available'> {
  if (!deferredPrompt) {
    return 'not-available'
  }

  try {
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    
    devLog.info('PWA install prompt result:', outcome)
    
    if (outcome === 'accepted') {
      deferredPrompt = null
    }
    
    return outcome
  } catch (error) {
    prodLog.error('Error showing PWA install prompt', error)
    return 'dismissed'
  }
}

/**
 * Setup PWA install prompt handling
 */
export function setupPWAInstallPrompt(): void {
  if (typeof window === 'undefined') return

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    deferredPrompt = e as any
    devLog.info('PWA install prompt available')
    
    // Notify app that install is available
    window.dispatchEvent(new CustomEvent('pwa-install-available'))
  })

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null
    devLog.info('PWA installed successfully')
    
    // Track installation
    if (typeof gtag !== 'undefined') {
      gtag('event', 'pwa_install', {
        event_category: 'PWA',
        event_label: 'Installation'
      })
    }
  })
}

/**
 * Request notification permission
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    devLog.warn('Notifications not supported')
    return 'denied'
  }

  if (Notification.permission === 'granted') {
    return 'granted'
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission()
    devLog.info('Notification permission requested:', permission)
    return permission
  }

  return Notification.permission
}

/**
 * Subscribe to push notifications
 */
export async function subscribeToPushNotifications(): Promise<PushSubscription | null> {
  if (!isServiceWorkerRegistered || !('PushManager' in window)) {
    devLog.warn('Push notifications not supported')
    return null
  }

  try {
    const registration = await navigator.serviceWorker.ready
    
    // Check if already subscribed
    const existingSubscription = await registration.pushManager.getSubscription()
    if (existingSubscription) {
      return existingSubscription
    }

    // Get VAPID public key from server
    const vapidResponse = await fetch('/api/push/vapid-key')
    if (!vapidResponse.ok) {
      throw new Error('Failed to get VAPID key')
    }
    
    const { publicKey } = await vapidResponse.json()

    // Subscribe to push notifications
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource
    })

    // Send subscription to server
    const subscribeResponse = await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(subscription)
    })

    if (!subscribeResponse.ok) {
      throw new Error('Failed to save subscription')
    }

    devLog.info('Push notification subscription successful')
    return subscription
  } catch (error) {
    prodLog.error('Push notification subscription failed', error)
    return null
  }
}

/**
 * Send local notification
 */
export async function sendLocalNotification(options: NotificationOptions): Promise<boolean> {
  const permission = await requestNotificationPermission()
  
  if (permission !== 'granted') {
    devLog.warn('Notification permission not granted')
    return false
  }

  try {
    const notification = new Notification(options.title, {
      body: options.body,
      icon: options.icon || '/images/icons/icon-192x192.png',
      badge: options.badge || '/images/icons/badge-72x72.png',
      data: options.data,
      tag: options.tag,
      requireInteraction: options.requireInteraction,
      silent: options.silent
    } as NotificationOptions)

    notification.onclick = () => {
      window.focus()
      notification.close()
      
      if (options.data?.url) {
        window.location.href = options.data.url
      }
    }

    return true
  } catch (error) {
    prodLog.error('Failed to send local notification', error)
    return false
  }
}

/**
 * Check if running in standalone PWA mode
 */
export function isPWAInstalled(): boolean {
  if (typeof window === 'undefined') return false
  
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true ||
    document.referrer.includes('android-app://')
  )
}

/**
 * Get PWA display mode
 */
export function getPWADisplayMode(): 'standalone' | 'minimal-ui' | 'fullscreen' | 'browser' {
  if (typeof window === 'undefined') return 'browser'
  
  if (window.matchMedia('(display-mode: standalone)').matches) {
    return 'standalone'
  }
  if (window.matchMedia('(display-mode: minimal-ui)').matches) {
    return 'minimal-ui'
  }
  if (window.matchMedia('(display-mode: fullscreen)').matches) {
    return 'fullscreen'
  }
  
  return 'browser'
}

/**
 * Update service worker
 */
export async function updateServiceWorker(): Promise<boolean> {
  if (!isServiceWorkerRegistered) {
    return false
  }

  try {
    const registration = await navigator.serviceWorker.ready
    await registration.update()
    devLog.info('Service Worker update initiated')
    return true
  } catch (error) {
    prodLog.error('Service Worker update failed', error)
    return false
  }
}

/**
 * Show update notification when new version available
 */
function showUpdateNotification(): void {
  // Create custom update notification
  const notification = document.createElement('div')
  notification.innerHTML = `
    <div id="pwa-update-notification" class="fixed top-4 right-4 bg-white rounded-2xl shadow-xl p-4 border border-gray-200 z-50 max-w-sm">
      <div class="flex items-start space-x-3">
        <div class="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
          <svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clip-rule="evenodd"></path>
          </svg>
        </div>
        <div class="flex-1">
          <h4 class="font-semibold text-gray-900">App Update Available</h4>
          <p class="text-sm text-gray-600 mt-1">A new version of FoodNow is ready!</p>
          <div class="flex space-x-2 mt-3">
            <button onclick="window.location.reload()" class="text-xs bg-orange-500 text-white px-3 py-1 rounded-lg hover:bg-orange-600 transition-colors">
              Update Now
            </button>
            <button onclick="document.getElementById('pwa-update-notification').remove()" class="text-xs text-gray-500 hover:text-gray-700 transition-colors">
              Later
            </button>
          </div>
        </div>
        <button onclick="document.getElementById('pwa-update-notification').remove()" class="text-gray-400 hover:text-gray-600">
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path>
          </svg>
        </button>
      </div>
    </div>
  `
  
  document.body.appendChild(notification)
  
  // Auto-remove after 10 seconds
  setTimeout(() => {
    const elem = document.getElementById('pwa-update-notification')
    if (elem) {
      elem.remove()
    }
  }, 10000)
}

/**
 * Convert VAPID key to Uint8Array
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/')

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

/**
 * Initialize PWA functionality
 */
export function initializePWA(): void {
  if (typeof window === 'undefined') return

  // Register service worker
  registerServiceWorker()
  
  // Setup install prompt
  setupPWAInstallPrompt()
  
  // Log PWA status
  devLog.info('PWA initialized', {
    isPWAInstalled: isPWAInstalled(),
    displayMode: getPWADisplayMode(),
    notificationPermission: 'Notification' in window ? Notification.permission : 'not-supported'
  })
}

/**
 * Check network status and update UI accordingly
 */
export function setupNetworkStatusHandling(): void {
  if (typeof window === 'undefined') return

  const updateNetworkStatus = () => {
    const isOnline = navigator.onLine
    document.body.classList.toggle('offline', !isOnline)
    
    // Dispatch custom event
    window.dispatchEvent(new CustomEvent('network-status-change', {
      detail: { isOnline }
    }))
    
    devLog.info('Network status changed:', isOnline ? 'online' : 'offline')
  }

  window.addEventListener('online', updateNetworkStatus)
  window.addEventListener('offline', updateNetworkStatus)
  
  // Initial status
  updateNetworkStatus()
}

/**
 * Add to home screen prompt for iOS
 */
export function showIOSInstallPrompt(): void {
  if (typeof window === 'undefined') return

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
  const isStandalone = (window.navigator as any).standalone

  if (isIOS && !isStandalone) {
    // Show iOS-specific install instructions
    const iosPrompt = document.createElement('div')
    iosPrompt.innerHTML = `
      <div id="ios-install-prompt" class="fixed bottom-4 left-4 right-4 bg-white rounded-2xl shadow-xl p-4 border border-gray-200 z-50">
        <div class="flex items-start space-x-3">
          <div class="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
            <svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clip-rule="evenodd"></path>
            </svg>
          </div>
          <div class="flex-1">
            <h4 class="font-semibold text-gray-900">Install FoodNow App</h4>
            <p class="text-sm text-gray-600 mt-1">
              Tap the share button 
              <svg class="inline w-4 h-4 mx-1" fill="currentColor" viewBox="0 0 20 20">
                <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z"></path>
              </svg>
              and select "Add to Home Screen"
            </p>
            <button onclick="document.getElementById('ios-install-prompt').remove()" class="text-xs bg-blue-500 text-white px-3 py-1 rounded-lg hover:bg-blue-600 transition-colors mt-2">
              Got it
            </button>
          </div>
          <button onclick="document.getElementById('ios-install-prompt').remove()" class="text-gray-400 hover:text-gray-600">
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path>
            </svg>
          </button>
        </div>
      </div>
    `
    
    document.body.appendChild(iosPrompt)
    
    // Auto-remove after 15 seconds
    setTimeout(() => {
      const elem = document.getElementById('ios-install-prompt')
      if (elem) {
        elem.remove()
      }
    }, 15000)
  }
}

/**
 * Cache important resources
 */
export async function cacheImportantResources(urls: string[]): Promise<void> {
  if (!isServiceWorkerRegistered) return

  try {
    const registration = await navigator.serviceWorker.ready
    registration.active?.postMessage({
      type: 'CACHE_URLS',
      urls
    })
    
    devLog.info('Resources queued for caching:', urls.length)
  } catch (error) {
    prodLog.error('Failed to cache resources', error)
  }
}

/**
 * Clear all PWA caches
 */
export async function clearPWACaches(): Promise<void> {
  if (!('caches' in window)) return

  try {
    const cacheNames = await caches.keys()
    await Promise.all(
      cacheNames
        .filter(name => name.startsWith('foodnow-'))
        .map(name => caches.delete(name))
    )
    
    devLog.info('PWA caches cleared')
  } catch (error) {
    prodLog.error('Failed to clear PWA caches', error)
  }
}

/**
 * Get PWA installation stats
 */
export function getPWAStats(): {
  isInstalled: boolean
  isStandalone: boolean
  displayMode: string
  hasNotificationPermission: boolean
  hasServiceWorker: boolean
} {
  return {
    isInstalled: isPWAInstalled(),
    isStandalone: getPWADisplayMode() === 'standalone',
    displayMode: getPWADisplayMode(),
    hasNotificationPermission: typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted',
    hasServiceWorker: isServiceWorkerRegistered
  }
}