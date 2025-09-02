/**
 * Admin Messaging Service
 * =======================
 * Secure admin-controlled messaging system with broadcast capabilities
 */

import { createClient } from '@supabase/supabase-js'
import type {
  AdminMessage,
  MessageThread,
  Notification,
  NotificationPreferences,
  BroadcastCampaign
} from '@/types/communication'
import { devLog, prodLog } from '@/lib/logger'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

/**
 * Admin Messaging Service
 */
export class AdminMessagingService {
  /**
   * Send message from admin to user(s)
   */
  static async sendMessage(
    adminId: string,
    adminRole: 'super_admin' | 'admin' | 'support',
    messageData: Omit<AdminMessage, 'id' | 'from' | 'status' | 'sentAt' | 'readReceipts' | 'stats'>
  ): Promise<{ success: boolean; messageId?: string; recipientCount?: number }> {
    try {
      // Create message record
      const message: AdminMessage = {
        id: crypto.randomUUID(),
        from: {
          adminId,
          adminName: await this.getAdminName(adminId),
          adminRole
        },
        ...messageData,
        status: 'sent',
        sentAt: new Date(),
        readReceipts: [],
        stats: {
          totalRecipients: 0,
          delivered: 0,
          read: 0,
          responded: 0,
          failed: 0
        }
      }

      // Get recipient list
      const recipients = await this.getRecipients(message.to)
      message.stats.totalRecipients = recipients.length

      // Store message
      const { error: insertError } = await supabase
        .from('admin_messages')
        .insert(message)

      if (insertError) {
        throw insertError
      }

      // Send to recipients
      let delivered = 0
      for (const recipient of recipients) {
        const success = await this.deliverMessage(message, recipient)
        if (success) delivered++
      }

      // Update delivery stats
      await supabase
        .from('admin_messages')
        .update({ 
          'stats.delivered': delivered,
          status: delivered > 0 ? 'delivered' : 'failed'
        })
        .eq('id', message.id)

      devLog.info('Admin message sent', {
        messageId: message.id,
        adminId,
        recipients: recipients.length,
        delivered
      })

      return {
        success: true,
        messageId: message.id,
        recipientCount: recipients.length
      }
    } catch (error) {
      prodLog.error('Failed to send admin message', error, { adminId })
      return { success: false }
    }
  }

  /**
   * Get recipients based on targeting criteria
   */
  private static async getRecipients(to: AdminMessage['to']): Promise<Array<{ id: string; type: string; name: string; phone?: string; email?: string }>> {
    try {
      let query
      let recipients: any[] = []

      switch (to.type) {
        case 'individual':
          if (to.individual) {
            const { data } = await supabase
              .from('users')
              .select('id, first_name, last_name, phone, email, user_type')
              .eq('id', to.individual.userId)
              .eq('user_type', to.individual.userType)
              .single()

            if (data) {
              recipients = [data]
            }
          }
          break

        case 'broadcast':
          if (to.broadcast) {
            let baseQuery = supabase
              .from('users')
              .select('id, first_name, last_name, phone, email, user_type')

            // Filter by user type
            if (to.broadcast.scope === 'all_customers') {
              baseQuery = baseQuery.eq('user_type', 'customer')
            } else if (to.broadcast.scope === 'all_restaurants') {
              baseQuery = baseQuery.eq('user_type', 'restaurant_owner')
            } else if (to.broadcast.scope === 'all_riders') {
              baseQuery = baseQuery.eq('user_type', 'rider')
            }

            // Filter by zone if specified
            if (to.broadcast.zone) {
              baseQuery = baseQuery.eq('zone', to.broadcast.zone)
            }

            const { data } = await baseQuery
            recipients = data || []
          }
          break

        case 'targeted':
          if (to.targeted) {
            let targetQuery = supabase
              .from('users')
              .select('id, first_name, last_name, phone, email, user_type')
              .eq('user_type', to.targeted.userType)

            // Apply criteria filters
            if (to.targeted.criteria.zone) {
              targetQuery = targetQuery.eq('zone', to.targeted.criteria.zone)
            }

            if (to.targeted.criteria.isOnline !== undefined) {
              targetQuery = targetQuery.eq('is_online', to.targeted.criteria.isOnline)
            }

            if (to.targeted.criteria.accountAge) {
              const cutoffDate = new Date()
              cutoffDate.setDate(cutoffDate.getDate() - to.targeted.criteria.accountAge)
              targetQuery = targetQuery.lte('created_at', cutoffDate.toISOString())
            }

            const { data } = await targetQuery
            recipients = data || []

            // Apply rating filter if specified
            if (to.targeted.criteria.minRating || to.targeted.criteria.maxRating) {
              recipients = await this.filterByRating(recipients, to.targeted.criteria)
            }
          }
          break
      }

      return recipients.map(user => ({
        id: user.id,
        type: user.user_type,
        name: `${user.first_name} ${user.last_name}`,
        phone: user.phone,
        email: user.email
      }))
    } catch (error) {
      prodLog.error('Failed to get message recipients', error)
      return []
    }
  }

