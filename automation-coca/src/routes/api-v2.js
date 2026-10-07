// 📡 API V2 - Advanced REST API with versioning
// Rutas mejoradas con mejor estructura, documentación, y manejo de errores

import express from 'express';
import { config } from '../config.js';
import { cacheMiddleware } from '../middleware/cache.js';
import { apiLimiter } from '../middleware/security.js';
import { getHealthStatus, getDiagnostics } from '../health.js';

const router = express.Router();

// Health & Status endpoints
router.get('/health', cacheMiddleware(30000), (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
  });
});

router.get('/diagnostics', (req, res) => {
  const token = req.headers['x-admin-token'];
  if (token !== config.ADMIN_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  res.json(getDiagnostics(config));
});

// Status endpoint (detailed health)
router.get('/status', (req, res) => {
  try {
    const health = getHealthStatus();
    res.json({
      ...health,
      services: {
        stripe: !!config.STRIPE_SECRET_KEY,
        paypal: !!config.PAYPAL_CLIENT_SECRET,
        email: !!config.EMAIL_USER,
        whatsapp: !!config.WHATSAPP_OWNER_NUMBER,
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get status' });
  }
});

// Products endpoint with caching
router.get('/products', cacheMiddleware(10 * 60 * 1000), apiLimiter, (req, res) => {
  try {
    // TODO: Implement product listing from store
    res.json({
      products: [],
      total: 0,
      cached: false,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Configuration (admin only)
router.get('/config', (req, res) => {
  const token = req.headers['x-admin-token'];
  if (token !== config.ADMIN_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Return safe config (no secrets)
  const safeConfig = {
    PORT: config.PORT,
    PUBLIC_BASE_URL: config.PUBLIC_BASE_URL,
    NODE_ENV: process.env.NODE_ENV,
    stripeConfigured: !!config.STRIPE_SECRET_KEY,
    paypalConfigured: !!config.PAYPAL_CLIENT_SECRET,
    emailConfigured: !!config.EMAIL_USER,
    whatsappConfigured: !!config.WHATSAPP_OWNER_NUMBER,
    instagramConfigured: !!config.INSTAGRAM_USERNAME,
    anthropicConfigured: !!config.ANTHROPIC_API_KEY,
  };

  res.json(safeConfig);
});

// Statistics endpoint
router.get('/stats', (req, res) => {
  try {
    const health = getHealthStatus();
    res.json({
      uptime: health.uptime,
      requests: health.application.requests,
      errors: health.application.errors,
      errorRate: health.application.errorRate,
      memory: health.system.memory,
      cpu: health.system.cpuUsage,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// Version endpoint
router.get('/version', (req, res) => {
  res.json({
    api: 'v2',
    app: 'K-Beauty CDE',
    timestamp: new Date().toISOString(),
    features: [
      '🔒 Advanced Security',
      '⚡ Performance Caching',
      '📊 Detailed Diagnostics',
      '🔄 Rate Limiting',
      '📡 RESTful API v2',
      '💾 In-Memory Cache',
      '🏥 Health Monitoring',
    ],
  });
});

// API Documentation endpoint
router.get('/docs', (req, res) => {
  res.json({
    title: 'K-Beauty CDE API V2',
    version: '2.0.0',
    endpoints: {
      health: {
        method: 'GET',
        path: '/api/v2/health',
        description: 'Quick health check',
        response: { status: 'OK' },
      },
      diagnostics: {
        method: 'GET',
        path: '/api/v2/diagnostics',
        description: 'Detailed system diagnostics (admin only)',
        headers: { 'X-Admin-Token': 'required' },
      },
      status: {
        method: 'GET',
        path: '/api/v2/status',
        description: 'Detailed status with service info',
      },
      products: {
        method: 'GET',
        path: '/api/v2/products',
        description: 'List all products (cached)',
        query: { limit: 'optional', offset: 'optional' },
      },
      config: {
        method: 'GET',
        path: '/api/v2/config',
        description: 'Get safe config (admin only)',
        headers: { 'X-Admin-Token': 'required' },
      },
      stats: {
        method: 'GET',
        path: '/api/v2/stats',
        description: 'Get performance statistics',
      },
      version: {
        method: 'GET',
        path: '/api/v2/version',
        description: 'Get API version and features',
      },
    },
    authentication: {
      adminToken: 'Pass X-Admin-Token header for protected endpoints',
      methods: ['Bearer tokens', 'API Keys', 'OAuth (planned)'],
    },
    rateLimiting: {
      enabled: true,
      limits: {
        general: '100 requests per 15 minutes',
        checkout: '10 requests per minute',
        auth: '5 attempts per 15 minutes',
      },
    },
  });
});

export default router;
