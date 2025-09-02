import React, { ReactElement, ReactNode } from 'react'
import { vi } from 'vitest'
import { render, RenderOptions } from '@testing-library/react'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import cartSlice from '@/store/slices/cartSlice'
import uiSlice from '@/store/slices/uiSlice'
import restaurantSlice from '@/store/slices/restaurantSlice'
import { AuthContext } from '@/contexts/AuthContext'
import { LocationContext } from '@/contexts/LocationContext'

// Mock store setup
const createMockStore = (preloadedState = {}) => {
  return configureStore({
    reducer: {
      cart: cartSlice,
      ui: uiSlice,
      restaurants: restaurantSlice
    },
    preloadedState
  })
}

// Mock contexts
const mockAuthContext = {
  user: null,
  loading: false,
  signIn: vi.fn(),
  signUp: vi.fn(),
  signOut: vi.fn(),
  resetPassword: vi.fn(),
  updateProfile: vi.fn()
}

const mockLocationContext = {
  location: null,
  address: '',
  loading: false,
  error: null,
  getCurrentLocation: vi.fn(),
  setLocation: vi.fn(),
  setAddress: vi.fn()
}

interface AllTheProvidersProps {
  children: ReactNode
  initialState?: any
  authValue?: any
  locationValue?: any
}

const AllTheProviders = ({ 
  children, 
  initialState = {}, 
  authValue = mockAuthContext,
  locationValue = mockLocationContext
}: AllTheProvidersProps) => {
  const store = createMockStore(initialState)
  
  return (
    <Provider store={store}>
      <AuthContext.Provider value={authValue}>
        <LocationContext.Provider value={locationValue}>
          {children}
        </LocationContext.Provider>
      </AuthContext.Provider>
    </Provider>
  )
}

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'> & {
    initialState?: any
    authValue?: any
    locationValue?: any
  }
) => {
  const { initialState, authValue, locationValue, ...renderOptions } = options || {}
  
  return render(ui, {
    wrapper: ({ children }) => (
      <AllTheProviders 
        initialState={initialState}
        authValue={authValue}
        locationValue={locationValue}
      >
        {children}
      </AllTheProviders>
    ),
    ...renderOptions
  })
}

export * from '@testing-library/react'
export { customRender as render, createMockStore }