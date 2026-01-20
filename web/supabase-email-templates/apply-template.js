#!/usr/bin/env node

/**
 * Script to apply FitCoin email templates to Supabase
 * 
 * Usage:
 *   node apply-template.js
 * 
 * Requires environment variables:
 *   - SUPABASE_ACCESS_TOKEN (get from https://supabase.com/dashboard/account/tokens)
 *   - SUPABASE_PROJECT_REF (your project reference ID)
 */

const fs = require('fs');
const path = require('path');

const SUPABASE_ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN;
const SUPABASE_PROJECT_REF = process.env.SUPABASE_PROJECT_REF;

if (!SUPABASE_ACCESS_TOKEN || !SUPABASE_PROJECT_REF) {
  console.error('❌ Missing required environment variables:');
  console.error('   SUPABASE_ACCESS_TOKEN - Get from https://supabase.com/dashboard/account/tokens');
  console.error('   SUPABASE_PROJECT_REF - Your Supabase project reference ID');
  console.error('\nExample:');
  console.error('   SUPABASE_ACCESS_TOKEN=your_token SUPABASE_PROJECT_REF=your_ref node apply-template.js');
  process.exit(1);
}

async function applyTemplate() {
  try {
    // Read the confirmation template
    const templatePath = path.join(__dirname, 'confirmation.html');
    const templateContent = fs.readFileSync(templatePath, 'utf8');

    // Escape the template content for JSON
    const escapedContent = JSON.stringify(templateContent);

    // Prepare the request body
    const requestBody = {
      mailer_subjects_confirmation: 'Confirm Your FitCoin Account',
      mailer_templates_confirmation_content: templateContent,
    };

    console.log('📧 Applying FitCoin email template...');
    console.log(`   Project: ${SUPABASE_PROJECT_REF}`);

    // Make the API request
    const response = await fetch(
      `https://api.supabase.com/v1/projects/${SUPABASE_PROJECT_REF}/config/auth`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API request failed: ${response.status} ${response.statusText}\n${errorText}`);
    }

    const result = await response.json();
    console.log('✅ Email template applied successfully!');
    console.log('\nNext steps:');
    console.log('   1. Test by signing up with a test email');
    console.log('   2. Check your email inbox to verify the template');
    console.log('   3. Make sure your redirect URL is set to: https://ddfitcoin.netlify.app/auth/confirm');

  } catch (error) {
    console.error('❌ Error applying template:', error.message);
    process.exit(1);
  }
}

// Check if fetch is available (Node 18+)
if (typeof fetch === 'undefined') {
  console.error('❌ This script requires Node.js 18+ (for native fetch support)');
  console.error('   Or install node-fetch: npm install node-fetch');
  process.exit(1);
}

applyTemplate();
