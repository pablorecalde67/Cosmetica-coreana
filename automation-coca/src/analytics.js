import { config } from './config.js';

/**
 * Analytics Module
 * Integración con Google Analytics y tracking de eventos personalizados
 */

const GOOGLE_ANALYTICS_ENDPOINT = 'https://www.google-analytics.com/mp/collect';

/**
 * Envía evento a Google Analytics (Measurement Protocol v1)
 */
export async function trackEvent(eventName, eventData = {}, userId = 'anonymous') {
  if (!config.googleAnalyticsId) {
    console.log('[ANALYTICS] Google Analytics no configurado');
    return;
  }

  try {
    const payload = {
      client_id: userId,
      events: [
        {
          name: eventName,
          params: {
            session_id: eventData.sessionId || generateSessionId(),
            ...eventData
          }
        }
      ]
    };

    // Send to Google Analytics Measurement Protocol
    const response = await fetch(GOOGLE_ANALYTICS_ENDPOINT, {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: {
        'Content-Type': 'application/json'
      },
      params: {
        measurement_id: config.googleAnalyticsId,
        api_secret: config.googleAnalyticsSecret || 'dev-secret'
      }
    });

    if (!response.ok) {
      console.warn('[ANALYTICS] Error tracking event:', response.status);
    }
  } catch (err) {
    console.error('[ANALYTICS] Error in trackEvent:', err.message);
  }
}

/**
 * Track page view
 */
export function trackPageView(pagePath, pageTitle) {
  return trackEvent('page_view', {
    page_path: pagePath,
    page_title: pageTitle
  });
}

/**
 * Track e-commerce event: view_item
 */
export function trackViewItem(product) {
  return trackEvent('view_item', {
    items: [
      {
        item_id: product.id,
        item_name: product.nombre,
        item_category: product.categoria || 'skincare',
        price: product.precio,
        currency: product.moneda || 'ARS'
      }
    ]
  });
}

/**
 * Track e-commerce event: add_to_cart
 */
export function trackAddToCart(cartItem, cartValue) {
  return trackEvent('add_to_cart', {
    currency: cartItem.moneda || 'ARS',
    value: cartValue,
    items: [
      {
        item_id: cartItem.id,
        item_name: cartItem.nombre,
        quantity: cartItem.cantidad || 1,
        price: cartItem.precio
      }
    ]
  });
}

/**
 * Track e-commerce event: begin_checkout
 */
export function trackBeginCheckout(items, cartValue) {
  return trackEvent('begin_checkout', {
    currency: items[0]?.moneda || 'ARS',
    value: cartValue,
    items: items.map(item => ({
      item_id: item.id,
      item_name: item.nombre,
      quantity: item.cantidad || 1,
      price: item.precio
    }))
  });
}

/**
 * Track e-commerce event: purchase (en webhook de pago)
 */
export function trackPurchase(order) {
  return trackEvent('purchase', {
    transaction_id: order.id,
    affiliation: 'kbeautycde',
    value: order.total,
    currency: order.moneda || 'ARS',
    tax: 0,
    shipping: 0,
    items: order.items.map(item => ({
      item_id: item.id,
      item_name: item.nombre,
      item_category: 'skincare',
      quantity: item.cantidad || 1,
      price: item.precio
    }))
  });
}

/**
 * Track custom event: newsletter signup
 */
export function trackNewsletterSignup(email) {
  return trackEvent('newsletter_signup', {
    email_domain: email.split('@')[1] || 'unknown'
  });
}

/**
 * Track custom event: skin analysis
 */
export function trackSkinAnalysis(skinType, productCount) {
  return trackEvent('skin_analysis', {
    skin_type: skinType,
    products_recommended: productCount
  });
}

/**
 * Track payment method selection
 */
export function trackPaymentMethodSelected(method) {
  return trackEvent('payment_method_selected', {
    payment_method: method
  });
}

/**
 * Track shipping method selection
 */
export function trackShippingMethodSelected(method, cost) {
  return trackEvent('shipping_method_selected', {
    shipping_method: method,
    shipping_cost: cost
  });
}

/**
 * Generate session ID (simple version)
 */
function generateSessionId() {
  return `session_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Track error event
 */
export function trackError(errorMessage, errorCategory = 'general') {
  return trackEvent('exception', {
    description: errorMessage,
    fatal: false,
    error_category: errorCategory
  });
}

/**
 * Track Instagram scrape completion
 */
export function trackInstagramScrape(postsCount, productsCount) {
  return trackEvent('instagram_scrape', {
    posts_scraped: postsCount,
    products_extracted: productsCount,
    sync_status: 'completed'
  });
}

/**
 * Track admin action (in admin panel)
 */
export function trackAdminAction(actionType, resourceType, resourceId) {
  return trackEvent('admin_action', {
    action_type: actionType,
    resource_type: resourceType,
    resource_id: resourceId
  });
}

export default {
  trackEvent,
  trackPageView,
  trackViewItem,
  trackAddToCart,
  trackBeginCheckout,
  trackPurchase,
  trackNewsletterSignup,
  trackSkinAnalysis,
  trackPaymentMethodSelected,
  trackShippingMethodSelected,
  trackError,
  trackInstagramScrape,
  trackAdminAction
};
