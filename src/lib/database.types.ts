export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          first_name: string
          last_name: string
          phone: string | null
          avatar_url: string | null
          date_of_birth: string | null
          gender: 'male' | 'female' | 'other' | null
          loyalty_points: number
          tier: 'bronze' | 'silver' | 'gold' | 'platinum'
          total_orders: number
          created_at: string
          updated_at: string
          preferences: Json | null
        }
        Insert: {
          id?: string
          email: string
          first_name: string
          last_name: string
          phone?: string | null
          avatar_url?: string | null
          date_of_birth?: string | null
          gender?: 'male' | 'female' | 'other' | null
          loyalty_points?: number
          tier?: 'bronze' | 'silver' | 'gold' | 'platinum'
          total_orders?: number
          created_at?: string
          updated_at?: string
          preferences?: Json | null
        }
        Update: {
          id?: string
          email?: string
          first_name?: string
          last_name?: string
          phone?: string | null
          avatar_url?: string | null
          date_of_birth?: string | null
          gender?: 'male' | 'female' | 'other' | null
          loyalty_points?: number
          tier?: 'bronze' | 'silver' | 'gold' | 'platinum'
          total_orders?: number
          created_at?: string
          updated_at?: string
          preferences?: Json | null
        }
      }
      addresses: {
        Row: {
          id: string
          user_id: string
          label: string
          address: string
          coordinates: Json
          instructions: string | null
          is_default: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          label: string
          address: string
          coordinates: Json
          instructions?: string | null
          is_default?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          label?: string
          address?: string
          coordinates?: Json
          instructions?: string | null
          is_default?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      payment_methods: {
        Row: {
          id: string
          user_id: string
          type: 'card' | 'bank' | 'wallet'
          last4: string | null
          brand: string | null
          expiry_month: string | null
          expiry_year: string | null
          is_default: boolean
          name: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: 'card' | 'bank' | 'wallet'
          last4?: string | null
          brand?: string | null
          expiry_month?: string | null
          expiry_year?: string | null
          is_default?: boolean
          name: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: 'card' | 'bank' | 'wallet'
          last4?: string | null
          brand?: string | null
          expiry_month?: string | null
          expiry_year?: string | null
          is_default?: boolean
          name?: string
          created_at?: string
          updated_at?: string
        }
      }
      restaurants: {
        Row: {
          id: string
          name: string
          description: string
          image_url: string
          cover_image_url: string | null
          rating: number
          review_count: number
          price_range: '$' | '$$' | '$$$' | '$$$$'
          cuisine_types: string[]
          delivery_time: string
          delivery_fee: number
          minimum_order: number
          is_open: boolean
          opening_hours: Json
          location: Json
          features: string[]
          phone_number: string
          email: string
          total_orders: number
          established_year: number | null
          created_at: string
          updated_at: string
          promotions: Json | null
        }
        Insert: {
          id?: string
          name: string
          description: string
          image_url: string
          cover_image_url?: string | null
          rating?: number
          review_count?: number
          price_range: '$' | '$$' | '$$$' | '$$$$'
          cuisine_types: string[]
          delivery_time: string
          delivery_fee: number
          minimum_order: number
          is_open?: boolean
          opening_hours: Json
          location: Json
          features?: string[]
          phone_number: string
          email: string
          total_orders?: number
          established_year?: number | null
          created_at?: string
          updated_at?: string
          promotions?: Json | null
        }
        Update: {
          id?: string
          name?: string
          description?: string
          image_url?: string
          cover_image_url?: string | null
          rating?: number
          review_count?: number
          price_range?: '$' | '$$' | '$$$' | '$$$$'
          cuisine_types?: string[]
          delivery_time?: string
          delivery_fee?: number
          minimum_order?: number
          is_open?: boolean
          opening_hours?: Json
          location?: Json
          features?: string[]
          phone_number?: string
          email?: string
          total_orders?: number
          established_year?: number | null
          created_at?: string
          updated_at?: string
          promotions?: Json | null
        }
      }
      menu_items: {
        Row: {
          id: string
          restaurant_id: string
          name: string
          description: string
          base_price: number
          image_url: string
          category: string
          is_available: boolean
          preparation_time: number
          calories: number | null
          tags: string[]
          allergens: string[] | null
          customizations: Json | null
          nutrition_info: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          restaurant_id: string
          name: string
          description: string
          base_price: number
          image_url: string
          category: string
          is_available?: boolean
          preparation_time: number
          calories?: number | null
          tags?: string[]
          allergens?: string[] | null
          customizations?: Json | null
          nutrition_info?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          restaurant_id?: string
          name?: string
          description?: string
          base_price?: number
          image_url?: string
          category?: string
          is_available?: boolean
          preparation_time?: number
          calories?: number | null
          tags?: string[]
          allergens?: string[] | null
          customizations?: Json | null
          nutrition_info?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      orders: {
        Row: {
          id: string
          order_number: string
          user_id: string
          restaurant_id: string
          status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'picked_up' | 'delivered' | 'cancelled'
          payment_method: string
          payment_status: 'pending' | 'paid' | 'failed' | 'refunded'
          subtotal: number
          delivery_fee: number
          service_fee: number
          tax: number
          discount: number
          total: number
          delivery_info: Json
          rider_id: string | null
          estimated_delivery_time: string
          actual_delivery_time: string | null
          special_instructions: string | null
          promo_code: string | null
          rating: number | null
          review: string | null
          tracking_updates: Json[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          order_number: string
          user_id: string
          restaurant_id: string
          status?: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'picked_up' | 'delivered' | 'cancelled'
          payment_method: string
          payment_status?: 'pending' | 'paid' | 'failed' | 'refunded'
          subtotal: number
          delivery_fee: number
          service_fee: number
          tax: number
          discount: number
          total: number
          delivery_info: Json
          rider_id?: string | null
          estimated_delivery_time: string
          actual_delivery_time?: string | null
          special_instructions?: string | null
          promo_code?: string | null
          rating?: number | null
          review?: string | null
          tracking_updates?: Json[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          order_number?: string
          user_id?: string
          restaurant_id?: string
          status?: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'picked_up' | 'delivered' | 'cancelled'
          payment_method?: string
          payment_status?: 'pending' | 'paid' | 'failed' | 'refunded'
          subtotal?: number
          delivery_fee?: number
          service_fee?: number
          tax?: number
          discount?: number
          total?: number
          delivery_info?: Json
          rider_id?: string | null
          estimated_delivery_time?: string
          actual_delivery_time?: string | null
          special_instructions?: string | null
          promo_code?: string | null
          rating?: number | null
          review?: string | null
          tracking_updates?: Json[]
          created_at?: string
          updated_at?: string
        }
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          menu_item_id: string
          quantity: number
          price: number
          customizations: string[] | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          menu_item_id: string
          quantity: number
          price: number
          customizations?: string[] | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          menu_item_id?: string
          quantity?: number
          price?: number
          customizations?: string[] | null
          notes?: string | null
          created_at?: string
        }
      }
      riders: {
        Row: {
          id: string
          user_id: string
          vehicle_type: string
          license_number: string
          vehicle_registration: string
          rating: number
          total_deliveries: number
          is_active: boolean
          current_location: Json | null
          is_available: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          vehicle_type: string
          license_number: string
          vehicle_registration: string
          rating?: number
          total_deliveries?: number
          is_active?: boolean
          current_location?: Json | null
          is_available?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          vehicle_type?: string
          license_number?: string
          vehicle_registration?: string
          rating?: number
          total_deliveries?: number
          is_active?: boolean
          current_location?: Json | null
          is_available?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      favorites: {
        Row: {
          id: string
          user_id: string
          restaurant_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          restaurant_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          restaurant_id?: string
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}