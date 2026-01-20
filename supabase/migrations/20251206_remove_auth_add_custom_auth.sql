-- Remove Supabase auth and add custom authentication fields
BEGIN;

-- Add email column (make it nullable first, then we'll update existing users)
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS email text;

-- Add password_hash column (nullable for existing users)
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS password_hash text;

-- Add reset_token columns for password reset functionality
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS reset_token text;
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS reset_token_expires timestamptz;

-- Remove auth_user_id column and related constraints/indexes
-- First drop the unique index
DROP INDEX IF EXISTS public.idx_users_auth_user_id_unique;
DROP INDEX IF EXISTS public.idx_users_auth_user_id;

-- Remove the foreign key constraint (if it exists)
-- Note: We can't directly drop a foreign key constraint by name in a simple way,
-- so we'll handle the column removal which will cascade
ALTER TABLE public.users
DROP COLUMN IF EXISTS auth_user_id;

-- Now make email required and unique (after removing auth_user_id)
-- First, ensure all existing users have a placeholder email if needed
-- For existing users without email, we'll set a temporary value
-- In practice, existing users will need to set their email on first login
UPDATE public.users
SET email = 'temp_' || id::text || '@temp.com'
WHERE email IS NULL;

-- Add NOT NULL constraint and unique constraint
ALTER TABLE public.users
ALTER COLUMN email SET NOT NULL;

-- Add unique constraint on email
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_unique ON public.users(email);

-- Add index on reset_token for password reset lookups
CREATE INDEX IF NOT EXISTS idx_users_reset_token ON public.users(reset_token) WHERE reset_token IS NOT NULL;

COMMIT;
