'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function AdminAccessHandler() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Check for admin parameter
    const adminParam = searchParams.get('admin')
    
    if (adminParam !== null) {
      // Redirect to admin system login
      router.replace('/admin-systemapp')
    }
  }, [searchParams, router])

  return null // This component doesn't render anything
}