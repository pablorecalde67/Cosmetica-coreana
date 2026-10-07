/**
 * Monitoring and Campaigns API Routes
 * Endpoints para monitoreo de sistema y gestión de campañas de email
 */

import { Router } from 'express';
import monitor from '../monitoring.js';
import campaigns from '../email-campaigns.js';

const router = Router();

/**
 * Middleware de autenticación
 */
function authAdmin(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  const adminToken = process.env.ADMIN_TOKEN || 'admin-secret-123';

  if (token !== adminToken) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

// ============= MONITORING =============

/**
 * GET /api/monitoring/status
 * Estado general del sistema
 */
router.get('/status', authAdmin, (req, res) => {
  try {
    const status = monitor.getStatus();
    res.json({ success: true, ...status });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/monitoring/health
 * Health check simple (sin autenticación, para balanceadores de carga)
 */
router.get('/health', (req, res) => {
  try {
    const health = monitor.getHealthCheck();
    const statusCode = health.success ? 200 : 503;
    res.status(statusCode).json(health);
  } catch (err) {
    res.status(503).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/monitoring/metrics
 * Métricas detalladas
 */
router.get('/metrics', authAdmin, (req, res) => {
  try {
    res.json({
      success: true,
      metrics: monitor.metrics,
      summary: {
        totalRequests: monitor.metrics.requests,
        totalErrors: monitor.metrics.errors,
        errorRate: monitor.getErrorRate(),
        uptime: monitor.metrics.uptime,
        avgResponseTime: monitor.metrics.avgResponseTime
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/monitoring/alerts
 * Alertas activas
 */
router.get('/alerts', authAdmin, (req, res) => {
  try {
    const alerts = monitor.getAlerts();
    res.json({ success: true, ...alerts });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/monitoring/alerts/:id/resolve
 * Resolver una alerta
 */
router.post('/alerts/:id/resolve', authAdmin, (req, res) => {
  try {
    const result = monitor.resolveAlert(parseInt(req.params.id));
    if (result.success) {
      res.json({ success: true, message: 'Alert resolved' });
    } else {
      res.status(404).json(result);
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/monitoring/endpoints
 * Estadísticas por endpoint
 */
router.get('/endpoints', authAdmin, (req, res) => {
  try {
    const endpoints = Object.entries(monitor.metrics.endpoints)
      .map(([endpoint, data]) => ({
        endpoint,
        requests: data.requests,
        errors: data.errors,
        errorRate: data.errors / data.requests,
        avgResponseTime: Math.round(data.avgResponseTime),
        lastAccess: data.lastAccess
      }))
      .sort((a, b) => b.requests - a.requests);

    res.json({
      success: true,
      total: endpoints.length,
      endpoints
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/monitoring/errors
 * Log de errores recientes
 */
router.get('/errors', authAdmin, (req, res) => {
  try {
    const { limit = 50 } = req.query;
    const errors = monitor.metrics.errors_log
      .slice(-parseInt(limit))
      .reverse();

    res.json({
      success: true,
      total: monitor.metrics.errors_log.length,
      count: errors.length,
      errors
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ============= EMAIL CAMPAIGNS =============

/**
 * GET /api/campaigns/status
 * Estado de todas las campañas
 */
router.get('/campaigns/status', authAdmin, (req, res) => {
  try {
    const status = campaigns.getCampaignStatus();
    res.json({ success: true, campaigns: status });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/campaigns/analytics
 * Analíticas de campañas
 */
router.get('/campaigns/analytics', authAdmin, (req, res) => {
  try {
    const analytics = campaigns.getAnalytics();
    res.json({ success: true, ...analytics });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/campaigns/:id/enable
 * Habilitar una campaña
 */
router.post('/campaigns/:id/enable', authAdmin, (req, res) => {
  try {
    const result = campaigns.enableCampaign(req.params.id);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/campaigns/:id/disable
 * Deshabilitar una campaña
 */
router.post('/campaigns/:id/disable', authAdmin, (req, res) => {
  try {
    const result = campaigns.disableCampaign(req.params.id);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/monitoring/reset
 * Reset de métricas (solo para testing)
 */
router.post('/reset', authAdmin, (req, res) => {
  try {
    if (process.env.NODE_ENV !== 'test') {
      return res.status(403).json({ error: 'Reset only allowed in test mode' });
    }
    monitor.reset();
    res.json({ success: true, message: 'Metrics reset' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
