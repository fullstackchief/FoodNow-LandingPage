-- SAFE RLS MIGRATION - VERIFIED TABLES ONLY
-- ===========================================
-- Generated: 2025-09-02T02:15:37.033Z
-- Tables verified: 38

-- Enable RLS on verified existing tables only
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guarantor_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rider_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rider_guarantors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payout_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promo_code_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.riders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spatial_ref_sys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_order_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zones ENABLE ROW LEVEL SECURITY;

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

CREATE POLICY "service_role_access_users" ON public.users
  FOR ALL TO service_role USING (true);

CREATE POLICY "service_role_access_restaurants" ON public.restaurants
  FOR ALL TO service_role USING (true);

CREATE POLICY "service_role_access_menu_items" ON public.menu_items
  FOR ALL TO service_role USING (true);

CREATE POLICY "service_role_access_orders" ON public.orders
  FOR ALL TO service_role USING (true);

CREATE POLICY "service_role_access_order_items" ON public.order_items
  FOR ALL TO service_role USING (true);

CREATE POLICY "service_role_access_notifications" ON public.notifications
  FOR ALL TO service_role USING (true);

CREATE POLICY "service_role_access_admin_users" ON public.admin_users
  FOR ALL TO service_role USING (true);

CREATE POLICY "service_role_access_admin_sessions" ON public.admin_sessions
  FOR ALL TO service_role USING (true);

CREATE POLICY "service_role_access_role_applications" ON public.role_applications
  FOR ALL TO service_role USING (true);

CREATE POLICY "service_role_access_guarantor_verifications" ON public.guarantor_verifications
  FOR ALL TO service_role USING (true);

CREATE POLICY "service_role_access_delivery_zones" ON public.delivery_zones
  FOR ALL TO service_role USING (true);

CREATE POLICY "service_role_access_support_tickets" ON public.support_tickets
  FOR ALL TO service_role USING (true);

CREATE POLICY "service_role_access_payment_transactions" ON public.payment_transactions
  FOR ALL TO service_role USING (true);

CREATE POLICY "service_role_access_delivery_assignments" ON public.delivery_assignments
  FOR ALL TO service_role USING (true);

CREATE POLICY "service_role_access_rider_documents" ON public.rider_documents
  FOR ALL TO service_role USING (true);

CREATE POLICY "service_role_access_restaurant_documents" ON public.restaurant_documents
  FOR ALL TO service_role USING (true);

CREATE POLICY "service_role_access_admin_permissions" ON public.admin_permissions
  FOR ALL TO service_role USING (true);

CREATE POLICY "service_role_access_system_settings" ON public.system_settings
  FOR ALL TO service_role USING (true);

CREATE POLICY "service_role_access_rider_guarantors" ON public.rider_guarantors
  FOR ALL TO service_role USING (true);

CREATE POLICY "service_role_access_payout_history" ON public.payout_history
  FOR ALL TO service_role USING (true);

CREATE POLICY "service_role_access_promo_codes" ON public.promo_codes
  FOR ALL TO service_role USING (true);

CREATE POLICY "service_role_access_promo_code_usage" ON public.promo_code_usage
  FOR ALL TO service_role USING (true);

CREATE POLICY "service_role_access_push_subscriptions" ON public.push_subscriptions
  FOR ALL TO service_role USING (true);

CREATE POLICY "service_role_access_rate_limits" ON public.rate_limits
  FOR ALL TO service_role USING (true);

CREATE POLICY "service_role_access_restaurant_analytics" ON public.restaurant_analytics
  FOR ALL TO service_role USING (true);

CREATE POLICY "service_role_access_restaurant_settings" ON public.restaurant_settings
  FOR ALL TO service_role USING (true);

CREATE POLICY "service_role_access_restaurant_subscriptions" ON public.restaurant_subscriptions
  FOR ALL TO service_role USING (true);

CREATE POLICY "service_role_access_review_votes" ON public.review_votes
  FOR ALL TO service_role USING (true);

CREATE POLICY "service_role_access_reviews" ON public.reviews
  FOR ALL TO service_role USING (true);

CREATE POLICY "service_role_access_riders" ON public.riders
  FOR ALL TO service_role USING (true);

CREATE POLICY "service_role_access_service_areas" ON public.service_areas
  FOR ALL TO service_role USING (true);

CREATE POLICY "service_role_access_spatial_ref_sys" ON public.spatial_ref_sys
  FOR ALL TO service_role USING (true);

CREATE POLICY "service_role_access_system_analytics" ON public.system_analytics
  FOR ALL TO service_role USING (true);

CREATE POLICY "service_role_access_user_order_history" ON public.user_order_history
  FOR ALL TO service_role USING (true);

CREATE POLICY "service_role_access_user_preferences" ON public.user_preferences
  FOR ALL TO service_role USING (true);

CREATE POLICY "service_role_access_user_ratings" ON public.user_ratings
  FOR ALL TO service_role USING (true);

CREATE POLICY "service_role_access_user_reviews" ON public.user_reviews
  FOR ALL TO service_role USING (true);

CREATE POLICY "service_role_access_zones" ON public.zones
  FOR ALL TO service_role USING (true);

-- ===============================================
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
SELECT 'SAFE RLS MIGRATION COMPLETE - 38 TABLES SECURED' as result;