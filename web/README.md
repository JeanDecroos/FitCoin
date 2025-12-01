# FitCoin Challenge

Internal betting app for a group of colleagues participating in a physique and fitness challenge.

## Environment Variables

This application requires the following environment variables to be set:

- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous key

### For Netlify Deployment

1. Go to your Netlify site dashboard
2. Navigate to **Site settings** → **Environment variables**
3. Add the following variables:
   - `NEXT_PUBLIC_SUPABASE_URL` = `https://fpfgkbdtzxehfrfshyuj.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZwZmdrYmR0enhlaGZyZnNoeXVqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1OTgxODMsImV4cCI6MjA4MDE3NDE4M30.kL8gqQlGJMLqzIm8apcTI1IcaVJTERWPiHDk35VuLFw`
4. Redeploy your site

## Local Development

1. Copy `.env.example` to `.env.local`
2. Fill in your Supabase credentials
3. Run `npm install`
4. Run `npm run dev`

## Tech Stack

- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS
- Supabase (PostgreSQL)
- Lucide React (Icons)
