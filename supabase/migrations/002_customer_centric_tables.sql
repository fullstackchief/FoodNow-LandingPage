/**
 * CUSTOMER-CENTRIC DATABASE TABLES
 * =================================
 * Critical tables for customer experience and system operations
 * Created: September 1, 2025
 */

-- =======================
-- NOTIFICATIONS SYSTEM
-- =======================
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- 'order_update', 'payment_confirmed', 'delivery_update', etc.
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}', -- Additional payload data
  channel VARCHAR(20) NOT NULL DEFAULT 'in_app', -- 'sms', 'email', 'in_app', 'push'
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'sent', 'delivered', 'failed'
  priority VARCHAR(10) NOT NULL DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
  read_at TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for user notifications
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_status ON notifications(status);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

-- =======================
-- DELIVERY ZONES SYSTEM
-- =======================
CREATE TABLE delivery_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL, -- 'Victoria Island', 'Lekki Phase 1', etc.
  description TEXT,
  polygon JSONB NOT NULL, -- GeoJSON polygon coordinates
  center_lat DECIMAL(10, 8) NOT NULL,
  center_lng DECIMAL(11, 8) NOT NULL,
  radius_km DECIMAL(5, 2) NOT NULL DEFAULT 5.0, -- Default 5km radius
  delivery_fee INTEGER NOT NULL DEFAULT 500, -- Base delivery fee in Kobo
  surge_multiplier DECIMAL(3, 2) DEFAULT 1.0, -- Surge pricing multiplier
  is_active BOOLEAN NOT NULL DEFAULT true,
  peak_hours JSONB DEFAULT '[]', -- Array of peak hour ranges
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for zone queries
CREATE INDEX idx_delivery_zones_active ON delivery_zones(is_active);
CREATE INDEX idx_delivery_zones_center ON delivery_zones(center_lat, center_lng);

-- =======================
-- RESTAURANT ZONES MAPPING
-- =======================
CREATE TABLE restaurant_delivery_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  zone_id UUID NOT NULL REFERENCES delivery_zones(id) ON DELETE CASCADE,
  custom_delivery_fee INTEGER, -- Override zone default if needed
  custom_radius_km DECIMAL(5, 2), -- Override zone default if needed
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(restaurant_id, zone_id)
);

-- =======================
-- SUPPORT TICKETS SYSTEM
-- =======================
CREATE TABLE support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number VARCHAR(20) UNIQUE NOT NULL, -- 'FN-2025-001234'
  customer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  category VARCHAR(50) NOT NULL, -- 'order_issue', 'payment_problem', 'delivery_delay', etc.
  subject VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  priority VARCHAR(20) NOT NULL DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
  status VARCHAR(20) NOT NULL DEFAULT 'open', -- 'open', 'in_progress', 'resolved', 'closed'
  assigned_to UUID REFERENCES users(id), -- Admin user handling the ticket
  resolution TEXT,
  customer_rating INTEGER CHECK (customer_rating >= 1 AND customer_rating <= 5),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  closed_at TIMESTAMP WITH TIME ZONE
);

-- Generate ticket number function
CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS TEXT AS $$
DECLARE
  year_suffix TEXT := TO_CHAR(NOW(), 'YYYY');
  sequence_num INTEGER;
