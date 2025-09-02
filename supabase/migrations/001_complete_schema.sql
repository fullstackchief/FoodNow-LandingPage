-- FoodNow Complete Database Schema
-- This migration creates all necessary tables for the food delivery platform

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis"; -- For geolocation features
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For text search

-- Enum types for consistency
CREATE TYPE delivery_status AS ENUM ('pending', 'assigned', 'accepted', 'picked_up', 'in_transit', 'delivered', 'cancelled');
CREATE TYPE payment_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'refunded', 'partially_refunded');
CREATE TYPE payment_method AS ENUM ('card', 'bank_transfer', 'cash', 'wallet');
CREATE TYPE document_status AS ENUM ('pending', 'approved', 'rejected', 'expired');
CREATE TYPE ticket_status AS ENUM ('open', 'in_progress', 'resolved', 'closed', 'escalated');
CREATE TYPE ticket_priority AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE notification_type AS ENUM ('order', 'payment', 'delivery', 'system', 'promotion', 'support');

-- 1. Delivery Zones Table
CREATE TABLE IF NOT EXISTS delivery_zones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    zone_name VARCHAR(100) NOT NULL UNIQUE,
    zone_code VARCHAR(20) NOT NULL UNIQUE,
    city VARCHAR(100) NOT NULL DEFAULT 'Lagos',
    state VARCHAR(100) NOT NULL DEFAULT 'Lagos',
    country VARCHAR(100) NOT NULL DEFAULT 'Nigeria',
    
    -- GPS boundaries (polygon)
    boundaries GEOGRAPHY(POLYGON, 4326),
    center_point GEOGRAPHY(POINT, 4326),
    
    -- Delivery fees and timing
    base_delivery_fee DECIMAL(10, 2) NOT NULL DEFAULT 500.00,
    per_km_fee DECIMAL(10, 2) DEFAULT 50.00,
    min_order_amount DECIMAL(10, 2) DEFAULT 1000.00,
    estimated_delivery_time INTEGER DEFAULT 30, -- in minutes
    max_delivery_distance DECIMAL(5, 2) DEFAULT 15.00, -- in km
    
    -- Operational settings
    is_active BOOLEAN DEFAULT true,
    surge_multiplier DECIMAL(3, 2) DEFAULT 1.00,
    available_from TIME DEFAULT '08:00:00',
    available_to TIME DEFAULT '23:00:00',
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Rider Documents Table
CREATE TABLE IF NOT EXISTS rider_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rider_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Document types and files
    document_type VARCHAR(50) NOT NULL, -- 'nin', 'guarantor_form', 'sla', 'photo', 'guarantor_photo'
    document_url TEXT NOT NULL,
    document_number VARCHAR(100), -- For NIN number
    
    -- Verification status
    status document_status DEFAULT 'pending',
    verified_by UUID REFERENCES users(id),
    verified_at TIMESTAMPTZ,
    rejection_reason TEXT,
    
    -- Expiry for documents like licenses
    expires_at DATE,
    
    -- Metadata
    uploaded_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(rider_id, document_type)
);

