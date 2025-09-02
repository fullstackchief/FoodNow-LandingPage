-- DEBUG AUTHENTICATION CONTEXT
-- ==============================
-- Tests what auth.role() actually returns in Supabase

-- Test current authentication context
SELECT 'TESTING AUTHENTICATION CONTEXT' as test_start;

-- Check what auth.role() returns
SELECT 
  auth.role() as current_role,
  auth.uid() as current_user_id,
  current_user as postgres_user,
  session_user as session_user;

-- Test if we can create a simple blocking policy
-- Remove existing policies on users table first
DROP POLICY IF EXISTS "final_claude_access_users" ON public.users;

-- Create a simple policy that should block everything except service role
CREATE POLICY "test_block_all_except_service" ON public.users
  FOR ALL 
  USING (auth.role() = 'service_role');

-- Test query to see what happens
SELECT 'POLICY CREATED - Testing access...' as policy_status;

-- Check if any policies exist on users table
SELECT 
  pol.polname as policy_name,
  pol.polcmd as command_type,
  CASE pol.polcmd
    WHEN 'r' THEN 'SELECT'
    WHEN 'a' THEN 'INSERT' 
    WHEN 'w' THEN 'UPDATE'
    WHEN 'd' THEN 'DELETE'
    WHEN '*' THEN 'ALL'
    ELSE 'UNKNOWN'
  END as operations,
  pol.polroles as role_oids,
  rel.relname as table_name
FROM pg_policy pol
JOIN pg_class rel ON pol.polrelid = rel.oid
WHERE rel.relname = 'users'
ORDER BY pol.polname;

SELECT 'AUTHENTICATION DEBUG COMPLETE' as debug_end;