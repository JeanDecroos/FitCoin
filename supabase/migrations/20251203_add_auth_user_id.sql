-- Add auth_user_id column to users table to link Supabase auth users
BEGIN;

-- Add auth_user_id column
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS auth_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Add unique constraint to prevent multiple users linking to same auth account
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_auth_user_id_unique ON public.users(auth_user_id) WHERE auth_user_id IS NOT NULL;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_users_auth_user_id ON public.users(auth_user_id);

COMMIT;