-- 3. Rider Details Table (extends users table)
CREATE TABLE IF NOT EXISTS rider_details (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rider_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Personal Information
    nin_number VARCHAR(20),
    address TEXT NOT NULL,
    emergency_contact_name VARCHAR(255),
    emergency_contact_phone VARCHAR(20),
    
    -- Vehicle Information
    vehicle_type VARCHAR(50) DEFAULT 'motorcycle', -- 'bicycle', 'motorcycle', 'car'
    vehicle_make VARCHAR(100),
    vehicle_model VARCHAR(100),
    vehicle_year INTEGER,
    vehicle_plate_number VARCHAR(20),
    vehicle_color VARCHAR(50),
    
    -- Guarantor Information
    guarantor_name VARCHAR(255),
    guarantor_phone VARCHAR(20),
    guarantor_email VARCHAR(255),
    guarantor_address TEXT,
    guarantor_relationship VARCHAR(100),
    
    -- Status and Performance
    is_available BOOLEAN DEFAULT false,
    is_verified BOOLEAN DEFAULT false,
    last_known_location GEOGRAPHY(POINT, 4326),
    last_location_update TIMESTAMPTZ,
    
    -- Ratings and metrics
    total_deliveries INTEGER DEFAULT 0,
    total_distance_km DECIMAL(10, 2) DEFAULT 0,
    average_rating DECIMAL(3, 2) DEFAULT 0,
    completion_rate DECIMAL(5, 2) DEFAULT 0,
    
    -- Financial
    current_balance DECIMAL(10, 2) DEFAULT 0,
    total_earnings DECIMAL(10, 2) DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Delivery Assignments Table
CREATE TABLE IF NOT EXISTS delivery_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    rider_id UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Assignment details
    status delivery_status DEFAULT 'pending',
    assigned_at TIMESTAMPTZ,
    accepted_at TIMESTAMPTZ,
    picked_up_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    cancellation_reason TEXT,
    
    -- Location tracking
    pickup_location GEOGRAPHY(POINT, 4326),
    pickup_address TEXT NOT NULL,
    delivery_location GEOGRAPHY(POINT, 4326),
    delivery_address TEXT NOT NULL,
    
    -- Route information
    estimated_distance_km DECIMAL(5, 2),
    actual_distance_km DECIMAL(5, 2),
    estimated_duration_minutes INTEGER,
    actual_duration_minutes INTEGER,
    route_polyline TEXT, -- Encoded polyline for route
    
    -- Delivery proof
    delivery_photo_url TEXT,
    delivery_notes TEXT,
    customer_signature_url TEXT,
    delivery_code VARCHAR(10), -- Verification code
    
    -- Ratings
    customer_rating INTEGER CHECK (customer_rating >= 1 AND customer_rating <= 5),
    customer_feedback TEXT,
    rider_rating INTEGER CHECK (rider_rating >= 1 AND rider_rating <= 5),
    rider_feedback TEXT,
    
    -- Financial
    delivery_fee DECIMAL(10, 2) NOT NULL,
    rider_commission DECIMAL(10, 2),
    platform_fee DECIMAL(10, 2),
    tips DECIMAL(10, 2) DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Payment Transactions Table
CREATE TABLE IF NOT EXISTS payment_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    user_id UUID NOT NULL REFERENCES users(id),
    
    -- Transaction details
    transaction_reference VARCHAR(100) UNIQUE NOT NULL,
    payment_method payment_method NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'NGN',
    status payment_status DEFAULT 'pending',
    
    -- Payment gateway details
    gateway_name VARCHAR(50), -- 'paystack', 'flutterwave', etc.
    gateway_reference VARCHAR(200),
    gateway_response TEXT,
    authorization_code VARCHAR(100),
    
    -- Card details (masked)
    card_last4 VARCHAR(4),
    card_brand VARCHAR(50),
    card_bank VARCHAR(100),
    
    -- Refund information
    is_refunded BOOLEAN DEFAULT false,
    refund_amount DECIMAL(10, 2),
    refund_reason TEXT,
    refunded_at TIMESTAMPTZ,
    refunded_by UUID REFERENCES users(id),
    
    -- Metadata
    ip_address INET,
    user_agent TEXT,
    metadata JSONB,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Notification details
    type notification_type NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    
    -- Delivery channels
    sent_via_email BOOLEAN DEFAULT false,
    sent_via_sms BOOLEAN DEFAULT false,
    sent_via_push BOOLEAN DEFAULT false,
    sent_via_in_app BOOLEAN DEFAULT true,
    
    -- Status tracking
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMPTZ,
    is_archived BOOLEAN DEFAULT false,
    
    -- Related entities
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    related_entity_type VARCHAR(50), -- 'order', 'payment', 'delivery', etc.
    related_entity_id UUID,
    
    -- Action buttons
    action_url TEXT,
    action_label VARCHAR(100),
    
    -- Scheduling
    scheduled_for TIMESTAMPTZ,
    sent_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Support Tickets Table
CREATE TABLE IF NOT EXISTS support_tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_number VARCHAR(20) UNIQUE NOT NULL,
    
    -- User information
    user_id UUID NOT NULL REFERENCES users(id),
    user_type VARCHAR(50) NOT NULL, -- 'customer', 'rider', 'restaurant'
    
    -- Ticket details
    category VARCHAR(100) NOT NULL, -- 'order_issue', 'payment', 'delivery', 'account', 'other'
    subject VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    status ticket_status DEFAULT 'open',
    priority ticket_priority DEFAULT 'medium',
    
    -- Related entities
    order_id UUID REFERENCES orders(id),
    delivery_id UUID REFERENCES delivery_assignments(id),
    
    -- Assignment and resolution
    assigned_to UUID REFERENCES users(id),
    assigned_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES users(id),
    resolved_at TIMESTAMPTZ,
    resolution_notes TEXT,
    
    -- Customer satisfaction
    satisfaction_rating INTEGER CHECK (satisfaction_rating >= 1 AND satisfaction_rating <= 5),
    satisfaction_feedback TEXT,
    
    -- SLA tracking
    sla_deadline TIMESTAMPTZ,
    first_response_at TIMESTAMPTZ,
    
    -- Metadata
    attachments TEXT[], -- Array of URLs
    internal_notes TEXT,
    tags TEXT[],
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    closed_at TIMESTAMPTZ
);

