#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

/**
 * Script para optimizar archivos estáticos para producción
 * Ejecutar con: node scripts/optimize-static-files.js
 */

const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const OPTIMIZED_DIR = path.join(PUBLIC_DIR, 'optimized');

// Crear directorio optimizado si no existe
if (!fs.existsSync(OPTIMIZED_DIR)) {
  fs.mkdirSync(OPTIMIZED_DIR, { recursive: true });
}

async function optimizeImage(inputPath, outputPath, options = {}) {
  const { width, height, quality = 80, format = 'webp' } = options;
  
  try {
    let pipeline = sharp(inputPath);
    
    if (width || height) {
      pipeline = pipeline.resize(width, height, {
        fit: 'inside',
        withoutEnlargement: true
      });
    }
    
    switch (format) {
      case 'webp':
        pipeline = pipeline.webp({ quality });
        break;
      case 'avif':
        pipeline = pipeline.avif({ quality });
        break;
      case 'jpeg':
        pipeline = pipeline.jpeg({ quality });
        break;
      case 'png':
        pipeline = pipeline.png({ quality });
        break;
    }
    
    await pipeline.toFile(outputPath);
    //console.log(`✅ Optimizado: ${path.basename(inputPath)} → ${path.basename(outputPath)}`);
  } catch (error) {
    console.error(`❌ Error optimizando ${inputPath}:`, error.message);
  }
}

async function processDirectory(dir) {
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      await processDirectory(fullPath);
    } else if (stat.isFile()) {
      const ext = path.extname(item).toLowerCase();
      const name = path.basename(item, ext);
      
      if (['.jpg', '.jpeg', '.png', '.gif', '.bmp'].includes(ext)) {
        // Crear estructura de directorios
        const relativeDir = path.relative(PUBLIC_DIR, dir);
        const optimizedSubDir = path.join(OPTIMIZED_DIR, relativeDir);
        
        if (!fs.existsSync(optimizedSubDir)) {
          fs.mkdirSync(optimizedSubDir, { recursive: true });
        }
        
        // Generar versiones optimizadas
        const baseOutput = path.join(optimizedSubDir, name);
        
        // WebP para navegadores modernos
        await optimizeImage(fullPath, `${baseOutput}.webp`, {
          quality: 80,
          format: 'webp'
        });
        
        // AVIF para navegadores súper modernos
        await optimizeImage(fullPath, `${baseOutput}.avif`, {
          quality: 70,
          format: 'avif'
        });
        
        // JPEG como fallback
        await optimizeImage(fullPath, `${baseOutput}.jpg`, {
          quality: 85,
          format: 'jpeg'
        });
        
        // Thumbnail pequeño
        await optimizeImage(fullPath, `${baseOutput}-thumb.webp`, {
          width: 300,
          quality: 70,
          format: 'webp'
        });
      }
    }
  }
}

async function generateManifest() {
  const manifest = {
    generated: new Date().toISOString(),
    files: []
  };
  
  function scanDirectory(dir, basePath = '') {
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        scanDirectory(fullPath, path.join(basePath, item));
      } else {
        manifest.files.push({
          path: path.join(basePath, item),
          size: stat.size,
          modified: stat.mtime.toISOString()
        });
      }
    }
  }
  
  scanDirectory(OPTIMIZED_DIR);
  
  fs.writeFileSync(
    path.join(OPTIMIZED_DIR, 'manifest.json'),
    JSON.stringify(manifest, null, 2)
  );
  
  //console.log('📄 Manifest generado en optimized/manifest.json');
}

async function main() {
  /*
  console.log('🚀 Iniciando optimización de archivos estáticos...');
  console.log(`📁 Directorio origen: ${PUBLIC_DIR}`);
  console.log(`📁 Directorio optimizado: ${OPTIMIZED_DIR}`);
  */
  
  try {
    await processDirectory(PUBLIC_DIR);
    await generateManifest();
    //console.log('✅ Optimización completada');
  } catch (error) {
    console.error('❌ Error durante la optimización:', error);
    process.exit(1);
  }
}

// Verificar si sharp está instalado
try {
  require('sharp');
  main();
} catch (error) {
  /*
  console.log('📦 Instalando dependencias necesarias...');
  console.log('Ejecuta: npm install sharp');
  console.log('Luego vuelve a ejecutar este script');
  */
}
