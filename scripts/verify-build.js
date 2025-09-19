#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Script para verificar que el build de Next.js se genere correctamente
 * y que los archivos estáticos estén disponibles
 */

const BUILD_DIR = path.join(__dirname, '..', '.next');
const STATIC_DIR = path.join(BUILD_DIR, 'static');

function checkBuildFiles() {
  console.log('🔍 Verificando archivos de build...');
  
  // Verificar que existe el directorio .next
  if (!fs.existsSync(BUILD_DIR)) {
    console.error('❌ Directorio .next no encontrado. Ejecuta "npm run build" primero.');
    return false;
  }
  
  // Verificar archivos críticos (modo export)
  const criticalFiles = [
    'BUILD_ID',
    'static/css',
    'static/chunks'
  ];
  
  let allFilesExist = true;
  
  for (const file of criticalFiles) {
    const filePath = path.join(BUILD_DIR, file);
    if (fs.existsSync(filePath)) {
      console.log(`✅ ${file} - OK`);
    } else {
      console.error(`❌ ${file} - NO ENCONTRADO`);
      allFilesExist = false;
    }
  }
  
  // Verificar archivos estáticos
  if (fs.existsSync(STATIC_DIR)) {
    const staticSubDirs = fs.readdirSync(STATIC_DIR);
    console.log(`📁 Directorios estáticos encontrados: ${staticSubDirs.join(', ')}`);
    
    // Verificar chunks
    const chunksDir = path.join(STATIC_DIR, 'chunks');
    if (fs.existsSync(chunksDir)) {
      const chunkFiles = fs.readdirSync(chunksDir);
      console.log(`📦 Chunks encontrados: ${chunkFiles.length} archivos`);
    }
    
    // Verificar CSS
    const cssDir = path.join(STATIC_DIR, 'css');
    if (fs.existsSync(cssDir)) {
      const cssFiles = fs.readdirSync(cssDir);
      console.log(`🎨 Archivos CSS encontrados: ${cssFiles.length} archivos`);
    }
  }
  
  return allFilesExist;
}

function checkPublicFiles() {
  console.log('\n🔍 Verificando archivos públicos...');
  
  const PUBLIC_DIR = path.join(__dirname, '..', 'public');
  
  if (!fs.existsSync(PUBLIC_DIR)) {
    console.error('❌ Directorio public no encontrado');
    return false;
  }
  
  // Listar archivos públicos importantes
  const publicFiles = fs.readdirSync(PUBLIC_DIR, { recursive: true });
  console.log(`📁 Archivos públicos: ${publicFiles.length} encontrados`);
  
  // Verificar subdirectorios importantes
  const importantDirs = ['uploads', 'avatars'];
  for (const dir of importantDirs) {
    const dirPath = path.join(PUBLIC_DIR, dir);
    if (fs.existsSync(dirPath)) {
      const files = fs.readdirSync(dirPath);
      console.log(`📂 ${dir}: ${files.length} archivos`);
    }
  }
  
  return true;
}

function generateStaticFileReport() {
  console.log('\n📊 Generando reporte de archivos estáticos...');
  
  const report = {
    timestamp: new Date().toISOString(),
    build: {},
    public: {}
  };
  
  // Información del build
  if (fs.existsSync(BUILD_DIR)) {
    const buildId = fs.readFileSync(path.join(BUILD_DIR, 'BUILD_ID'), 'utf8').trim();
    report.build.id = buildId;
    report.build.exists = true;
    
    // Tamaño del directorio .next
    const getDirSize = (dir) => {
      let size = 0;
      const files = fs.readdirSync(dir);
      for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
          size += getDirSize(filePath);
        } else {
          size += stat.size;
        }
      }
      return size;
    };
    
    report.build.size = getDirSize(BUILD_DIR);
  } else {
    report.build.exists = false;
  }
  
  // Información de archivos públicos
  const PUBLIC_DIR = path.join(__dirname, '..', 'public');
  if (fs.existsSync(PUBLIC_DIR)) {
    const publicFiles = fs.readdirSync(PUBLIC_DIR, { recursive: true });
    report.public.count = publicFiles.length;
    report.public.exists = true;
  } else {
    report.public.exists = false;
  }
  
  // Guardar reporte
  const reportPath = path.join(__dirname, '..', 'build-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`📄 Reporte guardado en: ${reportPath}`);
  
  return report;
}

function main() {
  console.log('🚀 Verificando build de Next.js...\n');
  
  const buildOk = checkBuildFiles();
  const publicOk = checkPublicFiles();
  const report = generateStaticFileReport();
  
  console.log('\n📋 Resumen:');
  console.log(`Build: ${buildOk ? '✅ OK' : '❌ FALLÓ'}`);
  console.log(`Archivos públicos: ${publicOk ? '✅ OK' : '❌ FALLÓ'}`);
  console.log(`Tamaño del build: ${(report.build.size / 1024 / 1024).toFixed(2)} MB`);
  
  if (!buildOk) {
    console.log('\n💡 Soluciones sugeridas:');
    console.log('1. Ejecuta "npm run build" para generar el build');
    console.log('2. Verifica que no haya errores de TypeScript');
    console.log('3. Revisa la configuración de next.config.ts');
    process.exit(1);
  }
  
  console.log('\n✅ Verificación completada exitosamente');
}

main();
