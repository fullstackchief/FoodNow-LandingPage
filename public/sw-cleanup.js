// Service Worker Cleanup for Development
// This unregisters any service workers to prevent caching issues
if ('serviceWorker' in navigator && process.env.NODE_ENV === 'development') {
  navigator.serviceWorker.getRegistrations().then(function(registrations) {
    for(let registration of registrations) {
      registration.unregister().then(function(success) {
        if (success) {
          console.log('[Dev] Service Worker unregistered:', registration.scope);
        }
      });
    }
  });
  
  // Also clear caches
  if ('caches' in window) {
    caches.keys().then(function(names) {
      for (let name of names) {
        caches.delete(name);
        console.log('[Dev] Cache cleared:', name);
      }
    });
  }
}