import { createSlice, PayloadAction } from '@reduxjs/toolkit'

// Types
export interface Modal {
  id: string
  type: string
  data?: unknown
  isOpen: boolean
}

export interface Toast {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message?: string
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}

export interface UIState {
  // Modals
  modals: Modal[]
  
  // Toasts/Notifications
  toasts: Toast[]
  
  // Loading states
  isPageLoading: boolean
  loadingStates: Record<string, boolean>
  
  // Mobile/Responsive
  isMobileMenuOpen: boolean
  isSidebarOpen: boolean
  
  // Theme
  theme: 'light' | 'dark' | 'system'
  
  // Search
  isSearchOpen: boolean
  searchQuery: string
  
  // Filters
  isFilterOpen: boolean
  
  // Location
  isLocationModalOpen: boolean
  
  // Drawer states
  activeDrawer: string | null
  
  // Page states
  scrollPosition: number
  lastVisitedPage: string | null
  
  // Feature flags
  features: Record<string, boolean>
}

const initialState: UIState = {
  modals: [],
  toasts: [],
  isPageLoading: false,
  loadingStates: {},
  isMobileMenuOpen: false,
  isSidebarOpen: false,
  theme: 'light',
  isSearchOpen: false,
  searchQuery: '',
  isFilterOpen: false,
  isLocationModalOpen: false,
  activeDrawer: null,
  scrollPosition: 0,
  lastVisitedPage: null,
  features: {},
}

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    // Modals
    openModal: (state, action: PayloadAction<{ type: string; data?: unknown }>) => {
      const { type, data } = action.payload
      const id = `${type}-${Date.now()}`
      
      state.modals.push({
        id,
        type,
        data,
        isOpen: true,
      })
    },

    closeModal: (state, action: PayloadAction<string>) => {
      const modalIndex = state.modals.findIndex((modal) => modal.id === action.payload)
      if (modalIndex >= 0) {
        state.modals.splice(modalIndex, 1)
      }
    },

    closeAllModals: (state) => {
      state.modals = []
    },

    closeModalByType: (state, action: PayloadAction<string>) => {
      state.modals = state.modals.filter((modal) => modal.type !== action.payload)
    },

    // Toasts
    addToast: (state, action: PayloadAction<Omit<Toast, 'id'>>) => {
      const id = `toast-${Date.now()}`
      state.toasts.push({
        id,
        ...action.payload,
      })
    },

    removeToast: (state, action: PayloadAction<string>) => {
      state.toasts = state.toasts.filter((toast) => toast.id !== action.payload)
    },

    clearToasts: (state) => {
      state.toasts = []
    },

    // Loading states
    setPageLoading: (state, action: PayloadAction<boolean>) => {
      state.isPageLoading = action.payload
    },

    setLoadingState: (state, action: PayloadAction<{ key: string; isLoading: boolean }>) => {
      const { key, isLoading } = action.payload
      state.loadingStates[key] = isLoading
    },

    clearLoadingStates: (state) => {
      state.loadingStates = {}
    },

    // Mobile/Responsive
    toggleMobileMenu: (state) => {
      state.isMobileMenuOpen = !state.isMobileMenuOpen
    },

    setMobileMenuOpen: (state, action: PayloadAction<boolean>) => {
      state.isMobileMenuOpen = action.payload
    },

    toggleSidebar: (state) => {
      state.isSidebarOpen = !state.isSidebarOpen
    },

    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.isSidebarOpen = action.payload
    },

    // Theme
    setTheme: (state, action: PayloadAction<'light' | 'dark' | 'system'>) => {
      state.theme = action.payload
    },

    // Search
    toggleSearch: (state) => {
      state.isSearchOpen = !state.isSearchOpen
      if (!state.isSearchOpen) {
        state.searchQuery = ''
      }
    },

    setSearchOpen: (state, action: PayloadAction<boolean>) => {
      state.isSearchOpen = action.payload
      if (!action.payload) {
        state.searchQuery = ''
      }
    },

    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload
    },

    // Filters
    toggleFilter: (state) => {
      state.isFilterOpen = !state.isFilterOpen
    },

    setFilterOpen: (state, action: PayloadAction<boolean>) => {
      state.isFilterOpen = action.payload
    },

    // Location
    toggleLocationModal: (state) => {
      state.isLocationModalOpen = !state.isLocationModalOpen
    },

    setLocationModalOpen: (state, action: PayloadAction<boolean>) => {
      state.isLocationModalOpen = action.payload
    },

    // Drawers
    openDrawer: (state, action: PayloadAction<string>) => {
      state.activeDrawer = action.payload
    },

    closeDrawer: (state) => {
      state.activeDrawer = null
    },

    // Page states
    setScrollPosition: (state, action: PayloadAction<number>) => {
      state.scrollPosition = action.payload
    },

    setLastVisitedPage: (state, action: PayloadAction<string>) => {
      state.lastVisitedPage = action.payload
    },

    // Feature flags
    setFeature: (state, action: PayloadAction<{ key: string; enabled: boolean }>) => {
      const { key, enabled } = action.payload
      state.features[key] = enabled
    },

    setFeatures: (state, action: PayloadAction<Record<string, boolean>>) => {
      state.features = action.payload
    },

    // Reset UI state (useful for logout)
    resetUIState: (state) => {
      return {
        ...initialState,
        theme: state.theme, // Preserve theme preference
      }
    },
  },
})

export const {
  openModal,
  closeModal,
  closeAllModals,
  closeModalByType,
  addToast,
  removeToast,
  clearToasts,
  setPageLoading,
  setLoadingState,
  clearLoadingStates,
  toggleMobileMenu,
  setMobileMenuOpen,
  toggleSidebar,
  setSidebarOpen,
  setTheme,
  toggleSearch,
  setSearchOpen,
  setSearchQuery,
  toggleFilter,
  setFilterOpen,
  toggleLocationModal,
  setLocationModalOpen,
  openDrawer,
  closeDrawer,
  setScrollPosition,
  setLastVisitedPage,
  setFeature,
  setFeatures,
  resetUIState,
} = uiSlice.actions

export default uiSlice.reducer