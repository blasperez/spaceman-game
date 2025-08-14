#!/usr/bin/env node

require('dotenv').config();

// Script para verificar variables de entorno requeridas

const requiredEnvVars = [
  // Supabase
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
  'DATABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  
  // Stripe
  'VITE_STRIPE_PUBLISHABLE_KEY',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  
  // App
  'VITE_APP_URL',
  // Aceptamos cualquiera de estas dos
  // 'VITE_WS_URL',
  // 'VITE_WEBSOCKET_URL',
  'PORT',
  'NODE_ENV'
];

console.log('🔍 Verificando variables de entorno...\n');

let allPresent = true;
const missing = [];

requiredEnvVars.forEach(varName => {
  if (process.env[varName]) {
    console.log(`✅ ${varName}: Configurada`);
  } else {
    console.log(`❌ ${varName}: FALTA`);
    missing.push(varName);
    allPresent = false;
  }
});

// Manejo especial para WS URL (acepta cualquiera de las dos)
const hasWs = !!(process.env.VITE_WS_URL || process.env.VITE_WEBSOCKET_URL);
if (!hasWs) {
  console.log('❌ VITE_WS_URL/VITE_WEBSOCKET_URL: FALTA (se acepta cualquiera de las dos)');
  missing.push('VITE_WS_URL or VITE_WEBSOCKET_URL');
  allPresent = false;
} else {
  console.log(`✅ WS URL: ${process.env.VITE_WS_URL || process.env.VITE_WEBSOCKET_URL}`);
}

console.log('\n' + '='.repeat(50) + '\n');

if (allPresent) {
  console.log('✅ Todas las variables de entorno están configuradas correctamente');
  process.exit(0);
} else {
  console.error(`❌ Faltan ${missing.length} variables de entorno:`);
  missing.forEach(v => console.error(`   - ${v}`));
  console.error('\nPor favor, configura estas variables en Railway o en tu archivo .env');
  process.exit(1);
}