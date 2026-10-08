/**
 * SOCIAL MEDIA INTEGRATION
 * Instagram Graph API, WhatsApp, TikTok
 * Publicación automática de productos trending
 */

import fetch from 'node-fetch';

class SocialMediaAPI {
  constructor() {
    // Instagram Graph API
    this.instagram = {
      accessToken: process.env.INSTAGRAM_ACCESS_TOKEN,
      businessAccountId: process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID,
      apiVersion: 'v18.0',
      endpoint: 'https://graph.instagram.com'
    };

    // WhatsApp Business API
    this.whatsapp = {
      accessToken: process.env.WHATSAPP_ACCESS_TOKEN,
      businessPhoneId: process.env.WHATSAPP_BUSINESS_PHONE_ID,
      endpoint: 'https://graph.instagram.com'
    };

    // TikTok API
    this.tiktok = {
      accessToken: process.env.TIKTOK_ACCESS_TOKEN,
      apiVersion: 'v1',
      endpoint: 'https://open-api.tiktok.com'
    };

    this.stats = {
      instagram_posted: 0,
      instagram_failed: 0,
      whatsapp_sent: 0,
      whatsapp_failed: 0
    };
  }

  /**
   * INSTAGRAM: Publicar producto trending
   */
  async publishToInstagram(product) {
    if (!this.instagram.accessToken || !this.instagram.businessAccountId) {
      return {
        success: false,
        error: 'Instagram credentials not configured',
        reason: 'Missing INSTAGRAM_ACCESS_TOKEN or INSTAGRAM_BUSINESS_ACCOUNT_ID'
      };
    }

    try {
      // 1. Crear contenido de post
      const caption = this._generateInstagramCaption(product);

      // 2. Subir imagen (si existe)
      let mediaId = null;
      if (product.image_url) {
        mediaId = await this._uploadInstagramImage(product.image_url);
      }

      if (!mediaId) {
        this.stats.instagram_failed++;
        return {
          success: false,
          error: 'Failed to upload image to Instagram'
        };
      }

      // 3. Crear carousel item o single image
      const carouselData = {
        image_url: product.image_url,
        caption: caption
      };

      // 4. Publicar
      const response = await fetch(
        `${this.instagram.endpoint}/${this.instagram.businessAccountId}/media`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.instagram.accessToken}`
          },
          body: JSON.stringify({
            image_url: product.image_url,
            caption: caption,
            media_type: 'IMAGE'
          })
        }
      );

      if (!response.ok) {
        this.stats.instagram_failed++;
        const error = await response.json();
        return {
          success: false,
          error: 'Instagram API error',
          details: error.error
        };
      }

      const result = await response.json();
      this.stats.instagram_posted++;

      return {
        success: true,
        media_id: result.id,
        url: `https://instagram.com/p/${result.id}`,
        product: product.name,
        caption: caption
      };

    } catch (error) {
      this.stats.instagram_failed++;
      console.error('[INSTAGRAM ERROR]', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * INSTAGRAM: Subir imagen
   */
  async _uploadInstagramImage(imageUrl) {
    try {
      const response = await fetch(
        `${this.instagram.endpoint}/${this.instagram.businessAccountId}/media_publish`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.instagram.accessToken}`
          },
          body: JSON.stringify({
            creation_name: 'K-Beauty CDE',
            image_url: imageUrl,
            media_type: 'IMAGE'
          })
        }
      );

      const result = await response.json();
      return result.id || null;
    } catch (error) {
      console.error('[INSTAGRAM UPLOAD ERROR]', error.message);
      return null;
    }
  }

  /**
   * Generar caption para Instagram
   */
  _generateInstagramCaption(product) {
    const priceArs = Math.round(product.price * 990);
    const emojis = ['💄', '✨', '💧', '🎨', '🧴', '💙', '🌿', '💋'];
    const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];

    return `${randomEmoji} ${product.name}

💵 $${product.price.toFixed(2)} USD | $${priceArs.toLocaleString('es-AR')} ARS

✅ 100% Auténtico desde Corea
⭐ ${product.reviews} reseñas | ${product.rating}★

🚚 Envío a TODO Sudamérica
📲 Link en bio para comprar

#KBeautyCDE #KoreanBeauty #Skincare #Makeup #CosmeticaCoreana #BeautyShopping #TrendingNow #Viral`;
  }

  /**
   * WHATSAPP: Enviar alerta de producto trending
   */
  async sendWhatsAppAlert(phoneNumber, product) {
    if (!this.whatsapp.accessToken || !this.whatsapp.businessPhoneId) {
      return {
        success: false,
        error: 'WhatsApp credentials not configured'
      };
    }

    try {
      const message = this._generateWhatsAppMessage(product);

      const response = await fetch(
        `${this.whatsapp.endpoint}/v18.0/${this.whatsapp.businessPhoneId}/messages`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.whatsapp.accessToken}`
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: phoneNumber,
            type: 'text',
            text: {
              preview_url: true,
              body: message
            }
          })
        }
      );

      if (!response.ok) {
        this.stats.whatsapp_failed++;
        const error = await response.json();
        return {
          success: false,
          error: 'WhatsApp API error',
          details: error.error
        };
      }

      const result = await response.json();
      this.stats.whatsapp_sent++;

      return {
        success: true,
        message_id: result.messages[0].id,
        phone: phoneNumber,
        product: product.name
      };

    } catch (error) {
      this.stats.whatsapp_failed++;
      console.error('[WHATSAPP ERROR]', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Generar mensaje WhatsApp
   */
  _generateWhatsAppMessage(product) {
    const priceArs = Math.round(product.price * 990);

    return `🎁 *TRENDING AHORA* 🎁

*${product.name}*

💵 *Precio:* $${product.price.toFixed(2)} USD | $${priceArs.toLocaleString('es-AR')} ARS

⭐ *Rating:* ${product.rating}★ (${product.reviews} reseñas)

✅ 100% Auténtico desde Corea del Sur
🚚 Envío a TODO Sudamérica en 48-72h
📦 Stock disponible: ${product.stock} unidades

👉 *Compra ahora:* https://kbeautycde.com/piel

*K-Beauty CDE* - Tendencias de Seúl en tu puerta`;
  }

  /**
   * TIKTOK: Publicar video de producto
   */
  async publishToTikTok(videoUrl, productName, price) {
    if (!this.tiktok.accessToken) {
      return {
        success: false,
        error: 'TikTok credentials not configured'
      };
    }

    try {
      const description = `¡${productName} a $${price} USD! 🇰🇷 K-Beauty auténtica. Envío a LATAM. #KBeauty #Skincare #Viral`;

      const response = await fetch(
        `${this.tiktok.endpoint}/video/upload/`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.tiktok.accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            video_url: videoUrl,
            description: description,
            privacy_level: 'PUBLIC'
          })
        }
      );

      if (!response.ok) {
        return {
          success: false,
          error: 'TikTok API error'
        };
      }

      const result = await response.json();
      return {
        success: true,
        video_id: result.data.video_id,
        url: `https://tiktok.com/@kbeautycde/video/${result.data.video_id}`
      };

    } catch (error) {
      console.error('[TIKTOK ERROR]', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Obtener estadísticas de publicación
   */
  getStats() {
    return {
      instagram: {
        posted: this.stats.instagram_posted,
        failed: this.stats.instagram_failed,
        success_rate: this.stats.instagram_posted + this.stats.instagram_failed > 0
          ? ((this.stats.instagram_posted / (this.stats.instagram_posted + this.stats.instagram_failed)) * 100).toFixed(1) + '%'
          : 'N/A'
      },
      whatsapp: {
        sent: this.stats.whatsapp_sent,
        failed: this.stats.whatsapp_failed,
        success_rate: this.stats.whatsapp_sent + this.stats.whatsapp_failed > 0
          ? ((this.stats.whatsapp_sent / (this.stats.whatsapp_sent + this.stats.whatsapp_failed)) * 100).toFixed(1) + '%'
          : 'N/A'
      }
    };
  }

  /**
   * Publicar a todas las plataformas
   */
  async publishToAll(product) {
    const results = {
      instagram: null,
      tiktok: null,
      whatsapp: []
    };

    // Instagram
    console.log(`[SOCIAL] Publicando ${product.name} en Instagram...`);
    results.instagram = await this.publishToInstagram(product);

    // WhatsApp (a list de suscriptores)
    if (process.env.WHATSAPP_CONTACTS) {
      const contacts = process.env.WHATSAPP_CONTACTS.split(',');
      console.log(`[SOCIAL] Enviando alerta WhatsApp a ${contacts.length} contactos...`);

      for (let contact of contacts) {
        const alert = await this.sendWhatsAppAlert(contact.trim(), product);
        results.whatsapp.push(alert);
      }
    }

    return {
      product: product.name,
      timestamp: new Date().toISOString(),
      results: results,
      stats: this.getStats()
    };
  }
}

export default SocialMediaAPI;
