-- DEBUG SCRIPT: Simulate Signup
-- Run this in SQL Editor. It will fail with the REAL error message.
-- It rolls back automatically so it won't leave trash.

BEGIN;

DO $$
DECLARE
  new_user_id uuid := gen_random_uuid();
BEGIN
  RAISE NOTICE 'Creating Mock User %', new_user_id;
  
  -- 1. Insert into auth.users (This fires the triggers!)
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    recovery_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    new_user_id,
    'authenticated',
    'authenticated',
    'debug_test_' || md5(random()::text) || '@test.com',
    'password_hash',
    now(),
    now(),
    now(),
    '{"provider": "email", "providers": ["email"]}',
    '{"first_name": "Debug", "last_name": "User"}',
    now(),
    now(),
    '',
    '',
    '',
    ''
  );
  
  RAISE NOTICE 'User Created Successfully (Triggers Passed)';
  
  -- If we get here, triggers are fine.
  -- We roll back anyway to not clutter DB.
  RAISE EXCEPTION 'TEST_SUCCESS_ROLLBACK';

EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE '❌ ERROR DETECTED: %', SQLERRM;
  RAISE; -- Re-raise to see full details in UI
END;
$$;

ROLLBACK;