-- 8. Support Ticket Messages Table (for conversation threads)
CREATE TABLE IF NOT EXISTS support_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES users(id),
    
    message TEXT NOT NULL,
    is_internal BOOLEAN DEFAULT false, -- Internal notes not visible to customer
    attachments TEXT[],
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Rider Payouts Table
CREATE TABLE IF NOT EXISTS rider_payouts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rider_id UUID NOT NULL REFERENCES users(id),
    
    -- Payout details
    payout_reference VARCHAR(100) UNIQUE NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    status payment_status DEFAULT 'pending',
    
    -- Period covered
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    delivery_count INTEGER NOT NULL,
    
    -- Bank details
    bank_name VARCHAR(100),
    account_number VARCHAR(20),
    account_name VARCHAR(255),
    
    -- Processing details
    processed_by UUID REFERENCES users(id),
    processed_at TIMESTAMPTZ,
    payment_reference VARCHAR(200),
    payment_receipt_url TEXT,
    
    -- Deductions
    platform_fee DECIMAL(10, 2) DEFAULT 0,
    deductions DECIMAL(10, 2) DEFAULT 0,
    deduction_reason TEXT,
    net_amount DECIMAL(10, 2) NOT NULL,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Restaurant Payouts Table
CREATE TABLE IF NOT EXISTS restaurant_payouts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id),
    
    -- Payout details
    payout_reference VARCHAR(100) UNIQUE NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    status payment_status DEFAULT 'pending',
    
    -- Period covered
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    order_count INTEGER NOT NULL,
    
    -- Bank details
    bank_name VARCHAR(100),
    account_number VARCHAR(20),
    account_name VARCHAR(255),
    
    -- Processing details
    processed_by UUID REFERENCES users(id),
    processed_at TIMESTAMPTZ,
    payment_reference VARCHAR(200),
    payment_receipt_url TEXT,
    
    -- Commission and fees
    gross_sales DECIMAL(10, 2) NOT NULL,
    platform_commission DECIMAL(10, 2) DEFAULT 0,
    processing_fee DECIMAL(10, 2) DEFAULT 0,
    refunds DECIMAL(10, 2) DEFAULT 0,
    net_amount DECIMAL(10, 2) NOT NULL,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Order Notes Table (for customer notes to restaurant/rider)
CREATE TABLE IF NOT EXISTS order_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    
    delivery_instructions TEXT,
    restaurant_notes TEXT,
    rider_notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. System Settings Table
