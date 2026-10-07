import express from 'express';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from './config.js';
import { MEDIA_DIR } from './store.js';
import { startWhatsapp } from './whatsapp.js';
import { startEmailIngest } from './email.js';
import monitor from './monitoring.js';
import { recordRequest, recordError } from './health.js';

// Import routers
import apiRouter from './routes/api.js';
import checkoutRouter from './routes/checkout.js';
import shippingRouter from './routes/shipping.js';
import webhooksRouter from './routes/webhooks.js';
import instagramRouter from './routes/instagram.js';
import adminRouter from './routes/admin.js';
import monitoringRouter from './routes/monitoring.js';
import whatsappSetupRouter from './routes/whatsappSetup.js';
import pielRouter from './routes/piel.js';
import apiV2Router from './routes/api-v2.js';
import productsRouter from './routes/products.js';
import cartRouter from './routes/cart.js';
import usersRouter from './routes/users.js';
import viralAutomationRouter from './routes/viral-automation.js';
import notificationsRouter from './routes/notifications.js';
import catalogLoaderRouter from './routes/catalog-loader.js';

// Import advanced middleware
import {
  securityHeaders,
  corsConfig,
  requestLogger,
  errorHandler,
  compressionMiddleware,
} from './middleware/security.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

// ============= ADVANCED MIDDLEWARE STACK =============

// 1. Security headers
app.use(securityHeaders);

// 2. Compression
app.use(compressionMiddleware);

// 3. CORS
app.use(cors(corsConfig));

// 4. Body parsing (increased limit for image uploads)
app.use(express.json({ limit: '10mb' }));

// 5. Request logging & metrics
app.use(requestLogger);
app.use((req, res, next) => {
  recordRequest();
  next();
});

// ============= STATIC FILES & MEDIA =============

app.use(express.static(path.join(__dirname, '..', 'public')));
app.use('/media', express.static(MEDIA_DIR));

// ============= MONITORING =============

app.use(monitor.middleware());

// ============= API ROUTES =============

// API v2 (advanced with caching, rate limiting, diagnostics)
app.use('/api/v2', apiV2Router);

// E-commerce core routes (NEW)
app.use('/api/products', productsRouter);
app.use('/api/cart', cartRouter);
app.use('/api/users', usersRouter);

// Viral automation routes (PHASE 3)
app.use('/api/viral', viralAutomationRouter);

// Notifications & Push (PHASE 3)
app.use('/api/notifications', notificationsRouter);

// Catalog loader & Products (PHASE 3)
app.use('/api/catalog', catalogLoaderRouter);

// Existing routes
app.use('/api/piel', pielRouter);
app.use('/api', apiRouter);
app.use('/api/checkout', checkoutRouter);
app.use('/api/shipping', shippingRouter);
app.use('/api/webhooks', webhooksRouter);
app.use('/api/instagram', instagramRouter);
app.use('/api/admin', adminRouter);
app.use('/api/monitoring', monitoringRouter);
app.use('/', whatsappSetupRouter);

// ============= ERROR HANDLING =============

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint no encontrado', path: req.path });
});

// Global error handler
app.use((err, req, res, next) => {
  recordError(err);
  console.error('[ERROR]', err);

  // Check error type and respond appropriately
  if (err.code === 'STRIPE_ERROR') {
    return res.status(402).json({ error: 'Error de pago', details: err.message });
  }

  if (err.code === 'VALIDATION_ERROR') {
    return res.status(400).json({ error: 'Validación fallida', details: err.message });
  }

  res.status(500).json({ error: 'Error interno del servidor' });
});

// ============= SERVER STARTUP =============

const server = app.listen(config.port, () => {
  console.log(`\n${'═'.repeat(50)}`);
  console.log(`✅ K-BEAUTY CDE - PRODUCCIÓN AVANZADA`);
  console.log(`${'═'.repeat(50)}`);
  console.log(`🌐 Panel: http://localhost:${config.port}`);
  console.log(`📱 WhatsApp Setup: /whatsapp-setup`);
  console.log(`📊 API v2: /api/v2`);
  console.log(`📈 Diagnostics: /api/v2/diagnostics`);
  console.log(`${'═'.repeat(50)}\n`);
});

// ============= BACKGROUND SERVICES =============

// Start WhatsApp
startWhatsapp().catch((err) => {
  console.error('[COCA] ❌ No se pudo iniciar WhatsApp:', err.message);
  recordError(err);
});

// Start Email
startEmailIngest().catch((err) => {
  console.error('[COCA] ❌ No se pudo iniciar la ingesta por mail:', err.message);
  recordError(err);
});

// ============= GRACEFUL SHUTDOWN =============

process.on('SIGTERM', () => {
  console.log('[SHUTDOWN] Received SIGTERM, closing server...');
  server.close(() => {
    console.log('[SHUTDOWN] Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('[SHUTDOWN] Received SIGINT, closing server...');
  server.close(() => {
    console.log('[SHUTDOWN] Server closed');
    process.exit(0);
  });
});
