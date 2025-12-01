-- FitCoin Challenge initial schema
-- Run via Supabase migration tooling
BEGIN;

-- Enums ---------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'challenge_status') THEN
    CREATE TYPE public.challenge_status AS ENUM ('PENDING', 'PASSED', 'FAILED');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'wager_prediction') THEN
    CREATE TYPE public.wager_prediction AS ENUM ('PASS', 'FAIL');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'challenge_type') THEN
    CREATE TYPE public.challenge_type AS ENUM ('DEXA', 'FUNCTIONAL');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'wager_status') THEN
    CREATE TYPE public.wager_status AS ENUM ('OPEN', 'MATCHED', 'SETTLED', 'CANCELLED');
  END IF;
END $$;

-- Tables --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  avatar_url text,
  balance integer NOT NULL DEFAULT 5000 CHECK (balance >= 0),
  is_admin boolean NOT NULL DEFAULT false,
  goals_set boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT users_name_unique UNIQUE (name)
);

CREATE TABLE IF NOT EXISTS public.challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  dexa_goal text NOT NULL,
  functional_goal text NOT NULL,
  dexa_status public.challenge_status NOT NULL DEFAULT 'PENDING',
  functional_status public.challenge_status NOT NULL DEFAULT 'PENDING',
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT challenges_user_unique UNIQUE (user_id)
);

CREATE TABLE IF NOT EXISTS public.wagers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  target_user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  counter_id uuid REFERENCES public.users(id) ON DELETE RESTRICT,
  amount integer NOT NULL CHECK (amount > 0),
  prediction public.wager_prediction NOT NULL,
  challenge_type public.challenge_type NOT NULL,
  status public.wager_status NOT NULL DEFAULT 'OPEN',
  winner_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

-- Helpful indexes -----------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_challenges_user_id ON public.challenges (user_id);
CREATE INDEX IF NOT EXISTS idx_wagers_creator_id ON public.wagers (creator_id);
CREATE INDEX IF NOT EXISTS idx_wagers_target_user_id ON public.wagers (target_user_id);
CREATE INDEX IF NOT EXISTS idx_wagers_counter_id ON public.wagers (counter_id);
CREATE INDEX IF NOT EXISTS idx_wagers_status ON public.wagers (status);
CREATE INDEX IF NOT EXISTS idx_wagers_challenge_combo ON public.wagers (target_user_id, challenge_type);

COMMIT;

