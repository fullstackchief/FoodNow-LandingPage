-- ROW LEVEL SECURITY SETUP FOR FOODNOW
-- Generated: 2025-09-01T23:14:48.954Z
-- Execute these statements in Supabase Dashboard SQL Editor

-- 1. Enable RLS on all tables
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

-- 2. Service role bypass policies (for Claude access)

-- Service role bypass policy for users
DROP POLICY IF EXISTS "service_role_bypass_users" ON public.users;
CREATE POLICY "service_role_bypass_users" ON public.users
  FOR ALL USING (auth.role() = 'service_role');


-- Service role bypass policy for restaurants
DROP POLICY IF EXISTS "service_role_bypass_restaurants" ON public.restaurants;
CREATE POLICY "service_role_bypass_restaurants" ON public.restaurants
  FOR ALL USING (auth.role() = 'service_role');


-- Service role bypass policy for menu_items
DROP POLICY IF EXISTS "service_role_bypass_menu_items" ON public.menu_items;
CREATE POLICY "service_role_bypass_menu_items" ON public.menu_items
  FOR ALL USING (auth.role() = 'service_role');


-- Service role bypass policy for orders
DROP POLICY IF EXISTS "service_role_bypass_orders" ON public.orders;
CREATE POLICY "service_role_bypass_orders" ON public.orders
  FOR ALL USING (auth.role() = 'service_role');


-- Service role bypass policy for order_items
DROP POLICY IF EXISTS "service_role_bypass_order_items" ON public.order_items;
CREATE POLICY "service_role_bypass_order_items" ON public.order_items
  FOR ALL USING (auth.role() = 'service_role');


-- Service role bypass policy for notifications
DROP POLICY IF EXISTS "service_role_bypass_notifications" ON public.notifications;
CREATE POLICY "service_role_bypass_notifications" ON public.notifications
  FOR ALL USING (auth.role() = 'service_role');


-- Service role bypass policy for delivery_zones
DROP POLICY IF EXISTS "service_role_bypass_delivery_zones" ON public.delivery_zones;
CREATE POLICY "service_role_bypass_delivery_zones" ON public.delivery_zones
  FOR ALL USING (auth.role() = 'service_role');


-- Service role bypass policy for support_tickets
DROP POLICY IF EXISTS "service_role_bypass_support_tickets" ON public.support_tickets;
CREATE POLICY "service_role_bypass_support_tickets" ON public.support_tickets
  FOR ALL USING (auth.role() = 'service_role');


-- Service role bypass policy for payment_transactions
DROP POLICY IF EXISTS "service_role_bypass_payment_transactions" ON public.payment_transactions;
CREATE POLICY "service_role_bypass_payment_transactions" ON public.payment_transactions
  FOR ALL USING (auth.role() = 'service_role');


-- Service role bypass policy for delivery_assignments
DROP POLICY IF EXISTS "service_role_bypass_delivery_assignments" ON public.delivery_assignments;
CREATE POLICY "service_role_bypass_delivery_assignments" ON public.delivery_assignments
  FOR ALL USING (auth.role() = 'service_role');


-- Service role bypass policy for rider_documents
DROP POLICY IF EXISTS "service_role_bypass_rider_documents" ON public.rider_documents;
CREATE POLICY "service_role_bypass_rider_documents" ON public.rider_documents
  FOR ALL USING (auth.role() = 'service_role');


-- Service role bypass policy for restaurant_documents
DROP POLICY IF EXISTS "service_role_bypass_restaurant_documents" ON public.restaurant_documents;
CREATE POLICY "service_role_bypass_restaurant_documents" ON public.restaurant_documents
  FOR ALL USING (auth.role() = 'service_role');


-- Service role bypass policy for admin_permissions
DROP POLICY IF EXISTS "service_role_bypass_admin_permissions" ON public.admin_permissions;
CREATE POLICY "service_role_bypass_admin_permissions" ON public.admin_permissions
  FOR ALL USING (auth.role() = 'service_role');


-- Service role bypass policy for system_settings
DROP POLICY IF EXISTS "service_role_bypass_system_settings" ON public.system_settings;
CREATE POLICY "service_role_bypass_system_settings" ON public.system_settings
  FOR ALL USING (auth.role() = 'service_role');


-- Service role bypass policy for rider_guarantors
DROP POLICY IF EXISTS "service_role_bypass_rider_guarantors" ON public.rider_guarantors;
CREATE POLICY "service_role_bypass_rider_guarantors" ON public.rider_guarantors
  FOR ALL USING (auth.role() = 'service_role');


-- Service role bypass policy for payout_history
DROP POLICY IF EXISTS "service_role_bypass_payout_history" ON public.payout_history;
CREATE POLICY "service_role_bypass_payout_history" ON public.payout_history
  FOR ALL USING (auth.role() = 'service_role');


-- 3. User-specific policies
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

-- Restaurants can see their own profile
DROP POLICY IF EXISTS "restaurants_own_profile" ON public.restaurants;
CREATE POLICY "restaurants_own_profile" ON public.restaurants 
  FOR SELECT USING (auth.uid() = owner_id OR owner_id IS NULL);

-- Public can see available menu items
DROP POLICY IF EXISTS "public_menu_items" ON public.menu_items;
CREATE POLICY "public_menu_items" ON public.menu_items 
  FOR SELECT USING (is_available = true);

-- Users can see their own notifications
DROP POLICY IF EXISTS "users_own_notifications" ON public.notifications;
CREATE POLICY "users_own_notifications" ON public.notifications 
  FOR SELECT USING (auth.uid() = user_id);

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

-- Public can see active delivery zones
DROP POLICY IF EXISTS "public_active_zones" ON public.delivery_zones;
CREATE POLICY "public_active_zones" ON public.delivery_zones 
  FOR SELECT USING (is_active = true);
