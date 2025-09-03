#!/usr/bin/env node

/**
 * CREATE MISSING 6 TABLES SCRIPT
 * ===============================
 * Creates the 6 missing tables identified from definitive discovery
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const MISSING_TABLES = {
  restaurant_settings: `
    CREATE TABLE IF NOT EXISTS public.restaurant_settings (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
      auto_accept_orders BOOLEAN DEFAULT false,
      max_orders_per_hour INTEGER DEFAULT 20,
      advance_booking_enabled BOOLEAN DEFAULT true,
      pickup_instructions TEXT,
      special_delivery_notes TEXT,
      operating_hours JSONB DEFAULT '{}',
      holiday_schedule JSONB DEFAULT '{}',
      notification_preferences JSONB DEFAULT '{}',
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(restaurant_id)
    );
  `,
  
  restaurant_subscriptions: `
    CREATE TABLE IF NOT EXISTS public.restaurant_subscriptions (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
      plan_type TEXT NOT NULL CHECK (plan_type IN ('basic', 'premium', 'enterprise')),
      status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'cancelled')),
      started_at TIMESTAMPTZ DEFAULT NOW(),
      expires_at TIMESTAMPTZ NOT NULL,
      monthly_fee DECIMAL(10,2) NOT NULL,
      commission_rate DECIMAL(5,2) NOT NULL,
      features JSONB DEFAULT '{}',
      payment_method TEXT,
      last_payment_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `,
  
  user_preferences: `
    CREATE TABLE IF NOT EXISTS public.user_preferences (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
      cuisine_preferences TEXT[] DEFAULT '{}',
      dietary_restrictions TEXT[] DEFAULT '{}',
      allergens TEXT[] DEFAULT '{}',
      preferred_spice_level TEXT DEFAULT 'medium' CHECK (preferred_spice_level IN ('mild', 'medium', 'hot', 'extra_hot')),
      notification_settings JSONB DEFAULT '{}',
      delivery_instructions TEXT,
      payment_method_preference TEXT,
      language_preference TEXT DEFAULT 'en',
      marketing_consent BOOLEAN DEFAULT false,
      data_sharing_consent BOOLEAN DEFAULT false,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(user_id)
    );
  `,
  
  user_ratings: `
    CREATE TABLE IF NOT EXISTS public.user_ratings (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
      user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
      target_id UUID NOT NULL,
      target_type TEXT NOT NULL CHECK (target_type IN ('restaurant', 'rider')),
      overall_rating INTEGER NOT NULL CHECK (overall_rating >= 1 AND overall_rating <= 5),
      food_quality INTEGER CHECK (food_quality >= 1 AND food_quality <= 5),
      delivery_speed INTEGER CHECK (delivery_speed >= 1 AND delivery_speed <= 5),
      packaging_quality INTEGER CHECK (packaging_quality >= 1 AND packaging_quality <= 5),
      rider_professionalism INTEGER CHECK (rider_professionalism >= 1 AND rider_professionalism <= 5),
      comment TEXT,
      is_anonymous BOOLEAN DEFAULT false,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `,
  
  user_reviews: `
    CREATE TABLE IF NOT EXISTS public.user_reviews (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      rating_id UUID REFERENCES public.user_ratings(id) ON DELETE CASCADE,
      user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
      target_id UUID NOT NULL,
      target_type TEXT NOT NULL CHECK (target_type IN ('restaurant', 'rider')),
      review_text TEXT NOT NULL,
      images TEXT[] DEFAULT '{}',
      is_verified BOOLEAN DEFAULT false,
      is_featured BOOLEAN DEFAULT false,
      helpfulness_score INTEGER DEFAULT 0,
      admin_notes TEXT,
      moderation_status TEXT DEFAULT 'pending' CHECK (moderation_status IN ('pending', 'approved', 'rejected')),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `,
  
  zones: `
    CREATE TABLE IF NOT EXISTS public.zones (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      display_name TEXT NOT NULL,
      description TEXT,
      city TEXT NOT NULL DEFAULT 'Lagos',
      state TEXT NOT NULL DEFAULT 'Lagos',
      country TEXT NOT NULL DEFAULT 'Nigeria',
      boundaries JSONB,
      center_coordinates JSONB,
      base_delivery_fee DECIMAL(10,2) DEFAULT 500.00,
      per_km_rate DECIMAL(10,2) DEFAULT 50.00,
      minimum_order DECIMAL(10,2) DEFAULT 2000.00,
      maximum_distance_km DECIMAL(5,2) DEFAULT 15.00,
      estimated_delivery_minutes INTEGER DEFAULT 30,
      is_active BOOLEAN DEFAULT true,
      surge_enabled BOOLEAN DEFAULT true,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `
}

async function createMissingTables() {
  console.log('🔨 CREATING 6 MISSING TABLES')
  console.log('============================')
  
  const results = {
    success: [],
    failed: []
  }
  
  for (const [tableName, sql] of Object.entries(MISSING_TABLES)) {
    try {
      console.log(`\n🏗️  Creating: ${tableName}...`)
      
      // Use direct SQL execution through Supabase API
      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY
        },
        body: JSON.stringify({ sql: sql.trim() })
      })
      
      if (response.ok) {
        console.log(`✅ ${tableName}: Created successfully`)
        results.success.push(tableName)
      } else {
        const error = await response.text()
        console.log(`❌ ${tableName}: ${error}`)
        results.failed.push({ table: tableName, error })
      }
      
    } catch (error) {
      console.log(`❌ ${tableName}: ${error.message}`)
      results.failed.push({ table: tableName, error: error.message })
    }
  }
  
  console.log('\n📊 CREATION RESULTS:')
  console.log('====================')
  console.log(`✅ Created: ${results.success.length} tables`)
  console.log(`❌ Failed: ${results.failed.length} tables`)
  
  if (results.success.length > 0) {
    console.log('\n✅ Successfully created:')
    results.success.forEach(table => console.log(`   - ${table}`))
  }
  
  if (results.failed.length > 0) {
    console.log('\n❌ Failed to create:')
    results.failed.forEach(({ table, error }) => console.log(`   - ${table}: ${error}`))
  }
  
  return results
}

// Enable RLS on new tables
async function enableRLSOnNewTables() {
  console.log('\n🔒 ENABLING RLS ON NEW TABLES')
  console.log('=============================')
  
  const tables = Object.keys(MISSING_TABLES)
  
  for (const tableName of tables) {
    try {
      const rlsSQL = `ALTER TABLE public.${tableName} ENABLE ROW LEVEL SECURITY;`
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY
        },
        body: JSON.stringify({ sql: rlsSQL })
      })
      
      if (response.ok) {
        console.log(`🔒 ${tableName}: RLS enabled`)
      } else {
        console.log(`⚠️  ${tableName}: RLS enable failed`)
      }
      
    } catch (error) {
      console.log(`❌ ${tableName}: RLS error - ${error.message}`)
    }
  }
}

async function main() {
  console.log('\n🚀 STARTING MISSING TABLES CREATION')
  console.log('===================================')
  
  try {
    // Create missing tables
    const results = await createMissingTables()
    
    // Enable RLS on successfully created tables
    if (results.success.length > 0) {
      await enableRLSOnNewTables()
    }
    
    // Final verification
    console.log('\n🔍 FINAL VERIFICATION')
    console.log('====================')
    
    for (const tableName of Object.keys(MISSING_TABLES)) {
      try {
        const { error } = await supabase.from(tableName).select('id').limit(1)
        if (error) {
          console.log(`❌ ${tableName}: ${error.message}`)
        } else {
          console.log(`✅ ${tableName}: Accessible`)
        }
      } catch (error) {
        console.log(`❌ ${tableName}: ${error.message}`)
      }
    }
    
    console.log('\n🎉 MISSING TABLES CREATION COMPLETE!')
    
  } catch (error) {
    console.error('💥 Fatal error:', error.message)
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}

module.exports = { createMissingTables, enableRLSOnNewTables }