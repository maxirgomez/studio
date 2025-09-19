#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Script para verificar que los archivos estáticos se generen correctamente
 * y diagnosticar problemas con el servidor
 */

const BUILD_DIR = path.join(__dirname, '..', '.next');
const STATIC_DIR = path.join(BUILD_DIR, 'static');

function checkStaticFiles() {
  console.log('🔍 Verificando archivos estáticos...');
  
  if (!fs.existsSync(BUILD_DIR)) {
    console.error('❌ Directorio .next no encontrado. Ejecuta "npm run build" primero.');
    return false;
  }
  
  // Verificar estructura de archivos estáticos
  const staticPaths = [
    'static/chunks',
    'static/css',
    'static/media'
  ];
  
  let allPathsExist = true;
  
  for (const staticPath of staticPaths) {
    const fullPath = path.join(BUILD_DIR, staticPath);
    if (fs.existsSync(fullPath)) {
      const files = fs.readdirSync(fullPath);
      console.log(`✅ ${staticPath}: ${files.length} archivos`);
      
      // Mostrar algunos archivos como ejemplo
      if (files.length > 0) {
        console.log(`   Ejemplos: ${files.slice(0, 3).join(', ')}${files.length > 3 ? '...' : ''}`);
      }
    } else {
      console.error(`❌ ${staticPath}: NO ENCONTRADO`);
      allPathsExist = false;
    }
  }
  
  return allPathsExist;
}

function checkBuildManifest() {
  console.log('\n🔍 Verificando manifest del build...');
  
  const manifestPath = path.join(BUILD_DIR, 'build-manifest.json');
  if (fs.existsSync(manifestPath)) {
    try {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      console.log('✅ Build manifest encontrado');
      
      // Mostrar páginas y sus chunks
      const pages = Object.keys(manifest.pages || {});
      console.log(`📄 Páginas: ${pages.length}`);
      
      for (const page of pages.slice(0, 3)) {
        const chunks = manifest.pages[page] || [];
        console.log(`   ${page}: ${chunks.length} chunks`);
      }
      
      return true;
    } catch (error) {
      console.error('❌ Error leyendo manifest:', error.message);
      return false;
    }
  } else {
    console.error('❌ Build manifest no encontrado');
    return false;
  }
}

function checkExportManifest() {
  console.log('\n🔍 Verificando export manifest...');
  
  const exportManifestPath = path.join(BUILD_DIR, 'export-marker.json');
  if (fs.existsSync(exportManifestPath)) {
    try {
      const manifest = JSON.parse(fs.readFileSync(exportManifestPath, 'utf8'));
      console.log('✅ Export manifest encontrado');
      return true;
    } catch (error) {
      console.error('❌ Error leyendo export manifest:', error.message);
      return false;
    }
  } else {
    console.log('ℹ️  Export manifest no encontrado (normal en modo export)');
    return true; // No es crítico en modo export
  }
}

function generateStaticFileReport() {
  console.log('\n📊 Generando reporte detallado...');
  
  const report = {
    timestamp: new Date().toISOString(),
    build: {
      exists: fs.existsSync(BUILD_DIR),
      size: 0,
      staticFiles: {}
    },
    issues: [],
    recommendations: []
  };
  
  if (report.build.exists) {
    // Calcular tamaño del build
    const getDirSize = (dir) => {
      let size = 0;
      try {
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
      } catch (error) {
        // Ignorar errores de permisos
      }
      return size;
    };
    
    report.build.size = getDirSize(BUILD_DIR);
    
    // Verificar archivos estáticos específicos
    const staticSubDirs = ['chunks', 'css', 'media'];
    for (const subDir of staticSubDirs) {
      const subDirPath = path.join(BUILD_DIR, 'static', subDir);
      if (fs.existsSync(subDirPath)) {
        const files = fs.readdirSync(subDirPath);
        report.build.staticFiles[subDir] = {
          exists: true,
          fileCount: files.length,
          files: files.slice(0, 5) // Primeros 5 archivos como ejemplo
        };
      } else {
        report.build.staticFiles[subDir] = {
          exists: false,
          fileCount: 0,
          files: []
        };
        report.issues.push(`Directorio static/${subDir} no encontrado`);
      }
    }
  } else {
    report.issues.push('Directorio .next no encontrado');
    report.recommendations.push('Ejecutar "npm run build" para generar el build');
  }
  
  // Verificar archivos críticos
  const criticalFiles = [
    '.next/BUILD_ID',
    '.next/build-manifest.json',
    '.next/server/app-manifest.json'
  ];
  
  for (const file of criticalFiles) {
    const filePath = path.join(__dirname, '..', file);
    if (!fs.existsSync(filePath)) {
      report.issues.push(`Archivo crítico no encontrado: ${file}`);
    }
  }
  
  // Agregar recomendaciones basadas en los problemas encontrados
  if (report.issues.length > 0) {
    report.recommendations.push('Verificar configuración de next.config.ts');
    report.recommendations.push('Revisar logs de build para errores');
    report.recommendations.push('Asegurar que todas las dependencias estén instaladas');
  }
  
  // Guardar reporte
  const reportPath = path.join(__dirname, '..', 'static-files-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`📄 Reporte guardado en: ${reportPath}`);
  
  return report;
}

function main() {
  console.log('🚀 Verificando archivos estáticos de Next.js...\n');
  
  const staticOk = checkStaticFiles();
  const manifestOk = checkBuildManifest();
  const exportManifestOk = checkExportManifest();
  const report = generateStaticFileReport();
  
  console.log('\n📋 Resumen:');
  console.log(`Archivos estáticos: ${staticOk ? '✅ OK' : '❌ PROBLEMAS'}`);
  console.log(`Build manifest: ${manifestOk ? '✅ OK' : '❌ PROBLEMAS'}`);
  console.log(`Export manifest: ${exportManifestOk ? '✅ OK' : '❌ PROBLEMAS'}`);
  console.log(`Tamaño del build: ${(report.build.size / 1024 / 1024).toFixed(2)} MB`);
  
  if (report.issues.length > 0) {
    console.log('\n⚠️  Problemas encontrados:');
    report.issues.forEach(issue => console.log(`   • ${issue}`));
  }
  
  if (report.recommendations.length > 0) {
    console.log('\n💡 Recomendaciones:');
    report.recommendations.forEach(rec => console.log(`   • ${rec}`));
  }
  
  if (!staticOk || !manifestOk || !exportManifestOk) {
    console.log('\n🔧 Soluciones sugeridas:');
    console.log('1. Limpiar build anterior: rm -rf .next');
    console.log('2. Reinstalar dependencias: rm -rf node_modules && npm install');
    console.log('3. Ejecutar build limpio: npm run build');
    console.log('4. Verificar configuración de next.config.ts');
    process.exit(1);
  }
  
  console.log('\n✅ Verificación completada exitosamente');
  console.log('🎉 Los archivos estáticos están listos para el despliegue');
}

main();
