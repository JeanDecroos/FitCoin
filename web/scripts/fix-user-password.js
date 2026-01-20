/**
 * Script to fix user password hash for accounts created directly in Supabase
 * Usage: node scripts/fix-user-password.js <email> <password>
 */

const bcrypt = require('bcryptjs');
const { createClient } = require('@supabase/supabase-js');

// Load environment variables from .env.local if it exists
try {
  require('dotenv').config({ path: '.env.local' });
} catch (e) {
  // dotenv not available, use process.env directly
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY)');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixUserPassword(email, password) {
  try {
    console.log(`Looking up user with email: ${email}`);
    
    // Find user by email (case-insensitive)
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .ilike('email', email)
      .maybeSingle();

    if (fetchError) {
      console.error('Error fetching user:', fetchError);
      return;
    }

    if (!user) {
      console.log(`User not found with email: ${email}`);
      console.log('Creating new user...');
      
      // Create new user
      const passwordHash = await bcrypt.hash(password, 10);
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          name: email.split('@')[0], // Use email prefix as name
          email: email.toLowerCase().trim(),
          password_hash: passwordHash,
          balance: 200,
          is_admin: false,
          goals_set: false,
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating user:', createError);
        return;
      }

      console.log('✅ User created successfully!');
      console.log('User ID:', newUser.id);
      console.log('Email:', newUser.email);
      return;
    }

    console.log(`Found user: ${user.name} (${user.email})`);
    
    // Hash the password
    const passwordHash = await bcrypt.hash(password, 10);
    
    // Update user with new email and password hash
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({
        email: email.toLowerCase().trim(),
        password_hash: passwordHash,
      })
      .eq('id', user.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating user:', updateError);
      return;
    }

    console.log('✅ User updated successfully!');
    console.log('User ID:', updatedUser.id);
    console.log('Email:', updatedUser.email);
    console.log('Password hash set:', updatedUser.password_hash ? 'Yes' : 'No');
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Get command line arguments
const email = process.argv[2];
const password = process.argv[3];

if (!email || !password) {
  console.error('Usage: node scripts/fix-user-password.js <email> <password>');
  console.error('Example: node scripts/fix-user-password.js bart-jan@deardigital.com test123');
  process.exit(1);
}

fixUserPassword(email, password)
  .then(() => {
    console.log('\n✅ Done! You can now log in with your credentials.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });
