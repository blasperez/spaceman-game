const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configure Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'your-supabase-url';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'your-supabase-anon-key';
const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  try {
    console.log('🚀 Ejecutando migraciones de base de datos...');
    
    // Read the migration file
    const migrationPath = path.join(__dirname, 'supabase', 'migrations', '20240101000000_create_payment_tables.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');
    
    // Split SQL into individual statements
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);
    
    console.log(`📋 Ejecutando ${statements.length} sentencias SQL...`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';';
      console.log(`  ${i + 1}/${statements.length} - Ejecutando: ${statement.substring(0, 50)}...`);
      
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: statement });
        if (error) {
          console.error(`❌ Error en sentencia ${i + 1}:`, error);
        } else {
          console.log(`✅ Sentencia ${i + 1} ejecutada correctamente`);
        }
      } catch (err) {
        console.error(`❌ Error ejecutando sentencia ${i + 1}:`, err.message);
        // Continue with next statement
      }
    }
    
    console.log('🎉 Migraciones completadas!');
    
    // Test the connection by querying the users table
    const { data, error } = await supabase.from('users').select('count').limit(1);
    if (error) {
      console.log('⚠️  Advertencia: No se pudo verificar la tabla users:', error.message);
    } else {
      console.log('✅ Conexión a la base de datos verificada');
    }
    
  } catch (error) {
    console.error('❌ Error ejecutando migraciones:', error);
  }
}

// Alternative method: Manual table creation
async function createTablesManually() {
  console.log('🔧 Creando tablas manualmente...');
  
  const tables = [
    {
      name: 'users',
      sql: `
        CREATE TABLE IF NOT EXISTS users (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          auth_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
          email VARCHAR(255) UNIQUE NOT NULL,
          username VARCHAR(50) UNIQUE NOT NULL,
          full_name VARCHAR(255),
          balance DECIMAL(10,2) DEFAULT 0.00,
          phone VARCHAR(20),
          country VARCHAR(100),
          age INTEGER,
          kyc_verified BOOLEAN DEFAULT FALSE,
          stripe_customer_id VARCHAR(255),
          deposit_limit DECIMAL(10,2) DEFAULT 1000.00,
          withdrawal_limit DECIMAL(10,2) DEFAULT 1000.00,
          total_deposits DECIMAL(10,2) DEFAULT 0.00,
          total_withdrawals DECIMAL(10,2) DEFAULT 0.00,
          total_wagered DECIMAL(10,2) DEFAULT 0.00,
          total_won DECIMAL(10,2) DEFAULT 0.00,
          games_played INTEGER DEFAULT 0,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    },
    {
      name: 'transactions',
      sql: `
        CREATE TABLE IF NOT EXISTS transactions (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id UUID REFERENCES users(id) ON DELETE CASCADE,
          type VARCHAR(20) NOT NULL CHECK (type IN ('deposit', 'withdrawal', 'bet', 'win')),
          amount DECIMAL(10,2) NOT NULL,
          status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
          payment_method VARCHAR(50),
          stripe_payment_intent_id VARCHAR(255),
          stripe_charge_id VARCHAR(255),
          description TEXT,
          metadata JSONB,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    },
    {
      name: 'game_history',
      sql: `
        CREATE TABLE IF NOT EXISTS game_history (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id UUID REFERENCES users(id) ON DELETE CASCADE,
          game_id VARCHAR(100) NOT NULL,
          bet_amount DECIMAL(10,2) NOT NULL,
          cash_out_multiplier DECIMAL(8,2),
          win_amount DECIMAL(10,2) DEFAULT 0.00,
          crash_multiplier DECIMAL(8,2),
          auto_cash_out BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    },
    {
      name: 'payment_methods',
      sql: `
        CREATE TABLE IF NOT EXISTS payment_methods (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id UUID REFERENCES users(id) ON DELETE CASCADE,
          stripe_payment_method_id VARCHAR(255) NOT NULL,
          type VARCHAR(20) NOT NULL DEFAULT 'card',
          card_brand VARCHAR(20),
          card_last4 VARCHAR(4),
          card_exp_month INTEGER,
          card_exp_year INTEGER,
          is_default BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    }
  ];
  
  for (const table of tables) {
    try {
      console.log(`📋 Creando tabla: ${table.name}`);
      const { error } = await supabase.rpc('exec_sql', { sql: table.sql });
      if (error) {
        console.error(`❌ Error creando tabla ${table.name}:`, error);
      } else {
        console.log(`✅ Tabla ${table.name} creada correctamente`);
      }
    } catch (err) {
      console.error(`❌ Error creando tabla ${table.name}:`, err.message);
    }
  }
}

// Run the migration
if (require.main === module) {
  console.log('🎯 Iniciando configuración de base de datos...');
  console.log('');
  
  // Try migration first, then manual creation if needed
  runMigration()
    .then(() => {
      console.log('');
      console.log('📚 INSTRUCCIONES PARA CONFIGURAR SUPABASE:');
      console.log('');
      console.log('1. Ve a tu panel de Supabase: https://app.supabase.com');
      console.log('2. Selecciona tu proyecto');
      console.log('3. Ve a "SQL Editor"');
      console.log('4. Copia y pega el contenido del archivo: supabase/migrations/20240101000000_create_payment_tables.sql');
      console.log('5. Ejecuta el SQL');
      console.log('');
      console.log('O alternativamente, ejecuta las sentencias manualmente desde el código arriba.');
      console.log('');
      process.exit(0);
    })
    .catch(err => {
      console.error('Error:', err);
      process.exit(1);
    });
}

module.exports = { runMigration, createTablesManually };