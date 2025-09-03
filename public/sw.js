/**
 * FoodNow Service Worker
 * =====================
 * Progressive Web App service worker for offline functionality,
 * push notifications, and performance optimization
 */

const CACHE_NAME = 'foodnow-v1.0.0'
const API_CACHE_NAME = 'foodnow-api-v1.0.0'
const STATIC_CACHE_NAME = 'foodnow-static-v1.0.0'

// Files to cache for offline functionality
const STATIC_CACHE_URLS = [
  '/',
  '/browse',
  '/search',
  '/orders',
  '/profile',
  '/auth/login',
  '/auth/signup',
  '/offline',
  '/manifest.json',
  '/images/icons/icon-192x192.png',
  '/images/icons/icon-512x512.png',
  '/images/logo.png'
]

// API endpoints to cache for offline functionality
const CACHEABLE_API_PATTERNS = [
  /\/api\/restaurants$/,
  /\/api\/menu\/\w+$/,
  /\/api\/categories$/
]

// Network-first API patterns (always try network first)
const NETWORK_FIRST_PATTERNS = [
  /\/api\/orders/,
  /\/api\/payments/,
  /\/api\/auth/,
  /\/api\/webhooks/
]

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker v1.0.0')
  
  event.waitUntil(
    Promise.all([
      // Cache static files
      caches.open(STATIC_CACHE_NAME).then((cache) => {
        return cache.addAll(STATIC_CACHE_URLS)
      }),
      // Skip waiting to activate immediately
      self.skipWaiting()
    ])
  )
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker v1.0.0')
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => {
              return (
                cacheName.startsWith('foodnow-') &&
                ![CACHE_NAME, API_CACHE_NAME, STATIC_CACHE_NAME].includes(cacheName)
              )
            })
            .map((cacheName) => {
              console.log('[SW] Deleting old cache:', cacheName)
              return caches.delete(cacheName)
            })
        )
      }),
      // Take control of all clients
      self.clients.claim()
    ])
  )
})

// Fetch event - handle network requests with caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Only handle same-origin requests
  if (url.origin !== self.location.origin) {
    return
  }

  // Different strategies based on request type
  if (request.method === 'GET') {
    // API requests
    if (url.pathname.startsWith('/api/')) {
      event.respondWith(handleApiRequest(request))
    }
    // Static assets and pages
    else {
      event.respondWith(handleStaticRequest(request))
    }
  }
  // POST/PUT/DELETE requests - network only
  else {
    event.respondWith(handleNetworkOnlyRequest(request))
  }
})

// Handle API requests with appropriate caching strategy
async function handleApiRequest(request) {
  const url = new URL(request.url)
  
  // Network-first for critical APIs
  if (NETWORK_FIRST_PATTERNS.some(pattern => pattern.test(url.pathname))) {
    return handleNetworkFirst(request, API_CACHE_NAME)
  }
  
  // Cache-first for cacheable APIs
  if (CACHEABLE_API_PATTERNS.some(pattern => pattern.test(url.pathname))) {
    return handleCacheFirst(request, API_CACHE_NAME)
  }
  
  // Default: Network only for other APIs
  return fetch(request)
}

// Handle static requests (pages, assets)
async function handleStaticRequest(request) {
  // Check if it's a navigation request
  if (request.mode === 'navigate') {
    return handlePageRequest(request)
  }
  
  // Handle static assets
  return handleCacheFirst(request, STATIC_CACHE_NAME)
}

// Handle page navigation with offline fallback
async function handlePageRequest(request) {
  try {
    // Try network first for pages
    const response = await fetch(request)
    
    // Cache successful responses
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME)
      cache.put(request, response.clone())
    }
    
    return response
  } catch (error) {
    // Network failed, try cache
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      return cachedResponse
    }
    
    // No cache, return offline page
    return caches.match('/offline')
  }
}

// Network-first strategy
async function handleNetworkFirst(request, cacheName) {
  try {
    const response = await fetch(request)
    
    // Cache successful responses
    if (response.ok) {
      const cache = await caches.open(cacheName)
      cache.put(request, response.clone())
    }
    
    return response
  } catch (error) {
    // Network failed, try cache
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      console.log('[SW] Serving from cache (network failed):', request.url)
      return cachedResponse
    }
    
    throw error
  }
}

// Cache-first strategy
async function handleCacheFirst(request, cacheName) {
  const cachedResponse = await caches.match(request)
  
  if (cachedResponse) {
    console.log('[SW] Serving from cache:', request.url)
    
    // Optionally update cache in background
    fetch(request).then((response) => {
      if (response.ok) {
        caches.open(cacheName).then((cache) => {
          cache.put(request, response)
        })
      }
    }).catch(() => {}) // Ignore network errors
    
    return cachedResponse
  }
  
  // Not in cache, fetch from network
  try {
    const response = await fetch(request)
    
    if (response.ok) {
      const cache = await caches.open(cacheName)
      cache.put(request, response.clone())
    }
    
    return response
  } catch (error) {
    console.error('[SW] Network request failed:', request.url, error)
    throw error
  }
}