  /**
   * Deliver message to individual recipient
   */
  private static async deliverMessage(
    message: AdminMessage,
    recipient: { id: string; type: string; name: string; phone?: string; email?: string }
  ): Promise<boolean> {
    try {
      // Create notification for recipient
      const notification: Notification = {
        id: crypto.randomUUID(),
        userId: recipient.id,
        userType: recipient.type as any,
        title: message.subject,
        body: message.content,
        type: 'message',
        category: message.priority === 'urgent' ? 'action_required' : 'info',
        channels: {
          inApp: true,
          push: message.priority === 'urgent' || message.priority === 'high',
          sms: message.priority === 'urgent',
          email: true
        },
        action: message.actionButtons?.length ? {
          type: 'navigate',
          target: '/messages',
          label: 'View Message'
        } : undefined,
        metadata: {
          messageId: message.id
        },
        status: 'sent',
        createdAt: new Date(),
        sentAt: new Date(),
        attempts: 1
      }

      // Store notification
      const { error } = await supabase
        .from('notifications')
        .insert(notification)

      if (error) {
        throw error
      }

      // Send via enabled channels
      await this.sendNotificationViaChannels(notification, recipient)

      return true
    } catch (error) {
      prodLog.error('Failed to deliver message', error, {
        messageId: message.id,
        recipientId: recipient.id
      })
      return false
    }
  }

  /**
   * Send notification via multiple channels
   */
  private static async sendNotificationViaChannels(
    notification: Notification,
    recipient: { phone?: string; email?: string }
  ): Promise<void> {
    try {
      // Get user notification preferences
      const preferences = await this.getUserNotificationPreferences(notification.userId)

      // Send push notification
      if (notification.channels.push && preferences?.channels.push.enabled) {
        await this.sendPushNotification(notification, preferences.channels.push.token)
      }

      // Send SMS
      if (notification.channels.sms && preferences?.channels.sms.enabled && recipient.phone) {
        await this.sendSMS(recipient.phone, notification.title, notification.body)
      }

      // Send email
      if (notification.channels.email && preferences?.channels.email.enabled && recipient.email) {
        await this.sendEmail(recipient.email, notification.title, notification.body)
      }

      // Send in-app notification (always enabled)
      await this.sendInAppNotification(notification)

      devLog.info('Notification sent via channels', {
        notificationId: notification.id,
        userId: notification.userId,
        channels: Object.keys(notification.channels).filter(ch => notification.channels[ch as keyof typeof notification.channels])
      })
    } catch (error) {
      prodLog.error('Failed to send notification via channels', error, {
        notificationId: notification.id
      })
    }
  }

  /**
   * Create support thread
   */
  static async createSupportThread(
    customerId: string,
    subject: string,
    category: 'order_issue' | 'payment' | 'complaint' | 'feedback' | 'technical' | 'other',
    initialMessage: string,
    orderId?: string
  ): Promise<string | null> {
    try {
      const thread: MessageThread = {
        id: crypto.randomUUID(),
        participantIds: [customerId], // Admin will be added when they respond
        subject,
        category,
        priority: category === 'order_issue' ? 'high' : 'normal',
        status: 'open',
        orderId,
        messages: [{
          id: crypto.randomUUID(),
          senderId: customerId,
          senderRole: 'customer',
          content: initialMessage,
          sentAt: new Date(),
          readBy: []
        }],
        createdAt: new Date(),
        updatedAt: new Date()
      }

      const { error } = await supabase
        .from('support_threads')
        .insert(thread)

      if (error) {
        throw error
      }

      // Notify admins of new support request
      await this.notifyAdminsOfNewThread(thread)

      devLog.info('Support thread created', {
        threadId: thread.id,
        customerId,
        category
      })

      return thread.id
    } catch (error) {
      prodLog.error('Failed to create support thread', error, { customerId })
      return null
    }
  }

