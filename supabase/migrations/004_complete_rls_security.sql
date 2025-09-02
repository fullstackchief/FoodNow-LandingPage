-- COMPLETE ROW LEVEL SECURITY SETUP
-- Execute AFTER all table migrations (002_missing_tables.sql + 003_selective_tables.sql)
-- Generated: 2025-09-02

-- 1. Enable RLS on all existing tables (safely)
ALTER TABLE IF EXISTS public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.notifications ENABLE ROW LEVEL SECURITY;

-- Enable RLS on newly created tables
ALTER TABLE IF EXISTS public.delivery_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.delivery_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.rider_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.restaurant_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.admin_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.rider_guarantors ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.payout_history ENABLE ROW LEVEL SECURITY;

-- Enable RLS on admin tables
ALTER TABLE IF EXISTS public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.admin_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.role_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.guarantor_verifications ENABLE ROW LEVEL SECURITY;

-- =======================
-- SERVICE ROLE BYPASS POLICIES (Claude Access)
-- =======================

-- Service role bypass for existing tables
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

-- Service role bypass for new tables
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

-- Service role bypass for admin tables
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

-- =======================
-- USER-SPECIFIC POLICIES
-- =======================

-- Users can see their own profile
DROP POLICY IF EXISTS "users_own_profile" ON public.users;
CREATE POLICY "users_own_profile" ON public.users 
  FOR SELECT USING (auth.uid() = id);

-- Customers can see their own orders
DROP POLICY IF EXISTS "customers_own_orders" ON public.orders;
CREATE POLICY "customers_own_orders" ON public.orders 
  FOR SELECT USING (auth.uid() = user_id);

-- Customers can see their own order items
DROP POLICY IF EXISTS "customers_own_order_items" ON public.order_items;
CREATE POLICY "customers_own_order_items" ON public.order_items 
  FOR SELECT USING (
    auth.uid() IN (SELECT user_id FROM orders WHERE id = order_items.order_id)
  );

-- Public can see available menu items
DROP POLICY IF EXISTS "public_menu_items" ON public.menu_items;
CREATE POLICY "public_menu_items" ON public.menu_items 
  FOR SELECT USING (is_available = true);

-- Users can see their own notifications
DROP POLICY IF EXISTS "users_own_notifications" ON public.notifications;
CREATE POLICY "users_own_notifications" ON public.notifications 
  FOR SELECT USING (auth.uid() = user_id);

-- Public can see active delivery zones
DROP POLICY IF EXISTS "public_active_zones" ON public.delivery_zones;
CREATE POLICY "public_active_zones" ON public.delivery_zones 
  FOR SELECT USING (is_active = true);

-- Customers can see their own support tickets
DROP POLICY IF EXISTS "customers_own_tickets" ON public.support_tickets;
CREATE POLICY "customers_own_tickets" ON public.support_tickets 
  FOR SELECT USING (auth.uid() = customer_id);

-- Customers can see their own payment transactions
DROP POLICY IF EXISTS "customers_own_payments" ON public.payment_transactions;
CREATE POLICY "customers_own_payments" ON public.payment_transactions 
  FOR SELECT USING (auth.uid() = customer_id);

-- Riders can see their own delivery assignments
DROP POLICY IF EXISTS "riders_own_assignments" ON public.delivery_assignments;
CREATE POLICY "riders_own_assignments" ON public.delivery_assignments 
  FOR SELECT USING (auth.uid() = rider_id);

-- Riders can see their own documents
DROP POLICY IF EXISTS "riders_own_documents" ON public.rider_documents;
CREATE POLICY "riders_own_documents" ON public.rider_documents 
  FOR SELECT USING (auth.uid() = rider_id);

-- Restaurants can see their own documents
DROP POLICY IF EXISTS "restaurants_own_documents" ON public.restaurant_documents;
CREATE POLICY "restaurants_own_documents" ON public.restaurant_documents 
  FOR SELECT USING (auth.uid() IN (
    SELECT owner_id FROM restaurants WHERE id = restaurant_documents.restaurant_id
  ));

-- Public can read public system settings
DROP POLICY IF EXISTS "public_system_settings" ON public.system_settings;
CREATE POLICY "public_system_settings" ON public.system_settings 
  FOR SELECT USING (is_public = true);

-- =======================
-- SUMMARY
-- =======================
-- This script enables RLS on all 20 tables:
-- 
-- Existing tables (6):
-- - users, restaurants, menu_items, orders, order_items, notifications
--
-- New tables from migrations (14):
-- - delivery_zones, support_tickets, payment_transactions, delivery_assignments
-- - rider_documents, restaurant_documents, admin_permissions, system_settings
-- - rider_guarantors, payout_history, admin_users, admin_sessions
-- - role_applications, guarantor_verifications
--
-- All tables have service_role bypass for Claude access
-- User-specific policies ensure data security and privacy