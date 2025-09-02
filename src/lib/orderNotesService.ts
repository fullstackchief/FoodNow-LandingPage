/**
 * Order Notes Service
 * ===================
 * Permanent customer order notes system for delivery preferences and special instructions
 */

import { createClient } from '@supabase/supabase-js'
import type { OrderNotes } from '@/types/order-tracking'
import { devLog, prodLog } from '@/lib/logger'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

/**
 * Order Notes Management Service
 */
export class OrderNotesService {
  /**
   * Create or update order notes
   */
  static async saveOrderNotes(
    orderId: string,
    customerId: string,
    notes: {
      deliveryInstructions?: string
      dietaryPreferences?: string
      specialRequests?: string
    },
    setAsDefault: boolean = false
  ): Promise<{ success: boolean; noteId?: string }> {
    try {
      // Check if notes already exist for this order
      const { data: existing, error: fetchError } = await supabase
        .from('order_notes')
        .select('*')
        .eq('order_id', orderId)
        .single()

      const noteData: Partial<OrderNotes> = {
        orderId,
        customerId,
        deliveryInstructions: notes.deliveryInstructions || '',
        dietaryPreferences: notes.dietaryPreferences || '',
        specialRequests: notes.specialRequests || '',
        visibleTo: ['rider', 'restaurant', 'admin'],
        isDefault: setAsDefault,
        frequency: existing ? existing.frequency + 1 : 1,
        updatedAt: new Date()
      }

      let result
      if (existing) {
        // Update existing notes
        const { data, error } = await supabase
          .from('order_notes')
          .update(noteData)
          .eq('id', existing.id)
          .select()
          .single()

        if (error) throw error
        result = data
      } else {
        // Create new notes
        noteData.id = crypto.randomUUID()
        noteData.createdAt = new Date()

        const { data, error } = await supabase
          .from('order_notes')
          .insert(noteData)
          .select()
          .single()

        if (error) throw error
        result = data
      }

      // If set as default, update customer's default preferences
      if (setAsDefault) {
        await this.updateCustomerDefaultNotes(customerId, notes)
      }

      // Update note frequency tracking
      await this.updateNoteFrequency(customerId, notes)

      devLog.info('Order notes saved', {
        orderId,
        customerId,
        noteId: result.id,
        setAsDefault
      })

      return { success: true, noteId: result.id }
    } catch (error) {
      prodLog.error('Failed to save order notes', error, { orderId, customerId })
      return { success: false }
    }
  }

  /**
   * Get order notes by order ID
   */
  static async getOrderNotes(
    orderId: string,
    requestingUserRole: 'customer' | 'restaurant' | 'rider' | 'admin'
  ): Promise<OrderNotes | null> {
    try {
      const { data, error } = await supabase
        .from('order_notes')
        .select('*')
        .eq('order_id', orderId)
        .single()

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      if (!data) return null

      // Check visibility permissions
      const notes = data as OrderNotes
      if (!notes.visibleTo.includes(requestingUserRole as any) && requestingUserRole !== 'admin') {
        return null
      }

      return notes
    } catch (error) {
      prodLog.error('Failed to get order notes', error, { orderId })
      return null
    }
  }

  /**
   * Get customer's default delivery preferences
   */
  static async getCustomerDefaultNotes(customerId: string): Promise<{
    deliveryInstructions: string
    dietaryPreferences: string
    specialRequests: string
  } | null> {
    try {
      const { data, error } = await supabase
        .from('customer_default_notes')
        .select('*')
        .eq('customer_id', customerId)
        .single()

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      return data ? {
        deliveryInstructions: data.delivery_instructions || '',
        dietaryPreferences: data.dietary_preferences || '',
        specialRequests: data.special_requests || ''
      } : null
    } catch (error) {
      prodLog.error('Failed to get customer default notes', error, { customerId })
      return null
    }
  }

