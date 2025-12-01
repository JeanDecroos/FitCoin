-- Seed script for initial FitCoin participants
BEGIN;

WITH seed_data (name) AS (
  VALUES
    ('Anjana T''Jampens'),
    ('Bart-Jan Decroos'),
    ('Christ-Offert Nsana Matundu'),
    ('Emmanuel Partsafas'),
    ('Jana Surmont'),
    ('John-Morgan Galeyn'),
    ('Joris Desplenter'),
    ('Julien Verheughe'),
    ('Kurt Rochtus'),
    ('Lara Deraes'),
    ('Loes Grimonprez'),
    ('Louise Heirman'),
    ('Michiel Verbeke'),
    ('Sam Volckaert'),
    ('Samuel Rieder'),
    ('Stef Melotte'),
    ('Stijn Dejonghe'),
    ('Thomas De Waelle'),
    ('Yenthe Van Ginneken'),
    ('Ziggy Moens')
)
INSERT INTO public.users (name, balance, is_admin, goals_set)
SELECT name, 5000, false, false
FROM seed_data
ON CONFLICT (name) DO NOTHING;

COMMIT;

