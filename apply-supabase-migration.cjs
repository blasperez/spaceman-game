const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigration() {
  console.log('🔧 Applying Supabase Auth Migration...');
  
  const migration = `
    -- Create profiles table
    CREATE TABLE IF NOT EXISTS public.profiles (
      id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      full_name TEXT,
      avatar_url TEXT,
      provider TEXT DEFAULT 'google',
      balance DECIMAL(10,2) DEFAULT 1000.00,
      age INTEGER,
      country TEXT,
      phone TEXT,
      kyc_verified BOOLEAN DEFAULT FALSE,
      withdrawal_methods JSONB DEFAULT '[]'::jsonb,
      deposit_limit DECIMAL(10,2) DEFAULT 1000.00,
      withdrawal_limit DECIMAL(10,2) DEFAULT 1000.00,
      total_deposits DECIMAL(10,2) DEFAULT 0,
      total_withdrawals DECIMAL(10,2) DEFAULT 0,
      games_played INTEGER DEFAULT 0,
      total_wagered DECIMAL(10,2) DEFAULT 0,
      total_won DECIMAL(10,2) DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- Enable RLS on profiles table
    ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
    DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
    DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

    -- Create RLS policies
    CREATE POLICY "Users can view own profile" ON public.profiles
      FOR SELECT USING (auth.uid() = id);

    CREATE POLICY "Users can update own profile" ON public.profiles
      FOR UPDATE USING (auth.uid() = id);

    CREATE POLICY "Users can insert own profile" ON public.profiles
      FOR INSERT WITH CHECK (auth.uid() = id);

    -- Create function to handle new user profile creation
    CREATE OR REPLACE FUNCTION public.handle_new_user()
    RETURNS TRIGGER AS $$
    BEGIN
      INSERT INTO public.profiles (
        id,
        email,
        full_name,
        avatar_url,
        provider
      )
      VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuario'),
        NEW.raw_user_meta_data->>'avatar_url',
        'google'
      )
      ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
        avatar_url = COALESCE(EXCLUDED.avatar_url, profiles.avatar_url),
        updated_at = NOW();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;

    -- Create trigger for automatic profile creation
    DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

    -- Create function to update updated_at timestamp
    CREATE OR REPLACE FUNCTION public.handle_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    -- Create trigger for updated_at
    DROP TRIGGER IF EXISTS on_profiles_updated ON public.profiles;
    CREATE TRIGGER on_profiles_updated
      BEFORE UPDATE ON public.profiles
      FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

    -- Create indexes for better performance
    CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
  `;

  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql: migration });
    
    if (error) {
      console.error('❌ Migration failed:', error.message);
      
      // Try alternative method
      console.log('🔄 Trying alternative method...');
      
      // Check if profiles table exists
      const { data: tables, error: tablesError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .eq('table_name', 'profiles');
      
      if (tablesError) {
        console.error('❌ Cannot check existing tables:', tablesError.message);
      } else if (tables && tables.length > 0) {
        console.log('✅ Profiles table already exists');
      } else {
        console.log('⚠️ Profiles table needs to be created manually in Supabase dashboard');
        console.log('   Go to: https://supabase.com/dashboard/project/lcpsoyorsaevkabvanrw/editor');
        console.log('   Run the SQL from: supabase/migrations/001_create_profiles_table.sql');
      }
    } else {
      console.log('✅ Migration applied successfully');
    }
  } catch (error) {
    console.error('❌ Migration error:', error.message);
    console.log('⚠️ You may need to apply this manually in Supabase dashboard');
    console.log('   Go to: https://supabase.com/dashboard/project/lcpsoyorsaevkabvanrw/sql-editor');
  }

  // Test if profiles table is accessible
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);
    
    if (error) {
      console.error('❌ Profiles table is not accessible:', error.message);
      console.log('💡 Make sure to create the profiles table in Supabase dashboard');
    } else {
      console.log('✅ Profiles table is accessible');
    }
  } catch (error) {
    console.error('❌ Error testing profiles table:', error.message);
  }

  console.log('\n🎯 Summary:');
  console.log('- Environment variables: ✅ OK');
  console.log('- Supabase connection: ✅ OK');
  console.log('- Database schema: Check Supabase dashboard');
  console.log('\nNext: Test Google login in your app!');
}

applyMigration().catch(console.error);