// Mock API initialization for development
export async function enableMocking() {
  if (typeof window === 'undefined') {
    // Server-side (Node.js)
    const { server } = await import('./server')
    server.listen({
      onUnhandledRequest: 'bypass',
    })
    return
  }

  // Client-side (Browser)
  const { worker } = await import('./browser')
  return worker.start({
    onUnhandledRequest: 'bypass',
  })
}

// Re-export handlers for testing
export { handlers } from './handlers'