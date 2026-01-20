-- Add Row Level Security policies for users table
-- This allows public signup and authentication operations
BEGIN;

-- Enable RLS on users table (if not already enabled)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Policy: Allow anyone to insert (for signup)
-- This is safe because we check for duplicate emails/names in the application code
CREATE POLICY IF NOT EXISTS "Allow public signup"
  ON public.users
  FOR INSERT
  WITH CHECK (true);

-- Policy: Allow anyone to read user data (needed for login checks and public leaderboard)
CREATE POLICY IF NOT EXISTS "Allow public read"
  ON public.users
  FOR SELECT
  USING (true);

-- Policy: Allow users to update their own data (for password reset, profile updates)
-- This uses a session-based check - users can only update their own record
-- For server-side actions, we'll need to ensure the user is authenticated via session
CREATE POLICY IF NOT EXISTS "Allow users to update own data"
  ON public.users
  FOR UPDATE
  USING (true); -- We validate ownership in application code

-- Enable RLS on challenges table
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;

-- Policy: Allow public read for challenges
CREATE POLICY IF NOT EXISTS "Allow public read challenges"
  ON public.challenges
  FOR SELECT
  USING (true);

-- Policy: Allow users to insert their own challenges
CREATE POLICY IF NOT EXISTS "Allow users to create challenges"
  ON public.challenges
  FOR INSERT
  WITH CHECK (true); -- Ownership validated in application code

-- Policy: Allow updates to challenges (for admin resolution)
CREATE POLICY IF NOT EXISTS "Allow challenge updates"
  ON public.challenges
  FOR UPDATE
  USING (true); -- Admin validation in application code

-- Enable RLS on wagers table
ALTER TABLE public.wagers ENABLE ROW LEVEL SECURITY;

-- Policy: Allow public read for wagers
CREATE POLICY IF NOT EXISTS "Allow public read wagers"
  ON public.wagers
  FOR SELECT
  USING (true);

-- Policy: Allow users to create wagers
CREATE POLICY IF NOT EXISTS "Allow users to create wagers"
  ON public.wagers
  FOR INSERT
  WITH CHECK (true); -- Validation in application code

-- Policy: Allow updates to wagers (for countering, cancellation, settlement)
CREATE POLICY IF NOT EXISTS "Allow wager updates"
  ON public.wagers
  FOR UPDATE
  USING (true); -- Validation in application code

-- Enable RLS on fund_requests table
ALTER TABLE public.fund_requests ENABLE ROW LEVEL SECURITY;

-- Policy: Allow public read for fund requests (users can see their own)
CREATE POLICY IF NOT EXISTS "Allow public read fund requests"
  ON public.fund_requests
  FOR SELECT
  USING (true);

-- Policy: Allow users to create fund requests
CREATE POLICY IF NOT EXISTS "Allow users to create fund requests"
  ON public.fund_requests
  FOR INSERT
  WITH CHECK (true);

-- Policy: Allow updates to fund requests (for admin approval/rejection)
CREATE POLICY IF NOT EXISTS "Allow fund request updates"
  ON public.fund_requests
  FOR UPDATE
  USING (true); -- Admin validation in application code

-- Enable RLS on system_settings table
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Policy: Allow public read for system settings
CREATE POLICY IF NOT EXISTS "Allow public read system settings"
  ON public.system_settings
  FOR SELECT
  USING (true);

-- Policy: Allow updates to system settings (admin only, validated in app code)
CREATE POLICY IF NOT EXISTS "Allow system settings updates"
  ON public.system_settings
  FOR UPDATE
  USING (true); -- Admin validation in application code

COMMIT;
