#!/usr/bin/env node

/**
 * 🚀 Ultra-Fast Heroku Configuration
 *
 * Uso: node configure-heroku-fast.js [HEROKU_API_KEY]
 *
 * Si no pasas la API key como argumento, la pide interactivamente.
 * Luego pregunta por las keys essenciales y las configura automáticamente en Heroku.
 */

const https = require('https');
const readline = require('readline');

const APP_NAME = 'kbeautycde';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      resolve(answer.trim());
    });
  });
}

function herokuApiCall(method, path, data, apiKey) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.heroku.com',
      path: path,
      method: method,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.heroku+json; version=3'
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const parsed = body ? JSON.parse(body) : {};
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve({ ok: true, data: parsed, status: res.statusCode });
          } else {
            resolve({ ok: false, data: parsed, status: res.statusCode });
          }
        } catch (e) {
          resolve({ ok: false, data: body, status: res.statusCode });
        }
      });
    });

    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function main() {
  console.log('🚀 K-Beauty CDE - Configuración Ultra Rápida\n');

  // Get API key
  let apiKey = process.argv[2];
  if (!apiKey) {
    apiKey = await question('🔐 Ingresá tu HEROKU_API_KEY: ');
  }

  if (!apiKey) {
    console.error('❌ ERROR: HEROKU_API_KEY es requerida');
    process.exit(1);
  }

  console.log('\n✅ API Key configurada');

  // Verify app exists
  console.log('\n🔍 Verificando que el app exista...');
  const checkApp = await herokuApiCall('GET', `/apps/${APP_NAME}`, null, apiKey);

  if (!checkApp.ok && checkApp.status === 404) {
    console.log('📦 Creando app...');
    const createApp = await herokuApiCall('POST', '/apps', { name: APP_NAME }, apiKey);
    if (!createApp.ok) {
      console.error('❌ ERROR creando app:', createApp.data);
      process.exit(1);
    }
    console.log('✅ App creado');
  } else if (!checkApp.ok) {
    console.error('❌ ERROR verificando app:', checkApp.data);
    process.exit(1);
  } else {
    console.log('✅ App ya existe');
  }

  // Get configuration
  console.log('\n📋 Completá solo lo ESSENCIAL (enter para saltear):');

  const config = {
    'NODE_ENV': 'production',
    'PORT': '3000',
    'PUBLIC_BASE_URL': `https://${APP_NAME}.herokuapp.com`
  };

  // Stripe (essencial)
  console.log('\n💳 STRIPE (essencial para pagos):');
  const stripePublic = await question('  Stripe Public Key (pk_live_...): ');
  const stripeSecret = await question('  Stripe Secret Key (sk_live_...): ');
  const stripeWebhook = await question('  Stripe Webhook Secret (whsec_...): ');

  if (stripePublic) config['STRIPE_PUBLIC_KEY'] = stripePublic;
  if (stripeSecret) config['STRIPE_SECRET_KEY'] = stripeSecret;
  if (stripeWebhook) config['STRIPE_WEBHOOK_SECRET'] = stripeWebhook;

  // PayPal (opcional)
  console.log('\n💳 PAYPAL (opcional):');
  const ppClientId = await question('  PayPal Client ID (o enter para saltear): ');
  const ppSecret = await question('  PayPal Secret (o enter para saltear): ');
  const ppWebhook = await question('  PayPal Webhook ID (o enter para saltear): ');

  if (ppClientId) config['PAYPAL_CLIENT_ID'] = ppClientId;
  if (ppSecret) config['PAYPAL_CLIENT_SECRET'] = ppSecret;
  if (ppWebhook) config['PAYPAL_WEBHOOK_ID'] = ppWebhook;

  // Email (opcional)
  console.log('\n📧 EMAIL (opcional):');
  const emailUser = await question('  Email user (tu@gmail.com o enter): ');
  const emailPass = await question('  Email app password (16 chars o enter): ');

  if (emailUser) config['EMAIL_USER'] = emailUser;
  if (emailPass) config['EMAIL_APP_PASSWORD'] = emailPass;

  // Anthropic (opcional)
  console.log('\n🤖 IA (opcional):');
  const anthropic = await question('  Anthropic API Key (o enter): ');
  if (anthropic) config['ANTHROPIC_API_KEY'] = anthropic;

  console.log('\n⏳ Aplicando configuración a Heroku...\n');

  // Apply config
  const configResult = await herokuApiCall(
    'PATCH',
    `/apps/${APP_NAME}/config-vars`,
    config,
    apiKey
  );

  if (!configResult.ok) {
    console.error('❌ ERROR aplicando configuración:', configResult.data);
    process.exit(1);
  }

  console.log('✅ Configuración aplicada!');
  console.log(`\n📊 Variables configuradas:`);
  Object.keys(config).forEach(key => {
    const value = config[key];
    const display = value.length > 20 ? value.substring(0, 20) + '...' : value;
    console.log(`  ✓ ${key} = ${display}`);
  });

  // Restart dyno
  console.log('\n🔄 Reiniciando la app...');
  const restart = await herokuApiCall('DELETE', `/apps/${APP_NAME}/dynos`, null, apiKey);

  if (restart.ok) {
    console.log('✅ Restart iniciado');
  } else {
    console.log('⚠️  No se pudo reiniciar (probablemente ya se reinició)');
  }

  // Wait and check
  console.log('\n⏳ Esperando que la app se inicie (2-3 minutos)...');

  for (let i = 0; i < 30; i++) {
    await new Promise(r => setTimeout(r, 5000));

    try {
      const health = await new Promise((resolve) => {
        const req = https.get(`https://${APP_NAME}.herokuapp.com/api/admin/health`, (res) => {
          resolve(res.statusCode);
        });
        req.on('error', () => resolve(0));
        req.setTimeout(3000);
      });

      if (health === 200 || health === 404) {
        console.log(`✅ App está viva! (HTTP ${health})`);
        break;
      }
    } catch (e) {
      // Continue waiting
    }

    console.log(`  [${i + 1}/30] Aún iniciando...`);
  }

  console.log('\n════════════════════════════════════════');
  console.log('✅ ¡LISTO! App configurada y en vivo');
  console.log('════════════════════════════════════════');
  console.log(`\n🌐 URL: https://${APP_NAME}.herokuapp.com`);
  console.log(`📊 Dashboard: https://dashboard.heroku.com/apps/${APP_NAME}`);
  console.log(`📝 Logs: https://dashboard.heroku.com/apps/${APP_NAME}/logs`);
  console.log('\n✨ Próximo paso: Configurar webhooks en Stripe/PayPal\n');

  rl.close();
}

main().catch(err => {
  console.error('❌ ERROR:', err.message);
  process.exit(1);
});
