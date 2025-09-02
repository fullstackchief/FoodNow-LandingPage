/**
 * GENERATE SAFE RLS MIGRATION
 * ============================
 * Creates RLS migration with only verified existing tables
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')

async function generateSafeRLS() {
  console.log('🔍 GENERATING SAFE RLS MIGRATION')
  console.log('================================')

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  // Test tables one by one to find which actually exist
  const candidateTables = [
    'users', 'restaurants', 'menu_items', 'orders', 'order_items', 'notifications',
    'admin_users', 'admin_sessions', 'role_applications', 'guarantor_verifications',
    'delivery_zones', 'support_tickets', 'payment_transactions', 'delivery_assignments',
    'rider_documents', 'restaurant_documents', 'admin_permissions', 'system_settings',
    'rider_guarantors', 'payout_history', 'promo_codes', 'promo_code_usage',
    'push_subscriptions', 'rate_limits', 'restaurant_analytics', 'restaurant_settings',
    'restaurant_subscriptions', 'review_votes', 'reviews', 'riders', 'service_areas',
    'spatial_ref_sys', 'system_analytics', 'user_order_history', 'user_preferences',
    'user_ratings', 'user_reviews', 'zones'
  ]

  const verifiedTables = []
  
  console.log('\n🧪 VERIFYING TABLE EXISTENCE:')
  console.log('=============================')

  for (const tableName of candidateTables) {
    try {
      const { count, error } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true })

      if (!error) {
        verifiedTables.push(tableName)
        console.log(`✅ ${tableName} - VERIFIED`)
      } else {
        console.log(`❌ ${tableName} - NOT ACCESSIBLE: ${error.message}`)
      }
    } catch (err) {
      console.log(`💥 ${tableName} - ERROR: ${err.message}`)
    }
  }

  console.log(`\n✅ VERIFIED ${verifiedTables.length} EXISTING TABLES`)

  // Generate SQL migration content
  let sqlContent = `-- SAFE RLS MIGRATION - VERIFIED TABLES ONLY
-- ===========================================
-- Generated: ${new Date().toISOString()}
-- Tables verified: ${verifiedTables.length}

-- Enable RLS on verified existing tables only
`

  // Add ALTER TABLE commands for verified tables
  verifiedTables.forEach(table => {
    sqlContent += `ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY;\n`
  })

  sqlContent += `
-- ===============================================
-- CLEAN UP EXISTING POLICIES
-- ===============================================

-- Remove any existing problematic policies on users table
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "service_role_bypass_users" ON public.users;
DROP POLICY IF EXISTS "test_service_role_policy" ON public.users;
DROP POLICY IF EXISTS "users_own_profile" ON public.users;
DROP POLICY IF EXISTS "service_role_all_access" ON public.users;

-- ===============================================
-- SERVICE ROLE BYPASS POLICIES (VERIFIED TABLES)
-- ===============================================

`

  // Add service role policies for verified tables
  verifiedTables.forEach(table => {
    sqlContent += `CREATE POLICY "service_role_access_${table}" ON public.${table}
  FOR ALL TO service_role USING (true);

`
  })

  sqlContent += `-- ===============================================
-- PUBLIC ACCESS (Very Limited)
-- ===============================================

-- Only restaurants and menu items visible to anonymous users
CREATE POLICY "anon_restaurant_read" ON public.restaurants
  FOR SELECT TO anon USING (status = 'approved' AND is_open = true);

CREATE POLICY "anon_menu_read" ON public.menu_items
  FOR SELECT TO anon USING (is_available = true);

-- Authenticated users can access their own data
CREATE POLICY "auth_user_own_data" ON public.users
  FOR ALL TO authenticated USING (auth.uid() = id);

CREATE POLICY "auth_user_own_orders" ON public.orders
  FOR ALL TO authenticated USING (auth.uid() = user_id);

-- Success message
SELECT 'SAFE RLS MIGRATION COMPLETE - ${verifiedTables.length} TABLES SECURED' as result;`

  // Write the migration file
  const migrationPath = '/Users/mac/Desktop/FoodNow-LandingPage/supabase/migrations/012_safe_rls_verified.sql'
  fs.writeFileSync(migrationPath, sqlContent)

  console.log(`\n📄 Safe RLS migration generated: 012_safe_rls_verified.sql`)
  console.log(`🔒 ${verifiedTables.length} tables will be secured`)
  
  return {
    verifiedTables,
    migrationFile: '012_safe_rls_verified.sql'
  }
}

generateSafeRLS()
  .then(result => {
    console.log('\n🎉 SAFE RLS MIGRATION GENERATED')
    console.log(`✅ Ready to secure ${result.verifiedTables.length} verified tables`)
  })
  .catch(error => {
    console.error('💥 Generation error:', error)
  })