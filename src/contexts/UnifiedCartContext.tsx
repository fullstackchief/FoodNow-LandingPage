'use client'

import React, { createContext, useContext, ReactNode } from 'react'
import { useUnifiedCartLogic, type UnifiedCartResult } from '@/hooks/useUnifiedCart'

type UnifiedCartContextType = UnifiedCartResult

const UnifiedCartContext = createContext<UnifiedCartContextType | undefined>(undefined)

interface UnifiedCartProviderProps {
  children: ReactNode
}

export function UnifiedCartProvider({ children }: UnifiedCartProviderProps) {
  // Always call hooks in the same order - never conditionally
  const cartLogic = useUnifiedCartLogic()
  
  return (
    <UnifiedCartContext.Provider value={cartLogic}>
      {children}
    </UnifiedCartContext.Provider>
  )
}

export function useUnifiedCart(): UnifiedCartContextType {
  const context = useContext(UnifiedCartContext)
  if (context === undefined) {
    throw new Error('useUnifiedCart must be used within a UnifiedCartProvider')
  }
  return context
}

// Safe hook that provides fallback values during initialization
export function useSafeUnifiedCart(): UnifiedCartContextType | null {
  try {
    return useContext(UnifiedCartContext) || null
  } catch (error) {
    // Return null during SSR or provider initialization issues
    console.warn('UnifiedCartContext not available during initialization', error)
    return null
  }
}

export default UnifiedCartProvider