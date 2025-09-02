'use client'

/**
 * Simple Google Maps Integration
 * =============================
 * Direct script loading without any external dependencies
 */

// Client-side only check
const isBrowser = typeof window !== 'undefined'
const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

// Simple loading state
let isGoogleMapsLoaded = false
let isLoading = false
let loadPromise: Promise<any> | null = null

/**
 * Load Google Maps API with direct script injection
 */
export async function loadGoogleMaps(): Promise<any> {
  // Browser check
  if (!isBrowser) {
    throw new Error('Google Maps can only be loaded in browser environment')
  }

  // Return if already loaded
  if (isGoogleMapsLoaded && window.google?.maps) {
    return window.google.maps
  }

  // Return existing promise if loading
  if (isLoading && loadPromise) {
    return loadPromise
  }

  if (!API_KEY) {
    throw new Error('Google Maps API key not configured')
  }

  isLoading = true
  
  loadPromise = new Promise((resolve, reject) => {
    // Create unique callback
    const callbackName = 'initGoogleMaps' + Date.now();
    
    // Set up global callback
    (window as any)[callbackName] = () => {
      isGoogleMapsLoaded = true;
      isLoading = false;
      delete (window as any)[callbackName];
      resolve(window.google.maps);
    };

    // Create script
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${API_KEY}&libraries=places&callback=${callbackName}`;
    script.onerror = () => {
      isLoading = false;
      delete (window as any)[callbackName];
      reject(new Error('Failed to load Google Maps'));
    };

    document.head.appendChild(script);
  });

  return loadPromise
}

/**
 * Create a simple map
 */
export async function createSimpleMap(element: HTMLElement, center: {lat: number, lng: number}) {
  if (!isBrowser) {
    throw new Error('Maps can only be created in browser environment')
  }
  
  const maps = await loadGoogleMaps()
  
  return new maps.Map(element, {
    center,
    zoom: 12,
    mapTypeControl: false,
    streetViewControl: false,
  })
}

/**
 * Add a marker to the map
 */
export function addMarker(map: any, position: {lat: number, lng: number}, title: string) {
  if (!isBrowser || !window.google?.maps) {
    throw new Error('Google Maps not available')
  }
  
  return new google.maps.Marker({
    position,
    map,
    title
  })
}