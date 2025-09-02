-- Missing Tables for FoodNow Platform
-- This migration adds the admin_users, admin_sessions, role_applications, and guarantor_verifications tables

-- Enable necessary extensions (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enum types for new tables
CREATE TYPE admin_role AS ENUM ('super_admin', 'admin', 'moderator', 'staff');
CREATE TYPE application_status AS ENUM ('pending', 'under_review', 'approved', 'rejected', 'withdrawn');
CREATE TYPE application_type AS ENUM ('restaurant_owner', 'rider');

-- 1. Admin Users Table (separate from regular users)
CREATE TABLE IF NOT EXISTS admin_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    
    -- Personal Information
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    avatar_url TEXT,
    
    -- Admin Role and Permissions
    role admin_role NOT NULL DEFAULT 'staff',
    permissions JSONB DEFAULT '{}',
    
    -- Security and Access Control
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMPTZ,
    last_login TIMESTAMPTZ,
    password_changed_at TIMESTAMPTZ DEFAULT NOW(),
    session_timeout INTEGER DEFAULT 3600, -- in seconds
    
    -- 2FA Setup
    two_factor_enabled BOOLEAN DEFAULT false,
    two_factor_secret VARCHAR(32),
    backup_codes TEXT[],
    
    -- Audit Trail
    created_by UUID REFERENCES admin_users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_activity_at TIMESTAMPTZ
);

-- 2. Admin Sessions Table
CREATE TABLE IF NOT EXISTS admin_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_user_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
    
    -- Session Details
    session_token VARCHAR(255) UNIQUE NOT NULL,
    refresh_token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    
    -- Security Information
    ip_address INET,
    user_agent TEXT,
    device_fingerprint VARCHAR(255),
    location_info JSONB,
    
    -- Session State
    is_active BOOLEAN DEFAULT true,
    last_activity TIMESTAMPTZ DEFAULT NOW(),
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    revoked_at TIMESTAMPTZ,
    revoked_by UUID REFERENCES admin_users(id)
);

-- 3. Role Applications Table (for restaurant owner and rider applications)
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

-- 4. Guarantor Verifications Table (for rider applications)
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

-- Create indexes for better performance
CREATE INDEX idx_admin_users_email ON admin_users(email);
CREATE INDEX idx_admin_users_active ON admin_users(is_active, role);
CREATE INDEX idx_admin_sessions_admin_active ON admin_sessions(admin_user_id, is_active);
CREATE INDEX idx_admin_sessions_token ON admin_sessions(session_token);
CREATE INDEX idx_role_applications_user_type ON role_applications(user_id, application_type);
CREATE INDEX idx_role_applications_status ON role_applications(status, application_type);
CREATE INDEX idx_guarantor_verifications_application ON guarantor_verifications(role_application_id, status);

-- Create triggers for updated_at timestamps
CREATE TRIGGER update_admin_users_updated_at BEFORE UPDATE ON admin_users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_role_applications_updated_at BEFORE UPDATE ON role_applications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_guarantor_verifications_updated_at BEFORE UPDATE ON guarantor_verifications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default super admin (password: admin123! - CHANGE IMMEDIATELY IN PRODUCTION)
-- Password hash for 'admin123!' using bcrypt with salt rounds 12
INSERT INTO admin_users (email, password_hash, first_name, last_name, role, is_active, is_verified, created_at) VALUES
('admin@foodnow.com', '$2b$12$LQv3c1yqBwkVGvjzLAEIme6h1aU4XVR8WlKIJGqQtqQCNQQH8ZkNa', 'System', 'Administrator', 'super_admin', true, true, NOW());

-- Grant appropriate permissions
GRANT ALL ON admin_users TO authenticated;
GRANT ALL ON admin_sessions TO authenticated;
GRANT ALL ON role_applications TO authenticated;
GRANT ALL ON guarantor_verifications TO authenticated;

-- RLS Policies for admin tables
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE guarantor_verifications ENABLE ROW LEVEL SECURITY;

-- Admin users can only be accessed by other admin users
CREATE POLICY "Admin users can access admin_users table" ON admin_users
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin_sessions s 
            WHERE s.admin_user_id = auth.uid()::uuid 
            AND s.is_active = true 
            AND s.expires_at > NOW()
        )
    );

-- Admin sessions policy
CREATE POLICY "Admin users can access their own sessions" ON admin_sessions
    FOR ALL USING (admin_user_id = auth.uid()::uuid);

-- Role applications can be viewed by users and admins
CREATE POLICY "Users can access their own role applications" ON role_applications
    FOR SELECT USING (user_id = auth.uid()::uuid);

CREATE POLICY "Users can insert their own role applications" ON role_applications
    FOR INSERT WITH CHECK (user_id = auth.uid()::uuid);

CREATE POLICY "Admins can access all role applications" ON role_applications
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin_sessions s 
            JOIN admin_users au ON s.admin_user_id = au.id
            WHERE s.admin_user_id = auth.uid()::uuid 
            AND s.is_active = true 
            AND s.expires_at > NOW()
            AND au.is_active = true
        )
    );

-- Guarantor verifications policy
CREATE POLICY "Admins can access all guarantor verifications" ON guarantor_verifications
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin_sessions s 
            JOIN admin_users au ON s.admin_user_id = au.id
            WHERE s.admin_user_id = auth.uid()::uuid 
            AND s.is_active = true 
            AND s.expires_at > NOW()
            AND au.is_active = true
        )
    );