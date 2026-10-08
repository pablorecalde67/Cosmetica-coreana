/**
 * ANALYTICS INTEGRATION
 * Google Analytics 4 + Facebook Pixel
 * Track conversions, user behavior, and viral metrics
 */

class AnalyticsTracker {
  constructor() {
    this.ga4 = {
      measurementId: process.env.GA4_MEASUREMENT_ID,
      apiSecret: process.env.GA4_API_SECRET,
      endpoint: 'https://www.google-analytics.com/mp/collect'
    };

    this.facebook = {
      pixelId: process.env.FACEBOOK_PIXEL_ID,
      accessToken: process.env.FACEBOOK_ACCESS_TOKEN,
      endpoint: 'https://graph.facebook.com'
    };

    this.events = {
      page_view: 0,
      view_item: 0,
      add_to_cart: 0,
      purchase: 0,
      ai_analysis: 0,
      share: 0
    };
  }

  /**
   * GOOGLE ANALYTICS 4: Track page view
   */
  async trackPageView(sessionId, userId, pageTitle, pagePath) {
    if (!this.ga4.measurementId || !this.ga4.apiSecret) {
      console.warn('[GA4] Credentials not configured');
      return { success: false, reason: 'Missing GA4 credentials' };
    }

    try {
      const payload = {
        client_id: sessionId || 'anonymous',
        user_id: userId,
        timestamp_micros: (Date.now() * 1000).toString(),
        events: [
          {
            name: 'page_view',
            params: {
              page_title: pageTitle,
              page_location: `https://kbeautycde.com${pagePath}`,
              page_path: pagePath
            }
          }
        ]
      };

      const response = await fetch(
        `${this.ga4.endpoint}?measurement_id=${this.ga4.measurementId}&api_secret=${this.ga4.apiSecret}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }
      );

      if (response.ok) {
        this.events.page_view++;
        return { success: true };
      } else {
        console.error('[GA4] Error:', response.statusText);
        return { success: false, error: response.statusText };
      }
    } catch (error) {
      console.error('[GA4 ERROR]', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * GOOGLE ANALYTICS 4: Track product view
   */
  async trackViewItem(sessionId, userId, product) {
    if (!this.ga4.measurementId || !this.ga4.apiSecret) return;

    try {
      const payload = {
        client_id: sessionId || 'anonymous',
        user_id: userId,
        timestamp_micros: (Date.now() * 1000).toString(),
        events: [
          {
            name: 'view_item',
            params: {
              items: [
                {
                  item_id: product.id,
                  item_name: product.name,
                  item_brand: product.brand,
                  item_category: product.category,
                  price: product.price,
                  currency: 'USD'
                }
              ]
            }
          }
        ]
      };

      await fetch(
        `${this.ga4.endpoint}?measurement_id=${this.ga4.measurementId}&api_secret=${this.ga4.apiSecret}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }
      );

      this.events.view_item++;
    } catch (error) {
      console.error('[GA4 VIEW_ITEM ERROR]', error.message);
    }
  }

  /**
   * GOOGLE ANALYTICS 4: Track purchase (conversion)
   */
  async trackPurchase(sessionId, userId, orderId, products, totalValue) {
    if (!this.ga4.measurementId || !this.ga4.apiSecret) return;

    try {
      const items = products.map(p => ({
        item_id: p.id,
        item_name: p.name,
        item_brand: p.brand,
        price: p.price,
        quantity: p.quantity || 1,
        currency: 'USD'
      }));

      const payload = {
        client_id: sessionId || 'anonymous',
        user_id: userId,
        timestamp_micros: (Date.now() * 1000).toString(),
        events: [
          {
            name: 'purchase',
            params: {
              transaction_id: orderId,
              value: totalValue,
              currency: 'USD',
              tax: 0,
              shipping: 0,
              items: items
            }
          }
        ]
      };

      await fetch(
        `${this.ga4.endpoint}?measurement_id=${this.ga4.measurementId}&api_secret=${this.ga4.apiSecret}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }
      );

      this.events.purchase++;
      console.log(`[GA4] Purchase tracked: ${orderId} ($${totalValue})`);
    } catch (error) {
      console.error('[GA4 PURCHASE ERROR]', error.message);
    }
  }

  /**
   * GOOGLE ANALYTICS 4: Track AI analysis
   */
  async trackAIAnalysis(sessionId, userId, skinType, analysisTime) {
    if (!this.ga4.measurementId || !this.ga4.apiSecret) return;

    try {
      const payload = {
        client_id: sessionId || 'anonymous',
        user_id: userId,
        timestamp_micros: (Date.now() * 1000).toString(),
        events: [
          {
            name: 'custom_ai_analysis',
            params: {
              skin_type: skinType,
              analysis_time_ms: analysisTime,
              feature: 'skin_analyzer'
            }
          }
        ]
      };

      await fetch(
        `${this.ga4.endpoint}?measurement_id=${this.ga4.measurementId}&api_secret=${this.ga4.apiSecret}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }
      );

      this.events.ai_analysis++;
    } catch (error) {
      console.error('[GA4 AI_ANALYSIS ERROR]', error.message);
    }
  }

  /**
   * FACEBOOK PIXEL: Track page view
   */
  async trackFacebookPageView(userId, pageUrl, userData = {}) {
    if (!this.facebook.pixelId || !this.facebook.accessToken) {
      console.warn('[FACEBOOK] Pixel not configured');
      return { success: false };
    }

    try {
      const payload = {
        data: [
          {
            event_name: 'PageView',
            event_time: Math.floor(Date.now() / 1000),
            action_source: 'website',
            user_data: {
              em: userData.email ? this._hashEmail(userData.email) : null,
              ph: userData.phone ? this._hashPhone(userData.phone) : null,
              client_user_id: userId
            },
            custom_data: {
              currency: 'USD',
              value: 0,
              content_name: pageUrl
            }
          }
        ]
      };

      const response = await fetch(
        `${this.facebook.endpoint}/${this.facebook.pixelId}/events`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.facebook.accessToken}`
          },
          body: JSON.stringify(payload)
        }
      );

      return { success: response.ok };
    } catch (error) {
      console.error('[FACEBOOK PAGE VIEW ERROR]', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * FACEBOOK PIXEL: Track purchase (conversion)
   */
  async trackFacebookPurchase(userId, orderId, totalValue, items, userData = {}) {
    if (!this.facebook.pixelId || !this.facebook.accessToken) return;

    try {
      const contents = items.map(item => ({
        id: item.id,
        quantity: item.quantity || 1,
        delivery_category: 'home_delivery'
      }));

      const payload = {
        data: [
          {
            event_name: 'Purchase',
            event_time: Math.floor(Date.now() / 1000),
            action_source: 'website',
            user_data: {
              em: userData.email ? this._hashEmail(userData.email) : null,
              ph: userData.phone ? this._hashPhone(userData.phone) : null,
              client_user_id: userId
            },
            custom_data: {
              currency: 'USD',
              value: totalValue,
              content_name: 'K-Beauty Purchase',
              content_ids: items.map(i => i.id),
              contents: contents
            }
          }
        ]
      };

      await fetch(
        `${this.facebook.endpoint}/${this.facebook.pixelId}/events`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.facebook.accessToken}`
          },
          body: JSON.stringify(payload)
        }
      );

      console.log(`[FACEBOOK] Purchase tracked: ${orderId} ($${totalValue})`);
    } catch (error) {
      console.error('[FACEBOOK PURCHASE ERROR]', error.message);
    }
  }

  /**
   * FACEBOOK PIXEL: Track content interaction (para retargeting)
   */
  async trackFacebookAddToCart(userId, product, quantity = 1) {
    if (!this.facebook.pixelId || !this.facebook.accessToken) return;

    try {
      const payload = {
        data: [
          {
            event_name: 'AddToCart',
            event_time: Math.floor(Date.now() / 1000),
            action_source: 'website',
            user_data: {
              client_user_id: userId
            },
            custom_data: {
              currency: 'USD',
              value: product.price * quantity,
              content_ids: [product.id],
              content_name: product.name,
              content_type: 'product',
              contents: [
                {
                  id: product.id,
                  quantity: quantity
                }
              ]
            }
          }
        ]
      };

      await fetch(
        `${this.facebook.endpoint}/${this.facebook.pixelId}/events`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.facebook.accessToken}`
          },
          body: JSON.stringify(payload)
        }
      );

      this.events.add_to_cart++;
    } catch (error) {
      console.error('[FACEBOOK ADD_TO_CART ERROR]', error.message);
    }
  }

  /**
   * Hash email para Facebook (SHA256)
   */
  _hashEmail(email) {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(email.toLowerCase()).digest('hex');
  }

  /**
   * Hash phone para Facebook
   */
  _hashPhone(phone) {
    const crypto = require('crypto');
    // Remover espacios y caracteres especiales
    const cleaned = phone.replace(/\D/g, '');
    return crypto.createHash('sha256').update(cleaned).digest('hex');
  }

  /**
   * Obtener estadísticas de eventos
   */
  getEventStats() {
    return {
      events: this.events,
      total: Object.values(this.events).reduce((a, b) => a + b, 0),
      timestamp: new Date().toISOString()
    };
  }
}

export default AnalyticsTracker;
