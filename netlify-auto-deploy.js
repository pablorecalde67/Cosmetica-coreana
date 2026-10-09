#!/usr/bin/env node

/**
 * Netlify Auto-Deploy
 * Despliega automáticamente a Netlify sin intervención manual
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Configuración
const NETLIFY_SITE_ID = 'serene-axolotl-437b9f'; // Tu sitio actual
const NETLIFY_API_TOKEN = process.env.NETLIFY_AUTH_TOKEN;
const DEPLOY_DIR = path.join(__dirname, 'docs');

if (!NETLIFY_API_TOKEN) {
  console.error('❌ Error: NETLIFY_AUTH_TOKEN no está configurado');
  console.error('Por favor, asigna el token y reinténtalo');
  process.exit(1);
}

async function deployToNetlify() {
  try {
    console.log('🚀 Iniciando despliegue a Netlify...');
    
    // Crear ZIP del directorio /docs
    const archiver = require('archiver');
    const output = fs.createWriteStream('deploy.zip');
    const archive = archiver('zip', { zlib: { level: 9 } });

    archive.pipe(output);
    archive.directory(DEPLOY_DIR, false);
    await archive.finalize();

    // Esperar a que se complete la compresión
    await new Promise((resolve, reject) => {
      output.on('close', resolve);
      output.on('error', reject);
    });

    console.log('📦 ZIP creado correctamente');

    // Subir a Netlify
    const zipBuffer = fs.readFileSync('deploy.zip');
    
    const options = {
      hostname: 'api.netlify.com',
      path: `/api/v1/sites/${NETLIFY_SITE_ID}/deploys`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NETLIFY_API_TOKEN}`,
        'Content-Type': 'application/zip',
        'Content-Length': zipBuffer.length
      }
    };

    return new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            console.log('✅ Despliegue completado en Netlify');
            console.log('🌐 Tu sitio está en vivo en: https://kbeautycde.com');
            fs.unlinkSync('deploy.zip');
            resolve();
          } else {
            reject(new Error(`Error: ${res.statusCode} - ${data}`));
          }
        });
      });

      req.on('error', reject);
      req.write(zipBuffer);
      req.end();
    });

  } catch (error) {
    console.error('❌ Error en despliegue:', error.message);
    process.exit(1);
  }
}

deployToNetlify();
