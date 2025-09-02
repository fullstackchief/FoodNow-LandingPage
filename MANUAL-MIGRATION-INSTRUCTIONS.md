# MANUAL MIGRATION EXECUTION GUIDE

## 🎯 OBJECTIVE
Fix "relation does not exist" error by creating missing database tables and applying RLS policies.

## 📋 EXECUTION SEQUENCE

### STEP 1: Create exec_sql Function (Optional - for future use)
**Location:** Supabase Dashboard > SQL Editor
**Content:**
```sql
CREATE OR REPLACE FUNCTION exec_sql(sql_text TEXT)
RETURNS TABLE(result TEXT) AS $$
BEGIN
  EXECUTE sql_text;
  RETURN QUERY SELECT 'Executed successfully'::TEXT;
EXCEPTION
  WHEN OTHERS THEN
    RETURN QUERY SELECT ('ERROR: ' || SQLSTATE || ' - ' || SQLERRM)::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION exec_sql(TEXT) TO service_role;
```

### STEP 2: Execute Admin Tables Migration
**File:** `supabase/migrations/002_missing_tables.sql`
**Creates:** admin_users, admin_sessions, role_applications, guarantor_verifications
**Action:** Copy entire file content to Supabase Dashboard SQL Editor and execute

### STEP 3: Execute Remaining Tables Migration  
**File:** `supabase/migrations/003_selective_tables.sql`
**Creates:** delivery_zones, support_tickets, payment_transactions, delivery_assignments, rider_documents, restaurant_documents, admin_permissions, system_settings, rider_guarantors, payout_history
**Action:** Copy entire file content to Supabase Dashboard SQL Editor and execute

### STEP 4: Execute RLS Security Setup
**File:** `supabase/migrations/004_complete_rls_security.sql`
**Enables:** Row Level Security on all 20 tables with service role bypass
**Action:** Copy entire file content to Supabase Dashboard SQL Editor and execute

## ✅ VERIFICATION
After all migrations, run:
```bash
node scripts/discover-all-tables.js
```

Should show 20 tables instead of 6.

## 🔐 SECURITY NOTES
- Default admin created: `admin@foodnow.com` / `admin123!`
- **CHANGE ADMIN PASSWORD IMMEDIATELY** in production
- All tables have service role bypass for Claude access
- RLS policies secure user data appropriately

## 🚨 CRITICAL
Execute migrations in EXACT sequence: 002 → 003 → 004
Do not skip or reorder migrations.