-- Force PostgREST to reload the schema cache
-- Run this if you get errors like "Could not find column/table in schema cache"

NOTIFY pgrst, 'reload schema';