  /**
   * Update customer's default delivery preferences
   */
  static async updateCustomerDefaultNotes(
    customerId: string,
    notes: {
      deliveryInstructions?: string
      dietaryPreferences?: string
      specialRequests?: string
    }
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('customer_default_notes')
        .upsert({
          customer_id: customerId,
          delivery_instructions: notes.deliveryInstructions || '',
          dietary_preferences: notes.dietaryPreferences || '',
          special_requests: notes.specialRequests || '',
          updated_at: new Date().toISOString()
        })

      if (error) {
        throw error
      }

      devLog.info('Customer default notes updated', { customerId })
      return true
    } catch (error) {
      prodLog.error('Failed to update customer default notes', error, { customerId })
      return false
    }
  }

  /**
   * Get customer's historical note patterns
   */
  static async getCustomerNotePatterns(customerId: string): Promise<{
    mostCommonInstructions: string[]
    frequentDietaryPreferences: string[]
    recentSpecialRequests: string[]
  }> {
    try {
      const { data: notes, error } = await supabase
        .from('order_notes')
        .select('delivery_instructions, dietary_preferences, special_requests, frequency')
        .eq('customer_id', customerId)
        .order('frequency', { ascending: false })
        .limit(20)

      if (error) {
        throw error
      }

      if (!notes || notes.length === 0) {
        return {
          mostCommonInstructions: [],
          frequentDietaryPreferences: [],
          recentSpecialRequests: []
        }
      }

      // Analyze patterns
      const instructionFreq = new Map<string, number>()
      const dietaryFreq = new Map<string, number>()
      const requestsFreq = new Map<string, number>()

      notes.forEach(note => {
        if (note.delivery_instructions) {
          instructionFreq.set(note.delivery_instructions, (instructionFreq.get(note.delivery_instructions) || 0) + note.frequency)
        }
        if (note.dietary_preferences) {
          dietaryFreq.set(note.dietary_preferences, (dietaryFreq.get(note.dietary_preferences) || 0) + note.frequency)
        }
        if (note.special_requests) {
          requestsFreq.set(note.special_requests, (requestsFreq.get(note.special_requests) || 0) + note.frequency)
        }
      })

      return {
        mostCommonInstructions: Array.from(instructionFreq.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([instruction]) => instruction),
        frequentDietaryPreferences: Array.from(dietaryFreq.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([preference]) => preference),
        recentSpecialRequests: Array.from(requestsFreq.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([request]) => request)
      }
    } catch (error) {
      prodLog.error('Failed to get customer note patterns', error, { customerId })
      return {
        mostCommonInstructions: [],
        frequentDietaryPreferences: [],
        recentSpecialRequests: []
      }
    }
  }

  /**
   * Auto-suggest notes based on customer history
   */
  static async getNoteSuggestions(customerId: string): Promise<{
    deliveryInstructions: string[]
    dietaryPreferences: string[]
    specialRequests: string[]
  }> {
    try {
      const patterns = await this.getCustomerNotePatterns(customerId)
      const defaults = await this.getCustomerDefaultNotes(customerId)

      // Combine default notes with historical patterns
      const suggestions = {
        deliveryInstructions: [
          ...(defaults?.deliveryInstructions ? [defaults.deliveryInstructions] : []),
          ...patterns.mostCommonInstructions
        ].slice(0, 3), // Top 3 suggestions

        dietaryPreferences: [
          ...(defaults?.dietaryPreferences ? [defaults.dietaryPreferences] : []),
          ...patterns.frequentDietaryPreferences
        ].slice(0, 3),

        specialRequests: [
          ...(defaults?.specialRequests ? [defaults.specialRequests] : []),
          ...patterns.recentSpecialRequests
        ].slice(0, 3)
      }

      return suggestions
    } catch (error) {
      prodLog.error('Failed to get note suggestions', error, { customerId })
      return {
        deliveryInstructions: [],
        dietaryPreferences: [],
        specialRequests: []
      }
    }
  }

  /**
   * Update note frequency tracking
   */
  private static async updateNoteFrequency(
    customerId: string,
    notes: {
      deliveryInstructions?: string
      dietaryPreferences?: string
      specialRequests?: string
    }
  ): Promise<void> {
    try {
      // Find similar notes and increment frequency
      const queries = []

      if (notes.deliveryInstructions) {
        queries.push(
          supabase
            .from('order_notes')
            .update({ frequency: (supabase as any).raw('frequency + 1') })
            .eq('customer_id', customerId)
            .eq('delivery_instructions', notes.deliveryInstructions)
        )
      }

      if (notes.dietaryPreferences) {
        queries.push(
          supabase
            .from('order_notes')
            .update({ frequency: (supabase as any).raw('frequency + 1') })
            .eq('customer_id', customerId)
            .eq('dietary_preferences', notes.dietaryPreferences)
        )
      }

      if (notes.specialRequests) {
        queries.push(
          supabase
            .from('order_notes')
            .update({ frequency: (supabase as any).raw('frequency + 1') })
            .eq('customer_id', customerId)
            .eq('special_requests', notes.specialRequests)
        )
      }

      // Execute all updates
      await Promise.all(queries)

      devLog.info('Note frequency updated', { customerId })
    } catch (error) {
      prodLog.error('Failed to update note frequency', error, { customerId })
    }
  }

  /**
   * Get notes for restaurant view (visible data only)
   */
  static async getNotesForRestaurant(orderId: string): Promise<{
    deliveryInstructions: string
    dietaryPreferences: string
    specialRequests: string
  } | null> {
    try {
      const notes = await this.getOrderNotes(orderId, 'restaurant')
      
      if (!notes) return null

      return {
        deliveryInstructions: notes.deliveryInstructions,
        dietaryPreferences: notes.dietaryPreferences,
        specialRequests: notes.specialRequests
      }
    } catch (error) {
      prodLog.error('Failed to get notes for restaurant', error, { orderId })
      return null
    }
  }

  /**
   * Get notes for rider view (visible data only)
   */
  static async getNotesForRider(orderId: string): Promise<{
    deliveryInstructions: string
    specialRequests: string
  } | null> {
    try {
      const notes = await this.getOrderNotes(orderId, 'rider')
      
      if (!notes) return null

      return {
        deliveryInstructions: notes.deliveryInstructions,
        specialRequests: notes.specialRequests
        // Dietary preferences not shown to rider for security
      }
    } catch (error) {
      prodLog.error('Failed to get notes for rider', error, { orderId })
      return null
    }
  }

  /**
   * Search notes across orders (admin only)
   */
  static async searchOrderNotes(
    searchTerm: string,
    filters?: {
      customerId?: string
      dateFrom?: Date
      dateTo?: Date
      noteType?: 'delivery' | 'dietary' | 'special'
    }
  ): Promise<OrderNotes[]> {
    try {
      let query = supabase
        .from('order_notes')
        .select('*')

      // Apply filters
      if (filters?.customerId) {
        query = query.eq('customer_id', filters.customerId)
      }

      if (filters?.dateFrom) {
        query = query.gte('created_at', filters.dateFrom.toISOString())
      }

      if (filters?.dateTo) {
        query = query.lte('created_at', filters.dateTo.toISOString())
      }

      // Text search across note fields
      if (searchTerm) {
        query = query.or(`delivery_instructions.ilike.%${searchTerm}%,dietary_preferences.ilike.%${searchTerm}%,special_requests.ilike.%${searchTerm}%`)
      }

      const { data, error } = await query
        .order('created_at', { ascending: false })
        .limit(100)

      if (error) {
        throw error
      }

      return data as OrderNotes[] || []
    } catch (error) {
      prodLog.error('Failed to search order notes', error, { searchTerm })
      return []
    }
  }

  /**
   * Get note analytics for admin dashboard
   */
  static async getNoteAnalytics(): Promise<{
    totalNotes: number
    avgNotesPerOrder: number
    mostCommonInstructions: { text: string; count: number }[]
    mostCommonDietary: { text: string; count: number }[]
    mostCommonRequests: { text: string; count: number }[]
  }> {
    try {
      const { data: notes, error } = await supabase
        .from('order_notes')
        .select('delivery_instructions, dietary_preferences, special_requests, frequency')

      if (error) {
        throw error
      }

      if (!notes || notes.length === 0) {
        return {
          totalNotes: 0,
          avgNotesPerOrder: 0,
          mostCommonInstructions: [],
          mostCommonDietary: [],
          mostCommonRequests: []
        }
      }

      // Analyze frequency patterns
      const instructionFreq = new Map<string, number>()
      const dietaryFreq = new Map<string, number>()
      const requestsFreq = new Map<string, number>()

      notes.forEach(note => {
        if (note.delivery_instructions) {
          instructionFreq.set(note.delivery_instructions, (instructionFreq.get(note.delivery_instructions) || 0) + note.frequency)
        }
        if (note.dietary_preferences) {
          dietaryFreq.set(note.dietary_preferences, (dietaryFreq.get(note.dietary_preferences) || 0) + note.frequency)
        }
        if (note.special_requests) {
          requestsFreq.set(note.special_requests, (requestsFreq.get(note.special_requests) || 0) + note.frequency)
        }
      })

      return {
        totalNotes: notes.length,
        avgNotesPerOrder: notes.reduce((sum, note) => sum + note.frequency, 0) / notes.length,
        mostCommonInstructions: Array.from(instructionFreq.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
          .map(([text, count]) => ({ text, count })),
        mostCommonDietary: Array.from(dietaryFreq.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
          .map(([text, count]) => ({ text, count })),
        mostCommonRequests: Array.from(requestsFreq.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
          .map(([text, count]) => ({ text, count }))
      }
    } catch (error) {
      prodLog.error('Failed to get note analytics', error)
      return {
        totalNotes: 0,
        avgNotesPerOrder: 0,
        mostCommonInstructions: [],
        mostCommonDietary: [],
        mostCommonRequests: []
      }
    }
  }

  /**
   * Auto-populate order notes from customer history
   */
  static async autoPopulateNotes(
    customerId: string,
    orderId: string
  ): Promise<{ success: boolean; notes?: any }> {
    try {
      // Get customer's default notes
      const defaultNotes = await this.getCustomerDefaultNotes(customerId)
      
      if (!defaultNotes) {
        return { success: true, notes: null }
      }

      // Save as order notes
      const result = await this.saveOrderNotes(orderId, customerId, defaultNotes, false)
      
      if (!result.success) {
        throw new Error('Failed to auto-populate notes')
      }

      devLog.info('Order notes auto-populated', {
        customerId,
        orderId,
        hasDeliveryInstructions: !!defaultNotes.deliveryInstructions,
        hasDietaryPreferences: !!defaultNotes.dietaryPreferences,
        hasSpecialRequests: !!defaultNotes.specialRequests
      })

      return { success: true, notes: defaultNotes }
    } catch (error) {
      prodLog.error('Failed to auto-populate notes', error, { customerId, orderId })
      return { success: false }
    }
  }

  /**
   * Get notes summary for order management
   */
  static async getNoteSummaryForOrder(
    orderId: string,
    userRole: 'restaurant' | 'rider' | 'admin'
  ): Promise<{
    hasDeliveryInstructions: boolean
    hasDietaryPreferences: boolean
    hasSpecialRequests: boolean
    summary: string
  }> {
    try {
      const notes = await this.getOrderNotes(orderId, userRole)
      
      if (!notes) {
        return {
          hasDeliveryInstructions: false,
          hasDietaryPreferences: false,
          hasSpecialRequests: false,
          summary: 'No special instructions'
        }
      }

      const summaryParts = []
      if (notes.deliveryInstructions) summaryParts.push(notes.deliveryInstructions)
      if (notes.dietaryPreferences && userRole !== 'rider') summaryParts.push(notes.dietaryPreferences)
      if (notes.specialRequests) summaryParts.push(notes.specialRequests)

      return {
        hasDeliveryInstructions: !!notes.deliveryInstructions,
        hasDietaryPreferences: !!notes.dietaryPreferences,
        hasSpecialRequests: !!notes.specialRequests,
        summary: summaryParts.length > 0 ? summaryParts.join(' | ') : 'No special instructions'
      }
    } catch (error) {
      prodLog.error('Failed to get note summary', error, { orderId })
      return {
        hasDeliveryInstructions: false,
        hasDietaryPreferences: false,
        hasSpecialRequests: false,
        summary: 'Error loading instructions'
      }
    }
  }

  /**
   * Delete order notes (admin only)
   */
  static async deleteOrderNotes(orderId: string, adminId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('order_notes')
        .delete()
        .eq('order_id', orderId)

      if (error) {
        throw error
      }

      // Log deletion for audit
      await supabase.from('note_audit_log').insert({
        order_id: orderId,
        action: 'deleted',
        admin_id: adminId,
        timestamp: new Date().toISOString()
      })

      devLog.info('Order notes deleted', { orderId, adminId })
      return true
    } catch (error) {
      prodLog.error('Failed to delete order notes', error, { orderId })
      return false
    }
  }
}