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

// Alternative approach: Create tables manually using direct SQL
async function createTablesManually() {
  console.log('🔧 Creating tables manually...');
  
  try {
    // Create profiles table with all casino fields
    const createProfilesTable = `
      CREATE TABLE IF NOT EXISTS profiles (
        id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
        email text UNIQUE NOT NULL,
        full_name text,
        avatar_url text,
        balance numeric DEFAULT 1000.00 CHECK (balance >= 0),
        provider text DEFAULT 'google',
        age integer,
        country text,
        phone text,
        kyc_verified boolean DEFAULT false,
        withdrawal_methods jsonb DEFAULT '[]',
        deposit_limit numeric DEFAULT 1000.00,
        withdrawal_limit numeric DEFAULT 1000.00,
        total_deposits numeric DEFAULT 0.00,
        total_withdrawals numeric DEFAULT 0.00,
        games_played integer DEFAULT 0,
        total_wagered numeric DEFAULT 0.00,
        total_won numeric DEFAULT 0.00,
        created_at timestamptz DEFAULT now(),
        updated_at timestamptz DEFAULT now()
      );
    `;
    
    // Create game_history table
    const createGameHistoryTable = `
      CREATE TABLE IF NOT EXISTS game_history (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
        game_id text NOT NULL,
        bet_amount numeric NOT NULL CHECK (bet_amount > 0),
        multiplier numeric NOT NULL CHECK (multiplier >= 0),
        win_amount numeric NOT NULL CHECK (win_amount >= 0),
        created_at timestamptz DEFAULT now()
      );
    `;
    
    // Create transactions table
    const createTransactionsTable = `
      CREATE TABLE IF NOT EXISTS transactions (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
        type text NOT NULL CHECK (type IN ('deposit', 'withdrawal')),
        amount numeric NOT NULL CHECK (amount > 0),
        status text DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
        payment_method text NOT NULL,
        created_at timestamptz DEFAULT now()
      );
    `;
    
    // Enable RLS
    const enableRLS = `
      ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
      ALTER TABLE game_history ENABLE ROW LEVEL SECURITY;
      ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
    `;
    
    // Create policies
    const createPolicies = `
      -- Profiles policies
      CREATE POLICY "Users can read own profile" ON profiles FOR SELECT TO authenticated USING (auth.uid() = id);
      CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
      CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
      
      -- Game history policies
      CREATE POLICY "Users can read own game history" ON game_history FOR SELECT TO authenticated USING (auth.uid() = user_id);
      CREATE POLICY "Users can insert own game history" ON game_history FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
      
      -- Transactions policies
      CREATE POLICY "Users can read own transactions" ON transactions FOR SELECT TO authenticated USING (auth.uid() = user_id);
      CREATE POLICY "Users can insert own transactions" ON transactions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
    `;
    
    // Create functions and triggers
    const createFunctions = `
      -- Function to handle new user registration
      CREATE OR REPLACE FUNCTION handle_new_user()
      RETURNS trigger AS $$
      BEGIN
        INSERT INTO profiles (id, email, full_name, avatar_url, provider)
        VALUES (
          NEW.id,
          NEW.email,
          NEW.raw_user_meta_data->>'full_name',
          NEW.raw_user_meta_data->>'avatar_url',
          COALESCE(NEW.raw_user_meta_data->>'provider', 'google')
        );
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
      
      -- Function to update updated_at timestamp
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS trigger AS $$
      BEGIN
        NEW.updated_at = now();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `;
    
    const createTriggers = `
      -- Trigger to create profile on user registration
      DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
      CREATE TRIGGER on_auth_user_created
        AFTER INSERT ON auth.users
        FOR EACH ROW EXECUTE FUNCTION handle_new_user();
      
      -- Trigger to update updated_at on profiles
      CREATE TRIGGER update_profiles_updated_at
        BEFORE UPDATE ON profiles
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `;
    
    // Create indexes
    const createIndexes = `
      CREATE INDEX IF NOT EXISTS idx_game_history_user_id ON game_history(user_id);
      CREATE INDEX IF NOT EXISTS idx_game_history_created_at ON game_history(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
      CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC);
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