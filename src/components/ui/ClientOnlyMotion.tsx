'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

interface ClientOnlyMotionProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  className?: string
}

/**
 * ClientOnlyMotion - Renders Framer Motion animations only on client-side
 * This prevents SSR hydration mismatches while preserving beautiful animations
 */
export default function ClientOnlyMotion({ 
  children, 
  fallback, 
  className = "" 
}: ClientOnlyMotionProps) {
  const [hasMounted, setHasMounted] = useState(false)

  useEffect(() => {
    setHasMounted(true)
  }, [])

  if (!hasMounted) {
    // Render fallback during SSR - same layout without animations
    return (
      <div className={className}>
        {fallback || children}
      </div>
    )
  }

  // Render with animations after hydration
  return <>{children}</>
}

// Export a motion div that's client-only
export function ClientMotionDiv({ 
  children, 
  fallback,
  ...motionProps 
}: any) {
  const [hasMounted, setHasMounted] = useState(false)

  useEffect(() => {
    setHasMounted(true)
  }, [])

  if (!hasMounted) {
    // Render static div during SSR with same styling
    return (
      <div className={motionProps.className}>
        {fallback || children}
      </div>
    )
  }

  // Render motion.div after hydration
  return (
    <motion.div {...motionProps}>
      {children}
    </motion.div>
  )
}