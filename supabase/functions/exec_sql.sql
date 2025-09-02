-- CREATE EXEC_SQL FUNCTION FOR MIGRATION EXECUTION
-- Execute this FIRST in Supabase Dashboard before running migrations

CREATE OR REPLACE FUNCTION exec_sql(sql_text TEXT)
RETURNS TABLE(result TEXT) AS $$
BEGIN
  -- Execute the SQL and return a simple success message
  EXECUTE sql_text;
  RETURN QUERY SELECT 'Executed successfully'::TEXT;
EXCEPTION
  WHEN OTHERS THEN
    -- Return error details
    RETURN QUERY SELECT ('ERROR: ' || SQLSTATE || ' - ' || SQLERRM)::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to service role
GRANT EXECUTE ON FUNCTION exec_sql(TEXT) TO service_role;