import { createSlice, PayloadAction } from '@reduxjs/toolkit'

// Types
export interface OrderItem {
  id: string
  name: string
  price: number
  quantity: number
  customizations?: string[]
  notes?: string
  image?: string
}

export interface DeliveryInfo {
  address: string
  coordinates: {
    lat: number
    lng: number
  }
  instructions?: string
  contactPhone: string
  contactName: string
}

export interface RiderInfo {
  id: string
  name: string
  phone: string
  vehicle: string
  rating: number
  profileImage?: string
  currentLocation?: {
    lat: number
    lng: number
  }
}

export interface Order {
  id: string
  orderNumber: string
  userId: string
  restaurantId: string
  restaurantName: string
  restaurantImage?: string
  items: OrderItem[]
  subtotal: number
  deliveryFee: number
  serviceFee: number
  tax: number
  discount: number
  total: number
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'picked_up' | 'delivered' | 'cancelled'
  paymentMethod: string
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded'
  deliveryInfo: DeliveryInfo
  riderId?: string
  rider?: RiderInfo
  estimatedDeliveryTime: string
  actualDeliveryTime?: string
  createdAt: string
  updatedAt: string
  specialInstructions?: string
  promoCode?: string
  rating?: number
  review?: string
  trackingUpdates: {
    status: string
    message: string
    timestamp: string
    location?: {
      lat: number
      lng: number
    }
  }[]
}

export interface OrderState {
  currentOrder: Order | null
  orders: Order[]
  activeOrders: Order[]
  pastOrders: Order[]
  isLoading: boolean
  error: string | null
  trackingData: {
    orderId: string
    riderLocation: {
      lat: number
      lng: number
    } | null
    estimatedArrival: string | null
    lastUpdate: string | null
  } | null
}

const initialState: OrderState = {
  currentOrder: null,
  orders: [],
  activeOrders: [],
  pastOrders: [],
  isLoading: false,
  error: null,
  trackingData: null,
}

