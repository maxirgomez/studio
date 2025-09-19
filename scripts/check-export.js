#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Script para verificar que la exportación estática de Next.js se genere correctamente
 */

const OUT_DIR = path.join(__dirname, '..', 'out');

function checkExportDirectory() {
  console.log('🔍 Verificando directorio de exportación...');
  
  if (!fs.existsSync(OUT_DIR)) {
    console.error('❌ Directorio "out" no encontrado. Ejecuta "npm run build" primero.');
    return false;
  }
  
  console.log('✅ Directorio "out" encontrado');
  return true;
}

function checkStaticFiles() {
  console.log('\n🔍 Verificando archivos estáticos exportados...');
  
  const staticPaths = [
    '_next/static/chunks',
    '_next/static/css'
  ];
  
  let allPathsExist = true;
  
  for (const staticPath of staticPaths) {
    const fullPath = path.join(OUT_DIR, staticPath);
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

function checkHTMLFiles() {
  console.log('\n🔍 Verificando archivos HTML...');
  
  const htmlFiles = fs.readdirSync(OUT_DIR).filter(file => file.endsWith('.html'));
  
  if (htmlFiles.length > 0) {
    console.log(`✅ Archivos HTML encontrados: ${htmlFiles.length}`);
    htmlFiles.forEach(file => console.log(`   • ${file}`));
    return true;
  } else {
    console.error('❌ No se encontraron archivos HTML');
    return false;
  }
}

function checkPublicFiles() {
  console.log('\n🔍 Verificando archivos públicos exportados...');
  
  const publicPaths = [
    'uploads',
    'avatars',
    'favicon.ico'
  ];
  
  let foundFiles = 0;
  
  for (const publicPath of publicPaths) {
    const fullPath = path.join(OUT_DIR, publicPath);
    if (fs.existsSync(fullPath)) {
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        const files = fs.readdirSync(fullPath);
        console.log(`✅ ${publicPath}/: ${files.length} archivos`);
        foundFiles += files.length;
      } else {
        console.log(`✅ ${publicPath}`);
        foundFiles++;
      }
    }
  }
  
  console.log(`📁 Total archivos públicos: ${foundFiles}`);
  return foundFiles > 0;
}

function generateExportReport() {
  console.log('\n📊 Generando reporte de exportación...');
  
  const report = {
    timestamp: new Date().toISOString(),
    export: {
      exists: fs.existsSync(OUT_DIR),
      size: 0,
      files: []
    },
    issues: [],
    recommendations: []
  };
  
  if (report.export.exists) {
    // Calcular tamaño del directorio out
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
    
    report.export.size = getDirSize(OUT_DIR);
    
    // Listar archivos principales
    const allFiles = fs.readdirSync(OUT_DIR, { recursive: true });
    report.export.files = allFiles.slice(0, 20); // Primeros 20 archivos
    
    // Verificar archivos críticos
    const criticalFiles = ['index.html', '_next/static'];
    for (const file of criticalFiles) {
      const filePath = path.join(OUT_DIR, file);
      if (!fs.existsSync(filePath)) {
        report.issues.push(`Archivo crítico no encontrado: ${file}`);
      }
    }
    
    if (report.issues.length === 0) {
      report.recommendations.push('La exportación se completó exitosamente');
      report.recommendations.push('Listo para desplegar a Firebase Hosting');
    }
  } else {
    report.issues.push('Directorio "out" no encontrado');
    report.recommendations.push('Ejecutar "npm run build" para generar la exportación');
  }
  
  // Guardar reporte
  const reportPath = path.join(__dirname, '..', 'export-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`📄 Reporte guardado en: ${reportPath}`);
  
  return report;
}

function main() {
  console.log('🚀 Verificando exportación estática de Next.js...\n');
  
  const exportDirOk = checkExportDirectory();
  if (!exportDirOk) {
    process.exit(1);
  }
  
  const staticOk = checkStaticFiles();
  const htmlOk = checkHTMLFiles();
  const publicOk = checkPublicFiles();
  const report = generateExportReport();
  
  console.log('\n📋 Resumen:');
  console.log(`Directorio de exportación: ${exportDirOk ? '✅ OK' : '❌ PROBLEMAS'}`);
  console.log(`Archivos estáticos: ${staticOk ? '✅ OK' : '❌ PROBLEMAS'}`);
  console.log(`Archivos HTML: ${htmlOk ? '✅ OK' : '❌ PROBLEMAS'}`);
  console.log(`Archivos públicos: ${publicOk ? '✅ OK' : '❌ PROBLEMAS'}`);
  console.log(`Tamaño de la exportación: ${(report.export.size / 1024 / 1024).toFixed(2)} MB`);
  
  if (report.issues.length > 0) {
    console.log('\n⚠️  Problemas encontrados:');
    report.issues.forEach(issue => console.log(`   • ${issue}`));
  }
  
  if (report.recommendations.length > 0) {
    console.log('\n💡 Recomendaciones:');
    report.recommendations.forEach(rec => console.log(`   • ${rec}`));
  }
  
  if (!staticOk || !htmlOk) {
    console.log('\n🔧 Soluciones sugeridas:');
    console.log('1. Limpiar build anterior: rm -rf .next out');
    console.log('2. Verificar configuración de next.config.ts');
    console.log('3. Revisar logs de build para errores');
    console.log('4. Asegurar que todas las dependencias estén instaladas');
    process.exit(1);
  }
  
  console.log('\n✅ Verificación de exportación completada exitosamente');
  console.log('🎉 La exportación está lista para Firebase Hosting');
}

main();
