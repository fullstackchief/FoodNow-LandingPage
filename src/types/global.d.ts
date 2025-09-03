// Global type declarations for FoodNow

declare global {
  // Google Analytics gtag function
  function gtag(command: 'config' | 'event' | 'set', targetId: string, config?: any): void

  interface Window {
    gtag?: typeof gtag
  }

  // PWA-related events
  interface WindowEventMap {
    'pwa-install-available': CustomEvent
    'pwa-installed': CustomEvent
    'pwa-update-available': CustomEvent
  }
}

export {}