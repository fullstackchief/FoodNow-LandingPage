-- TEST RLS ENABLEMENT WITH VERIFICATION
-- ======================================
-- Tests individual commands and checks results

-- Check current RLS status BEFORE
SELECT 'BEFORE RLS ENABLEMENT:' as status;
SELECT 
  relname as table_name,
  relrowsecurity as rls_enabled,
  relforcerowsecurity as rls_forced
FROM pg_class 
WHERE relname IN ('users', 'restaurants') 
AND relkind = 'r';

-- Try to enable RLS on users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Check RLS status AFTER
SELECT 'AFTER RLS ENABLEMENT:' as status;
SELECT 
  relname as table_name,
  relrowsecurity as rls_enabled,
  relforcerowsecurity as rls_forced
FROM pg_class 
WHERE relname = 'users' 
AND relkind = 'r';

-- Create a test policy
DROP POLICY IF EXISTS "test_service_role_policy" ON public.users;
CREATE POLICY "test_service_role_policy" ON public.users
  FOR ALL USING (auth.role() = 'service_role');

-- Verify policy was created
SELECT 'POLICY VERIFICATION:' as status;
SELECT 
  pol.polname as policy_name,
  pol.polcmd as command,
  pol.polroles as roles,
  pol.polqual as qual,
  rel.relname as table_name
FROM pg_policy pol
JOIN pg_class rel ON pol.polrelid = rel.oid
WHERE rel.relname = 'users';