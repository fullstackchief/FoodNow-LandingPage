-- FINAL CLEAN MIGRATION - MISSING TABLES ONLY
-- ============================================
-- Handles existing objects gracefully
-- Creates only the 12 missing tables identified

-- Enable extensions (safe to re-run)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- ENUM TYPES HANDLED BY 006_missing_enums_only.sql
-- ===================================================
-- All required enum types should be created BEFORE running this migration:
-- - admin_role (already exists)
-- - application_type (created by 006_missing_enums_only.sql)
-- - application_status (created by 006_missing_enums_only.sql)
-- - document_status (created by 006_missing_enums_only.sql)
--
-- This migration ONLY creates tables, NOT enum types

-- Create update function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ===============================
-- CREATE MISSING TABLES (12 TOTAL)
-- ===============================

-- 1. role_applications (if not exists)
CREATE TABLE IF NOT EXISTS role_applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Application Details
    application_type application_type NOT NULL,
    status application_status DEFAULT 'pending',
    
    -- Restaurant Owner Application Fields
    restaurant_name VARCHAR(255),
    restaurant_description TEXT,
    restaurant_address TEXT,
    restaurant_phone VARCHAR(20),
    restaurant_email VARCHAR(255),
    cuisine_types TEXT[],
    
    -- Business Documentation
    business_license_url TEXT,
    cac_certificate_url TEXT,
    tax_clearance_url TEXT,
    bank_statement_url TEXT,
    
    -- Rider Application Fields
    vehicle_type VARCHAR(50), -- 'bicycle', 'motorcycle', 'car'
    vehicle_make VARCHAR(100),
    vehicle_model VARCHAR(100),
    vehicle_year INTEGER,
    vehicle_plate_number VARCHAR(20),
    nin_number VARCHAR(20),
    
    -- Rider Documentation
    drivers_license_url TEXT,
    vehicle_registration_url TEXT,
    insurance_certificate_url TEXT,
    rider_photo_url TEXT,
    
    -- Emergency Contact (for riders)
    emergency_contact_name VARCHAR(255),
    emergency_contact_phone VARCHAR(20),
    emergency_contact_relationship VARCHAR(100),
    
    -- Application Processing
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    reviewed_by UUID REFERENCES admin_users(id),
    reviewed_at TIMESTAMPTZ,
    review_notes TEXT,
    rejection_reason TEXT,
    
    -- Approval and Completion
    approved_by UUID REFERENCES admin_users(id),
    approved_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    
    -- Additional Information
    additional_documents JSONB, -- For any extra documents
    metadata JSONB,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_restaurant_fields CHECK (
        application_type != 'restaurant_owner' OR 
        (restaurant_name IS NOT NULL AND restaurant_address IS NOT NULL)
    ),
    CONSTRAINT valid_rider_fields CHECK (
        application_type != 'rider' OR 
        (vehicle_type IS NOT NULL AND nin_number IS NOT NULL)
    )
);

-- 2. guarantor_verifications
CREATE TABLE IF NOT EXISTS guarantor_verifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role_application_id UUID NOT NULL REFERENCES role_applications(id) ON DELETE CASCADE,
    rider_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Guarantor Personal Information
    guarantor_name VARCHAR(255) NOT NULL,
    guarantor_phone VARCHAR(20) NOT NULL,
    guarantor_email VARCHAR(255),
    guarantor_address TEXT NOT NULL,
    guarantor_relationship VARCHAR(100) NOT NULL,
    
    -- Guarantor Documentation
    guarantor_id_type VARCHAR(50), -- 'nin', 'drivers_license', 'voters_card', 'passport'
    guarantor_id_number VARCHAR(50),
    guarantor_photo_url TEXT,
    guarantor_id_document_url TEXT,
    
    -- Employment/Financial Information
    guarantor_occupation VARCHAR(255),
    guarantor_employer VARCHAR(255),
    guarantor_monthly_income DECIMAL(10, 2),
    
    -- Guarantor Form and Agreement
    guarantor_form_url TEXT NOT NULL, -- Signed guarantor form
    agreement_signed_at TIMESTAMPTZ,
    
    -- Verification Status
    status document_status DEFAULT 'pending',
    verified_by UUID REFERENCES admin_users(id),
    verified_at TIMESTAMPTZ,
    verification_notes TEXT,
    rejection_reason TEXT,
    
    -- Contact Verification
    phone_verified BOOLEAN DEFAULT false,
    phone_verified_at TIMESTAMPTZ,
    email_verified BOOLEAN DEFAULT false,
    email_verified_at TIMESTAMPTZ,
    
    -- Background Check (if applicable)
    background_check_requested BOOLEAN DEFAULT false,
    background_check_completed BOOLEAN DEFAULT false,
    background_check_passed BOOLEAN,
    background_check_notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. delivery_zones
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

