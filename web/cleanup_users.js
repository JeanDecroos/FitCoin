import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fpfgkbdtzxehfrfshyuj.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZwZmdrYmR0enhlaGZyZnNoeXVqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1OTgxODMsImV4cCI6MjA4MDE3NDE4M30.kL8gqQlGJMLqzIm8apcTI1IcaVJTERWPiHDk35VuLFw';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Users to keep
const usersToKeep = [
  'Yenthe Van Ginneken',
  'Stijn Dejonghe',
  'Suchit Borge',
  'Samuel Rieder',
  'Stef Melotte',
  'Bart-Jan Decroos',
  'Emmanuel Partsafas',
  'Sam Volckaert',
  'Ziggy Moens',
  'Thomas De Waelle',
  'Joris Desplenter'
];

async function cleanupUsers() {
  try {
    console.log('Fetching all users from database...');
    
    // Fetch all users
    const { data: users, error: fetchError } = await supabase
      .from('users')
      .select('id, name')
      .order('name');

    if (fetchError) {
      console.error('Error fetching users:', fetchError);
      process.exit(1);
    }

    console.log(`\nFound ${users.length} users in database:`);
    users.forEach(u => console.log(`  - ${u.name} (${u.id})`));

    // Find users to delete
    const usersToDelete = users.filter(u => !usersToKeep.includes(u.name));

    if (usersToDelete.length === 0) {
      console.log('\n✅ All users are in the keep list. No users to delete.');
      return;
    }

    console.log(`\n⚠️  Found ${usersToDelete.length} users to delete:`);
    usersToDelete.forEach(u => console.log(`  - ${u.name} (${u.id})`));

    // Delete users (this will cascade to related tables due to foreign keys)
    console.log('\nDeleting users...');
    for (const user of usersToDelete) {
      const { error: deleteError } = await supabase
        .from('users')
        .delete()
        .eq('id', user.id);

      if (deleteError) {
        console.error(`❌ Error deleting ${user.name}:`, deleteError);
      } else {
        console.log(`✅ Deleted: ${user.name}`);
      }
    }

    console.log('\n✅ Cleanup complete!');
    
    // Show remaining users
    const { data: remainingUsers } = await supabase
      .from('users')
      .select('id, name')
      .order('name');
    
    console.log(`\nRemaining users (${remainingUsers.length}):`);
    remainingUsers.forEach(u => console.log(`  - ${u.name}`));

  } catch (error) {
    console.error('Unexpected error:', error);
    process.exit(1);
  }
}

cleanupUsers();
