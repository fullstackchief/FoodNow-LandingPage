/**
 * Communication & Messaging System Types
 * ======================================
 * Secure admin-controlled messaging and notifications
 */

/**
 * Admin Messaging System
 */
export interface AdminMessage {
  id: string
  
  // Message metadata
  from: {
    adminId: string
    adminName: string
    adminRole: 'super_admin' | 'admin' | 'support'
  }
  
  // Recipients
  to: {
    type: 'individual' | 'broadcast' | 'targeted'
    
    // Individual recipient
    individual?: {
      userId: string
      userType: 'customer' | 'restaurant' | 'rider'
    }
    
    // Broadcast recipients
    broadcast?: {
      scope: 'all_customers' | 'all_restaurants' | 'all_riders' | 'zone_specific'
      zone?: string // For zone-specific broadcasts
    }
    
    // Targeted recipients based on criteria
    targeted?: {
      userType: 'customer' | 'restaurant' | 'rider'
      criteria: {
        minRating?: number
        maxRating?: number
        isOnline?: boolean
        zone?: string
        hasCompletedOrders?: number // Minimum orders
        accountAge?: number // Days since registration
        lastActiveWithin?: number // Days
        performanceScore?: number
      }
    }
  }
  
  // Message content
  subject: string
  content: string
  
  // Message properties
  priority: 'low' | 'normal' | 'high' | 'urgent'
  category: 'announcement' | 'alert' | 'update' | 'promotion' | 'support' | 'compliance'
  
  // Related context
  orderId?: string // For order-specific messages
  attachments?: {
    type: 'image' | 'document' | 'link'
    url: string
    name: string
  }[]
  
  // Actions
  requiresResponse: boolean
  responseOptions?: string[] // Pre-defined responses
  actionButtons?: {
    label: string
    action: string // URL or action identifier
    style: 'primary' | 'secondary' | 'danger'
  }[]
  
  // Tracking
  status: 'draft' | 'scheduled' | 'sent' | 'delivered' | 'failed'
  scheduledFor?: Date
  sentAt?: Date
  expiresAt?: Date // Message expires and won't be shown
  
  // Read receipts
  readReceipts: {
    userId: string
    readAt: Date
    response?: string
    deviceInfo?: string
  }[]
  
  // Delivery stats
  stats: {
    totalRecipients: number
    delivered: number
    read: number
    responded: number
    failed: number
  }
}

/**
 * Message Thread for Support
 */
export interface MessageThread {
  id: string
  participantIds: string[]
  
  // Thread metadata
  subject: string
  category: 'order_issue' | 'payment' | 'complaint' | 'feedback' | 'technical' | 'other'
  priority: 'low' | 'normal' | 'high' | 'urgent'
  status: 'open' | 'pending' | 'resolved' | 'closed'
  
  // Related entities
  orderId?: string
  restaurantId?: string
  riderId?: string
  
  // Messages in thread
  messages: {
    id: string
    senderId: string
    senderRole: 'customer' | 'restaurant' | 'rider' | 'admin'
    content: string
    attachments?: {
      type: 'image' | 'document'
      url: string
      name: string
    }[]
    sentAt: Date
    readBy: {
      userId: string
      readAt: Date
    }[]
  }[]
  
  // Thread lifecycle
  createdAt: Date
  updatedAt: Date
  resolvedAt?: Date
  closedAt?: Date
  
  // Admin assignment
  assignedTo?: string // Admin ID
  escalatedTo?: string // Senior admin ID
  
  // Resolution
  resolution?: {
    summary: string
    action: string
    compensationType?: 'refund' | 'discount' | 'points' | 'none'
    compensationAmount?: number
    resolvedBy: string
  }
}

/**
 * Notification System
 */
export interface Notification {
  id: string
  
  // Recipient
  userId: string
  userType: 'customer' | 'restaurant' | 'rider' | 'admin'
  
  // Notification content
  title: string
  body: string
  imageUrl?: string
  
  // Notification type and category
  type: 'order' | 'payment' | 'promotion' | 'system' | 'message' | 'reward'
  category: 'info' | 'success' | 'warning' | 'error' | 'action_required'
  
  // Delivery channels
  channels: {
    inApp: boolean
    push: boolean
    sms: boolean
    email: boolean
  }
  
  // Action and navigation
  action?: {
    type: 'navigate' | 'external_link' | 'dismiss'
    target?: string // Route or URL
    label?: string // Action button label
  }
  
  // Related data
  metadata?: {
    orderId?: string
    paymentId?: string
    promotionId?: string
    messageId?: string
  }
  
  // Notification state
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed'
  
  // Timestamps
  createdAt: Date
  scheduledFor?: Date
  sentAt?: Date
  deliveredAt?: Date
  readAt?: Date
  expiresAt?: Date
  
  // Delivery attempts
  attempts: number
  lastAttemptAt?: Date
  failureReason?: string
}

