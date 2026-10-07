/**
 * Monitoring and Alerting System
 * Tracks errors, performance, and uptime
 */

const fs = require('fs');
const path = require('path');

const METRICS_FILE = path.join(__dirname, '../data/metrics.json');
const ALERTS_FILE = path.join(__dirname, '../data/alerts.json');

class Monitor {
  constructor() {
    this.metrics = this.loadMetrics();
    this.alerts = this.loadAlerts();
    this.startTime = Date.now();
    this.requestCount = 0;
    this.errorCount = 0;
    this.avgResponseTime = 0;
  }

  loadMetrics() {
    try {
      if (fs.existsSync(METRICS_FILE)) {
        return JSON.parse(fs.readFileSync(METRICS_FILE, 'utf-8'));
      }
    } catch (err) {
      console.error('Error loading metrics:', err);
    }
    return this.getDefaultMetrics();
  }

  loadAlerts() {
    try {
      if (fs.existsSync(ALERTS_FILE)) {
        return JSON.parse(fs.readFileSync(ALERTS_FILE, 'utf-8'));
      }
    } catch (err) {
      console.error('Error loading alerts:', err);
    }
    return { alerts: [] };
  }

  getDefaultMetrics() {
    return {
      startTime: new Date().toISOString(),
      uptime: 0,
      requests: 0,
      errors: 0,
      avgResponseTime: 0,
      endpoints: {},
      errors_log: [],
      performance: []
    };
  }

  saveMetrics() {
    try {
      fs.writeFileSync(METRICS_FILE, JSON.stringify(this.metrics, null, 2));
    } catch (err) {
      console.error('Error saving metrics:', err);
    }
  }

  saveAlerts() {
    try {
      fs.writeFileSync(ALERTS_FILE, JSON.stringify(this.alerts, null, 2));
    } catch (err) {
      console.error('Error saving alerts:', err);
    }
  }

  // Middleware for Express to track requests
  middleware() {
    return (req, res, next) => {
      const startTime = Date.now();

      res.on('finish', () => {
        const duration = Date.now() - startTime;
        const endpoint = `${req.method} ${req.path}`;

        // Track endpoint metrics
        if (!this.metrics.endpoints[endpoint]) {
          this.metrics.endpoints[endpoint] = {
            requests: 0,
            errors: 0,
            avgResponseTime: 0,
            lastAccess: null
          };
        }

        this.metrics.endpoints[endpoint].requests++;
        this.metrics.endpoints[endpoint].lastAccess = new Date().toISOString();

        // Update response time
        const prev = this.metrics.endpoints[endpoint].avgResponseTime;
        const count = this.metrics.endpoints[endpoint].requests;
        this.metrics.endpoints[endpoint].avgResponseTime =
          (prev * (count - 1) + duration) / count;

        // Track if error
        if (res.statusCode >= 400) {
          this.metrics.endpoints[endpoint].errors++;
          this.recordError(endpoint, res.statusCode, duration);
        }

        this.metrics.requests++;
        this.updateOverallMetrics();
      });

      next();
    };
  }

  recordError(endpoint, statusCode, duration) {
    const error = {
      timestamp: new Date().toISOString(),
      endpoint,
      statusCode,
      duration,
      severity: this.getSeverity(statusCode)
    };

    this.metrics.errors_log.push(error);

    // Keep only last 1000 errors
    if (this.metrics.errors_log.length > 1000) {
      this.metrics.errors_log.shift();
    }

    this.metrics.errors++;

    // Check alert thresholds
    this.checkAlertThresholds(endpoint, statusCode);
  }

  getSeverity(statusCode) {
    if (statusCode >= 500) return 'critical';
    if (statusCode >= 400) return 'warning';
    return 'info';
  }

  checkAlertThresholds(endpoint, statusCode) {
    const errorRate = this.getErrorRate();

    // Alert if error rate > 5%
    if (errorRate > 0.05) {
      this.createAlert('high_error_rate', `Error rate at ${(errorRate * 100).toFixed(2)}%`, 'critical');
    }

    // Alert on repeated 5xx errors
    const recentErrors = this.metrics.errors_log
      .filter(e => e.endpoint === endpoint && e.statusCode >= 500)
      .slice(-5);

    if (recentErrors.length >= 3) {
      this.createAlert('repeated_errors', `${endpoint} failing repeatedly`, 'warning');
    }
  }

