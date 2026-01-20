# FitCoin Email Templates

This directory contains custom email templates for Supabase authentication emails.

## Template Files

- `confirmation.html` - Email verification template for new signups

## Preview the Template

Before applying, you can preview how the email will look:

1. Open `preview.html` in your web browser
2. This will show you exactly how the email will appear to users

## How to Apply Templates

### Option 1: Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **Authentication** → **Email Templates**
3. Find the **"Confirm signup"** template
4. Update the **Subject** to: `Confirm Your FitCoin Account`
5. Copy the contents of `confirmation.html` and paste it into the **Message** field
6. Click **Save**

### Option 2: Automated Script (Node.js)

Use the provided script to automatically apply the template:

```bash
# Set your Supabase credentials
export SUPABASE_ACCESS_TOKEN="your-access-token"  # Get from https://supabase.com/dashboard/account/tokens
export SUPABASE_PROJECT_REF="your-project-ref"   # Your project reference ID

# Run the script
node apply-template.js
```

**Note:** Requires Node.js 18+ (for native fetch support)

### Option 3: Management API (Manual)

You can also update the email template programmatically using the Supabase Management API:

```bash
# Get your access token from https://supabase.com/dashboard/account/tokens
export SUPABASE_ACCESS_TOKEN="your-access-token"
export PROJECT_REF="your-project-ref"

# Read the template file
TEMPLATE_CONTENT=$(cat supabase-email-templates/confirmation.html)

# Update the confirmation email template
curl -X PATCH "https://api.supabase.com/v1/projects/$PROJECT_REF/config/auth" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"mailer_subjects_confirmation\": \"Confirm Your FitCoin Account\",
    \"mailer_templates_confirmation_content\": $(echo "$TEMPLATE_CONTENT" | jq -Rs .)
  }"
```

## Template Variables

The template uses the following Supabase template variables:

- `{{ .ConfirmationURL }}` - The confirmation link that users click to verify their email
- `{{ .Email }}` - The user's email address (available but not used in this template)
- `{{ .SiteURL }}` - Your application's site URL (available but not used in this template)

## Customization

You can customize the template by editing `confirmation.html`. The template uses:
- FitCoin branding colors (yellow/orange gradient: #fbbf24 to #f97316)
- Dark theme matching the app's design
- Responsive design that works in all email clients
- Professional styling with proper spacing and typography

## Testing

After applying the template:
1. Sign up with a test email address
2. Check your email inbox
3. Verify the email looks correct and the confirmation link works

## Notes

- The template is designed to work in all major email clients (Gmail, Outlook, Apple Mail, etc.)
- The confirmation link expires after 24 hours (Supabase default)
- Make sure your Supabase redirect URL is configured to point to `/auth/confirm` in your app
