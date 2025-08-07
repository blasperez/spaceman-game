#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const planetImages = [
  'Planeta (1).png',
  'Planeta (2).png',
  'Planeta (3).png',
  'Planeta (4).png',
  'Planeta (5).png'
];

const publicDir = path.join(__dirname, 'public');

console.log('🪐 Verificando imágenes de planetas...\n');

planetImages.forEach(filename => {
  const filePath = path.join(publicDir, filename);
  if (fs.existsSync(filePath)) {
    const stats = fs.statSync(filePath);
    console.log(`✅ ${filename} - ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
  } else {
    console.log(`⚠️  ${filename} - NO ENCONTRADO`);
    console.log(`   Por favor, copia este archivo al directorio public/`);
  }
});

console.log('\nNota: Asegúrate de que todas las imágenes de planetas estén en el directorio public/');
console.log('antes de hacer el deployment en Railway.');
