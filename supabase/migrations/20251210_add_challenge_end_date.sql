-- Add challenge end date to system_settings
-- Run via Supabase migration tooling
BEGIN;

-- Add a timestamp_value column to system_settings for storing timestamps
-- We'll use this for challenge_end_date
ALTER TABLE public.system_settings 
ADD COLUMN IF NOT EXISTS timestamp_value timestamptz;

-- Create an index for timestamp lookups
CREATE INDEX IF NOT EXISTS idx_system_settings_timestamp_value 
ON public.system_settings (timestamp_value) 
WHERE timestamp_value IS NOT NULL;

COMMIT;
