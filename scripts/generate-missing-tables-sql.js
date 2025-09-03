#!/usr/bin/env node

/**
 * GENERATE MISSING TABLES SQL
 * ===========================
 * Creates SQL file that can be executed manually in Supabase Dashboard
 */

const fs = require('fs')

const SQL_CONTENT = `
-- ========================================
-- FOODNOW: MISSING 6 TABLES CREATION
-- ========================================
-- Execute this SQL in Supabase Dashboard > SQL Editor
-- Date: ${new Date().toISOString()}

-- 1. Restaurant Settings Table
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

-- 2. Restaurant Subscriptions Table
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

-- 3. User Preferences Table
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

-- 4. User Ratings Table
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

-- 5. User Reviews Table
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

-- 6. Zones Table
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

-- ========================================
-- ENABLE RLS ON NEW TABLES
-- ========================================

ALTER TABLE public.restaurant_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zones ENABLE ROW LEVEL SECURITY;

-- ========================================
-- CREATE BASIC RLS POLICIES
-- ========================================

-- Restaurant settings - only restaurant owners can manage
CREATE POLICY "restaurant_settings_owner_access" ON public.restaurant_settings
  FOR ALL USING (
    restaurant_id IN (
      SELECT id FROM public.restaurants 
      WHERE owner_id = auth.uid()
    )
  );

-- User preferences - users can only access their own
CREATE POLICY "user_preferences_own_access" ON public.user_preferences
  FOR ALL USING (auth.uid() = user_id);

-- User ratings - users can view all, modify own
CREATE POLICY "user_ratings_read_all" ON public.user_ratings
  FOR SELECT USING (true);

CREATE POLICY "user_ratings_own_access" ON public.user_ratings
  FOR INSERT USING (auth.uid() = user_id);

-- User reviews - similar to ratings
CREATE POLICY "user_reviews_read_all" ON public.user_reviews
  FOR SELECT USING (true);

CREATE POLICY "user_reviews_own_access" ON public.user_reviews
  FOR INSERT USING (auth.uid() = user_id);

-- Zones - public read access
CREATE POLICY "zones_public_read" ON public.zones
  FOR SELECT USING (is_active = true);

-- Service role bypass for all tables
CREATE POLICY "service_role_restaurant_settings" ON public.restaurant_settings
  FOR ALL TO service_role USING (true);

CREATE POLICY "service_role_restaurant_subscriptions" ON public.restaurant_subscriptions
  FOR ALL TO service_role USING (true);

CREATE POLICY "service_role_user_preferences" ON public.user_preferences
  FOR ALL TO service_role USING (true);

CREATE POLICY "service_role_user_ratings" ON public.user_ratings
  FOR ALL TO service_role USING (true);

CREATE POLICY "service_role_user_reviews" ON public.user_reviews
  FOR ALL TO service_role USING (true);

CREATE POLICY "service_role_zones" ON public.zones
  FOR ALL TO service_role USING (true);

-- ========================================
-- VERIFICATION QUERIES
-- ========================================

-- Check that all tables were created
SELECT 'restaurant_settings' as table_name, count(*) as row_count FROM public.restaurant_settings
UNION ALL
SELECT 'restaurant_subscriptions' as table_name, count(*) as row_count FROM public.restaurant_subscriptions
UNION ALL
SELECT 'user_preferences' as table_name, count(*) as row_count FROM public.user_preferences
UNION ALL
SELECT 'user_ratings' as table_name, count(*) as row_count FROM public.user_ratings
UNION ALL
SELECT 'user_reviews' as table_name, count(*) as row_count FROM public.user_reviews
UNION ALL
SELECT 'zones' as table_name, count(*) as row_count FROM public.zones;

-- Check RLS status
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('restaurant_settings', 'restaurant_subscriptions', 'user_preferences', 'user_ratings', 'user_reviews', 'zones')
ORDER BY tablename;

SELECT '✅ MISSING TABLES CREATION COMPLETE!' as result;
`

console.log('📝 GENERATING SQL FILE FOR MANUAL EXECUTION')
console.log('==========================================')

// Write SQL to file
fs.writeFileSync('create-missing-6-tables.sql', SQL_CONTENT)

console.log('✅ SQL file created: create-missing-6-tables.sql')
console.log('')
console.log('📋 MANUAL EXECUTION STEPS:')
console.log('==========================')
console.log('1. Open Supabase Dashboard')
console.log('2. Go to SQL Editor')
console.log('3. Copy and paste the contents of create-missing-6-tables.sql')
console.log('4. Click "RUN" to execute')
console.log('5. Verify all 6 tables are created')
console.log('')
console.log('🎯 This will create the final 6 missing tables and enable RLS')
console.log('✅ After execution, database will be 100% complete (38/38 tables)')