const orderSlice = createSlice({
  name: 'order',
  initialState,
  reducers: {
    // Order Management
    createOrder: (state, action: PayloadAction<Order>) => {
      state.currentOrder = action.payload
      state.orders.unshift(action.payload)
      state.activeOrders.unshift(action.payload)
    },

    updateOrder: (state, action: PayloadAction<{ id: string; updates: Partial<Order> }>) => {
      const { id, updates } = action.payload

      // Update current order
      if (state.currentOrder?.id === id) {
        state.currentOrder = { ...state.currentOrder, ...updates }
      }

      // Update in orders array
      const orderIndex = state.orders.findIndex((order) => order.id === id)
      if (orderIndex >= 0) {
        state.orders[orderIndex] = { ...state.orders[orderIndex], ...updates }
      }

      // Update active orders
      const activeIndex = state.activeOrders.findIndex((order) => order.id === id)
      if (activeIndex >= 0) {
        const updatedOrder = { ...state.activeOrders[activeIndex], ...updates }
        state.activeOrders[activeIndex] = updatedOrder

        // Move to past orders if completed or cancelled
        if (updates.status === 'delivered' || updates.status === 'cancelled') {
          state.activeOrders.splice(activeIndex, 1)
          state.pastOrders.unshift(updatedOrder)
        }
      }
    },

    setCurrentOrder: (state, action: PayloadAction<Order | null>) => {
      state.currentOrder = action.payload
    },

    // Order Lists
    setOrders: (state, action: PayloadAction<Order[]>) => {
      state.orders = action.payload
      state.activeOrders = action.payload.filter(
        (order) => !['delivered', 'cancelled'].includes(order.status)
      )
      state.pastOrders = action.payload.filter((order) =>
        ['delivered', 'cancelled'].includes(order.status)
      )
    },

    addOrder: (state, action: PayloadAction<Order>) => {
      state.orders.unshift(action.payload)
      if (!['delivered', 'cancelled'].includes(action.payload.status)) {
        state.activeOrders.unshift(action.payload)
      } else {
        state.pastOrders.unshift(action.payload)
      }
    },

    // Order Status Updates
    updateOrderStatus: (state, action: PayloadAction<{ orderId: string; status: Order['status']; message?: string }>) => {
      const { orderId, status, message } = action.payload
      const timestamp = new Date().toISOString()

      const updateOrderWithStatus = (order: Order) => {
        order.status = status
        order.updatedAt = timestamp
        
        // Add tracking update
        order.trackingUpdates.push({
          status,
          message: message || `Order ${status}`,
          timestamp,
        })

        // Set actual delivery time if delivered
        if (status === 'delivered') {
          order.actualDeliveryTime = timestamp
        }
      }

      // Update current order
      if (state.currentOrder?.id === orderId) {
        updateOrderWithStatus(state.currentOrder)
      }

      // Update in all arrays
      [state.orders, state.activeOrders, state.pastOrders].forEach((orderArray) => {
        const order = orderArray.find((o) => o.id === orderId)
        if (order) {
          updateOrderWithStatus(order)
        }
      })

      // Move between active and past orders if needed
      if (status === 'delivered' || status === 'cancelled') {
        const activeIndex = state.activeOrders.findIndex((order) => order.id === orderId)
        if (activeIndex >= 0) {
          const completedOrder = state.activeOrders.splice(activeIndex, 1)[0]
          state.pastOrders.unshift(completedOrder)
        }
      }
    },

    // Tracking
    setTrackingData: (state, action: PayloadAction<OrderState['trackingData']>) => {
      state.trackingData = action.payload
    },

    updateRiderLocation: (state, action: PayloadAction<{ orderId: string; location: { lat: number; lng: number } }>) => {
      const { orderId, location } = action.payload

      // Update tracking data
      if (state.trackingData?.orderId === orderId) {
        state.trackingData.riderLocation = location
        state.trackingData.lastUpdate = new Date().toISOString()
      }

      // Update order's rider location
      const updateRiderLocation = (order: Order) => {
        if (order.rider) {
          order.rider.currentLocation = location
        }
      }

      if (state.currentOrder?.id === orderId && state.currentOrder.rider) {
        updateRiderLocation(state.currentOrder)
      }

      state.orders.forEach((order) => {
        if (order.id === orderId) {
          updateRiderLocation(order)
        }
      })
    },

    // Rating and Review
    addReview: (state, action: PayloadAction<{ orderId: string; rating: number; review: string }>) => {
      const { orderId, rating, review } = action.payload

      const updateOrderReview = (order: Order) => {
        order.rating = rating
        order.review = review
      }

      // Update in all relevant arrays
      [state.orders, state.pastOrders].forEach((orderArray) => {
        const order = orderArray.find((o) => o.id === orderId)
        if (order) {
          updateOrderReview(order)
        }
      })

      if (state.currentOrder?.id === orderId) {
        updateOrderReview(state.currentOrder)
      }
    },

    // Cancel Order
    cancelOrder: (state, action: PayloadAction<{ orderId: string; reason: string }>) => {
      const { orderId, reason } = action.payload
      const timestamp = new Date().toISOString()
      
      const updateOrderWithStatus = (order: Order) => {
        order.status = 'cancelled'
        const orderWithHistory = order as Order & { statusHistory?: Array<{ status: string; timestamp: string; message: string }> }
        if (orderWithHistory.statusHistory) {
          orderWithHistory.statusHistory.push({
            status: 'cancelled',
            timestamp,
            message: `Order cancelled: ${reason}`
          })
        }
        order.updatedAt = timestamp
      }
      
      // Update in current order
      if (state.currentOrder && state.currentOrder.id === orderId) {
        updateOrderWithStatus(state.currentOrder)
      }
      
      // Update in orders array
      const orderIndex = state.orders.findIndex(order => order.id === orderId)
      if (orderIndex !== -1) {
        updateOrderWithStatus(state.orders[orderIndex])
      }
      
      // Update in past orders
      const pastOrderIndex = state.pastOrders.findIndex(order => order.id === orderId)
      if (pastOrderIndex !== -1) {
        updateOrderWithStatus(state.pastOrders[pastOrderIndex])
      }
    },

    // Loading and Error states
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload
    },

    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload
      state.isLoading = false
    },

    clearError: (state) => {
      state.error = null
    },

    // Clear completed orders (for cleanup)
    clearPastOrders: (state) => {
      state.pastOrders = []
      state.orders = state.orders.filter((order) => !['delivered', 'cancelled'].includes(order.status))
    },
  },
})

export const {
  createOrder,
  updateOrder,
  setCurrentOrder,
  setOrders,
  addOrder,
  updateOrderStatus,
  setTrackingData,
  updateRiderLocation,
  addReview,
  cancelOrder,
  setLoading,
  setError,
  clearError,
  clearPastOrders,
} = orderSlice.actions

export default orderSlice.reducer