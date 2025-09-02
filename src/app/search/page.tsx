'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function SearchRedirect() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Preserve search query and other parameters
    const query = searchParams.get('q') || searchParams.get('query') || ''
    const location = searchParams.get('location') || ''
    const filters = searchParams.get('filters') || ''
    
    let redirectUrl = '/explore'
    const params = new URLSearchParams()
    
    if (query) params.set('q', query)
    if (location) params.set('location', location)
    if (filters) params.set('filters', filters)
    
    if (params.toString()) {
      redirectUrl += `?${params.toString()}`
    }
    
    router.replace(redirectUrl)
  }, [router, searchParams])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting to our enhanced search experience...</p>
      </div>
    </div>
  )
}