/**
 * Enhanced Order Tracking Types
 * ==============================
 * Comprehensive order status tracking visible to all participants
 */

export type OrderStatus = 
  | 'order_placed'        // Customer placed order
  | 'payment_confirmed'   // Payment processed successfully
  | 'restaurant_accepted' // Restaurant accepted (or auto-accepted after 30s)
  | 'preparing'          // Restaurant preparing food
  | 'ready_for_pickup'   // Food ready for rider pickup
  | 'rider_assigned'     // Rider assigned to order
  | 'rider_en_route'     // Rider heading to restaurant
  | 'picked_up'          // Rider picked up order from restaurant
  | 'out_for_delivery'   // Rider heading to customer
  | 'delivered'          // Order delivered to customer
  | 'completed'          // Customer confirmed receipt
  | 'cancelled'          // Order cancelled by any party

export interface OrderStatusUpdate {
  orderId: string
  previousStatus: OrderStatus
  newStatus: OrderStatus
  timestamp: Date
  updatedBy: 'customer' | 'restaurant' | 'rider' | 'admin' | 'system'
  notes?: string
}

export interface OrderTracking {
  orderId: string
  currentStatus: OrderStatus
  statusHistory: OrderStatusUpdate[]
  estimatedCompletionTime: Date
  actualCompletionTime?: Date
  
  // Time estimates for each stage (in minutes)
  timeEstimates: {
    preparationTime: number     // Restaurant prep time
    riderAssignmentTime: number // Time to find rider
    pickupTime: number          // Rider to restaurant
    deliveryTime: number        // Restaurant to customer
    totalTime: number           // Total estimated time
  }
  
  // Participants visibility
  visibleTo: {
    customer: boolean
    restaurant: boolean
    rider: boolean
    admin: boolean
  }
}

/**
 * Active Order Contacts
 * Temporary contact information during active orders only
 * Auto-deleted after order completion
 */
export interface ActiveOrderContacts {
  orderId: string
  
  customer: {
    id: string
    name: string
    phone: string // Encrypted, visible to rider during delivery only
    address: string // Encrypted, visible to rider during delivery only
    deliveryInstructions?: string
  }
  
  rider?: {
    id: string
    name: string
    phone: string // Visible to customer & restaurant during active order
    vehicleType: 'bicycle' | 'motorcycle'
    estimatedArrival?: Date
  }
  
  restaurant: {
    id: string
    name: string
    phone: string // Visible to rider
    address: string
    pickupInstructions?: string
  }
  
  // Security & Privacy
  createdAt: Date
  expiresAt: Date // Order completion + 1 hour
  encryptionKey: string // For sensitive data
  accessLog: {
    userId: string
    userRole: string
    accessedAt: Date
    dataAccessed: string[]
  }[]
}

/**
 * Restaurant Capacity Management
 */
export interface RestaurantCapacity {
  restaurantId: string
  status: 'Available' | 'Busy'
  
  // Current order metrics
  activeOrders: number
  preparingOrders: number
  averagePrepTime: number // minutes
  
  // Admin-configurable thresholds
  busyThreshold: number // Number of orders to mark as busy
  autoRejectThreshold: number // Auto-reject new orders above this
  
  // Manual override by restaurant
  manualStatus?: 'Available' | 'Busy' | 'Closed'
  manualStatusReason?: string
  manualStatusExpiry?: Date
  
  // Historical data for predictions
  historicalCapacity: {
    hour: number // 0-23
    dayOfWeek: number // 0-6
    averageOrders: number
    peakCapacity: number
  }[]
}

/**
 * Order Notes System (Permanent Storage)
 */
export interface OrderNotes {
  id: string
  orderId: string
  customerId: string
  
  // Permanent notes categories
  deliveryInstructions: string // "Ring doorbell twice"
  dietaryPreferences: string // "No onions, allergic to peanuts"
  specialRequests: string // "Extra napkins, cutlery"
  
  // Visibility and access
  visibleTo: ('rider' | 'restaurant' | 'admin')[]
  
  // Metadata
  createdAt: Date
  updatedAt: Date
  
  // Historical pattern for future orders
  isDefault: boolean // Use for future orders
  frequency: number // How often these notes are used
}

/**
 * Real-time Order Updates
 */
export interface OrderUpdate {
  orderId: string
  updateType: 'status' | 'eta' | 'rider' | 'issue' | 'note'
  
  data: {
    status?: OrderStatus
    eta?: Date
    riderId?: string
    issue?: {
      type: 'delay' | 'unavailable' | 'wrong_address' | 'other'
      description: string
      reportedBy: string
    }
    note?: string
  }
  
  // Push notification settings
  notification: {
    title: string
    body: string
    priority: 'low' | 'medium' | 'high' | 'urgent'
    channels: ('inApp' | 'push' | 'sms' | 'email')[]
    recipients: ('customer' | 'restaurant' | 'rider' | 'admin')[]
  }
  
  timestamp: Date
}

/**
 * Order Visibility Rules
 */
export interface OrderVisibilityRules {
  // What each role can see during different order stages
  customer: {
    riderName: boolean // true during delivery
    riderPhone: boolean // true during delivery
    riderLocation: boolean // false (never)
    restaurantPhone: boolean // false (never)
    preparationDetails: boolean // true
    estimatedTimes: boolean // true
  }
  
  restaurant: {
    customerName: boolean // false
    customerPhone: boolean // false
    customerAddress: boolean // false
    riderName: boolean // true when assigned
    riderPhone: boolean // true when assigned
    riderLocation: boolean // false
  }
  
  rider: {
    customerName: boolean // true during delivery
    customerPhone: boolean // true during delivery
    customerAddress: boolean // true during delivery
    restaurantPhone: boolean // true
    orderHistory: boolean // false
    customerPreviousOrders: boolean // false
  }
  
  admin: {
    // Admin sees everything
    allData: boolean // true
  }
}

/**
 * Order Timeline Event
 */
export interface OrderTimelineEvent {
  orderId: string
  eventType: 'status_change' | 'message' | 'issue' | 'update'
  eventData: any
  timestamp: Date
  actor: {
    id: string
    role: 'customer' | 'restaurant' | 'rider' | 'admin' | 'system'
    name?: string
  }
  isPublic: boolean // Visible to customer
}