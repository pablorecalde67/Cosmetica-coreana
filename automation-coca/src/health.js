// 🏥 ADVANCED HEALTH CHECK & DIAGNOSTICS
// Monitorea: CPU, memoria, respuestas de API, estado de servicios externos

import os from 'os';
import { cacheManager } from './middleware/cache.js';

let startTime = Date.now();
let requestCount = 0;
let errorCount = 0;

export const healthMetrics = {
  startTime,
  requests: 0,
  errors: 0,
  lastError: null,
};

export const recordRequest = () => {
  requestCount++;
  healthMetrics.requests = requestCount;
};

export const recordError = (error) => {
  errorCount++;
  healthMetrics.errors = errorCount;
  healthMetrics.lastError = {
    message: error.message,
    timestamp: new Date(),
  };
};

export const getHealthStatus = () => {
  const uptime = Date.now() - startTime;
  const cpus = os.cpus();
  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();
  const usedMemory = totalMemory - freeMemory;

  // Calculate CPU usage (simplified)
  let avgLoad = os.loadavg()[0];
  const cpuUsagePercent = (avgLoad / cpus.length) * 100;

  const memoryUsagePercent = (usedMemory / totalMemory) * 100;

  return {
    status: 'HEALTHY',
    timestamp: new Date().toISOString(),
    uptime: {
      ms: uptime,
      seconds: Math.floor(uptime / 1000),
      minutes: Math.floor(uptime / 60000),
      hours: Math.floor(uptime / 3600000),
    },
    server: {
      host: os.hostname(),
      platform: os.platform(),
      arch: os.arch(),
    },
    system: {
      cpuCount: cpus.length,
      cpuUsage: `${cpuUsagePercent.toFixed(2)}%`,
      memory: {
        total: `${(totalMemory / 1024 / 1024).toFixed(2)} MB`,
        used: `${(usedMemory / 1024 / 1024).toFixed(2)} MB`,
        free: `${(freeMemory / 1024 / 1024).toFixed(2)} MB`,
        usagePercent: `${memoryUsagePercent.toFixed(2)}%`,
      },
      loadAverage: os.loadavg().map((x) => x.toFixed(2)),
    },
    application: {
      requests: requestCount,
      errors: errorCount,
      errorRate: errorCount > 0 ? ((errorCount / requestCount) * 100).toFixed(2) + '%' : '0%',
      cacheSize: cacheManager.size(),
      lastError: healthMetrics.lastError,
    },
    nodeVersion: process.version,
    memoryUsage: {
      heapUsed: `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB`,
      heapTotal: `${(process.memoryUsage().heapTotal / 1024 / 1024).toFixed(2)} MB`,
      rss: `${(process.memoryUsage().rss / 1024 / 1024).toFixed(2)} MB`,
    },
    warnings: getWarnings(cpuUsagePercent, memoryUsagePercent, errorCount),
  };
};

const getWarnings = (cpuUsage, memoryUsage, errorCount) => {
  const warnings = [];

  if (cpuUsage > 80) {
    warnings.push('⚠️ CPU usage alto (> 80%)');
  }

  if (memoryUsage > 85) {
    warnings.push('⚠️ Memory usage alto (> 85%)');
  }

  if (errorCount > 10) {
    warnings.push('⚠️ Error rate alto (> 10 errores)');
  }

  return warnings;
};

export const getServiceStatus = async (config) => {
  const services = {
    stripe: { available: !!config.STRIPE_SECRET_KEY },
    paypal: { available: !!config.PAYPAL_CLIENT_SECRET },
    email: { available: !!config.EMAIL_USER },
    whatsapp: { available: !!config.WHATSAPP_OWNER_NUMBER },
    instagram: { available: !!config.INSTAGRAM_USERNAME },
    anthropic: { available: !!config.ANTHROPIC_API_KEY },
  };

  return services;
};

// Detailed diagnostic report
export const getDiagnostics = (config) => {
  return {
    health: getHealthStatus(),
    services: getServiceStatus(config),
    cache: {
      enabled: true,
      size: cacheManager.size(),
      implementation: 'In-Memory',
    },
    environment: {
      node_env: process.env.NODE_ENV,
      port: process.env.PORT,
    },
  };
};
