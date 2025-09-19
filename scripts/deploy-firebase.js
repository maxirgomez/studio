#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Script para desplegar la aplicación a Firebase con la configuración correcta
 */

function runCommand(command, description) {
  console.log(`\n🚀 ${description}...`);
  try {
    execSync(command, { stdio: 'inherit' });
    console.log(`✅ ${description} completado`);
    return true;
  } catch (error) {
    console.error(`❌ Error en ${description}:`, error.message);
    return false;
  }
}

function checkPrerequisites() {
  console.log('🔍 Verificando prerequisitos...');
  
  // Verificar que Firebase CLI esté instalado
  try {
    execSync('firebase --version', { stdio: 'pipe' });
    console.log('✅ Firebase CLI encontrado');
  } catch (error) {
    console.error('❌ Firebase CLI no encontrado. Instala con: npm install -g firebase-tools');
    return false;
  }
  
  // Verificar que el directorio functions existe
  if (!fs.existsSync('functions')) {
    console.error('❌ Directorio functions no encontrado');
    return false;
  }
  
  console.log('✅ Prerequisitos verificados');
  return true;
}

function buildProject() {
  console.log('\n🔨 Construyendo proyecto...');
  
  // Limpiar builds anteriores
  console.log('🧹 Limpiando builds anteriores...');
  if (fs.existsSync('.next')) {
    fs.rmSync('.next', { recursive: true, force: true });
  }
  if (fs.existsSync('out')) {
    fs.rmSync('out', { recursive: true, force: true });
  }
  if (fs.existsSync('functions/lib')) {
    fs.rmSync('functions/lib', { recursive: true, force: true });
  }
  
  // Instalar dependencias de functions
  console.log('📦 Instalando dependencias de functions...');
  if (!runCommand('npm install', 'Instalación de dependencias en functions')) {
    return false;
  }
  
  // Build del proyecto principal
  console.log('🔨 Construyendo aplicación Next.js...');
  if (!runCommand('npm run build', 'Build de Next.js')) {
    return false;
  }
  
  return true;
}

function deployToFirebase() {
  console.log('\n🚀 Desplegando a Firebase...');
  
  // Desplegar functions y hosting
  if (!runCommand('firebase deploy', 'Despliegue completo a Firebase')) {
    return false;
  }
  
  return true;
}

function showDeploymentInfo() {
  console.log('\n📋 Información del despliegue:');
  console.log('• Hosting: Firebase Hosting');
  console.log('• Functions: Firebase Functions (Node.js 18)');
  console.log('• Región: us-east1');
  console.log('• Configuración: Next.js standalone con Functions');
  
  console.log('\n💡 Comandos útiles:');
  console.log('• Ver logs: firebase functions:log');
  console.log('• Emulador local: firebase emulators:start');
  console.log('• Solo hosting: firebase deploy --only hosting');
  console.log('• Solo functions: firebase deploy --only functions');
}

function main() {
  console.log('🚀 Iniciando despliegue a Firebase...\n');
  
  // Verificar prerequisitos
  if (!checkPrerequisites()) {
    process.exit(1);
  }
  
  // Construir proyecto
  if (!buildProject()) {
    console.error('\n❌ Error durante la construcción del proyecto');
    process.exit(1);
  }
  
  // Desplegar
  if (!deployToFirebase()) {
    console.error('\n❌ Error durante el despliegue');
    process.exit(1);
  }
  
  // Mostrar información
  showDeploymentInfo();
  
  console.log('\n✅ Despliegue completado exitosamente!');
}

main();