-- 4. support_tickets
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

-- 5. payment_transactions
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

-- 6. delivery_assignments
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

-- 7. rider_documents
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

-- 8. restaurant_documents
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

-- 9. admin_permissions
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

-- 10. system_settings
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

-- 11. rider_guarantors
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

-- 12. payout_history
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

-- ===============================
-- CREATE INDEXES (Safe to re-run)
-- ===============================

-- role_applications indexes
CREATE INDEX IF NOT EXISTS idx_role_applications_user_type ON role_applications(user_id, application_type);
CREATE INDEX IF NOT EXISTS idx_role_applications_status ON role_applications(status, application_type);

-- guarantor_verifications indexes
CREATE INDEX IF NOT EXISTS idx_guarantor_verifications_application ON guarantor_verifications(role_application_id, status);

-- delivery_zones indexes
CREATE INDEX IF NOT EXISTS idx_delivery_zones_active ON delivery_zones(is_active);
CREATE INDEX IF NOT EXISTS idx_delivery_zones_center ON delivery_zones(center_lat, center_lng);

-- support_tickets indexes
CREATE INDEX IF NOT EXISTS idx_support_tickets_customer ON support_tickets(customer_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_created ON support_tickets(created_at DESC);

-- payment_transactions indexes
CREATE INDEX IF NOT EXISTS idx_payment_transactions_order ON payment_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_customer ON payment_transactions(customer_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_reference ON payment_transactions(paystack_reference);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON payment_transactions(status);

-- delivery_assignments indexes
CREATE INDEX IF NOT EXISTS idx_delivery_assignments_order ON delivery_assignments(order_id);
CREATE INDEX IF NOT EXISTS idx_delivery_assignments_rider ON delivery_assignments(rider_id);
CREATE INDEX IF NOT EXISTS idx_delivery_assignments_status ON delivery_assignments(status);

-- rider_documents indexes
CREATE INDEX IF NOT EXISTS idx_rider_documents_rider ON rider_documents(rider_id);
CREATE INDEX IF NOT EXISTS idx_rider_documents_type ON rider_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_rider_documents_status ON rider_documents(verification_status);

-- restaurant_documents indexes
CREATE INDEX IF NOT EXISTS idx_restaurant_documents_restaurant ON restaurant_documents(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_restaurant_documents_type ON restaurant_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_restaurant_documents_status ON restaurant_documents(verification_status);

-- admin_permissions indexes
CREATE INDEX IF NOT EXISTS idx_admin_permissions_admin ON admin_permissions(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_permissions_active ON admin_permissions(is_active);

-- system_settings indexes
CREATE INDEX IF NOT EXISTS idx_system_settings_key ON system_settings(setting_key);
CREATE INDEX IF NOT EXISTS idx_system_settings_category ON system_settings(category);
CREATE INDEX IF NOT EXISTS idx_system_settings_public ON system_settings(is_public);

-- rider_guarantors indexes
CREATE INDEX IF NOT EXISTS idx_rider_guarantors_rider ON rider_guarantors(rider_id);
CREATE INDEX IF NOT EXISTS idx_rider_guarantors_phone ON rider_guarantors(phone_number);
CREATE INDEX IF NOT EXISTS idx_rider_guarantors_status ON rider_guarantors(verification_status);

-- payout_history indexes
CREATE INDEX IF NOT EXISTS idx_payout_history_recipient ON payout_history(recipient_id);
CREATE INDEX IF NOT EXISTS idx_payout_history_type ON payout_history(recipient_type);
CREATE INDEX IF NOT EXISTS idx_payout_history_status ON payout_history(status);
CREATE INDEX IF NOT EXISTS idx_payout_history_order ON payout_history(order_id);

-- ===============================
-- CREATE UPDATE TRIGGERS
-- ===============================

-- Apply triggers only if tables exist
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'role_applications') THEN
        DROP TRIGGER IF EXISTS update_role_applications_updated_at ON role_applications;
        CREATE TRIGGER update_role_applications_updated_at BEFORE UPDATE ON role_applications
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'guarantor_verifications') THEN
        DROP TRIGGER IF EXISTS update_guarantor_verifications_updated_at ON guarantor_verifications;
        CREATE TRIGGER update_guarantor_verifications_updated_at BEFORE UPDATE ON guarantor_verifications
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'delivery_zones') THEN
        DROP TRIGGER IF EXISTS trigger_delivery_zones_updated_at ON delivery_zones;
        CREATE TRIGGER trigger_delivery_zones_updated_at BEFORE UPDATE ON delivery_zones 
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'support_tickets') THEN
        DROP TRIGGER IF EXISTS trigger_support_tickets_updated_at ON support_tickets;
        CREATE TRIGGER trigger_support_tickets_updated_at BEFORE UPDATE ON support_tickets 
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payment_transactions') THEN
        DROP TRIGGER IF EXISTS trigger_payment_transactions_updated_at ON payment_transactions;
        CREATE TRIGGER trigger_payment_transactions_updated_at BEFORE UPDATE ON payment_transactions 
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'delivery_assignments') THEN
        DROP TRIGGER IF EXISTS trigger_delivery_assignments_updated_at ON delivery_assignments;
        CREATE TRIGGER trigger_delivery_assignments_updated_at BEFORE UPDATE ON delivery_assignments 
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'rider_documents') THEN
        DROP TRIGGER IF EXISTS trigger_rider_documents_updated_at ON rider_documents;
        CREATE TRIGGER trigger_rider_documents_updated_at BEFORE UPDATE ON rider_documents 
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'restaurant_documents') THEN
        DROP TRIGGER IF EXISTS trigger_restaurant_documents_updated_at ON restaurant_documents;
        CREATE TRIGGER trigger_restaurant_documents_updated_at BEFORE UPDATE ON restaurant_documents 
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'system_settings') THEN
        DROP TRIGGER IF EXISTS trigger_system_settings_updated_at ON system_settings;
        CREATE TRIGGER trigger_system_settings_updated_at BEFORE UPDATE ON system_settings 
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payout_history') THEN
        DROP TRIGGER IF EXISTS trigger_payout_history_updated_at ON payout_history;
        CREATE TRIGGER trigger_payout_history_updated_at BEFORE UPDATE ON payout_history 
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'rider_guarantors') THEN
        DROP TRIGGER IF EXISTS trigger_rider_guarantors_updated_at ON rider_guarantors;
        CREATE TRIGGER trigger_rider_guarantors_updated_at BEFORE UPDATE ON rider_guarantors 
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- ===============================
-- INSERT DEFAULT SYSTEM SETTINGS
-- ===============================
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

-- ===============================
-- COMPLETION MESSAGE
-- ===============================
DO $$
BEGIN
    RAISE NOTICE '🎉 CLEAN MIGRATION COMPLETED SUCCESSFULLY!';
    RAISE NOTICE '✅ All 12 missing tables created';
    RAISE NOTICE '✅ All indexes and triggers applied';
    RAISE NOTICE '✅ Default system settings inserted';
    RAISE NOTICE '🔄 Ready for RLS security setup (next step)';
END $$;