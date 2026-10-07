// 📱 NOTIFICATIONS ROUTER
// Push notifications para Pablo sobre campanhas, órdenes y trending

import express from 'express';
import { pushNotificationService } from '../services/push-notifications.js';

const router = express.Router();

// POST /api/notifications/subscribe
// Registrar dispositivo para push notifications
router.post('/subscribe', (req, res) => {
  try {
    const { subscription } = req.body;

    if (!subscription) {
      return res.status(400).json({ error: 'Subscription requerida' });
    }

    const result = pushNotificationService.registerDevice(subscription);

    res.status(201).json(result);
  } catch (error) {
    console.error('[NOTIFICATIONS] Error subscribing:', error);
    res.status(500).json({ error: 'Error al suscribirse' });
  }
});

// DELETE /api/notifications/unsubscribe/:deviceId
// Desuscribir dispositivo
router.delete('/unsubscribe/:deviceId', (req, res) => {
  try {
    const { deviceId } = req.params;
    const result = pushNotificationService.unregisterDevice(deviceId);

    if (result.success) {
      res.json(result);
    } else {
      res.status(404).json(result);
    }
  } catch (error) {
    console.error('[NOTIFICATIONS] Error unsubscribing:', error);
    res.status(500).json({ error: 'Error al desuscribirse' });
  }
});

// GET /api/notifications/devices
// Obtener dispositivos registrados
router.get('/devices', (req, res) => {
  try {
    const devices = pushNotificationService.getRegisteredDevices();
    res.json(devices);
  } catch (error) {
    console.error('[NOTIFICATIONS] Error getting devices:', error);
    res.status(500).json({ error: 'Error al obtener dispositivos' });
  }
});

// GET /api/notifications/history
// Obtener historial de notificaciones
router.get('/history', (req, res) => {
  try {
    const { limit = 50 } = req.query;
    const history = pushNotificationService.getNotificationHistory(parseInt(limit));

    res.json(history);
  } catch (error) {
    console.error('[NOTIFICATIONS] Error getting history:', error);
    res.status(500).json({ error: 'Error al obtener historial' });
  }
});

// POST /api/notifications/test
// Enviar notificación de prueba (para testing)
router.post('/test', async (req, res) => {
  try {
    const result = await pushNotificationService.sendCustomNotification(
      '🧪 Notificación de Prueba',
      'Si ves esto, las notificaciones push están funcionando correctamente en tu celular.'
    );

    res.json(result);
  } catch (error) {
    console.error('[NOTIFICATIONS] Error sending test:', error);
    res.status(500).json({ error: 'Error al enviar notificación de prueba' });
  }
});

// POST /api/notifications/campaign
// Notificar sobre nueva campaña viral
router.post('/campaign', async (req, res) => {
  try {
    const { campaignId, productName, viralScore, expectedReach } = req.body;

    if (!campaignId || !productName) {
      return res.status(400).json({
        error: 'campaignId y productName requeridos',
      });
    }

    const campaign = {
      id: campaignId,
      product: {
        name: productName,
      },
      content: {
        metrics: {
          viralScore: viralScore || 85,
          expectedReach: expectedReach || 5000,
        },
      },
    };

    const result = await pushNotificationService.notifyNewCampaign(campaign);

    res.json(result);
  } catch (error) {
    console.error('[NOTIFICATIONS] Error notifying campaign:', error);
    res.status(500).json({ error: 'Error al notificar campaña' });
  }
});

// POST /api/notifications/order
// Notificar sobre nueva orden
router.post('/order', async (req, res) => {
  try {
    const { orderId, items, total } = req.body;

    if (!orderId || !items || !total) {
      return res.status(400).json({
        error: 'orderId, items, y total requeridos',
      });
    }

    const order = {
      id: orderId,
      items,
      total,
    };

    const result = await pushNotificationService.notifyNewOrder(order);

    res.json(result);
  } catch (error) {
    console.error('[NOTIFICATIONS] Error notifying order:', error);
    res.status(500).json({ error: 'Error al notificar orden' });
  }
});

// POST /api/notifications/engagement
// Notificar sobre engagement en tiempo real
router.post('/engagement', async (req, res) => {
  try {
    const { campaignId, productName, impressions, clicks, conversions } = req.body;

    if (!campaignId || !productName) {
      return res.status(400).json({
        error: 'campaignId y productName requeridos',
      });
    }

    const campaign = {
      id: campaignId,
      product: {
        name: productName,
      },
    };

    const metrics = {
      impressions: impressions || 0,
      clicks: clicks || 0,
      conversions: conversions || 0,
    };

    const result = await pushNotificationService.notifyEngagement(campaign, metrics);

    res.json(result);
  } catch (error) {
    console.error('[NOTIFICATIONS] Error notifying engagement:', error);
    res.status(500).json({ error: 'Error al notificar engagement' });
  }
});

// POST /api/notifications/trending
// Notificar sobre producto trending
router.post('/trending', async (req, res) => {
  try {
    const { productId, productName, trendScore, rating } = req.body;

    if (!productId || !productName) {
      return res.status(400).json({
        error: 'productId y productName requeridos',
      });
    }

    const product = {
      id: productId,
      name: productName,
      trendScore: trendScore || 85,
      rating: rating || 4.7,
    };

    const result = await pushNotificationService.notifyTrendingProduct(product);

    res.json(result);
  } catch (error) {
    console.error('[NOTIFICATIONS] Error notifying trending:', error);
    res.status(500).json({ error: 'Error al notificar trending' });
  }
});

// POST /api/notifications/stock
// Notificar sobre stock bajo
router.post('/stock', async (req, res) => {
  try {
    const { productId, productName, stock } = req.body;

    if (!productId || !productName) {
      return res.status(400).json({
        error: 'productId y productName requeridos',
      });
    }

    const product = {
      id: productId,
      name: productName,
      stock: stock || 0,
    };

    const result = await pushNotificationService.notifyLowStock(product);

    res.json(result);
  } catch (error) {
    console.error('[NOTIFICATIONS] Error notifying low stock:', error);
    res.status(500).json({ error: 'Error al notificar stock bajo' });
  }
});

// POST /api/notifications/custom
// Enviar notificación personalizada
router.post('/custom', async (req, res) => {
  try {
    const { title, message, data } = req.body;

    if (!title || !message) {
      return res.status(400).json({
        error: 'title y message requeridos',
      });
    }

    const result = await pushNotificationService.sendCustomNotification(
      title,
      message,
      data
    );

    res.json(result);
  } catch (error) {
    console.error('[NOTIFICATIONS] Error sending custom notification:', error);
    res.status(500).json({ error: 'Error al enviar notificación' });
  }
});

export default router;