  createAlert(type, message, severity = 'warning') {
    // Avoid duplicate alerts within 5 minutes
    const recentAlert = this.alerts.alerts.find(a =>
      a.type === type &&
      (Date.now() - new Date(a.timestamp).getTime()) < 300000
    );

    if (recentAlert) return;

    const alert = {
      id: Date.now(),
      type,
      message,
      severity,
      timestamp: new Date().toISOString(),
      resolved: false
    };

    this.alerts.alerts.push(alert);
    this.saveAlerts();

    console.warn(`[ALERT] ${severity.toUpperCase()}: ${message}`);
  }

  updateOverallMetrics() {
    this.metrics.uptime = Math.floor((Date.now() - new Date(this.metrics.startTime).getTime()) / 1000);
    this.metrics.avgResponseTime = this.calculateAverageResponseTime();
    this.saveMetrics();
  }

  calculateAverageResponseTime() {
    const times = Object.values(this.metrics.endpoints)
      .map(e => e.avgResponseTime);

    if (times.length === 0) return 0;
    return times.reduce((a, b) => a + b, 0) / times.length;
  }

  getErrorRate() {
    if (this.metrics.requests === 0) return 0;
    return this.metrics.errors / this.metrics.requests;
  }

  getStatus() {
    const uptime = this.metrics.uptime;
    const uptimePercent = 99.9; // Placeholder - calculate based on real data

    return {
      status: uptimePercent > 99 ? 'healthy' : 'degraded',
      uptime: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m`,
      uptimePercent,
      requests: this.metrics.requests,
      errors: this.metrics.errors,
      errorRate: `${(this.getErrorRate() * 100).toFixed(2)}%`,
      avgResponseTime: `${Math.round(this.metrics.avgResponseTime)}ms`,
      activeAlerts: this.alerts.alerts.filter(a => !a.resolved).length,
      topErrors: this.getTopErrors(),
      slowestEndpoints: this.getSlowestEndpoints()
    };
  }

  getTopErrors() {
    const errorsByEndpoint = {};
    this.metrics.errors_log.forEach(error => {
      if (!errorsByEndpoint[error.endpoint]) {
        errorsByEndpoint[error.endpoint] = 0;
      }
      errorsByEndpoint[error.endpoint]++;
    });

    return Object.entries(errorsByEndpoint)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([endpoint, count]) => ({ endpoint, count }));
  }

  getSlowestEndpoints() {
    return Object.entries(this.metrics.endpoints)
      .sort((a, b) => b[1].avgResponseTime - a[1].avgResponseTime)
      .slice(0, 5)
      .map(([endpoint, data]) => ({
        endpoint,
        avgResponseTime: `${Math.round(data.avgResponseTime)}ms`,
        requests: data.requests
      }));
  }

  getAlerts() {
    return {
      total: this.alerts.alerts.length,
      active: this.alerts.alerts.filter(a => !a.resolved).length,
      byType: this.groupAlertsByType(),
      recent: this.alerts.alerts.slice(-10).reverse()
    };
  }

  groupAlertsByType() {
    const grouped = {};
    this.alerts.alerts.forEach(alert => {
      if (!grouped[alert.type]) {
        grouped[alert.type] = { total: 0, active: 0 };
      }
      grouped[alert.type].total++;
      if (!alert.resolved) {
        grouped[alert.type].active++;
      }
    });
    return grouped;
  }

  resolveAlert(alertId) {
    const alert = this.alerts.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.resolved = true;
      alert.resolvedAt = new Date().toISOString();
      this.saveAlerts();
      return { success: true };
    }
    return { success: false, error: 'Alert not found' };
  }

  getHealthCheck() {
    const errorRate = this.getErrorRate();
    const isHealthy = errorRate < 0.05 && this.metrics.requests > 0;

    return {
      success: isHealthy,
      status: isHealthy ? 'up' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime: `${Math.floor(this.metrics.uptime / 3600)}h`,
      requests: this.metrics.requests,
      errors: this.metrics.errors,
      errorRate: `${(errorRate * 100).toFixed(2)}%`,
      avgResponseTime: `${Math.round(this.metrics.avgResponseTime)}ms`,
      activeAlerts: this.alerts.alerts.filter(a => !a.resolved).length
    };
  }

  reset() {
    this.metrics = this.getDefaultMetrics();
    this.alerts = { alerts: [] };
    this.startTime = Date.now();
    this.saveMetrics();
    this.saveAlerts();
  }
}

module.exports = new Monitor();