  /**
   * Add message to support thread
   */
  static async addMessageToThread(
    threadId: string,
    senderId: string,
    senderRole: 'customer' | 'restaurant' | 'rider' | 'admin',
    content: string,
    attachments?: any[]
  ): Promise<boolean> {
    try {
      // Get current thread
      const { data: thread, error: threadError } = await supabase
        .from('support_threads')
        .select('*')
        .eq('id', threadId)
        .single()

      if (threadError || !thread) {
        throw new Error('Thread not found')
      }

      // Create new message
      const newMessage = {
        id: crypto.randomUUID(),
        senderId,
        senderRole,
        content,
        attachments,
        sentAt: new Date(),
        readBy: []
      }

      // Update thread
      const updatedMessages = [...(thread.messages || []), newMessage]

      const { error: updateError } = await supabase
        .from('support_threads')
        .update({
          messages: updatedMessages,
          updated_at: new Date().toISOString(),
          status: senderRole === 'admin' ? 'pending' : 'open'
        })
        .eq('id', threadId)

      if (updateError) {
        throw updateError
      }

      // Notify other participants
      await this.notifyThreadParticipants(threadId, newMessage, senderId)

      return true
    } catch (error) {
      prodLog.error('Failed to add message to thread', error, { threadId })
      return false
    }
  }

  /**
   * Get admin name
   */
  private static async getAdminName(adminId: string): Promise<string> {
    try {
      const { data } = await supabase
        .from('users')
        .select('first_name, last_name')
        .eq('id', adminId)
        .single()

      return data ? `${data.first_name} ${data.last_name}` : 'Admin'
    } catch {
      return 'Admin'
    }
  }

  /**
   * Filter recipients by rating
   */
  private static async filterByRating(
    recipients: any[],
    criteria: { minRating?: number; maxRating?: number }
  ): Promise<any[]> {
    // Implementation would filter users based on their ratings
    // This is a simplified version
    return recipients
  }

  /**
   * Get user notification preferences
   */
  private static async getUserNotificationPreferences(
    userId: string
  ): Promise<NotificationPreferences | null> {
    try {
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      return data as NotificationPreferences || null
    } catch (error) {
      prodLog.error('Failed to get notification preferences', error, { userId })
      return null
    }
  }

  /**
   * Send push notification
   */
  private static async sendPushNotification(
    notification: Notification,
    deviceToken?: string
  ): Promise<void> {
    if (!deviceToken) return

    try {
      // Integration with FCM/APNS would go here
      devLog.info('Push notification sent', {
        notificationId: notification.id,
        title: notification.title
      })
    } catch (error) {
      prodLog.error('Failed to send push notification', error)
    }
  }

  /**
   * Send SMS
   */
  private static async sendSMS(
    phoneNumber: string,
    title: string,
    message: string
  ): Promise<void> {
    try {
      // Integration with SMS provider would go here
      devLog.info('SMS sent', {
        phoneNumber: phoneNumber.substring(0, 4) + '****',
        message: message.substring(0, 50)
      })
    } catch (error) {
      prodLog.error('Failed to send SMS', error)
    }
  }

  /**
   * Send email
   */
  private static async sendEmail(
    email: string,
    subject: string,
    body: string
  ): Promise<void> {
    try {
      // Integration with email provider would go here
      devLog.info('Email sent', {
        email: email.substring(0, 3) + '****',
        subject
      })
    } catch (error) {
      prodLog.error('Failed to send email', error)
    }
  }

  /**
   * Send in-app notification
   */
  private static async sendInAppNotification(notification: Notification): Promise<void> {
    try {
      // Send real-time notification via Supabase channels
      const channel = supabase.channel(`user:${notification.userId}`)
      
      await channel.send({
        type: 'broadcast',
        event: 'notification',
        payload: notification
      })

      devLog.info('In-app notification sent', {
        notificationId: notification.id,
        userId: notification.userId
      })
    } catch (error) {
      prodLog.error('Failed to send in-app notification', error)
    }
  }