// Network-only strategy for mutations
async function handleNetworkOnlyRequest(request) {
  return fetch(request)
}

// Push notification handling
self.addEventListener('push', (event) => {
  if (!event.data) {
    return
  }

  try {
    const data = event.data.json()
    console.log('[SW] Push notification received:', data)

    const options = {
      body: data.body || 'Your FoodNow order update is here!',
      icon: '/images/icons/icon-192x192.png',
      badge: '/images/icons/badge-72x72.png',
      image: data.image,
      data: data.data || {},
      actions: [
        {
          action: 'view',
          title: 'View Order',
          icon: '/images/icons/action-view.png'
        },
        {
          action: 'dismiss',
          title: 'Dismiss',
          icon: '/images/icons/action-dismiss.png'
        }
      ],
      requireInteraction: data.requireInteraction || false,
      silent: data.silent || false,
      timestamp: Date.now(),
      tag: data.tag || 'foodnow-general'
    }

    event.waitUntil(
      self.registration.showNotification(
        data.title || 'FoodNow Update',
        options
      )
    )
  } catch (error) {
    console.error('[SW] Error processing push notification:', error)
  }
})

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification click received:', event.notification.data)

  event.notification.close()

  // Handle different notification actions
  if (event.action === 'view') {
    const url = event.notification.data?.url || '/orders'
    event.waitUntil(
      clients.openWindow(url)
    )
  } else if (event.action === 'dismiss') {
    // Just close the notification
    return
  } else {
    // Default action - open the app
    const url = event.notification.data?.url || '/'
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then((clientList) => {
        // Check if app is already open
        for (const client of clientList) {
          if (client.url === url && 'focus' in client) {
            return client.focus()
          }
        }
        
        // Open new window if app not open
        if (clients.openWindow) {
          return clients.openWindow(url)
        }
      })
    )
  }
})

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered:', event.tag)

  if (event.tag === 'order-sync') {
    event.waitUntil(syncOrders())
  } else if (event.tag === 'rating-sync') {
    event.waitUntil(syncRatings())
  }
})

// Sync pending orders when back online
async function syncOrders() {
  try {
    console.log('[SW] Syncing pending orders...')
    
    // Get pending orders from IndexedDB or localStorage
    const pendingOrders = await getPendingOrders()
    
    for (const order of pendingOrders) {
      try {
        const response = await fetch('/api/orders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${order.token}`
          },
          body: JSON.stringify(order.data)
        })
        
        if (response.ok) {
          // Remove from pending list
          await removePendingOrder(order.id)
          console.log('[SW] Order synced successfully:', order.id)
        }
      } catch (error) {
        console.error('[SW] Failed to sync order:', order.id, error)
      }
    }
  } catch (error) {
    console.error('[SW] Error during order sync:', error)
  }
}

// Sync pending ratings when back online
async function syncRatings() {
  try {
    console.log('[SW] Syncing pending ratings...')
    
    const pendingRatings = await getPendingRatings()
    
    for (const rating of pendingRatings) {
      try {
        const response = await fetch(`/api/orders/${rating.orderId}/rate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${rating.token}`
          },
          body: JSON.stringify(rating.data)
        })
        
        if (response.ok) {
          await removePendingRating(rating.id)
          console.log('[SW] Rating synced successfully:', rating.id)
        }
      } catch (error) {
        console.error('[SW] Failed to sync rating:', rating.id, error)
      }
    }
  } catch (error) {
    console.error('[SW] Error during rating sync:', error)
  }
}

// Helper functions for IndexedDB operations
async function getPendingOrders() {
  // This would integrate with IndexedDB for offline storage
  return []
}

async function removePendingOrder(orderId) {
  // Remove from IndexedDB
  return true
}

async function getPendingRatings() {
  // Get from IndexedDB
  return []
}

async function removePendingRating(ratingId) {
  // Remove from IndexedDB
  return true
}

// Message handling for communication with main thread
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data)

  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  } else if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: '1.0.0' })
  } else if (event.data && event.data.type === 'CACHE_URLS') {
    // Cache specific URLs on demand
    event.waitUntil(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.addAll(event.data.urls)
      })
    )
  }
})

// Error handling
self.addEventListener('error', (event) => {
  console.error('[SW] Service worker error:', event.error)
})

self.addEventListener('unhandledrejection', (event) => {
  console.error('[SW] Unhandled promise rejection:', event.reason)
})