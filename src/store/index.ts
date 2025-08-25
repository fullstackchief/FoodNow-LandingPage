import { configureStore } from '@reduxjs/toolkit'
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux'

// Import all slices
import cartReducer from './slices/cartSlice'
import userReducer from './slices/userSlice'
import restaurantReducer from './slices/restaurantSlice'
import orderReducer from './slices/orderSlice'
import uiReducer from './slices/uiSlice'

export const store = configureStore({
  reducer: {
    cart: cartReducer,
    user: userReducer,
    restaurant: restaurantReducer,
    order: orderReducer,
    ui: uiReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
  devTools: process.env.NODE_ENV !== 'production',
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

// Typed hooks for better TypeScript support
export const useAppDispatch = () => useDispatch<AppDispatch>()
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector