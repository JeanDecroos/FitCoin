-- Restore Supabase Auth integration
-- This migration adds back auth_user_id and prepares for Supabase Auth
BEGIN;

-- Add auth_user_id column back
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS auth_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Add unique constraint to prevent multiple users linking to same auth account
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_auth_user_id_unique ON public.users(auth_user_id) WHERE auth_user_id IS NOT NULL;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_users_auth_user_id ON public.users(auth_user_id);

-- Note: We keep email column in public.users for compatibility
-- but it should match the email in auth.users
-- We will NOT remove password_hash yet to allow gradual migration
-- Password resets should be handled through Supabase Auth going forward

COMMIT;
