# Supabase Configuration Guide

This guide explains how to configure Supabase for email verification redirects in the FitCoin application.

## Problem

When users sign up, the verification email contains `redirect_to=http://localhost:3000` instead of the production URL. This happens because Supabase uses its own URL configuration settings that need to be properly configured in the dashboard.

## Required Supabase Dashboard Configuration

You can configure redirect URLs in two ways:

### Option 1: Automated Script (Recommended)

Use the provided script to automatically configure redirect URLs via the Supabase Management API:

```bash
# Set your Supabase credentials
export SUPABASE_ACCESS_TOKEN="your-access-token"  # Get from https://supabase.com/dashboard/account/tokens
export SUPABASE_PROJECT_REF="your-project-ref"     # Your project reference ID

# Run the script
node scripts/configure-redirect-urls.js
```

**Note:** Requires Node.js 18+ (for native fetch support)

The script will:
- Set Site URL to `https://ddfitcoin.netlify.app`
- Configure redirect URLs whitelist with production and localhost URLs
- Show current configuration before updating

### Option 2: Manual Dashboard Configuration

If you prefer to configure manually:

#### Step 1: Access URL Configuration

1. Go to your Supabase project dashboard
2. Navigate to **Authentication** → **URL Configuration**
3. You'll see two key settings: **Site URL** and **Redirect URLs**

#### Step 2: Configure Site URL

Set the **Site URL** to your production domain:
```
https://ddfitcoin.netlify.app
```

This is the default redirect URL when no specific redirect is provided.

#### Step 3: Configure Redirect URLs (Whitelist)

Add the following URLs to the **Redirect URLs** list. These are the allowed destinations for email verification redirects:

**Production URLs:**
- `https://ddfitcoin.netlify.app/auth/confirm`
- `https://ddfitcoin.netlify.app/**` (wildcard for all paths on production)

**Local Development URLs:**
- `http://localhost:3000/auth/confirm`
- `http://localhost:3000/**` (wildcard for all paths on localhost)

**Important:** Supabase will only redirect to URLs that are in this whitelist. If a URL isn't whitelisted, Supabase will fall back to the Site URL.

## How It Works

### Email Verification Flow

1. **User signs up** → The `signUpAction` in `web/src/app/actions.ts` sets `emailRedirectTo: ${baseUrl}/auth/confirm`
2. **Supabase sends verification email** → Uses `{{ .ConfirmationURL }}` template variable which includes the `redirect_to` parameter
3. **User clicks verification link** → Supabase verifies the token and redirects to the `redirect_to` URL
4. **Your app receives redirect** → `web/src/app/auth/confirm/page.tsx` handles the verification and creates a session

### Environment-Specific Behavior

The application automatically uses the correct URL based on the environment:

- **Production:** Uses `https://ddfitcoin.netlify.app/auth/confirm`
- **Local Development:** Uses `http://localhost:3000/auth/confirm` (when `NEXT_PUBLIC_SITE_URL` is set)

The code in `web/src/app/actions.ts` handles this:
```typescript
const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://ddfitcoin.netlify.app';
const redirectTo = `${baseUrl}/auth/confirm`;
```

## Local Development Setup

For local development, create a `.env.local` file in the `web` directory:

```bash
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

This ensures that when testing locally, the verification emails will redirect to `localhost:3000` instead of production.

## Verification Steps

After configuring Supabase:

1. **Sign up with a test email** address
2. **Check the verification email** in your inbox
3. **Verify the `redirect_to` parameter** in the email link points to the correct URL:
   - Production: `redirect_to=https://ddfitcoin.netlify.app/auth/confirm`
   - Local: `redirect_to=http://localhost:3000/auth/confirm`
4. **Click the verification link** and confirm it redirects to `/auth/confirm` on the correct domain
5. **Verify the user is authenticated** and redirected to the dashboard

## Troubleshooting

### Issue: Still seeing `redirect_to=http://localhost:3000` in production emails

**Solution:**
- Verify the **Site URL** in Supabase dashboard is set to `https://ddfitcoin.netlify.app`
- Ensure `https://ddfitcoin.netlify.app/auth/confirm` is in the **Redirect URLs** whitelist
- Check that `NEXT_PUBLIC_SITE_URL` is not set in your production environment (Netlify)

### Issue: Redirect URL not allowed error

**Solution:**
- Add the exact URL to the **Redirect URLs** whitelist in Supabase dashboard
- Use wildcards (`**`) if you need to allow all paths on a domain
- Ensure the URL matches exactly (including `http://` vs `https://`)

### Issue: Verification link doesn't work

**Solution:**
- Check that `/auth/confirm` page exists and is accessible
- Verify the Supabase redirect URLs include the correct domain and path
- Check browser console for any errors during verification

## Security Notes

- The **Site URL** and **Redirect URLs** are security settings that prevent open redirect vulnerabilities
- Only whitelist URLs you trust and control
- Both production and localhost URLs should be in the whitelist for development flexibility
- The `emailRedirectTo` parameter in code is only respected if the URL is in the allowed list

## Related Files

- `web/src/app/actions.ts` - Signup action with redirect URL configuration
- `web/src/app/auth/confirm/page.tsx` - Email verification handler
- `web/supabase-email-templates/confirmation.html` - Email template
