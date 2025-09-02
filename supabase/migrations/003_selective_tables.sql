-- SELECTIVE MIGRATION: Missing Tables Only (No Conflicts)
-- Execute AFTER 002_missing_tables.sql
-- Skips 'notifications' which already exists

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- =======================
-- DELIVERY ZONES SYSTEM
-- =======================
CREATE TABLE IF NOT EXISTS delivery_zones (
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

-- =======================
-- SUPPORT TICKETS SYSTEM
-- =======================
CREATE TABLE IF NOT EXISTS support_tickets (
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

-- =======================
-- PAYMENT TRANSACTIONS
-- =======================
CREATE TABLE IF NOT EXISTS payment_transactions (
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

-- =======================
-- DELIVERY ASSIGNMENTS
-- =======================
CREATE TABLE IF NOT EXISTS delivery_assignments (
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

-- =======================
-- RIDER DOCUMENTS
-- =======================
CREATE TABLE IF NOT EXISTS rider_documents (
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

-- =======================
-- RESTAURANT DOCUMENTS
-- =======================
CREATE TABLE IF NOT EXISTS restaurant_documents (
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

-- =======================
-- ADMIN PERMISSIONS SYSTEM
-- =======================
CREATE TABLE IF NOT EXISTS admin_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  permission_name VARCHAR(100) NOT NULL, -- 'view_customers', 'approve_restaurants', etc.
  granted_by UUID NOT NULL REFERENCES users(id), -- Super admin who granted
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE, -- Optional expiration
  is_active BOOLEAN NOT NULL DEFAULT true,
  
  UNIQUE(admin_id, permission_name)
);

-- =======================
-- SYSTEM SETTINGS
-- =======================
CREATE TABLE IF NOT EXISTS system_settings (
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

-- =======================
-- RIDER GUARANTORS
-- =======================
CREATE TABLE IF NOT EXISTS rider_guarantors (
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

-- =======================
-- PAYOUT HISTORY
-- =======================
CREATE TABLE IF NOT EXISTS payout_history (
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

-- =======================
-- CREATE INDEXES
-- =======================

-- Delivery zones indexes
CREATE INDEX IF NOT EXISTS idx_delivery_zones_active ON delivery_zones(is_active);
CREATE INDEX IF NOT EXISTS idx_delivery_zones_center ON delivery_zones(center_lat, center_lng);

-- Support tickets indexes
CREATE INDEX IF NOT EXISTS idx_support_tickets_customer ON support_tickets(customer_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_created ON support_tickets(created_at DESC);

-- Payment transactions indexes
CREATE INDEX IF NOT EXISTS idx_payment_transactions_order ON payment_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_customer ON payment_transactions(customer_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_reference ON payment_transactions(paystack_reference);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON payment_transactions(status);

-- Delivery assignments indexes
CREATE INDEX IF NOT EXISTS idx_delivery_assignments_order ON delivery_assignments(order_id);
CREATE INDEX IF NOT EXISTS idx_delivery_assignments_rider ON delivery_assignments(rider_id);
CREATE INDEX IF NOT EXISTS idx_delivery_assignments_status ON delivery_assignments(status);

-- Rider documents indexes
CREATE INDEX IF NOT EXISTS idx_rider_documents_rider ON rider_documents(rider_id);
CREATE INDEX IF NOT EXISTS idx_rider_documents_type ON rider_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_rider_documents_status ON rider_documents(verification_status);

-- Restaurant documents indexes
CREATE INDEX IF NOT EXISTS idx_restaurant_documents_restaurant ON restaurant_documents(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_restaurant_documents_type ON restaurant_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_restaurant_documents_status ON restaurant_documents(verification_status);

-- Admin permissions indexes
CREATE INDEX IF NOT EXISTS idx_admin_permissions_admin ON admin_permissions(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_permissions_active ON admin_permissions(is_active);

-- System settings indexes
CREATE INDEX IF NOT EXISTS idx_system_settings_key ON system_settings(setting_key);
CREATE INDEX IF NOT EXISTS idx_system_settings_category ON system_settings(category);
CREATE INDEX IF NOT EXISTS idx_system_settings_public ON system_settings(is_public);

-- Rider guarantors indexes
CREATE INDEX IF NOT EXISTS idx_rider_guarantors_rider ON rider_guarantors(rider_id);
CREATE INDEX IF NOT EXISTS idx_rider_guarantors_phone ON rider_guarantors(phone_number);
CREATE INDEX IF NOT EXISTS idx_rider_guarantors_status ON rider_guarantors(verification_status);

-- Payout history indexes
CREATE INDEX IF NOT EXISTS idx_payout_history_recipient ON payout_history(recipient_id);
CREATE INDEX IF NOT EXISTS idx_payout_history_type ON payout_history(recipient_type);
CREATE INDEX IF NOT EXISTS idx_payout_history_status ON payout_history(status);
CREATE INDEX IF NOT EXISTS idx_payout_history_order ON payout_history(order_id);

-- =======================
-- INSERT DEFAULT SYSTEM SETTINGS
-- =======================
INSERT INTO system_settings (setting_key, setting_value, description, category, is_public) 
VALUES 
('default_delivery_radius', '5.0', 'Default delivery radius in kilometers', 'delivery', true),
('service_fee_percentage', '10', 'Service fee percentage on orders', 'payment', true),
('minimum_order_amount', '2000', 'Minimum order amount in Naira', 'payment', true),
('restaurant_commission_rate', '10', 'Commission rate for partner restaurants', 'payment', false),
('rider_commission_own_bike', '10', 'Commission rate for riders with own bike', 'payment', false),
('rider_commission_company_bike', '20', 'Commission rate for riders with company bike', 'payment', false),
('payout_delay_hours', '2', 'Hours to wait before processing restaurant payout', 'payment', false),
('max_preparation_time', '30', 'Maximum preparation time in minutes', 'operations', true),
('min_preparation_time', '25', 'Minimum preparation time in minutes', 'operations', true)
ON CONFLICT (setting_key) DO NOTHING;

-- =======================
-- CREATE UPDATE TRIGGERS
-- =======================

-- Create the trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers to new tables
CREATE TRIGGER trigger_delivery_zones_updated_at BEFORE UPDATE ON delivery_zones FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_support_tickets_updated_at BEFORE UPDATE ON support_tickets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_payment_transactions_updated_at BEFORE UPDATE ON payment_transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_delivery_assignments_updated_at BEFORE UPDATE ON delivery_assignments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_rider_documents_updated_at BEFORE UPDATE ON rider_documents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_restaurant_documents_updated_at BEFORE UPDATE ON restaurant_documents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_system_settings_updated_at BEFORE UPDATE ON system_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_payout_history_updated_at BEFORE UPDATE ON payout_history FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_rider_guarantors_updated_at BEFORE UPDATE ON rider_guarantors FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();