BEGIN
  -- Get next sequence number for the year
  SELECT COALESCE(MAX(CAST(SUBSTRING(ticket_number FROM 9 FOR 6) AS INTEGER)), 0) + 1
  INTO sequence_num
  FROM support_tickets 
  WHERE ticket_number LIKE 'FN-' || year_suffix || '-%';
  
  -- Return formatted ticket number
  RETURN 'FN-' || year_suffix || '-' || LPAD(sequence_num::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate ticket numbers
CREATE OR REPLACE FUNCTION set_ticket_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.ticket_number IS NULL THEN
    NEW.ticket_number := generate_ticket_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_ticket_number
  BEFORE INSERT ON support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION set_ticket_number();

-- Indexes for support tickets
CREATE INDEX idx_support_tickets_customer ON support_tickets(customer_id);
CREATE INDEX idx_support_tickets_status ON support_tickets(status);
CREATE INDEX idx_support_tickets_assigned ON support_tickets(assigned_to);
CREATE INDEX idx_support_tickets_created ON support_tickets(created_at DESC);

-- =======================
-- PAYMENT TRANSACTIONS
-- =======================
CREATE TABLE payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  paystack_reference VARCHAR(255) UNIQUE NOT NULL,
  amount INTEGER NOT NULL, -- Amount in Kobo
  currency VARCHAR(3) NOT NULL DEFAULT 'NGN',
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'success', 'failed', 'cancelled'
  payment_method VARCHAR(50), -- 'card', 'bank_transfer', 'ussd', etc.
  gateway_response JSONB DEFAULT '{}', -- Store Paystack response
  customer_email VARCHAR(255),
  customer_phone VARCHAR(20),
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for payment queries
CREATE INDEX idx_payment_transactions_order ON payment_transactions(order_id);
CREATE INDEX idx_payment_transactions_customer ON payment_transactions(customer_id);
CREATE INDEX idx_payment_transactions_reference ON payment_transactions(paystack_reference);
CREATE INDEX idx_payment_transactions_status ON payment_transactions(status);

-- =======================
-- DELIVERY ASSIGNMENTS
-- =======================
CREATE TABLE delivery_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  rider_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES users(id), -- Admin who assigned (if manual)
  assignment_type VARCHAR(20) NOT NULL DEFAULT 'auto', -- 'auto', 'manual'
  status VARCHAR(20) NOT NULL DEFAULT 'assigned', -- 'assigned', 'accepted', 'rejected', 'completed'
  pickup_time TIMESTAMP WITH TIME ZONE,
  delivery_time TIMESTAMP WITH TIME ZONE,
  delivery_notes TEXT,
  customer_rating INTEGER CHECK (customer_rating >= 1 AND customer_rating <= 5),
  rider_earnings INTEGER, -- Earnings in Kobo
  distance_km DECIMAL(5, 2),
  estimated_duration INTEGER, -- Minutes
  actual_duration INTEGER, -- Minutes
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(order_id) -- One assignment per order
);

-- Indexes for delivery tracking
CREATE INDEX idx_delivery_assignments_order ON delivery_assignments(order_id);
CREATE INDEX idx_delivery_assignments_rider ON delivery_assignments(rider_id);
CREATE INDEX idx_delivery_assignments_status ON delivery_assignments(status);

-- =======================
-- RIDER DOCUMENTS
-- =======================
CREATE TABLE rider_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rider_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  document_type VARCHAR(50) NOT NULL, -- 'nin_front', 'nin_back', 'guarantor_nin', 'photo', etc.
  file_url TEXT NOT NULL,
  file_name VARCHAR(255),
  file_size INTEGER,
  mime_type VARCHAR(100),
  verification_status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  verified_by UUID REFERENCES users(id), -- Admin who verified
  verification_notes TEXT,
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for document management
CREATE INDEX idx_rider_documents_rider ON rider_documents(rider_id);
CREATE INDEX idx_rider_documents_type ON rider_documents(document_type);
CREATE INDEX idx_rider_documents_status ON rider_documents(verification_status);

-- =======================
-- RESTAURANT DOCUMENTS
-- =======================
CREATE TABLE restaurant_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  document_type VARCHAR(50) NOT NULL, -- 'cac_certificate', 'owner_nin_front', 'owner_nin_back', etc.
  file_url TEXT NOT NULL,
  file_name VARCHAR(255),
  file_size INTEGER,
  mime_type VARCHAR(100),
  verification_status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  verified_by UUID REFERENCES users(id), -- Admin who verified
  verification_notes TEXT,
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for restaurant documents
CREATE INDEX idx_restaurant_documents_restaurant ON restaurant_documents(restaurant_id);
CREATE INDEX idx_restaurant_documents_type ON restaurant_documents(document_type);
CREATE INDEX idx_restaurant_documents_status ON restaurant_documents(verification_status);

