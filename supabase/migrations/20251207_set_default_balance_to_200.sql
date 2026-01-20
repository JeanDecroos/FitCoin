-- Set default balance to 200 for all new users
BEGIN;

-- Update users table default balance from 0 to 200
ALTER TABLE public.users ALTER COLUMN balance SET DEFAULT 200;

COMMIT;
