const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configuración de Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Faltan las variables de entorno SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY');
  console.log('💡 Asegúrate de tener un archivo .env con:');
  console.log('SUPABASE_URL=https://tu-proyecto.supabase.co');
  console.log('SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
  console.log('🚀 Iniciando migración completa del sistema de pagos...');
  
  try {
    // Leer el archivo de migración
    const migrationPath = path.join(__dirname, 'supabase/migrations/20250715000000_complete_payment_system.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📋 Aplicando migración...');
    
    // Ejecutar la migración
    const { error } = await supabase.rpc('exec_sql', { sql: migrationSQL });
    
    if (error) {
      console.error('❌ Error al aplicar la migración:', error);
      return;
    }
    
    console.log('✅ Migración aplicada exitosamente!');
    
    // Verificar que las tablas se crearon correctamente
    console.log('🔍 Verificando tablas creadas...');
    
    const tables = [
      'game_history',
      'transactions', 
      'payment_methods',
      'withdrawals',
      'stripe_customers',
      'stripe_subscriptions',
      'stripe_orders'
    ];
    
    for (const table of tables) {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (error) {
        console.log(`⚠️  Tabla ${table}: ${error.message}`);
      } else {
        console.log(`✅ Tabla ${table}: OK`);
      }
    }
    
    // Verificar vistas
    console.log('🔍 Verificando vistas...');
    const views = [
      'user_transaction_history',
      'stripe_user_subscriptions',
      'stripe_user_orders'
    ];
    
    for (const view of views) {
      try {
        const { data, error } = await supabase
          .from(view)
          .select('*')
          .limit(1);
        
        if (error) {
          console.log(`⚠️  Vista ${view}: ${error.message}`);
        } else {
          console.log(`✅ Vista ${view}: OK`);
        }
      } catch (err) {
        console.log(`⚠️  Vista ${view}: ${err.message}`);
      }
    }
    
    console.log('\n🎉 ¡Migración completada exitosamente!');
    console.log('\n📋 Resumen de lo que se agregó:');
    console.log('• Campos adicionales en tablas existentes');
    console.log('• Nueva tabla withdrawals para retiros');
    console.log('• Vista user_transaction_history unificada');
    console.log('• Políticas RLS para seguridad');
    console.log('• Triggers para actualización automática de balance');
    console.log('• Índices para mejor rendimiento');
    console.log('• Tipos personalizados para Stripe');
    
  } catch (error) {
    console.error('❌ Error durante la migración:', error);
  }
}

// Función alternativa para ejecutar SQL directamente
async function executeSQL(sql) {
  console.log('🔧 Ejecutando SQL directamente...');
  
  try {
    // Dividir el SQL en statements individuales
    const statements = sql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`📝 Ejecutando statement ${i + 1}/${statements.length}...`);
      
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: statement });
        
        if (error) {
          console.log(`⚠️  Statement ${i + 1}: ${error.message}`);
        } else {
          console.log(`✅ Statement ${i + 1}: OK`);
        }
      } catch (err) {
        console.log(`⚠️  Statement ${i + 1}: ${err.message}`);
      }
    }
    
    console.log('✅ SQL ejecutado completamente');
    
  } catch (error) {
    console.error('❌ Error ejecutando SQL:', error);
  }
}

// Función para verificar la configuración
async function checkConfiguration() {
  console.log('🔍 Verificando configuración de Supabase...');
  
  try {
    // Verificar conexión
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('❌ Error de conexión:', error.message);
      return false;
    }
    
    console.log('✅ Conexión a Supabase exitosa');
    return true;
    
  } catch (error) {
    console.error('❌ Error verificando configuración:', error);
    return false;
  }
}

// Función principal
async function main() {
  console.log('🎯 Sistema de Pagos Spaceman - Migración Completa');
  console.log('================================================');
  
  // Verificar configuración
  const isConfigured = await checkConfiguration();
  if (!isConfigured) {
    console.log('\n💡 Para configurar Supabase:');
    console.log('1. Ve a tu proyecto en Supabase Dashboard');
    console.log('2. Ve a Settings > API');
    console.log('3. Copia la URL y Service Role Key');
    console.log('4. Crea un archivo .env con esas variables');
    return;
  }
  
  // Leer el archivo de migración
  const migrationPath = path.join(__dirname, 'supabase/migrations/20250715000000_complete_payment_system.sql');
  
  if (!fs.existsSync(migrationPath)) {
    console.error('❌ No se encontró el archivo de migración');
    console.log('💡 Asegúrate de que el archivo existe en: supabase/migrations/20250715000000_complete_payment_system.sql');
    return;
  }
  
  const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
  
  // Preguntar al usuario qué método prefiere
  console.log('\n📋 Métodos de aplicación:');
  console.log('1. Migración completa (recomendado)');
  console.log('2. Ejecutar SQL directamente');
  console.log('3. Solo verificar configuración');
  
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  rl.question('\nSelecciona una opción (1-3): ', async (answer) => {
    switch (answer.trim()) {
      case '1':
        await applyMigration();
        break;
      case '2':
        await executeSQL(migrationSQL);
        break;
      case '3':
        console.log('✅ Configuración verificada correctamente');
        break;
      default:
        console.log('❌ Opción inválida');
    }
    
    rl.close();
  });
}

// Ejecutar si se llama directamente
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  applyMigration,
  executeSQL,
  checkConfiguration
};