CREATE TABLE IF NOT EXISTS system_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT NOT NULL,
    setting_type VARCHAR(50) NOT NULL, -- 'string', 'number', 'boolean', 'json'
    category VARCHAR(100) NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT false,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_delivery_zones_active ON delivery_zones(is_active);
CREATE INDEX idx_delivery_zones_boundaries ON delivery_zones USING GIST(boundaries);
CREATE INDEX idx_rider_documents_rider_status ON rider_documents(rider_id, status);
CREATE INDEX idx_rider_details_available ON rider_details(is_available, is_verified);
CREATE INDEX idx_rider_details_location ON rider_details USING GIST(last_known_location);
CREATE INDEX idx_delivery_assignments_status ON delivery_assignments(status);
CREATE INDEX idx_delivery_assignments_rider ON delivery_assignments(rider_id, status);
CREATE INDEX idx_payment_transactions_user ON payment_transactions(user_id, status);
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read);
CREATE INDEX idx_support_tickets_status ON support_tickets(status, priority);
CREATE INDEX idx_rider_payouts_status ON rider_payouts(rider_id, status);
CREATE INDEX idx_restaurant_payouts_status ON restaurant_payouts(restaurant_id, status);

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_delivery_zones_updated_at BEFORE UPDATE ON delivery_zones
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rider_documents_updated_at BEFORE UPDATE ON rider_documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rider_details_updated_at BEFORE UPDATE ON rider_details
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_delivery_assignments_updated_at BEFORE UPDATE ON delivery_assignments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_transactions_updated_at BEFORE UPDATE ON payment_transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_support_tickets_updated_at BEFORE UPDATE ON support_tickets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rider_payouts_updated_at BEFORE UPDATE ON rider_payouts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_restaurant_payouts_updated_at BEFORE UPDATE ON restaurant_payouts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_order_notes_updated_at BEFORE UPDATE ON order_notes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_system_settings_updated_at BEFORE UPDATE ON system_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default system settings
INSERT INTO system_settings (setting_key, setting_value, setting_type, category, description, is_public) VALUES
('platform_commission_percentage', '15', 'number', 'financial', 'Platform commission percentage for restaurants', false),
('rider_commission_percentage', '80', 'number', 'financial', 'Rider commission percentage from delivery fee', false),
('min_payout_amount', '5000', 'number', 'financial', 'Minimum amount for payout processing', false),
('order_auto_cancel_minutes', '30', 'number', 'orders', 'Auto-cancel unaccepted orders after this many minutes', false),
('max_delivery_distance_km', '20', 'number', 'delivery', 'Maximum delivery distance in kilometers', false),
('surge_pricing_enabled', 'false', 'boolean', 'pricing', 'Enable surge pricing during peak hours', false),
('sms_notifications_enabled', 'true', 'boolean', 'notifications', 'Enable SMS notifications', false),
('email_notifications_enabled', 'true', 'boolean', 'notifications', 'Enable email notifications', false);

-- Insert default delivery zones for Lagos
INSERT INTO delivery_zones (zone_name, zone_code, base_delivery_fee, per_km_fee, estimated_delivery_time) VALUES
('Lekki Phase 1', 'LK1', 500, 50, 25),
('Victoria Island', 'VI', 500, 50, 25),
('Ikoyi', 'IKY', 500, 50, 25),
('Yaba', 'YBA', 800, 60, 35),
('Surulere', 'SUR', 800, 60, 35),
('Ikeja', 'IKJ', 700, 55, 30),
('Maryland', 'MLD', 700, 55, 30),
('Ajah', 'AJH', 900, 65, 40),
('Gbagada', 'GBG', 800, 60, 35),
('Magodo', 'MGD', 900, 65, 40),
('Festac', 'FST', 1000, 70, 45),
('Apapa', 'APA', 1200, 75, 50);

-- Grant appropriate permissions (adjust based on your Supabase setup)
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;