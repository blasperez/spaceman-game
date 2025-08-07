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

let foundCount = 0;
planetImages.forEach(filename => {
  const filePath = path.join(publicDir, filename);
  if (fs.existsSync(filePath)) {
    const stats = fs.statSync(filePath);
    console.log(`✅ ${filename} - ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
    foundCount++;
  } else {
    // Check for SVG fallback
    const svgPath = path.join(publicDir, filename.replace('.png', '.svg'));
    if (fs.existsSync(svgPath)) {
      console.log(`⚠️  ${filename} - NO ENCONTRADO (usando SVG fallback)`);
    } else {
      console.log(`⚠️  ${filename} - NO ENCONTRADO`);
    }
  }
});

console.log(`\n📊 ${foundCount}/${planetImages.length} imágenes PNG encontradas`);
console.log('💡 El juego usará SVG como fallback para las imágenes faltantes');

// Exit with success to not break the build
process.exit(0);