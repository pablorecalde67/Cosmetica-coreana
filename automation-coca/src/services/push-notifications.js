// 📱 PUSH NOTIFICATIONS SERVICE
// Envía notificaciones push al celular de Pablo sobre campañas, órdenes y trending

export class PushNotificationService {
  constructor() {
    this.subscriptions = new Map();
    this.notifications = new Map();
    this.serviceWorkerReady = false;
  }

  // Registrar dispositivo para push notifications
  async registerDevice(subscription) {
    try {
      const deviceId = `device_${Date.now()}`;
      this.subscriptions.set(deviceId, {
        id: deviceId,
        subscription,
        createdAt: new Date(),
        active: true,
      });

      console.log('[PUSH] Dispositivo registrado:', deviceId);

      return {
        success: true,
        deviceId,
        message: 'Dispositivo registrado para notificaciones push',
      };
    } catch (error) {
      console.error('[PUSH] Error registering device:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Enviar notificación de campaña viral
  async notifyNewCampaign(campaign) {
    try {
      const notification = {
        title: `🔥 ${campaign.product.name} - VIRAL`,
        options: {
          body: `Alcance esperado: ${campaign.content.metrics.expectedReach.toLocaleString()} personas. Score: ${campaign.content.metrics.viralScore}/100`,
          icon: '/icon-viral.png',
          badge: '/badge-viral.png',
          tag: `campaign-${campaign.id}`,
          data: {
            campaignId: campaign.id,
            productId: campaign.product.id,
            action: 'open-campaign',
          },
        },
      };

      await this.broadcastNotification(notification);

      return {
        success: true,
        notification,
      };
    } catch (error) {
      console.error('[PUSH] Error notifying new campaign:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Notificación de nueva orden
  async notifyNewOrder(order) {
    try {
      const notification = {
        title: `📦 Nueva Orden #${order.id}`,
        options: {
          body: `${order.items.length} producto(s) • Total: $${order.total.toFixed(2)}`,
          icon: '/icon-order.png',
          badge: '/badge-order.png',
          tag: `order-${order.id}`,
          data: {
            orderId: order.id,
            action: 'open-order',
          },
        },
      };

      await this.broadcastNotification(notification);

      return {
        success: true,
        notification,
      };
    } catch (error) {
      console.error('[PUSH] Error notifying new order:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Notificación de engagement en tiempo real
  async notifyEngagement(campaign, metrics) {
    try {
      const notification = {
        title: `📊 ${campaign.product.name} - Engagement Live`,
        options: {
          body: `${metrics.impressions} impresiones • ${metrics.clicks} clics • ${metrics.conversions} ventas`,
          icon: '/icon-metrics.png',
          badge: '/badge-metrics.png',
          tag: `engagement-${campaign.id}`,
          data: {
            campaignId: campaign.id,
            action: 'open-metrics',
          },
        },
      };

      await this.broadcastNotification(notification);

      return {
        success: true,
        notification,
      };
    } catch (error) {
      console.error('[PUSH] Error notifying engagement:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Notificación de producto trending
  async notifyTrendingProduct(product) {
    try {
      const notification = {
        title: `⭐ ${product.name} - Trending NOW`,
        options: {
          body: `Viral Score: ${product.trendScore}/100 • Rating: ${product.rating}/5`,
          icon: '/icon-trending.png',
          badge: '/badge-trending.png',
          tag: `trending-${product.id}`,
          data: {
            productId: product.id,
            action: 'open-product',
          },
        },
      };

      await this.broadcastNotification(notification);

      return {
        success: true,
        notification,
      };
    } catch (error) {
      console.error('[PUSH] Error notifying trending:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Notificación de alerta de stock bajo
  async notifyLowStock(product) {
    try {
      const notification = {
        title: `⚠️ Stock Bajo: ${product.name}`,
        options: {
          body: `Solo ${product.stock} unidades disponibles. Reorden sugerido.`,
          icon: '/icon-warning.png',
          badge: '/badge-warning.png',
          tag: `stock-${product.id}`,
          data: {
            productId: product.id,
            action: 'reorder',
          },
        },
      };

      await this.broadcastNotification(notification);

      return {
        success: true,
        notification,
      };
    } catch (error) {
      console.error('[PUSH] Error notifying low stock:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Notificación personalizada
  async sendCustomNotification(title, message, data = {}) {
    try {
      const notification = {
        title,
        options: {
          body: message,
          icon: '/icon-notification.png',
          badge: '/badge-notification.png',
          tag: `custom-${Date.now()}`,
          data,
        },
      };

      await this.broadcastNotification(notification);

      return {
        success: true,
        notification,
      };
    } catch (error) {
      console.error('[PUSH] Error sending custom notification:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Enviar notificación a todos los dispositivos registrados
  async broadcastNotification(notification) {
    try {
      const notificationId = `notif_${Date.now()}`;
      this.notifications.set(notificationId, {
        id: notificationId,
        ...notification,
        sentAt: new Date(),
        deviceCount: this.subscriptions.size,
      });

      console.log('[PUSH] Notificación enviada a', this.subscriptions.size, 'dispositivo(s)');

      // En producción, aquí se enviaría a través de Firebase Cloud Messaging
      // o Web Push API usando las subscripciones almacenadas

      return {
        success: true,
        notificationId,
        devicesSent: this.subscriptions.size,
      };
    } catch (error) {
      console.error('[PUSH] Error broadcasting notification:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Obtener historial de notificaciones
  getNotificationHistory(limit = 50) {
    const history = Array.from(this.notifications.values())
      .sort((a, b) => b.sentAt - a.sentAt)
      .slice(0, limit);

    return {
      total: this.notifications.size,
      recent: history,
    };
  }

  // Obtener dispositivos registrados
  getRegisteredDevices() {
    const devices = Array.from(this.subscriptions.values()).map((d) => ({
      id: d.id,
      createdAt: d.createdAt,
      active: d.active,
    }));

    return {
      total: devices.length,
      devices,
    };
  }

  // Desuscribir dispositivo
  unregisterDevice(deviceId) {
    if (this.subscriptions.has(deviceId)) {
      this.subscriptions.delete(deviceId);
      return {
        success: true,
        message: 'Dispositivo desuscrito',
      };
    }

    return {
      success: false,
      error: 'Dispositivo no encontrado',
    };
  }
}

export const pushNotificationService = new PushNotificationService();