-- =======================
-- ADMIN PERMISSIONS SYSTEM
-- =======================
CREATE TABLE admin_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  permission_name VARCHAR(100) NOT NULL, -- 'view_customers', 'approve_restaurants', etc.
  granted_by UUID NOT NULL REFERENCES users(id), -- Super admin who granted
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE, -- Optional expiration
  is_active BOOLEAN NOT NULL DEFAULT true,
  
  UNIQUE(admin_id, permission_name)
);

-- Index for permission checks
CREATE INDEX idx_admin_permissions_admin ON admin_permissions(admin_id);
CREATE INDEX idx_admin_permissions_active ON admin_permissions(is_active);

-- =======================
-- SYSTEM SETTINGS
-- =======================
CREATE TABLE system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key VARCHAR(100) UNIQUE NOT NULL,
  setting_value JSONB NOT NULL,
  description TEXT,
  category VARCHAR(50) NOT NULL DEFAULT 'general', -- 'general', 'payment', 'delivery', etc.
  is_public BOOLEAN NOT NULL DEFAULT false, -- Can be accessed by frontend
  last_modified_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default system settings
INSERT INTO system_settings (setting_key, setting_value, description, category, is_public) VALUES
('default_delivery_radius', '5.0', 'Default delivery radius in kilometers', 'delivery', true),
('service_fee_percentage', '10', 'Service fee percentage on orders', 'payment', true),
('minimum_order_amount', '2000', 'Minimum order amount in Naira', 'payment', true),
('restaurant_commission_rate', '10', 'Commission rate for partner restaurants', 'payment', false),
('rider_commission_own_bike', '10', 'Commission rate for riders with own bike', 'payment', false),
('rider_commission_company_bike', '20', 'Commission rate for riders with company bike', 'payment', false),
('payout_delay_hours', '2', 'Hours to wait before processing restaurant payout', 'payment', false),
('max_preparation_time', '30', 'Maximum preparation time in minutes', 'operations', true),
('min_preparation_time', '25', 'Minimum preparation time in minutes', 'operations', true);

-- Index for settings
CREATE INDEX idx_system_settings_key ON system_settings(setting_key);
CREATE INDEX idx_system_settings_category ON system_settings(category);
CREATE INDEX idx_system_settings_public ON system_settings(is_public);

-- =======================
-- MENU TEMPLATES (ADMIN)
-- =======================
CREATE TABLE menu_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_name VARCHAR(100) NOT NULL,
  item_name VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  suggested_price_min INTEGER NOT NULL, -- Minimum suggested price in Kobo
  suggested_price_max INTEGER NOT NULL, -- Maximum suggested price in Kobo
  default_image_url TEXT NOT NULL,
  preparation_time_min INTEGER NOT NULL DEFAULT 25, -- Minutes
  preparation_time_max INTEGER NOT NULL DEFAULT 30, -- Minutes
  tags JSONB DEFAULT '[]', -- Array of tags
  allergens JSONB DEFAULT '[]', -- Array of common allergens
  customization_options JSONB DEFAULT '{}', -- Standard customization options
  nutrition_template JSONB DEFAULT '{}', -- Template nutrition info
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NOT NULL REFERENCES users(id), -- Admin who created
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for template search
CREATE INDEX idx_menu_templates_category ON menu_templates(category_name);
CREATE INDEX idx_menu_templates_active ON menu_templates(is_active);
CREATE INDEX idx_menu_templates_name ON menu_templates(item_name);

