# FitCoin Challenge

Internal betting app for a group of colleagues participating in a physique and fitness challenge.

## Environment Variables

This application requires the following environment variables to be set:

### Required Variables

- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous key

### Optional Variables

- `NEXT_PUBLIC_SITE_URL` - Your application's base URL (defaults to `https://ddfitcoin.netlify.app`)
  - **Production:** Leave unset or set to `https://ddfitcoin.netlify.app`
  - **Local Development:** Set to `http://localhost:3000` in `.env.local`

### For Netlify Deployment

1. Go to your Netlify site dashboard
2. Navigate to **Site settings** → **Environment variables**
3. Add the following variables with your Supabase credentials:
   - `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous key
   - `NEXT_PUBLIC_SITE_URL` - (Optional) Set to `https://ddfitcoin.netlify.app` if you want to override the default
4. Redeploy your site

**Note:** These are public environment variables (prefixed with `NEXT_PUBLIC_`) and will be bundled into the client-side code. This is expected and safe for Supabase anonymous keys.

## Local Development

1. Copy `.env.example` to `.env.local` (or create `.env.local` manually)
2. Fill in your Supabase credentials:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   ```
3. Run `npm install`
4. Run `npm run dev`

**Important:** For email verification to work correctly in local development, you must:
- Set `NEXT_PUBLIC_SITE_URL=http://localhost:3000` in `.env.local`
- Configure Supabase Redirect URLs (see [SUPABASE_SETUP.md](./SUPABASE_SETUP.md))

### Quick Setup Script

You can automatically configure Supabase redirect URLs using the provided script:

```bash
export SUPABASE_ACCESS_TOKEN="your-access-token"
export SUPABASE_PROJECT_REF="your-project-ref"
node scripts/configure-redirect-urls.js
```

This will configure both production and localhost redirect URLs automatically.

## Tech Stack

- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS
- Supabase (PostgreSQL)
- Lucide React (Icons)
