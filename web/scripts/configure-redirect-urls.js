#!/usr/bin/env node

/**
 * Script to configure Supabase redirect URLs via Management API
 * 
 * This script configures:
 * - Site URL
 * - Redirect URLs whitelist
 * 
 * Usage:
 *   node configure-redirect-urls.js
 * 
 * Requires environment variables:
 *   - SUPABASE_ACCESS_TOKEN (get from https://supabase.com/dashboard/account/tokens)
 *   - SUPABASE_PROJECT_REF (your project reference ID)
 */

const SUPABASE_ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN;
const SUPABASE_PROJECT_REF = process.env.SUPABASE_PROJECT_REF;

if (!SUPABASE_ACCESS_TOKEN || !SUPABASE_PROJECT_REF) {
  console.error('❌ Missing required environment variables:');
  console.error('   SUPABASE_ACCESS_TOKEN - Get from https://supabase.com/dashboard/account/tokens');
  console.error('   SUPABASE_PROJECT_REF - Your Supabase project reference ID');
  console.error('\nExample:');
  console.error('   SUPABASE_ACCESS_TOKEN=your_token SUPABASE_PROJECT_REF=your_ref node configure-redirect-urls.js');
  process.exit(1);
}

// Configuration - modify these URLs as needed
const SITE_URL = 'https://ddfitcoin.netlify.app';
const REDIRECT_URLS = [
  'https://ddfitcoin.netlify.app/auth/confirm',
  'https://ddfitcoin.netlify.app/**',
  'http://localhost:3000/auth/confirm',
  'http://localhost:3000/**',
];

async function configureRedirectUrls() {
  try {
    console.log('🔧 Configuring Supabase redirect URLs...');
    console.log(`   Project: ${SUPABASE_PROJECT_REF}`);
    console.log(`   Site URL: ${SITE_URL}`);
    console.log(`   Redirect URLs: ${REDIRECT_URLS.length} URLs`);

    // First, get current configuration to see what's already set
    const getResponse = await fetch(
      `https://api.supabase.com/v1/projects/${SUPABASE_PROJECT_REF}/config/auth`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!getResponse.ok) {
      const errorText = await getResponse.text();
      throw new Error(`Failed to get current config: ${getResponse.status} ${getResponse.statusText}\n${errorText}`);
    }

    const currentConfig = await getResponse.json();
    console.log('\n📋 Current configuration:');
    console.log(`   Site URL: ${currentConfig.SITE_URL || 'Not set'}`);
    console.log(`   Redirect URLs: ${currentConfig.URI_ALLOW_LIST?.length || 0} URLs`);

    // Prepare the update payload
    // Note: The exact field names may vary - check Supabase Management API docs
    const updatePayload = {
      SITE_URL: SITE_URL,
      URI_ALLOW_LIST: REDIRECT_URLS,
    };

    console.log('\n🔄 Updating configuration...');

    // Update the configuration
    const updateResponse = await fetch(
      `https://api.supabase.com/v1/projects/${SUPABASE_PROJECT_REF}/config/auth`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatePayload),
      }
    );

    if (!updateResponse.ok) {
      const errorText = await updateResponse.text();
      console.error('\n❌ Error response:', errorText);
      throw new Error(`API request failed: ${updateResponse.status} ${updateResponse.statusText}`);
    }

    const result = await updateResponse.json();
    console.log('✅ Redirect URLs configured successfully!');
    console.log('\n📝 Configuration summary:');
    console.log(`   Site URL: ${SITE_URL}`);
    console.log(`   Redirect URLs configured:`);
    REDIRECT_URLS.forEach((url, index) => {
      console.log(`     ${index + 1}. ${url}`);
    });
    console.log('\n✨ Next steps:');
    console.log('   1. Test by signing up with a test email');
    console.log('   2. Check the verification email - the redirect_to should now point to the correct URL');
    console.log('   3. Verify the link works correctly');

  } catch (error) {
    console.error('\n❌ Error configuring redirect URLs:', error.message);
    console.error('\n💡 Troubleshooting:');
    console.error('   - Verify your SUPABASE_ACCESS_TOKEN is valid');
    console.error('   - Check that SUPABASE_PROJECT_REF matches your project');
    console.error('   - Ensure you have admin access to the project');
    console.error('   - Check Supabase Management API documentation for field name changes');
    process.exit(1);
  }
}

// Check if fetch is available (Node 18+)
if (typeof fetch === 'undefined') {
  console.error('❌ This script requires Node.js 18+ (for native fetch support)');
  console.error('   Or install node-fetch: npm install node-fetch');
  process.exit(1);
}

configureRedirectUrls();
