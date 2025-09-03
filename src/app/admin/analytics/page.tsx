'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminAnalyticsOldRouteRedirect() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/admin-system/dashboard/live')
  }, [router])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-orange-500/30 border-t-orange-500 rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting to admin dashboard...</p>
      </div>
    </div>
  )
}