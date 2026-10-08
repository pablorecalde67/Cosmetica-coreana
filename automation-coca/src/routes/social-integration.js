/**
 * SOCIAL INTEGRATION ROUTES
 * Instagram, WhatsApp, TikTok, Analytics
 */

import express from 'express';
import SocialMediaAPI from '../services/social-media-api.js';
import AnalyticsTracker from '../services/analytics-tracker.js';

const router = express.Router();

// Instanciar servicios
const social = new SocialMediaAPI();
const analytics = new AnalyticsTracker();

/**
 * POST /api/social/publish
 * Publicar producto en todas las plataformas
 */
router.post('/publish', async (req, res) => {
  try {
    const { product } = req.body;

    if (!product || !product.name || !product.price) {
      return res.status(400).json({
        success: false,
        error: 'Missing required product fields'
      });
    }

    // Publicar a todas las plataformas
    const results = await social.publishToAll(product);

    return res.json({
      success: true,
      message: 'Product published to social media',
      results: results,
      stats: social.getStats()
    });
  } catch (error) {
    console.error('[SOCIAL PUBLISH ERROR]', error.message);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/social/instagram
 * Publicar solo en Instagram
 */
router.post('/instagram', async (req, res) => {
  try {
    const { product } = req.body;

    if (!product) {
      return res.status(400).json({
        success: false,
        error: 'Missing product data'
      });
    }

    const result = await social.publishToInstagram(product);

    return res.json({
      success: result.success,
      result: result,
      stats: social.getStats()
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/social/whatsapp
 * Enviar alerta por WhatsApp
 */
router.post('/whatsapp', async (req, res) => {
  try {
    const { phoneNumber, product } = req.body;

    if (!phoneNumber || !product) {
      return res.status(400).json({
        success: false,
        error: 'Missing phoneNumber or product'
      });
    }

    const result = await social.sendWhatsAppAlert(phoneNumber, product);

    return res.json({
      success: result.success,
      result: result,
      stats: social.getStats()
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/social/tiktok
 * Publicar en TikTok
 */
router.post('/tiktok', async (req, res) => {
  try {
    const { videoUrl, productName, price } = req.body;

    if (!videoUrl || !productName || !price) {
      return res.status(400).json({
        success: false,
        error: 'Missing videoUrl, productName, or price'
      });
    }

    const result = await social.publishToTikTok(videoUrl, productName, price);

    return res.json({
      success: result.success,
      result: result
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/social/stats
 * Obtener estadísticas de publicaciones
 */
router.get('/stats', (req, res) => {
  try {
    const stats = social.getStats();
    return res.json({
      success: true,
      stats: stats
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================
// ANALYTICS ROUTES
// ============================================================

/**
 * POST /api/analytics/pageview
 * Trackear page view en GA4 + Facebook
 */
router.post('/analytics/pageview', async (req, res) => {
  try {
    const { sessionId, userId, pageTitle, pagePath } = req.body;

    // GA4
    await analytics.trackPageView(sessionId, userId, pageTitle, pagePath);

    // Facebook
    if (req.body.userData) {
      await analytics.trackFacebookPageView(userId, pagePath, req.body.userData);
    }

    return res.json({
      success: true,
      message: 'Page view tracked',
      stats: analytics.getEventStats()
    });
  } catch (error) {
    console.error('[ANALYTICS PAGEVIEW ERROR]', error.message);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/analytics/view-item
 * Trackear vista de producto
 */
router.post('/analytics/view-item', async (req, res) => {
  try {
    const { sessionId, userId, product } = req.body;

    if (!product) {
      return res.status(400).json({
        success: false,
        error: 'Missing product data'
      });
    }

    await analytics.trackViewItem(sessionId, userId, product);

    return res.json({
      success: true,
      message: 'Product view tracked'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/analytics/add-to-cart
 * Trackear producto agregado al carrito
 */
router.post('/analytics/add-to-cart', async (req, res) => {
  try {
    const { sessionId, userId, product, quantity } = req.body;

    if (!product) {
      return res.status(400).json({
        success: false,
        error: 'Missing product data'
      });
    }

    // GA4
    await analytics.trackViewItem(sessionId, userId, product);

    // Facebook
    await analytics.trackFacebookAddToCart(userId, product, quantity);

    return res.json({
      success: true,
      message: 'Add to cart tracked'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/analytics/purchase
 * Trackear compra (conversión)
 */
router.post('/analytics/purchase', async (req, res) => {
  try {
    const { sessionId, userId, orderId, products, totalValue, userData } = req.body;

    if (!orderId || !products || !totalValue) {
      return res.status(400).json({
        success: false,
        error: 'Missing orderId, products, or totalValue'
      });
    }

    // GA4
    await analytics.trackPurchase(sessionId, userId, orderId, products, totalValue);

    // Facebook
    await analytics.trackFacebookPurchase(userId, orderId, totalValue, products, userData);

    return res.json({
      success: true,
      message: 'Purchase conversion tracked',
      orderId: orderId,
      value: totalValue
    });
  } catch (error) {
    console.error('[ANALYTICS PURCHASE ERROR]', error.message);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/analytics/ai-analysis
 * Trackear análisis de piel con IA
 */
router.post('/analytics/ai-analysis', async (req, res) => {
  try {
    const { sessionId, userId, skinType, analysisTime } = req.body;

    await analytics.trackAIAnalysis(sessionId, userId, skinType, analysisTime);

    return res.json({
      success: true,
      message: 'AI analysis tracked'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/analytics/stats
 * Obtener estadísticas de eventos
 */
router.get('/analytics/stats', (req, res) => {
  try {
    const stats = analytics.getEventStats();
    return res.json({
      success: true,
      stats: stats
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/analytics/custom-event
 * Trackear evento personalizado (GA4)
 */
router.post('/analytics/custom-event', async (req, res) => {
  try {
    const { sessionId, userId, eventName, eventData } = req.body;

    if (!eventName) {
      return res.status(400).json({
        success: false,
        error: 'Missing eventName'
      });
    }

    // Aquí se podría expandir para soportar eventos personalizados
    // Por ahora solo validamos

    return res.json({
      success: true,
      message: `Custom event '${eventName}' would be tracked`
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
