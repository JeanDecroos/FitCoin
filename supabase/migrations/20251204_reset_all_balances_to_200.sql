-- Reset all user balances to 200 coins
BEGIN;

UPDATE public.users
SET balance = 200
WHERE balance != 200 OR balance IS NULL;

COMMIT;