  /**
   * Mark message as read
   */
  static async markMessageAsRead(
    messageId: string,
    userId: string
  ): Promise<boolean> {
    try {
      // Get current message
      const { data: message, error: fetchError } = await supabase
        .from('admin_messages')
        .select('read_receipts')
        .eq('id', messageId)
        .single()

      if (fetchError) {
        throw fetchError
      }

      // Check if already read
      const readReceipts = message.read_receipts || []
      const alreadyRead = readReceipts.some((receipt: any) => receipt.userId === userId)

      if (alreadyRead) {
        return true
      }

      // Add read receipt
      const newReceipt = {
        userId,
        readAt: new Date(),
        deviceInfo: 'web' // Could be enhanced with actual device info
      }

      const updatedReceipts = [...readReceipts, newReceipt]

      const { error: updateError } = await supabase
        .from('admin_messages')
        .update({
          read_receipts: updatedReceipts,
          'stats.read': updatedReceipts.length
        })
        .eq('id', messageId)

      if (updateError) {
        throw updateError
      }

      return true
    } catch (error) {
      prodLog.error('Failed to mark message as read', error, { messageId, userId })
      return false
    }
  }

  /**
   * Get messages for user
   */
  static async getMessagesForUser(
    userId: string,
    userType: 'customer' | 'restaurant' | 'rider'
  ): Promise<AdminMessage[]> {
    try {
      const { data, error } = await supabase
        .from('admin_messages')
        .select('*')
        .or(`to.individual.userId.eq.${userId},to.broadcast.scope.eq.all_${userType}s`)
        .order('sent_at', { ascending: false })

      if (error) {
        throw error
      }

      return data as AdminMessage[]
    } catch (error) {
      prodLog.error('Failed to get messages for user', error, { userId })
      return []
    }
  }

  /**
   * Notify admins of new support thread
   */
  private static async notifyAdminsOfNewThread(thread: MessageThread): Promise<void> {
    try {
      // Get all admins
      const { data: admins } = await supabase
        .from('users')
        .select('id')
        .eq('user_type', 'admin')

      if (!admins) return

      // Send notification to each admin
      for (const admin of admins) {
        const notification: Notification = {
          id: crypto.randomUUID(),
          userId: admin.id,
          userType: 'admin',
          title: 'New Support Request',
          body: `${thread.category}: ${thread.subject}`,
          type: 'system',
          category: 'action_required',
          channels: {
            inApp: true,
            push: true,
            sms: false,
            email: false
          },
          action: {
            type: 'navigate',
            target: `/admin/support/${thread.id}`,
            label: 'View Thread'
          },
          metadata: {
            messageId: thread.id
          },
          status: 'sent',
          createdAt: new Date(),
          sentAt: new Date(),
          attempts: 1
        }

        await supabase.from('notifications').insert(notification)
      }
    } catch (error) {
      prodLog.error('Failed to notify admins of new thread', error)
    }
  }

  /**
   * Notify thread participants of new message
   */
  private static async notifyThreadParticipants(
    threadId: string,
    message: any,
    senderId: string
  ): Promise<void> {
    try {
      // Get thread participants
      const { data: thread } = await supabase
        .from('support_threads')
        .select('participant_ids')
        .eq('id', threadId)
        .single()

      if (!thread) return

      // Notify all participants except the sender
      const recipients = thread.participant_ids.filter((id: string) => id !== senderId)

      for (const recipientId of recipients) {
        const notification: Notification = {
          id: crypto.randomUUID(),
          userId: recipientId,
          userType: 'customer', // Simplified - would need to check actual role
          title: 'New Message in Support Thread',
          body: message.content.substring(0, 100),
          type: 'message',
          category: 'info',
          channels: {
            inApp: true,
            push: true,
            sms: false,
            email: false
          },
          metadata: {
            messageId: threadId
          },
          status: 'sent',
          createdAt: new Date(),
          sentAt: new Date(),
          attempts: 1
        }

        await supabase.from('notifications').insert(notification)
      }
    } catch (error) {
      prodLog.error('Failed to notify thread participants', error, { threadId })
    }
  }
}

/**
 * Broadcast Campaign Service
 */
