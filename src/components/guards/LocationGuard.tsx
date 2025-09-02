'use client'

import { useState, ReactNode } from 'react'
import { useLocation } from '@/contexts/LocationContext'
import LocationModal from '@/components/ui/LocationModal'

interface LocationGuardProps {
  children: ReactNode
  fallback?: ReactNode
  requireLocation?: boolean
  modalTitle?: string
  modalSubtitle?: string
}

const LocationGuard = ({ 
  children, 
  fallback,
  requireLocation = true,
  modalTitle = "Location Required",
  modalSubtitle = "Please set your location to continue ordering from nearby restaurants."
}: LocationGuardProps) => {
  const { hasLocation } = useLocation()
  const [showLocationModal, setShowLocationModal] = useState(false)

  // If location is not required or user has location, render children normally
  if (!requireLocation || hasLocation) {
    return <>{children}</>
  }

  // If fallback is provided, render it
  if (fallback) {
    return <>{fallback}</>
  }

  // Otherwise, render children but intercept clicks to show location modal
  const handleInterceptClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setShowLocationModal(true)
  }

  return (
    <>
      <div onClick={handleInterceptClick} className="cursor-pointer">
        {children}
      </div>
      
      <LocationModal
        isOpen={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        title={modalTitle}
        subtitle={modalSubtitle}
      />
    </>
  )
}

export default LocationGuard