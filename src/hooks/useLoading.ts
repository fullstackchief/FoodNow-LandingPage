'use client'

import { useSelector, useDispatch } from 'react-redux'
import { useCallback } from 'react'
import { RootState } from '@/store'
import { setPageLoading, setLoadingState, clearLoadingStates } from '@/store/slices/uiSlice'

// Hook for page-level loading
export const usePageLoading = () => {
  const dispatch = useDispatch()
  const isPageLoading = useSelector((state: RootState) => state.ui.isPageLoading)

  const setLoading = useCallback((loading: boolean) => {
    dispatch(setPageLoading(loading))
  }, [dispatch])

  return { isPageLoading, setLoading }
}

// Hook for component-specific loading states
export const useComponentLoading = (componentKey: string) => {
  const dispatch = useDispatch()
  const isLoading = useSelector((state: RootState) => state.ui.loadingStates[componentKey] || false)

  const setLoading = useCallback((loading: boolean) => {
    dispatch(setLoadingState({ key: componentKey, isLoading: loading }))
  }, [dispatch, componentKey])

  return { isLoading, setLoading }
}

// Hook for managing multiple loading states
export const useMultipleLoading = () => {
  const dispatch = useDispatch()
  const loadingStates = useSelector((state: RootState) => state.ui.loadingStates)

  const setLoading = useCallback((key: string, loading: boolean) => {
    dispatch(setLoadingState({ key, isLoading: loading }))
  }, [dispatch])

  const clearAll = useCallback(() => {
    dispatch(clearLoadingStates())
  }, [dispatch])

  const isLoading = useCallback((key: string) => {
    return loadingStates[key] || false
  }, [loadingStates])

  const isAnyLoading = useCallback(() => {
    return Object.values(loadingStates).some(Boolean)
  }, [loadingStates])

  return {
    loadingStates,
    setLoading,
    clearAll,
    isLoading,
    isAnyLoading
  }
}

// Async wrapper that automatically manages loading states
export const useAsyncAction = () => {
  const { setLoading } = useMultipleLoading()

  const executeAsync = useCallback(async <T>(
    key: string,
    asyncFunction: () => Promise<T>,
    options?: {
      onSuccess?: (result: T) => void
      onError?: (error: Error) => void
      showErrorToast?: boolean
    }
  ): Promise<T | null> => {
    try {
      setLoading(key, true)
      const result = await asyncFunction()
      
      if (options?.onSuccess) {
        options.onSuccess(result)
      }
      
      return result
    } catch (error) {
      console.error(`Async action "${key}" failed:`, error)
      
      if (options?.onError && error instanceof Error) {
        options.onError(error)
      }
      
      if (options?.showErrorToast) {
        // Toast will be handled by the calling component
      }
      
      return null
    } finally {
      setLoading(key, false)
    }
  }, [setLoading])

  return { executeAsync }
}

// Loading state keys for consistency across the app
export const LOADING_KEYS = {
  // Pages
  PAGE_LOADING: 'pageLoading',
  
  // Authentication
  LOGIN: 'auth.login',
  REGISTER: 'auth.register',
  LOGOUT: 'auth.logout',
  PASSWORD_RESET: 'auth.passwordReset',
  EMAIL_VERIFICATION: 'auth.emailVerification',
  
  // Restaurants
  RESTAURANTS_FETCH: 'restaurants.fetch',
  RESTAURANT_DETAILS: 'restaurants.details',
  RESTAURANT_MENU: 'restaurants.menu',
  
  // Search
  SEARCH_RESTAURANTS: 'search.restaurants',
  SEARCH_SUGGESTIONS: 'search.suggestions',
  
  // Cart & Orders
  ADD_TO_CART: 'cart.addItem',
  UPDATE_CART: 'cart.updateItem',
  REMOVE_FROM_CART: 'cart.removeItem',
  PLACE_ORDER: 'orders.place',
  ORDER_HISTORY: 'orders.history',
  ORDER_TRACKING: 'orders.tracking',
  
  // User Profile
  PROFILE_UPDATE: 'profile.update',
  PROFILE_FETCH: 'profile.fetch',
  ADDRESS_SAVE: 'profile.address.save',
  
  // Payments
  PAYMENT_PROCESS: 'payment.process',
  PAYMENT_VERIFY: 'payment.verify',
  
  // Admin
  ADMIN_DASHBOARD: 'admin.dashboard',
  ADMIN_USERS: 'admin.users',
  ADMIN_RESTAURANTS: 'admin.restaurants',
  ADMIN_ORDERS: 'admin.orders',
  
  // File uploads
  IMAGE_UPLOAD: 'upload.image',
  DOCUMENT_UPLOAD: 'upload.document',
} as const

export type LoadingKey = typeof LOADING_KEYS[keyof typeof LOADING_KEYS]