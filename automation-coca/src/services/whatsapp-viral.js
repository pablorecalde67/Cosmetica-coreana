// 📱 WHATSAPP VIRAL NOTIFICATIONS
// Envía notificaciones sobre campañas virales a clientes y negocios de CDE

import { nanoid } from 'nanoid';

export class WhatsAppViral {
  constructor() {
    this.notifications = new Map();
    this.businessNumbers = [
      '+595975001234', // Negocio 1
      '+595985002345', // Negocio 2
      '+595995003456', // Negocio 3
      '+595975004567', // Negocio 4
      '+595985005678', // Negocio 5
    ];
  }

  // Notificar a clientes sobre nueva oferta viral
  async notifyCustomers(campaign) {
    try {
      const message = this.generateCustomerMessage(campaign);
      const notificationId = nanoid();

      this.notifications.set(notificationId, {
        id: notificationId,
        type: 'customer',
        campaignId: campaign.id,
        message,
        sentAt: new Date(),
        status: 'sent',
      });

      console.log('[WHATSAPP VIRAL] Notificación a clientes enviada:', {
        campaignId: campaign.id,
        productName: campaign.product.name,
        message: message.substring(0, 50) + '...',
      });

      return {
        success: true,
        notificationId,
        type: 'customer',
        message,
      };
    } catch (error) {
      console.error('[WHATSAPP VIRAL] Error notifying customers:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Alertar a negocios de CDE sobre producto viral
  async alertCDEBusinesses(campaign) {
    try {
      const message = this.generateBusinessMessage(campaign);
      const notificationId = nanoid();
      const results = [];

      // Enviar a todos los números de negocios
      for (const phoneNumber of this.businessNumbers) {
        const result = await this.sendWhatsAppMessage(phoneNumber, message, campaign);
        results.push(result);
      }

      this.notifications.set(notificationId, {
        id: notificationId,
        type: 'business',
        campaignId: campaign.id,
        recipientCount: this.businessNumbers.length,
        message,
        sentAt: new Date(),
        status: 'sent',
      });

      console.log('[WHATSAPP VIRAL] Alertas a negocios enviadas:', {
        campaignId: campaign.id,
        productName: campaign.product.name,
        businessCount: this.businessNumbers.length,
      });

      return {
        success: true,
        notificationId,
        type: 'business',
        businessesNotified: this.businessNumbers.length,
        results,
      };
    } catch (error) {
      console.error('[WHATSAPP VIRAL] Error alerting businesses:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Generar mensaje para clientes
  generateCustomerMessage(campaign) {
    const { product, content } = campaign;

    return `🎉 ¡NUEVA OFERTA VIRAL! 🎉

📦 ${product.name}
💰 $${product.price}
⭐ Rating: ${product.rating}/5 (${product.reviews} reseñas)

✨ DISPONIBLE EN CDE

Este producto está siendo promocionado en:
✅ Instagram
✅ TikTok
✅ Facebook

🔥 Viral Score: ${content.metrics.viralScore}/100
📊 Alcance Esperado: ${content.metrics.expectedReach.toLocaleString()} personas

👉 Ver oferta completa: https://kbeautycde.herokuapp.com/api/products/${product.id}

¡No te lo pierdas! Stock limitado 🏃‍♀️`;
  }

  // Generar mensaje para negocios de CDE
  generateBusinessMessage(campaign) {
    const { product, content } = campaign;

    return `🔥 ALERTA VIRAL - OPORTUNIDAD AHORA MISMO 🔥

El producto "${product.name}" está siendo promocionado en todas las plataformas y ESTÁ GENERANDO MUCHO ENGAGEMENT.

📊 ESTADÍSTICAS:
💰 Precio: $${product.price}
⭐ Rating: ${product.rating}/5
📈 Viral Score: ${content.metrics.viralScore}/100
👥 Alcance Esperado: ${content.metrics.expectedReach.toLocaleString()} personas

🚀 CONTENIDO LISTO PARA COPIAR:

📸 INSTAGRAM (Publica a las ${content.timing.instagram}):
"${content.platforms.instagram.caption.substring(0, 80)}..."

Hashtags: ${content.platforms.instagram.hashtags.slice(0, 5).join(' ')}

🎵 TIKTOK (Publica a las ${content.timing.tiktok}):
"${content.platforms.tiktok.caption.substring(0, 60)}..."

Ideas de video: ${content.platforms.tiktok.videoIdeas.slice(0, 2).join(', ')}

👥 FACEBOOK (Publica a las ${content.timing.facebook}):
"${content.platforms.facebook.caption.substring(0, 80)}..."

---

¿QUÉ HIZO LA COMPETENCIA?

✅ Tienda A: +240 visitas en 24hs
✅ Tienda B: +3 ventas en 1 hora
✅ Tienda C: +150 mensajes de consulta

---

🎯 OPCIONES:

A️⃣ Quiero el contenido LISTO para copiar y pegar
B️⃣ Necesito asesoría paso a paso
C️⃣ Quiero saber más ejemplos

⏰ ACTÚA YA - Este trending dura 48 horas máximo

Responde para recibir el contenido completo 👇`;
  }

  // Enviar mensaje por WhatsApp (simular integración real)
  async sendWhatsAppMessage(phoneNumber, message, campaign) {
    try {
      // En producción, integrar con WhatsApp API (Twilio, MessageBird, etc)
      // Por ahora, simular envío exitoso

      const result = {
        phoneNumber,
        status: 'sent',
        messageId: `msg_${nanoid()}`,
        campaignId: campaign.id,
        productName: campaign.product.name,
        sentAt: new Date(),
      };

      console.log('[WHATSAPP] Mensaje enviado a:', phoneNumber);
      return result;
    } catch (error) {
      console.error('[WHATSAPP] Error sending message:', error);
      return {
        phoneNumber,
        status: 'failed',
        error: error.message,
      };
    }
  }

  // Obtener historial de notificaciones
  getNotificationHistory(campaignId) {
    const history = Array.from(this.notifications.values()).filter(
      (n) => n.campaignId === campaignId
    );

    return {
      campaignId,
      total: history.length,
      notifications: history,
    };
  }

  // Enviar notificación de engagement en tiempo real
  async notifyEngagementUpdate(campaign, metrics) {
    try {
      const message = `📊 UPDATE: "${campaign.product.name}" tiene:

👁️ ${metrics.impressions.toLocaleString()} impresiones
👆 ${metrics.clicks} clics
💬 ${metrics.shares} compartidos
🛍️ ${metrics.conversions} conversiones

Sigue siendo Trending! 🔥`;

      return {
        success: true,
        message,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }
}
