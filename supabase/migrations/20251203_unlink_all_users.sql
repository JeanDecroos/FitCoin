-- Unlink all users from auth accounts (for testing/development)
-- This sets auth_user_id to null for all users

BEGIN;

UPDATE public.users
SET auth_user_id = NULL
WHERE auth_user_id IS NOT NULL;

COMMIT;