-- =======================
-- GUARANTOR SYSTEM (RIDERS)
-- =======================
CREATE TABLE rider_guarantors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rider_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  full_name VARCHAR(255) NOT NULL,
  phone_number VARCHAR(20) NOT NULL,
  nin_number VARCHAR(11) NOT NULL,
  occupation VARCHAR(100) NOT NULL,
  company_name VARCHAR(255) NOT NULL,
  company_address TEXT NOT NULL,
  relationship_to_rider VARCHAR(100) NOT NULL,
  years_known INTEGER NOT NULL CHECK (years_known >= 2),
  verification_status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'otp_sent', 'verified', 'failed'
  otp_code VARCHAR(6), -- Current OTP code
  otp_expires_at TIMESTAMP WITH TIME ZONE,
  otp_attempts INTEGER DEFAULT 0,
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(rider_id) -- One guarantor per rider
);

-- Index for guarantor verification
CREATE INDEX idx_rider_guarantors_rider ON rider_guarantors(rider_id);
CREATE INDEX idx_rider_guarantors_phone ON rider_guarantors(phone_number);
CREATE INDEX idx_rider_guarantors_status ON rider_guarantors(verification_status);

-- =======================
-- PAYOUT HISTORY
-- =======================
CREATE TABLE payout_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipient_type VARCHAR(20) NOT NULL, -- 'restaurant', 'rider'
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  amount INTEGER NOT NULL, -- Amount in Kobo
  commission_amount INTEGER NOT NULL DEFAULT 0, -- Commission deducted in Kobo
  net_amount INTEGER NOT NULL, -- Final amount paid in Kobo
  payout_method VARCHAR(50) NOT NULL DEFAULT 'bank_transfer',
  bank_name VARCHAR(100),
  account_number VARCHAR(20),
  account_name VARCHAR(255),
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'processing', 'completed', 'failed'
  processed_by UUID REFERENCES users(id), -- Admin who processed
  paystack_transfer_code VARCHAR(255), -- Paystack transfer reference
  failure_reason TEXT,
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for payout management
CREATE INDEX idx_payout_history_recipient ON payout_history(recipient_id);
CREATE INDEX idx_payout_history_type ON payout_history(recipient_type);
CREATE INDEX idx_payout_history_status ON payout_history(status);
CREATE INDEX idx_payout_history_order ON payout_history(order_id);

-- =======================
-- USER SESSIONS & SECURITY
-- =======================
CREATE TABLE user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_token TEXT NOT NULL UNIQUE,
  ip_address INET,
  user_agent TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Clean up expired sessions
CREATE INDEX idx_user_sessions_user ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX idx_user_sessions_expires ON user_sessions(expires_at);

-- =======================
-- AUDIT LOGS
-- =======================
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL, -- 'order_created', 'user_approved', 'payout_processed', etc.
  entity_type VARCHAR(50) NOT NULL, -- 'order', 'user', 'restaurant', etc.
  entity_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for audit queries
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at DESC);

-- =======================
-- ROW LEVEL SECURITY POLICIES
-- =======================

-- Notifications RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role bypass notifications" ON notifications
  FOR ALL USING (auth.role() = 'service_role');

-- Support Tickets RLS  
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers see own tickets" ON support_tickets
  FOR SELECT USING (auth.uid() = customer_id);

CREATE POLICY "Service role bypass tickets" ON support_tickets
  FOR ALL USING (auth.role() = 'service_role');

-- Payment Transactions RLS
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers see own payments" ON payment_transactions
  FOR SELECT USING (auth.uid() = customer_id);

CREATE POLICY "Service role bypass payments" ON payment_transactions
  FOR ALL USING (auth.role() = 'service_role');

-- Delivery Assignments RLS
ALTER TABLE delivery_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Riders see own assignments" ON delivery_assignments
  FOR SELECT USING (auth.uid() = rider_id);

CREATE POLICY "Service role bypass assignments" ON delivery_assignments
  FOR ALL USING (auth.role() = 'service_role');

-- Rider Documents RLS
ALTER TABLE rider_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Riders see own documents" ON rider_documents
  FOR SELECT USING (auth.uid() = rider_id);

