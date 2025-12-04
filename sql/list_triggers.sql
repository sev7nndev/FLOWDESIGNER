-- Run this to see what triggers are active on auth.users
SELECT 
    event_object_schema as schema_name,
    event_object_table as table_name,
    trigger_name,
    action_timing,
    event_manipulation
FROM information_schema.triggers
WHERE event_object_table = 'users'
AND event_object_schema = 'auth';
