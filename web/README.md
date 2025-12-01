# FitCoin Challenge

Internal betting app for a group of colleagues participating in a physique and fitness challenge.

## Environment Variables

This application requires the following environment variables to be set:

- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous key

### For Netlify Deployment

1. Go to your Netlify site dashboard
2. Navigate to **Site settings** → **Environment variables**
3. Add the following variables with your Supabase credentials:
   - `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous key
4. Redeploy your site

**Note:** These are public environment variables (prefixed with `NEXT_PUBLIC_`) and will be bundled into the client-side code. This is expected and safe for Supabase anonymous keys.

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
