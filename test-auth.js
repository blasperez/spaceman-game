// Script de prueba para verificar la configuración de autenticación
const fs = require('fs');
const path = require('path');

console.log('🔍 Verificando configuración de autenticación...\n');

// Verificar archivo .env.local
const envPath = path.join(__dirname, '.env.local');
if (fs.existsSync(envPath)) {
  console.log('✅ Archivo .env.local encontrado');
  const envContent = fs.readFileSync(envPath, 'utf8');
  
  // Verificar variables requeridas
  const requiredVars = [
    'VITE_GOOGLE_CLIENT_ID',
    'VITE_GOOGLE_CLIENT_SECRET',
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY'
  ];
  
  requiredVars.forEach(varName => {
    if (envContent.includes(varName)) {
      console.log(`✅ ${varName} configurada`);
    } else {
      console.log(`❌ ${varName} faltante`);
    }
  });
} else {
  console.log('❌ Archivo .env.local no encontrado');
}

// Verificar configuración de puerto
const viteConfigPath = path.join(__dirname, 'vite.config.ts');
if (fs.existsSync(viteConfigPath)) {
  const viteConfig = fs.readFileSync(viteConfigPath, 'utf8');
  if (viteConfig.includes('port: 8081')) {
    console.log('✅ Puerto 8081 configurado correctamente');
  } else {
    console.log('❌ Puerto no está configurado en 8081');
  }
}

// Verificar URLs de callback
const googleConfigPath = path.join(__dirname, 'client_secret_2_946065921846-gr94a4clm5crfri3js950v5hgtargd4h.apps.googleusercontent.com (1).json');
if (fs.existsSync(googleConfigPath)) {
  const googleConfig = JSON.parse(fs.readFileSync(googleConfigPath, 'utf8'));
  const redirectUris = googleConfig.web.redirect_uris || [];
  
  if (redirectUris.includes('http://localhost:8081/auth/google/callback')) {
    console.log('✅ URL de callback localhost:8081 configurada en Google');
  } else {
    console.log('❌ URL de callback localhost:8081 no encontrada en Google config');
  }
}

console.log('\n📋 Resumen de configuración:');
console.log('1. Asegúrate de tener todas las variables de entorno en .env.local');
console.log('2. El servidor debe ejecutarse en http://localhost:8081');
console.log('3. Las URLs de callback deben coincidir exactamente');
console.log('4. Verifica que el proyecto de Google Cloud esté activo');
console.log('\n🚀 Para probar:');
console.log('npm run dev');
console.log('Luego visita: http://localhost:8081');
