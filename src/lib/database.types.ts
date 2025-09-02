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
          email_verified_at: string | null
          user_role: 'customer' | 'restaurant_owner' | 'rider' | null
          is_active: boolean
          created_at: string
          updated_at: string
          preferences: Json | null
          is_verified: boolean
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
          email_verified_at?: string | null
          user_role?: 'customer' | 'restaurant_owner' | 'rider' | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
          preferences?: Json | null
          is_verified?: boolean
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
          email_verified_at?: string | null
          user_role?: 'customer' | 'restaurant_owner' | 'rider' | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
          preferences?: Json | null
          is_verified?: boolean
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
          image_url: string | null
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
          is_featured: boolean
          distance?: number
        }
        Insert: {
          id?: string
          name: string
          description: string
          image_url: string | null
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
          image_url?: string | null
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
          category_id: string | null
          name: string
          description: string
          base_price: number
          image_url: string | null
          is_available: boolean
          is_popular: boolean
          preparation_time: number
          calories: number
          tags: string[] | null
          allergens: string[] | null
          customizations: Json | null
          nutrition_info: Json | null
          display_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          restaurant_id: string
          category_id?: string | null
          name: string
          description: string
          base_price: number
          image_url: string | null
          is_available?: boolean
          is_popular?: boolean
          preparation_time: number
          calories?: number
          tags?: string[] | null
          allergens?: string[] | null
          customizations?: Json | null
          nutrition_info?: Json | null
          display_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          restaurant_id?: string
          category_id?: string | null
          name?: string
          description?: string
          base_price?: number
          image_url?: string | null
          is_available?: boolean
          is_popular?: boolean
          preparation_time?: number
          calories?: number
          tags?: string[] | null
          allergens?: string[] | null
          customizations?: Json | null
          nutrition_info?: Json | null
          display_order?: number
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
          delivery_address: string
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
          delivery_address: string
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
          delivery_address?: string
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
          unit_price: number
          total_price: number
          customizations: string[] | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          menu_item_id: string
          quantity: number
          unit_price: number
          total_price: number
          customizations?: string[] | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          menu_item_id?: string
          quantity?: number
          unit_price?: number
          total_price?: number
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
      payment_transactions: {
        Row: {
          id: string
          order_id: string | null
          user_id: string
          transaction_reference: string
          payment_method: 'card' | 'bank_transfer' | 'cash' | 'wallet'
          amount: number
          currency: string
          status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded' | 'partially_refunded'
          gateway_name: string | null
          gateway_reference: string | null
          gateway_response: string | null
          authorization_code: string | null
          card_last4: string | null
          card_brand: string | null
          card_bank: string | null
          is_refunded: boolean
          refund_amount: number | null
          refund_reason: string | null
          refunded_at: string | null
          refunded_by: string | null
          ip_address: string | null
          user_agent: string | null
          metadata: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          order_id?: string | null
          user_id: string
          transaction_reference: string
          payment_method: 'card' | 'bank_transfer' | 'cash' | 'wallet'
          amount: number
          currency?: string
          status?: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded' | 'partially_refunded'
          gateway_name?: string | null
          gateway_reference?: string | null
          gateway_response?: string | null
          authorization_code?: string | null
          card_last4?: string | null
          card_brand?: string | null
          card_bank?: string | null
          is_refunded?: boolean
          refund_amount?: number | null
          refund_reason?: string | null
          refunded_at?: string | null
          refunded_by?: string | null
          ip_address?: string | null
          user_agent?: string | null
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          order_id?: string | null
          user_id?: string
          transaction_reference?: string
          payment_method?: 'card' | 'bank_transfer' | 'cash' | 'wallet'
          amount?: number
          currency?: string
          status?: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded' | 'partially_refunded'
          gateway_name?: string | null
          gateway_reference?: string | null
          gateway_response?: string | null
          authorization_code?: string | null
          card_last4?: string | null
          card_brand?: string | null
          card_bank?: string | null
          is_refunded?: boolean
          refund_amount?: number | null
          refund_reason?: string | null
          refunded_at?: string | null
          refunded_by?: string | null
          ip_address?: string | null
          user_agent?: string | null
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      role_applications: {
        Row: {
          id: string
          user_id: string
          requested_role: 'restaurant_owner' | 'rider'
          application_data: Json
          status: 'pending' | 'approved' | 'rejected'
          admin_notes: string | null
          reviewed_by: string | null
          reviewed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          requested_role: 'restaurant_owner' | 'rider'
          application_data: Json
          status?: 'pending' | 'approved' | 'rejected'
          admin_notes?: string | null
          reviewed_by?: string | null
          reviewed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          requested_role?: 'restaurant_owner' | 'rider'
          application_data?: Json
          status?: 'pending' | 'approved' | 'rejected'
          admin_notes?: string | null
          reviewed_by?: string | null
          reviewed_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      admin_users: {
        Row: {
          id: string
          email: string
          first_name: string
          last_name: string
          role: 'super_admin' | 'admin' | 'moderator' | 'staff'
          permissions: Json
          is_active: boolean
          last_login: string | null
          password_hash: string
          password_changed_at: string
          session_timeout: number
          must_change_password: boolean
          failed_login_attempts: number
          locked_until: string | null
          created_by: string | null
          invite_token: string | null
          invite_expires_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          first_name: string
          last_name: string
          role: 'super_admin' | 'admin' | 'moderator' | 'staff'
          permissions: Json
          is_active?: boolean
          last_login?: string | null
          password_hash: string
          password_changed_at?: string
          session_timeout?: number
          must_change_password?: boolean
          failed_login_attempts?: number
          locked_until?: string | null
          created_by?: string | null
          invite_token?: string | null
          invite_expires_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          first_name?: string
          last_name?: string
          role?: 'super_admin' | 'admin' | 'moderator' | 'staff'
          permissions?: Json
          is_active?: boolean
          last_login?: string | null
          password_hash?: string
          password_changed_at?: string
          session_timeout?: number
          must_change_password?: boolean
          failed_login_attempts?: number
          locked_until?: string | null
          created_by?: string | null
          invite_token?: string | null
          invite_expires_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      admin_sessions: {
        Row: {
          id: string
          admin_id: string
          token: string
          expires_at: string
          created_at: string
          last_accessed: string | null
          ip_address: string | null
          user_agent: string | null
        }
        Insert: {
          id?: string
          admin_id: string
          token: string
          expires_at: string
          created_at?: string
          last_accessed?: string | null
          ip_address?: string | null
          user_agent?: string | null
        }
        Update: {
          id?: string
          admin_id?: string
          token?: string
          expires_at?: string
          created_at?: string
          last_accessed?: string | null
          ip_address?: string | null
          user_agent?: string | null
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