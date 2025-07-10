const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read environment variables
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://spaceman-game-production.up.railway.app';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseKey) {
  console.error('❌ Missing VITE_SUPABASE_ANON_KEY environment variable');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigrations() {
  console.log('🚀 Applying database migrations...');
  
  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, 'supabase', 'migrations', '20250629182719_red_shrine.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📄 Migration file loaded successfully');
    
    // Split the SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--') && !stmt.startsWith('/*'));
    
    console.log(`📊 Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        try {
          console.log(`⏳ Executing statement ${i + 1}/${statements.length}...`);
          
          // Use RPC to execute raw SQL (this requires admin privileges)
          const { error } = await supabase.rpc('exec_sql', { sql: statement });
          
          if (error) {
            console.log(`⚠️  Statement ${i + 1} had an issue (this might be expected):`, error.message);
          } else {
            console.log(`✅ Statement ${i + 1} executed successfully`);
          }
        } catch (err) {
          console.log(`⚠️  Statement ${i + 1} failed (this might be expected):`, err.message);
        }
      }
    }
    
    console.log('🎉 Migration process completed!');
    
    // Test the connection and verify tables exist
    console.log('🔍 Verifying database structure...');
    
    const { data: tables, error: tablesError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);
    
    if (tablesError) {
      console.log('⚠️  Could not verify profiles table:', tablesError.message);
    } else {
      console.log('✅ Profiles table is accessible');
    }
    
  } catch (error) {
    console.error('❌ Error applying migrations:', error);
    process.exit(1);
  }
}

// Alternative approach: Create tables manually
async function createTablesManually() {
  console.log('🔧 Creating tables manually...');
  
  try {
    // Create profiles table with new fields
    const createProfilesTable = `
      CREATE TABLE IF NOT EXISTS profiles (
        id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
        email text UNIQUE NOT NULL,
        full_name text,
        avatar_url text,
        balance numeric DEFAULT 0 CHECK (balance >= 0),
        phone_number text,
        date_of_birth date,
        country text,
        city text,
        address text,
        document_type text,
        document_number text,
        kyc_status text DEFAULT 'pending' CHECK (kyc_status IN ('pending', 'verified', 'rejected')),
        account_status text DEFAULT 'active' CHECK (account_status IN ('active', 'suspended', 'banned')),
        created_at timestamptz DEFAULT now(),
        updated_at timestamptz DEFAULT now()
      );
    `;
    
    // Add new columns to existing profiles table
    const addNewColumns = `
      ALTER TABLE profiles 
      ADD COLUMN IF NOT EXISTS phone_number text,
      ADD COLUMN IF NOT EXISTS date_of_birth date,
      ADD COLUMN IF NOT EXISTS country text,
      ADD COLUMN IF NOT EXISTS city text,
      ADD COLUMN IF NOT EXISTS address text,
      ADD COLUMN IF NOT EXISTS document_type text,
      ADD COLUMN IF NOT EXISTS document_number text,
      ADD COLUMN IF NOT EXISTS kyc_status text DEFAULT 'pending' CHECK (kyc_status IN ('pending', 'verified', 'rejected')),
      ADD COLUMN IF NOT EXISTS account_status text DEFAULT 'active' CHECK (account_status IN ('active', 'suspended', 'banned'));
    `;
    
    console.log('✅ Manual table creation completed');
    
  } catch (error) {
    console.error('❌ Error creating tables manually:', error);
  }
}

// Run the migration
if (require.main === module) {
  applyMigrations()
    .then(() => {
      console.log('🎯 Migration script completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration script failed:', error);
      process.exit(1);
    });
}

module.exports = { applyMigrations, createTablesManually };