/**
 * Push Notification Settings
 */
export interface NotificationPreferences {
  userId: string
  
  // Channel preferences
  channels: {
    inApp: {
      enabled: boolean
      sound: boolean
      vibration: boolean
    }
    push: {
      enabled: boolean
      token?: string // FCM/APNS token
      deviceType?: 'ios' | 'android' | 'web'
    }
    sms: {
      enabled: boolean
      phoneVerified: boolean
      criticalOnly: boolean // Only urgent notifications
    }
    email: {
      enabled: boolean
      emailVerified: boolean
      digestFrequency?: 'immediate' | 'daily' | 'weekly'
    }
  }
  
  // Category preferences
  categories: {
    orderUpdates: boolean
    paymentAlerts: boolean
    promotions: boolean
    systemUpdates: boolean
    supportMessages: boolean
    rewards: boolean
  }
  
  // Quiet hours
  quietHours: {
    enabled: boolean
    startTime: string // "22:00"
    endTime: string // "07:00"
    timezone: string
    allowUrgent: boolean // Allow urgent notifications during quiet hours
  }
  
  // Language preference
  language: 'en' | 'yo' | 'ig' | 'ha' // English, Yoruba, Igbo, Hausa
  
  updatedAt: Date
}

/**
 * SMS Template
 */
export interface SMSTemplate {
  id: string
  name: string
  category: 'order' | 'payment' | 'verification' | 'alert' | 'marketing'
  
  template: string // "Your order {{orderId}} is on the way!"
  variables: string[] // ['orderId', 'riderName', 'eta']
  
  maxLength: number // 160 for single SMS
  isActive: boolean
  
  // Usage tracking
  usageCount: number
  lastUsedAt?: Date
  
  // Admin controls
  createdBy: string
  approvedBy?: string
  createdAt: Date
  updatedAt: Date
}

/**
 * Email Template
 */
export interface EmailTemplate {
  id: string
  name: string
  category: 'order' | 'payment' | 'welcome' | 'verification' | 'marketing' | 'receipt'
  
  subject: string
  htmlBody: string
  textBody: string
  
  variables: {
    name: string
    type: 'string' | 'number' | 'date' | 'array' | 'object'
    required: boolean
    defaultValue?: any
  }[]
  
  // Design elements
  headerImage?: string
  footerText?: string
  brandColors?: {
    primary: string
    secondary: string
    accent: string
  }
  
  isActive: boolean
  
  // Testing
  testRecipients?: string[]
  lastTestedAt?: Date
  
  // Admin controls
  createdBy: string
  approvedBy?: string
  createdAt: Date
  updatedAt: Date
}

/**
 * Communication Analytics
 */
export interface CommunicationAnalytics {
  period: 'daily' | 'weekly' | 'monthly'
  date: Date
  
  // Message metrics
  messages: {
    sent: number
    delivered: number
    read: number
    responded: number
    failed: number
  }
  
  // Notification metrics
  notifications: {
    push: {
      sent: number
      delivered: number
      opened: number
      failed: number
    }
    sms: {
      sent: number
      delivered: number
      failed: number
      cost: number // SMS cost
    }
    email: {
      sent: number
      delivered: number
      opened: number
      clicked: number
      bounced: number
    }
  }
  
  // Support metrics
  support: {
    threadsCreated: number
    threadsResolved: number
    avgResolutionTime: number // Hours
    satisfaction: number // 1-5 rating
  }
  
  // Engagement rates
  engagement: {
    overallRate: number // Percentage
    byChannel: {
      inApp: number
      push: number
      sms: number
      email: number
    }
    byCategory: {
      orders: number
      payments: number
      promotions: number
      support: number
    }
  }
}

/**
 * Broadcast Campaign
 */
export interface BroadcastCampaign {
  id: string
  name: string
  description: string
  
  // Target audience
  audience: {
    userType: ('customer' | 'restaurant' | 'rider')[]
    criteria?: {
      minOrders?: number
      lastActiveWithin?: number // Days
      zone?: string[]
      rating?: { min: number; max: number }
    }
    estimatedReach: number
  }
  
  // Message content
  message: {
    title: string
    body: string
    imageUrl?: string
    actionUrl?: string
  }
  
  // Delivery settings
  channels: ('inApp' | 'push' | 'sms' | 'email')[]
  scheduledFor?: Date
  expiresAt?: Date
  
  // Campaign status
  status: 'draft' | 'scheduled' | 'running' | 'completed' | 'cancelled'
  
  // Results
  results?: {
    sent: number
    delivered: number
    opened: number
    clicked: number
    converted: number // Took desired action
  }
  
  // Admin controls
  createdBy: string
  approvedBy?: string
  budget?: number // For SMS costs
  actualCost?: number
  
  createdAt: Date
  startedAt?: Date
  completedAt?: Date
}