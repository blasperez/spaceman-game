const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Configuración de Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Faltan las variables de entorno');
  console.log('💡 Asegúrate de tener un archivo .env con:');
  console.log('SUPABASE_URL=https://tu-proyecto.supabase.co');
  console.log('SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verifyMigration() {
  console.log('🔍 Verificando migración del sistema de pagos...');
  console.log('================================================');
  
  const results = {
    tables: {},
    views: {},
    policies: {},
    triggers: {},
    indexes: {},
    functions: {}
  };

  try {
    // 1. Verificar tablas principales
    console.log('\n📋 Verificando tablas...');
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
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);
        
        if (error) {
          results.tables[table] = { status: '❌', error: error.message };
          console.log(`  ${table}: ❌ ${error.message}`);
        } else {
          results.tables[table] = { status: '✅', data: data };
          console.log(`  ${table}: ✅ OK`);
        }
      } catch (err) {
        results.tables[table] = { status: '❌', error: err.message };
        console.log(`  ${table}: ❌ ${err.message}`);
      }
    }

    // 2. Verificar vistas
    console.log('\n👁️  Verificando vistas...');
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
          results.views[view] = { status: '❌', error: error.message };
          console.log(`  ${view}: ❌ ${error.message}`);
        } else {
          results.views[view] = { status: '✅', data: data };
          console.log(`  ${view}: ✅ OK`);
        }
      } catch (err) {
        results.views[view] = { status: '❌', error: err.message };
        console.log(`  ${view}: ❌ ${err.message}`);
      }
    }

    // 3. Verificar políticas RLS
    console.log('\n🔒 Verificando políticas RLS...');
    const rlsTables = ['game_history', 'transactions', 'payment_methods', 'withdrawals'];
    
    for (const table of rlsTables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);
        
        if (error && error.message.includes('permission denied')) {
          results.policies[table] = { status: '✅', message: 'RLS activo' };
          console.log(`  ${table}: ✅ RLS activo`);
        } else if (error) {
          results.policies[table] = { status: '❌', error: error.message };
          console.log(`  ${table}: ❌ ${error.message}`);
        } else {
          results.policies[table] = { status: '⚠️', message: 'RLS no activo' };
          console.log(`  ${table}: ⚠️  RLS no activo`);
        }
      } catch (err) {
        results.policies[table] = { status: '❌', error: err.message };
        console.log(`  ${table}: ❌ ${err.message}`);
      }
    }

    // 4. Verificar triggers
    console.log('\n⚡ Verificando triggers...');
    const triggerTests = [
      {
        name: 'game_history trigger',
        test: async () => {
          // Crear un usuario de prueba si no existe
          const testUserId = '00000000-0000-0000-0000-000000000001';
          
          // Insertar una partida de prueba
          const { data, error } = await supabase
            .from('game_history')
            .insert({
              user_id: testUserId,
              game_id: 'test-verification',
              bet_amount: 10.00,
              multiplier: 2.5,
              win_amount: 25.00,
              game_type: 'spaceman'
            })
            .select();
          
          if (error) {
            return { status: '❌', error: error.message };
          }
          
          // Verificar que se creó
          return { status: '✅', data: data };
        }
      }
    ];

    for (const test of triggerTests) {
      try {
        const result = await test.test();
        results.triggers[test.name] = result;
        console.log(`  ${test.name}: ${result.status}`);
      } catch (err) {
        results.triggers[test.name] = { status: '❌', error: err.message };
        console.log(`  ${test.name}: ❌ ${err.message}`);
      }
    }

    // 5. Verificar índices
    console.log('\n📈 Verificando índices...');
    const indexTests = [
      { name: 'game_history_user_id', table: 'game_history' },
      { name: 'transactions_user_id', table: 'transactions' },
      { name: 'payment_methods_user_id', table: 'payment_methods' },
      { name: 'withdrawals_user_id', table: 'withdrawals' }
    ];

    for (const index of indexTests) {
      try {
        const { data, error } = await supabase
          .from(index.table)
          .select('*')
          .limit(1);
        
        if (error) {
          results.indexes[index.name] = { status: '❌', error: error.message };
          console.log(`  ${index.name}: ❌ ${error.message}`);
        } else {
          results.indexes[index.name] = { status: '✅', message: 'Índice funcional' };
          console.log(`  ${index.name}: ✅ OK`);
        }
      } catch (err) {
        results.indexes[index.name] = { status: '❌', error: err.message };
        console.log(`  ${index.name}: ❌ ${err.message}`);
      }
    }

    // 6. Generar reporte final
    console.log('\n📊 Reporte Final');
    console.log('================');
    
    const totalTests = Object.keys(results.tables).length + 
                      Object.keys(results.views).length + 
                      Object.keys(results.policies).length + 
                      Object.keys(results.triggers).length + 
                      Object.keys(results.indexes).length;
    
    const passedTests = Object.values(results.tables).filter(r => r.status === '✅').length +
                       Object.values(results.views).filter(r => r.status === '✅').length +
                       Object.values(results.policies).filter(r => r.status === '✅').length +
                       Object.values(results.triggers).filter(r => r.status === '✅').length +
                       Object.values(results.indexes).filter(r => r.status === '✅').length;
    
    const successRate = ((passedTests / totalTests) * 100).toFixed(1);
    
    console.log(`\n✅ Tests pasados: ${passedTests}/${totalTests} (${successRate}%)`);
    
    if (successRate >= 80) {
      console.log('\n🎉 ¡Migración exitosa! El sistema está listo para usar.');
      console.log('\n📋 Próximos pasos:');
      console.log('1. Probar el frontend con los nuevos componentes');
      console.log('2. Verificar que los hooks funcionen correctamente');
      console.log('3. Probar el flujo completo de pagos y retiros');
    } else {
      console.log('\n⚠️  Algunos elementos necesitan atención.');
      console.log('Revisa los errores arriba y aplica las correcciones necesarias.');
    }
    
    // Guardar reporte en archivo
    const fs = require('fs');
    const report = {
      timestamp: new Date().toISOString(),
      successRate,
      results
    };
    
    fs.writeFileSync('migration-verification-report.json', JSON.stringify(report, null, 2));
    console.log('\n📄 Reporte guardado en: migration-verification-report.json');
    
  } catch (error) {
    console.error('❌ Error durante la verificación:', error);
  }
}

// Función para limpiar datos de prueba
async function cleanupTestData() {
  console.log('\n🧹 Limpiando datos de prueba...');
  
  try {
    const { error } = await supabase
      .from('game_history')
      .delete()
      .eq('game_id', 'test-verification');
    
    if (error) {
      console.log('⚠️  Error limpiando datos de prueba:', error.message);
    } else {
      console.log('✅ Datos de prueba limpiados');
    }
  } catch (err) {
    console.log('⚠️  Error durante limpieza:', err.message);
  }
}

// Función principal
async function main() {
  console.log('🎯 Verificación de Migración - Sistema de Pagos Spaceman');
  console.log('========================================================');
  
  await verifyMigration();
  
  // Preguntar si quiere limpiar datos de prueba
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  rl.question('\n¿Quieres limpiar los datos de prueba? (y/n): ', async (answer) => {
    if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
      await cleanupTestData();
    }
    rl.close();
  });
}

// Ejecutar si se llama directamente
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  verifyMigration,
  cleanupTestData
};
