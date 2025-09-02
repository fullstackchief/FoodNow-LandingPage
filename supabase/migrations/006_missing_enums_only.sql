-- MISSING ENUM TYPES ONLY
-- ========================
-- Creates only the enum types that are missing
-- admin_role already exists, so we skip it

-- Create missing enum types conditionally
DO $$ 
BEGIN
    -- application_type enum (for role_applications table)
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'application_type') THEN
        CREATE TYPE application_type AS ENUM ('restaurant_owner', 'rider');
        RAISE NOTICE '✅ Created application_type enum';
    ELSE
        RAISE NOTICE '⚠️  application_type enum already exists';
    END IF;

    -- application_status enum (for role_applications table)
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'application_status') THEN
        CREATE TYPE application_status AS ENUM ('pending', 'under_review', 'approved', 'rejected', 'withdrawn');
        RAISE NOTICE '✅ Created application_status enum';
    ELSE
        RAISE NOTICE '⚠️  application_status enum already exists';
    END IF;

    -- document_status enum (for various document tables)
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'document_status') THEN
        CREATE TYPE document_status AS ENUM ('pending', 'approved', 'rejected', 'expired');
        RAISE NOTICE '✅ Created document_status enum';
    ELSE
        RAISE NOTICE '⚠️  document_status enum already exists';
    END IF;

    -- admin_role should already exist, but check anyway
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'admin_role') THEN
        CREATE TYPE admin_role AS ENUM ('super_admin', 'admin', 'moderator', 'staff');
        RAISE NOTICE '✅ Created admin_role enum';
    ELSE
        RAISE NOTICE '⚠️  admin_role enum already exists (expected)';
    END IF;

    RAISE NOTICE '🎉 ENUM CREATION COMPLETE - Ready for table creation';
END $$;