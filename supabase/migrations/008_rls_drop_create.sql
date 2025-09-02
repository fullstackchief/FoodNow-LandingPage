-- CORRECTED RLS SETUP - DROP THEN CREATE POLICIES
-- ================================================
-- Uses correct PostgreSQL syntax for policy creation

-- Enable RLS on all tables (direct commands)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
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
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guarantor_verifications ENABLE ROW LEVEL SECURITY;

-- ===============================================
-- SERVICE ROLE BYPASS POLICIES (Correct Syntax)
-- ===============================================

-- Drop existing policies first, then create new ones

-- Core tables
DROP POLICY IF EXISTS "service_role_bypass_users" ON public.users;
CREATE POLICY "service_role_bypass_users" ON public.users
  FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "service_role_bypass_restaurants" ON public.restaurants;
CREATE POLICY "service_role_bypass_restaurants" ON public.restaurants
  FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "service_role_bypass_menu_items" ON public.menu_items;
CREATE POLICY "service_role_bypass_menu_items" ON public.menu_items
  FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "service_role_bypass_orders" ON public.orders;
CREATE POLICY "service_role_bypass_orders" ON public.orders
  FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "service_role_bypass_order_items" ON public.order_items;
CREATE POLICY "service_role_bypass_order_items" ON public.order_items
  FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "service_role_bypass_notifications" ON public.notifications;
CREATE POLICY "service_role_bypass_notifications" ON public.notifications
  FOR ALL USING (auth.role() = 'service_role');

-- New operational tables
DROP POLICY IF EXISTS "service_role_bypass_delivery_zones" ON public.delivery_zones;
CREATE POLICY "service_role_bypass_delivery_zones" ON public.delivery_zones
  FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "service_role_bypass_support_tickets" ON public.support_tickets;
CREATE POLICY "service_role_bypass_support_tickets" ON public.support_tickets
  FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "service_role_bypass_payment_transactions" ON public.payment_transactions;
CREATE POLICY "service_role_bypass_payment_transactions" ON public.payment_transactions
  FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "service_role_bypass_delivery_assignments" ON public.delivery_assignments;
CREATE POLICY "service_role_bypass_delivery_assignments" ON public.delivery_assignments
  FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "service_role_bypass_rider_documents" ON public.rider_documents;
CREATE POLICY "service_role_bypass_rider_documents" ON public.rider_documents
  FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "service_role_bypass_restaurant_documents" ON public.restaurant_documents;
CREATE POLICY "service_role_bypass_restaurant_documents" ON public.restaurant_documents
  FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "service_role_bypass_admin_permissions" ON public.admin_permissions;
CREATE POLICY "service_role_bypass_admin_permissions" ON public.admin_permissions
  FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "service_role_bypass_system_settings" ON public.system_settings;
CREATE POLICY "service_role_bypass_system_settings" ON public.system_settings
  FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "service_role_bypass_rider_guarantors" ON public.rider_guarantors;
CREATE POLICY "service_role_bypass_rider_guarantors" ON public.rider_guarantors
  FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "service_role_bypass_payout_history" ON public.payout_history;
CREATE POLICY "service_role_bypass_payout_history" ON public.payout_history
  FOR ALL USING (auth.role() = 'service_role');

-- Admin tables
DROP POLICY IF EXISTS "service_role_bypass_admin_users" ON public.admin_users;
CREATE POLICY "service_role_bypass_admin_users" ON public.admin_users
  FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "service_role_bypass_admin_sessions" ON public.admin_sessions;
CREATE POLICY "service_role_bypass_admin_sessions" ON public.admin_sessions
  FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "service_role_bypass_role_applications" ON public.role_applications;
CREATE POLICY "service_role_bypass_role_applications" ON public.role_applications
  FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "service_role_bypass_guarantor_verifications" ON public.guarantor_verifications;
CREATE POLICY "service_role_bypass_guarantor_verifications" ON public.guarantor_verifications
  FOR ALL USING (auth.role() = 'service_role');

-- Success confirmation
SELECT 'RLS SECURITY ENABLED ON ALL 20 TABLES' as status;