#!/usr/bin/env node

const crypto = require('crypto');

/**
 * Genera un JWT_SECRET seguro para usar en producción
 */
function generateJWTSecret() {
  // Generar 64 bytes de datos aleatorios y convertirlos a base64
  const secret = crypto.randomBytes(64).toString('base64');
  
  console.log('🔐 JWT_SECRET generado:');
  console.log('='.repeat(80));
  console.log(secret);
  console.log('='.repeat(80));
  console.log('');
  console.log('📋 Instrucciones:');
  console.log('1. Copia este valor y agrégalo a tu archivo .env como:');
  console.log(`   JWT_SECRET=${secret}`);
  console.log('');
  console.log('2. Asegúrate de que este archivo .env esté en tu .gitignore');
  console.log('3. Nunca compartas este valor públicamente');
  console.log('4. En producción, usa variables de entorno del servidor');
  console.log('');
  console.log('⚠️  IMPORTANTE: Si cambias el JWT_SECRET, todos los usuarios');
  console.log('   tendrán que volver a iniciar sesión.');
}

// Ejecutar si se llama directamente
if (require.main === module) {
  generateJWTSecret();
}

module.exports = { generateJWTSecret };
