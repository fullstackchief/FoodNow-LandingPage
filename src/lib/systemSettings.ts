/**
 * SYSTEM SETTINGS SERVICE
 * =======================
 * Service for managing configurable system settings
 */

import { supabase } from '@/lib/supabase-client'
import { prodLog } from '@/lib/logger'

interface SystemSetting {
  id: string
  setting_key: string
  setting_value: string
  setting_type: 'string' | 'number' | 'boolean' | 'json'
  category: string
  description?: string
  is_public: boolean
}

class SystemSettingsService {
  private cache = new Map<string, any>()
  private cacheExpiry = new Map<string, number>()
  private readonly CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

  /**
   * Get a setting value by key with caching
   */
  async getSetting<T = any>(key: string, defaultValue?: T): Promise<T> {
    try {
      // Check cache first
      if (this.isCacheValid(key)) {
        return this.cache.get(key)
      }

      const { data, error } = await (supabase as any)
        .from('system_settings')
        .select('setting_value, setting_type')
        .eq('setting_key', key)
        .single()

      if (error || !data) {
        console.warn(`⚠️ Setting ${key} not found, using default:`, defaultValue)
        return defaultValue as T
      }

      // Parse value based on type
      let parsedValue: any = (data as any).setting_value
      
      switch ((data as any).setting_type) {
        case 'number':
          parsedValue = parseFloat((data as any).setting_value)
          break
        case 'boolean':
          parsedValue = (data as any).setting_value.toLowerCase() === 'true'
          break
        case 'json':
          try {
            parsedValue = JSON.parse((data as any).setting_value)
          } catch {
            console.error(`❌ Invalid JSON in setting ${key}`)
            return defaultValue as T
          }
          break
        case 'string':
        default:
          parsedValue = (data as any).setting_value
      }

      // Cache the result
      this.cache.set(key, parsedValue)
      this.cacheExpiry.set(key, Date.now() + this.CACHE_DURATION)

      return parsedValue
    } catch (error) {
      prodLog.error('Error fetching system setting', error, { setting_key: key })
      return defaultValue as T
    }
  }

  /**
   * Get delivery radius in kilometers
   */
  async getDeliveryRadius(): Promise<number> {
    return await this.getSetting('max_delivery_distance_km', 20)
  }

  /**
   * Update a setting value (admin only)
   */
  async updateSetting(key: string, value: any, settingType?: string): Promise<boolean> {
    try {
      let stringValue: string
      
      if (typeof value === 'object') {
        stringValue = JSON.stringify(value)
        settingType = settingType || 'json'
      } else {
        stringValue = String(value)
        settingType = settingType || typeof value
      }

      const { error } = await (supabase as any)
        .from('system_settings')
        .update({ 
          setting_value: stringValue,
          setting_type: settingType
        })
        .eq('setting_key', key)

      if (error) {
        throw error
      }

      // Clear cache for this key
      this.cache.delete(key)
      this.cacheExpiry.delete(key)

      console.log(`✅ Updated setting ${key} to:`, value)
      return true
    } catch (error) {
      prodLog.error('Error updating system setting', error, { setting_key: key, value })
      return false
    }
  }

  /**
   * Get all settings by category
   */
  async getSettingsByCategory(category: string): Promise<SystemSetting[]> {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .eq('category', category)
        .order('setting_key')

      if (error) {
        throw error
      }

      return data || []
    } catch (error) {
      prodLog.error('Error fetching settings by category', error, { category })
      return []
    }
  }

  /**
   * Check if cache is still valid
   */
  private isCacheValid(key: string): boolean {
    const expiry = this.cacheExpiry.get(key)
    return expiry ? Date.now() < expiry : false
  }

  /**
   * Clear all cached settings
   */
  clearCache(): void {
    this.cache.clear()
    this.cacheExpiry.clear()
  }
}

export const systemSettings = new SystemSettingsService()