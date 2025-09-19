#!/usr/bin/env node

const https = require('https');
const http = require('http');

/**
 * Script para probar el acceso a archivos estáticos después del despliegue
 */

const DEPLOYMENT_URL = process.env.DEPLOYMENT_URL || 'http://35.239.219.192';

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https:') ? https : http;
    
    const req = client.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });
    
    req.on('error', reject);
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

async function testStaticFile(filePath) {
  const url = `${DEPLOYMENT_URL}${filePath}`;
  
  try {
    console.log(`🔍 Probando: ${filePath}`);
    const response = await makeRequest(url);
    
    if (response.statusCode === 200) {
      console.log(`✅ ${filePath} - OK (${response.statusCode})`);
      
      // Verificar headers importantes
      const cacheControl = response.headers['cache-control'];
      const contentType = response.headers['content-type'];
      
      if (cacheControl) {
        console.log(`   Cache-Control: ${cacheControl}`);
      }
      if (contentType) {
        console.log(`   Content-Type: ${contentType}`);
      }
      
      return { success: true, statusCode: response.statusCode, headers: response.headers };
    } else {
      console.log(`❌ ${filePath} - ERROR (${response.statusCode})`);
      return { success: false, statusCode: response.statusCode, error: 'HTTP Error' };
    }
  } catch (error) {
    console.log(`❌ ${filePath} - ERROR (${error.message})`);
    return { success: false, error: error.message };
  }
}

async function testMainPage() {
  console.log('\n🌐 Probando página principal...');
  
  try {
    const response = await makeRequest(DEPLOYMENT_URL);
    
    if (response.statusCode === 200) {
      console.log(`✅ Página principal - OK (${response.statusCode})`);
      
      // Buscar referencias a archivos estáticos en el HTML
      const html = response.body;
      const staticFileMatches = html.match(/_next\/static\/[^"'\s]+/g) || [];
      
      console.log(`📦 Archivos estáticos referenciados: ${staticFileMatches.length}`);
      
      if (staticFileMatches.length > 0) {
        console.log('   Ejemplos:');
        staticFileMatches.slice(0, 5).forEach(match => {
          console.log(`   • ${match}`);
        });
        
        return staticFileMatches;
      }
      
      return [];
    } else {
      console.log(`❌ Página principal - ERROR (${response.statusCode})`);
      return [];
    }
  } catch (error) {
    console.log(`❌ Página principal - ERROR (${error.message})`);
    return [];
  }
}

async function testStaticFiles(staticFiles) {
  console.log('\n📁 Probando archivos estáticos...');
  
  const results = [];
  
  for (const file of staticFiles) {
    const result = await testStaticFile(file);
    results.push({ file, ...result });
    
    // Pequeña pausa entre requests
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  return results;
}

async function testCommonStaticPaths() {
  console.log('\n🔧 Probando rutas estáticas comunes...');
  
  const commonPaths = [
    '/_next/static/css/',
    '/_next/static/chunks/',
    '/_next/static/media/',
    '/favicon.ico',
    '/robots.txt'
  ];
  
  const results = [];
  
  for (const path of commonPaths) {
    const result = await testStaticFile(path);
    results.push({ path, ...result });
  }
  
  return results;
}

function generateReport(mainPageFiles, staticResults, commonResults) {
  const report = {
    timestamp: new Date().toISOString(),
    deploymentUrl: DEPLOYMENT_URL,
    summary: {
      mainPageOk: mainPageFiles.length > 0,
      staticFilesFound: mainPageFiles.length,
      staticFilesTested: staticResults.length,
      staticFilesWorking: staticResults.filter(r => r.success).length,
      commonPathsTested: commonResults.length,
      commonPathsWorking: commonResults.filter(r => r.success).length
    },
    issues: [],
    recommendations: []
  };
  
  // Analizar problemas
  const failedStatic = staticResults.filter(r => !r.success);
  const failedCommon = commonResults.filter(r => !r.success);
  
  if (failedStatic.length > 0) {
    report.issues.push(`${failedStatic.length} archivos estáticos fallaron`);
  }
  
  if (failedCommon.length > 0) {
    report.issues.push(`${failedCommon.length} rutas comunes fallaron`);
  }
  
  if (report.summary.staticFilesWorking === 0) {
    report.issues.push('Ningún archivo estático está funcionando');
    report.recommendations.push('Verificar configuración de Firebase Hosting');
    report.recommendations.push('Revisar rewrites en firebase.json');
    report.recommendations.push('Asegurar que el build se haya completado correctamente');
  }
  
  // Guardar reporte
  const fs = require('fs');
  const path = require('path');
  const reportPath = path.join(__dirname, '..', 'deployment-test-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n📄 Reporte guardado en: ${reportPath}`);
  
  return report;
}

async function main() {
  console.log(`🚀 Probando despliegue en: ${DEPLOYMENT_URL}\n`);
  
  try {
    // Probar página principal
    const mainPageFiles = await testMainPage();
    
    // Probar archivos estáticos encontrados en la página principal
    let staticResults = [];
    if (mainPageFiles.length > 0) {
      staticResults = await testStaticFiles(mainPageFiles.slice(0, 10)); // Probar solo los primeros 10
    }
    
    // Probar rutas comunes
    const commonResults = await testCommonStaticPaths();
    
    // Generar reporte
    const report = generateReport(mainPageFiles, staticResults, commonResults);
    
    // Mostrar resumen
    console.log('\n📋 Resumen:');
    console.log(`Página principal: ${report.summary.mainPageOk ? '✅ OK' : '❌ FALLÓ'}`);
    console.log(`Archivos estáticos encontrados: ${report.summary.staticFilesFound}`);
    console.log(`Archivos estáticos funcionando: ${report.summary.staticFilesWorking}/${report.summary.staticFilesTested}`);
    console.log(`Rutas comunes funcionando: ${report.summary.commonPathsWorking}/${report.summary.commonPathsTested}`);
    
    if (report.issues.length > 0) {
      console.log('\n⚠️  Problemas encontrados:');
      report.issues.forEach(issue => console.log(`   • ${issue}`));
    }
    
    if (report.recommendations.length > 0) {
      console.log('\n💡 Recomendaciones:');
      report.recommendations.forEach(rec => console.log(`   • ${rec}`));
    }
    
    if (report.summary.staticFilesWorking === 0 && report.summary.commonPathsWorking === 0) {
      console.log('\n❌ El despliegue tiene problemas serios con archivos estáticos');
      process.exit(1);
    } else if (report.summary.staticFilesWorking < report.summary.staticFilesTested / 2) {
      console.log('\n⚠️  Algunos archivos estáticos no están funcionando correctamente');
    } else {
      console.log('\n✅ El despliegue parece estar funcionando correctamente');
    }
    
  } catch (error) {
    console.error('❌ Error durante las pruebas:', error.message);
    process.exit(1);
  }
}

// Permitir especificar URL personalizada
if (process.argv[2]) {
  process.env.DEPLOYMENT_URL = process.argv[2];
}

main();
