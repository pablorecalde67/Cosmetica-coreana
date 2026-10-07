// 🔐 ADVANCED SECURITY MIDDLEWARE
// Implementa: CORS, rate limiting, request validation, security headers

import rateLimit from 'express-rate-limit';
import compression from 'compression';
import helmet from 'helmet';

// Rate limiters por endpoint
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 100, // 100 requests per windowMs
  message: '❌ Demasiadas requests. Espera 15 minutos.',
  standardHeaders: true,
  legacyHeaders: false,
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // 5 auth attempts per 15 min
  message: '❌ Demasiados intentos de login. Espera 15 minutos.',
  skipSuccessfulRequests: true,
});

export const checkoutLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 min
  max: 10, // 10 checkouts per minute
  message: '❌ Demasiados intentos. Espera 1 minuto.',
});

// Security headers
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", 'cdn.jsdelivr.net'],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", 'https:'],
    },
  },
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
  frameOptions: { action: 'DENY' },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
});

// CORS configuration
export const corsConfig = {
  origin: [
    'https://kbeautycde.herokuapp.com',
    'http://localhost:3000',
    'http://localhost:5173',
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Admin-Token'],
  optionsSuccessStatus: 200,
};

// Request validation middleware
export const validateRequest = (schema) => {
  return (req, res, next) => {
    try {
      // Basic validation: check required fields
      if (schema.required) {
        for (const field of schema.required) {
          if (!req.body[field]) {
            return res.status(400).json({
              error: `Campo requerido: ${field}`,
              code: 'MISSING_FIELD',
            });
          }
        }
      }

      // Type validation
      if (schema.types) {
        for (const [field, expectedType] of Object.entries(schema.types)) {
          if (req.body[field] && typeof req.body[field] !== expectedType) {
            return res.status(400).json({
              error: `${field} debe ser ${expectedType}`,
              code: 'INVALID_TYPE',
            });
          }
        }
      }

      next();
    } catch (error) {
      res.status(400).json({ error: 'Validación fallida', code: 'VALIDATION_ERROR' });
    }
  };
};

// Request/Response logging
export const requestLogger = (req, res, next) => {
  const start = Date.now();
  const originalSend = res.send;

  res.send = function (data) {
    const duration = Date.now() - start;
    console.log(
      `[${new Date().toISOString()}] ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`
    );
    originalSend.call(this, data);
  };

  next();
};

// Error handler
export const errorHandler = (err, req, res, next) => {
  console.error('[ERROR]', err);

  if (err.code === 'STRIPE_ERROR') {
    return res.status(402).json({ error: 'Error de pago', details: err.message });
  }

  if (err.code === 'VALIDATION_ERROR') {
    return res.status(400).json({ error: 'Validación fallida', details: err.message });
  }

  if (err.code === 'NOT_FOUND') {
    return res.status(404).json({ error: 'Recurso no encontrado' });
  }

  res.status(500).json({ error: 'Error interno del servidor' });
};

// Compression middleware
export const compressionMiddleware = compression({
  level: 6,
  threshold: 1024, // Solo comprimir payloads > 1KB
});
