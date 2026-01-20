-- Remove all accounts from the database
BEGIN;

-- Delete all wagers first (due to RESTRICT constraints on user references)
DELETE FROM public.wagers;

-- Delete all challenges (will be cascaded by user deletion, but being explicit)
DELETE FROM public.challenges;

-- Delete all users from public.users table
DELETE FROM public.users;

-- Optionally delete all auth users (Supabase auth.users)
-- Note: This requires admin privileges and may affect other systems
DELETE FROM auth.users;

COMMIT;