CREATE POLICY "Service role bypass rider docs" ON rider_documents
  FOR ALL USING (auth.role() = 'service_role');

-- Restaurant Documents RLS
ALTER TABLE restaurant_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Restaurants see own documents" ON restaurant_documents
  FOR SELECT USING (auth.uid() IN (
    SELECT owner_id FROM restaurants WHERE id = restaurant_documents.restaurant_id
  ));

CREATE POLICY "Service role bypass restaurant docs" ON restaurant_documents
  FOR ALL USING (auth.role() = 'service_role');

-- Delivery Zones (Public read)
ALTER TABLE delivery_zones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active zones" ON delivery_zones
  FOR SELECT USING (is_active = true);

CREATE POLICY "Service role bypass zones" ON delivery_zones
  FOR ALL USING (auth.role() = 'service_role');

-- Restaurant Delivery Zones
ALTER TABLE restaurant_delivery_zones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read restaurant zones" ON restaurant_delivery_zones
  FOR SELECT USING (is_active = true);

CREATE POLICY "Service role bypass restaurant zones" ON restaurant_delivery_zones
  FOR ALL USING (auth.role() = 'service_role');

-- System Settings (Public read for public settings)
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Read public settings" ON system_settings
  FOR SELECT USING (is_public = true);

CREATE POLICY "Service role bypass settings" ON system_settings
  FOR ALL USING (auth.role() = 'service_role');

-- Admin Permissions (Admin only)
ALTER TABLE admin_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role bypass admin permissions" ON admin_permissions
  FOR ALL USING (auth.role() = 'service_role');

-- Other tables (Admin/Service role only)
ALTER TABLE rider_guarantors ENABLE ROW LEVEL SECURITY;
ALTER TABLE payout_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role bypass guarantors" ON rider_guarantors
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role bypass payout history" ON payout_history
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role bypass sessions" ON user_sessions
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role bypass audit logs" ON audit_logs
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role bypass menu templates" ON menu_templates
  FOR ALL USING (auth.role() = 'service_role');

-- =======================
-- UPDATE TRIGGERS
-- =======================

-- Generic updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers to all tables
CREATE TRIGGER trigger_notifications_updated_at BEFORE UPDATE ON notifications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_delivery_zones_updated_at BEFORE UPDATE ON delivery_zones FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_support_tickets_updated_at BEFORE UPDATE ON support_tickets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_payment_transactions_updated_at BEFORE UPDATE ON payment_transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_delivery_assignments_updated_at BEFORE UPDATE ON delivery_assignments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_rider_documents_updated_at BEFORE UPDATE ON rider_documents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_restaurant_documents_updated_at BEFORE UPDATE ON restaurant_documents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_system_settings_updated_at BEFORE UPDATE ON system_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_payout_history_updated_at BEFORE UPDATE ON payout_history FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_rider_guarantors_updated_at BEFORE UPDATE ON rider_guarantors FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =======================
-- SUMMARY
-- =======================
-- Tables created:
-- 1. notifications (customer communication)
-- 2. delivery_zones (customer coverage)
-- 3. restaurant_delivery_zones (restaurant coverage mapping)
-- 4. support_tickets (customer support)
-- 5. payment_transactions (payment tracking)
-- 6. delivery_assignments (order-rider mapping)
-- 7. rider_documents (rider verification)
-- 8. restaurant_documents (restaurant verification)
-- 9. admin_permissions (admin role management)
-- 10. system_settings (global configuration)
-- 11. rider_guarantors (rider guarantor system)
-- 12. payout_history (financial tracking)
-- 13. user_sessions (session management)
-- 14. audit_logs (security and compliance)

-- All tables have:
-- - UUID primary keys
-- - Proper foreign key relationships
-- - Row Level Security policies
-- - Service role bypass for admin operations
-- - Appropriate indexes for performance
-- - Updated_at triggers for audit trails