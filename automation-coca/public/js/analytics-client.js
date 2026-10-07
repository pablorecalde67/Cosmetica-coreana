/**
 * Client-side Analytics Tracker
 * Integración con Google Analytics 4 y tracking de eventos
 */

class AnalyticsTracker {
  constructor(measurementId) {
    this.measurementId = measurementId;
    this.sessionId = this.getOrCreateSessionId();
    this.userId = this.getOrCreateUserId();

    if (measurementId) {
      this.initGoogleAnalytics();
    }
  }

  /**
   * Inicializa Google Analytics 4
   */
  initGoogleAnalytics() {
    // Inyectar script de Google Analytics
    const script1 = document.createElement('script');
    script1.async = true;
    script1.src = `https://www.googletagmanager.com/gtag/js?id=${this.measurementId}`;
    document.head.appendChild(script1);

    // Configurar gtag
    window.dataLayer = window.dataLayer || [];
    function gtag() { window.dataLayer.push(arguments); }
    window.gtag = gtag;
    gtag('js', new Date());
    gtag('config', this.measurementId, {
      'session_id': this.sessionId,
      'user_id': this.userId,
      'allow_google_signals': false,
      'allow_ad_personalization_signals': false
    });
  }

  /**
   * Track page view
   */
  trackPageView(pagePath, pageTitle) {
    if (window.gtag) {
      window.gtag('event', 'page_view', {
        'page_path': pagePath,
        'page_title': pageTitle
      });
    }
    console.log(`[ANALYTICS] Page view: ${pageTitle}`);
  }

  /**
   * Track custom event
   */
  trackEvent(eventName, eventData = {}) {
    if (window.gtag) {
      window.gtag('event', eventName, eventData);
    }
    console.log(`[ANALYTICS] Event: ${eventName}`, eventData);
  }

  /**
   * E-commerce: view item
   */
  trackViewItem(product) {
    this.trackEvent('view_item', {
      currency: product.moneda || 'ARS',
      value: product.precio,
      items: [
        {
          item_id: product.id,
          item_name: product.nombre,
          item_category: product.categoria || 'skincare',
          price: product.precio,
          quantity: 1
        }
      ]
    });
  }

  /**
   * E-commerce: add to cart
   */
  trackAddToCart(cartItem) {
    this.trackEvent('add_to_cart', {
      currency: cartItem.moneda || 'ARS',
      value: cartItem.precio,
      items: [
        {
          item_id: cartItem.id,
          item_name: cartItem.nombre,
          price: cartItem.precio,
          quantity: cartItem.cantidad || 1
        }
      ]
    });
  }

  /**
   * E-commerce: begin checkout
   */
  trackBeginCheckout(cartItems, cartTotal) {
    this.trackEvent('begin_checkout', {
      currency: cartItems[0]?.moneda || 'ARS',
      value: cartTotal,
      items: cartItems.map(item => ({
        item_id: item.id,
        item_name: item.nombre,
        price: item.precio,
        quantity: item.cantidad || 1
      }))
    });
  }

  /**
   * E-commerce: purchase (disparado desde backend en webhook)
   */
  trackPurchase(transactionId, cartItems, cartTotal) {
    this.trackEvent('purchase', {
      transaction_id: transactionId,
      currency: cartItems[0]?.moneda || 'ARS',
      value: cartTotal,
      items: cartItems.map(item => ({
        item_id: item.id,
        item_name: item.nombre,
        price: item.precio,
        quantity: item.cantidad || 1
      }))
    });
  }

  /**
   * Track newsletter signup
   */
  trackNewsletterSignup(email) {
    this.trackEvent('newsletter_signup', {
      email_domain: email.split('@')[1]
    });
  }

  /**
   * Track skin analysis
   */
  trackSkinAnalysis(skinType, productsCount) {
    this.trackEvent('skin_analysis', {
      skin_type: skinType,
      products_recommended: productsCount
    });
  }

  /**
   * Track payment method
   */
  trackPaymentMethod(method) {
    this.trackEvent('payment_method_selected', {
      payment_method: method
    });
  }

  /**
   * Track shipping method
   */
  trackShippingMethod(method, cost) {
    this.trackEvent('shipping_method_selected', {
      shipping_method: method,
      shipping_cost: cost
    });
  }

  /**
   * Track search
   */
  trackSearch(searchTerm, resultsCount) {
    this.trackEvent('search', {
      search_term: searchTerm,
      results_count: resultsCount
    });
  }

  /**
   * Track error
   */
  trackError(errorMessage) {
    this.trackEvent('exception', {
      description: errorMessage,
      fatal: false
    });
  }

  /**
   * Set user properties
   */
  setUserProperty(propertyName, propertyValue) {
    if (window.gtag) {
      window.gtag('set', {
        'user_properties': {
          [propertyName]: propertyValue
        }
      });
    }
  }

  /**
   * Get or create session ID
   */
  getOrCreateSessionId() {
    let sessionId = sessionStorage.getItem('sessionId');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      sessionStorage.setItem('sessionId', sessionId);
    }
    return sessionId;
  }

  /**
   * Get or create user ID (persistent in localStorage)
   */
  getOrCreateUserId() {
    let userId = localStorage.getItem('userId');
    if (!userId) {
      userId = `user_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;
      localStorage.setItem('userId', userId);
    }
    return userId;
  }

  /**
   * Clear session (on logout)
   */
  clearSession() {
    sessionStorage.removeItem('sessionId');
    this.sessionId = this.getOrCreateSessionId();
  }
}

// Exportar instancia global
window.analyticsTracker = null;

/**
 * Inicializar tracker globalmente
 */
function initAnalytics(measurementId) {
  if (!window.analyticsTracker) {
    window.analyticsTracker = new AnalyticsTracker(measurementId);
    console.log('[ANALYTICS] Tracker initialized');
  }
}

// Auto-init if measurement ID is in meta tag
document.addEventListener('DOMContentLoaded', () => {
  const measurementIdMeta = document.querySelector('meta[data-google-analytics-id]');
  if (measurementIdMeta) {
    initAnalytics(measurementIdMeta.getAttribute('data-google-analytics-id'));
  }
});
