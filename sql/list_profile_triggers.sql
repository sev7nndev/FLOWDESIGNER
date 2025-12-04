-- List triggers specifically on the profiles table
SELECT 
    trigger_name,
    action_timing,
    event_manipulation
FROM information_schema.triggers
WHERE event_object_schema = 'public'
AND event_object_table = 'profiles';
