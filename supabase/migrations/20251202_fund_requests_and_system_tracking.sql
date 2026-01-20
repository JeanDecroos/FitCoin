-- Fund requests and system tracking migration
-- Run via Supabase migration tooling
BEGIN;

-- Enums ---------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'fund_request_status') THEN
    CREATE TYPE public.fund_request_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
  END IF;
END $$;

-- Update users table default balance from 5000 to 0
ALTER TABLE public.users ALTER COLUMN balance SET DEFAULT 0;

-- Create system_settings table for tracking total euros
CREATE TABLE IF NOT EXISTS public.system_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  value numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

-- Initialize total_euros_in_system if it doesn't exist
INSERT INTO public.system_settings (key, value)
VALUES ('total_euros_in_system', 0)
ON CONFLICT (key) DO NOTHING;

-- Create fund_requests table
CREATE TABLE IF NOT EXISTS public.fund_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  euro_amount numeric NOT NULL CHECK (euro_amount > 0),
  fitcoin_amount integer NOT NULL CHECK (fitcoin_amount > 0),
  status public.fund_request_status NOT NULL DEFAULT 'PENDING',
  admin_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

-- Indexes for fund_requests
CREATE INDEX IF NOT EXISTS idx_fund_requests_user_id ON public.fund_requests (user_id);
CREATE INDEX IF NOT EXISTS idx_fund_requests_status ON public.fund_requests (status);
CREATE INDEX IF NOT EXISTS idx_fund_requests_admin_id ON public.fund_requests (admin_id);

COMMIT;