export class BroadcastCampaignService {
  /**
   * Create and execute broadcast campaign
   */
  static async createCampaign(
    adminId: string,
    campaignData: Omit<BroadcastCampaign, 'id' | 'status' | 'results' | 'createdBy' | 'createdAt'>
  ): Promise<{ success: boolean; campaignId?: string }> {
    try {
      const campaign: BroadcastCampaign = {
        id: crypto.randomUUID(),
        ...campaignData,
        status: campaignData.scheduledFor ? 'scheduled' : 'running',
        createdBy: adminId,
        createdAt: new Date(),
        startedAt: campaignData.scheduledFor ? undefined : new Date()
      }

      // Store campaign
      const { error } = await supabase
        .from('broadcast_campaigns')
        .insert(campaign)

      if (error) {
        throw error
      }

      // Execute immediately if not scheduled
      if (!campaignData.scheduledFor) {
        await this.executeCampaign(campaign.id)
      }

      return { success: true, campaignId: campaign.id }
    } catch (error) {
      prodLog.error('Failed to create broadcast campaign', error)
      return { success: false }
    }
  }

  /**
   * Execute broadcast campaign
   */
  static async executeCampaign(campaignId: string): Promise<void> {
    try {
      // Get campaign details
      const { data: campaign, error } = await supabase
        .from('broadcast_campaigns')
        .select('*')
        .eq('id', campaignId)
        .single()

      if (error || !campaign) {
        throw new Error('Campaign not found')
      }

      // Get target audience
      const recipients = await this.getCampaignRecipients(campaign)

      // Send to all recipients
      let sent = 0
      let delivered = 0

      for (const recipient of recipients) {
        try {
          const notification: Notification = {
            id: crypto.randomUUID(),
            userId: recipient.id,
            userType: recipient.type as any,
            title: campaign.message.title,
            body: campaign.message.body,
            imageUrl: campaign.message.imageUrl,
            type: 'promotion',
            category: 'info',
            channels: {
              inApp: campaign.channels.includes('inApp'),
              push: campaign.channels.includes('push'),
              sms: campaign.channels.includes('sms'),
              email: campaign.channels.includes('email')
            },
            action: campaign.message.actionUrl ? {
              type: 'external_link',
              target: campaign.message.actionUrl,
              label: 'Learn More'
            } : undefined,
            status: 'sent',
            createdAt: new Date(),
            sentAt: new Date(),
            expiresAt: campaign.expiresAt,
            attempts: 1
          }

          await supabase.from('notifications').insert(notification)
          sent++

          // Send via channels
          await AdminMessagingService['sendNotificationViaChannels'](notification, recipient)
          delivered++
        } catch (error) {
          prodLog.error('Failed to send campaign message to recipient', error, {
            campaignId,
            recipientId: recipient.id
          })
        }
      }

      // Update campaign results
      await supabase
        .from('broadcast_campaigns')
        .update({
          status: 'completed',
          results: {
            sent,
            delivered,
            opened: 0, // Will be updated as notifications are opened
            clicked: 0,
            converted: 0
          },
          completedAt: new Date().toISOString()
        })
        .eq('id', campaignId)

      devLog.info('Broadcast campaign executed', {
        campaignId,
        sent,
        delivered
      })
    } catch (error) {
      prodLog.error('Failed to execute broadcast campaign', error, { campaignId })
    }
  }

  /**
   * Get campaign recipients based on audience criteria
   */
  private static async getCampaignRecipients(
    campaign: BroadcastCampaign
  ): Promise<Array<{ id: string; type: string; name: string; phone?: string; email?: string }>> {
    try {
      let query = supabase
        .from('users')
        .select('id, first_name, last_name, phone, email, user_type')

      // Filter by user types
      if (campaign.audience.userType.length > 0) {
        query = query.in('user_type', campaign.audience.userType)
      }

      // Apply criteria filters
      if (campaign.audience.criteria) {
        const criteria = campaign.audience.criteria

        if (criteria.zone && criteria.zone.length > 0) {
          query = query.in('zone', criteria.zone)
        }

        if (criteria.lastActiveWithin) {
          const cutoffDate = new Date()
          cutoffDate.setDate(cutoffDate.getDate() - criteria.lastActiveWithin)
          query = query.gte('last_active_at', cutoffDate.toISOString())
        }
      }

      const { data, error } = await query

      if (error) {
        throw error
      }

      return data?.map(user => ({
        id: user.id,
        type: user.user_type,
        name: `${user.first_name} ${user.last_name}`,
        phone: user.phone,
        email: user.email
      })) || []
    } catch (error) {
      prodLog.error('Failed to get campaign recipients', error)
      return []
    }
  }
}