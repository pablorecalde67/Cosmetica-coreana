// K-Beauty CDE Analytics Tracker
class AnalyticsTracker {
  constructor() {
    this.sessionId = this.generateSessionId();
    this.sessionStartTime = Date.now();
    this.initGA4();
    this.initFacebookPixel();
  }

  generateSessionId() {
    return 'session_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
  }

  // Google Analytics 4 (if GA4_MEASUREMENT_ID is configured)
  initGA4() {
    if (!config.analytics.GA4_MEASUREMENT_ID) {
      console.log('GA4 not configured');
      return;
    }

    window.dataLayer = window.dataLayer || [];
    function gtag() { dataLayer.push(arguments); }
    gtag('js', new Date());
    gtag('config', config.analytics.GA4_MEASUREMENT_ID);

    // Load GA script
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${config.analytics.GA4_MEASUREMENT_ID}`;
    document.head.appendChild(script);
  }

  // Facebook Pixel (if FACEBOOK_PIXEL_ID is configured)
  initFacebookPixel() {
    if (!config.analytics.FACEBOOK_PIXEL_ID) {
      console.log('Facebook Pixel not configured');
      return;
    }

    // Facebook Pixel initialization
    window.fbq = window.fbq || function() {
      (window.fbq.q = window.fbq.q || []).push(arguments);
    };
    window.fbq('init', config.analytics.FACEBOOK_PIXEL_ID);
    window.fbq('track', 'PageView');

    // Load Pixel script
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://connect.facebook.net/en_US/fbevents.js`;
    document.head.appendChild(script);
  }

  // Track Page View
  trackPageView(pageName) {
    const event = {
      event: 'page_view',
      page_name: pageName,
      page_location: window.location.href,
      timestamp: new Date().toISOString(),
      session_id: this.sessionId,
    };

    this.sendEvent(event);
    console.log('📊 Page View tracked:', pageName);
  }

  // Track Product View
  trackProductView(product) {
    const event = {
      event: 'view_item',
      product_id: product.id,
      product_name: product.name,
      product_brand: product.brand,
      product_category: product.category,
      product_price: product.priceUSD,
      timestamp: new Date().toISOString(),
      session_id: this.sessionId,
    };

    this.sendEvent(event);
    console.log('👁️ Product View tracked:', product.name);
  }

  // Track Add to Cart
  trackAddToCart(product, quantity) {
    const event = {
      event: 'add_to_cart',
      product_id: product.id,
      product_name: product.name,
      product_price: product.priceUSD,
      quantity: quantity,
      timestamp: new Date().toISOString(),
      session_id: this.sessionId,
    };

    this.sendEvent(event);
    console.log('🛒 Add to Cart tracked:', product.name, `x${quantity}`);
  }

  // Track Purchase
  trackPurchase(cartItems, totalUSD, totalARS) {
    const event = {
      event: 'purchase',
      items: cartItems.map(item => ({
        product_id: item.id,
        product_name: item.name,
        quantity: item.quantity,
        price: item.priceUSD,
      })),
      total_usd: totalUSD,
      total_ars: totalARS,
      timestamp: new Date().toISOString(),
      session_id: this.sessionId,
    };

    this.sendEvent(event);
    console.log('💰 Purchase tracked:', `u$s ${totalUSD}`);
  }

  // Track Search
  trackSearch(searchQuery, resultsCount) {
    const event = {
      event: 'search',
      search_term: searchQuery,
      results_count: resultsCount,
      timestamp: new Date().toISOString(),
      session_id: this.sessionId,
    };

    this.sendEvent(event);
    console.log('🔍 Search tracked:', searchQuery);
  }

  // Track Filter
  trackFilter(filterType, filterValue) {
    const event = {
      event: 'filter',
      filter_type: filterType,
      filter_value: filterValue,
      timestamp: new Date().toISOString(),
      session_id: this.sessionId,
    };

    this.sendEvent(event);
    console.log('🔽 Filter tracked:', filterType, filterValue);
  }

  // Track WhatsApp Click
  trackWhatsAppClick(cartTotal) {
    const event = {
      event: 'whatsapp_click',
      cart_total: cartTotal,
      timestamp: new Date().toISOString(),
      session_id: this.sessionId,
    };

    this.sendEvent(event);
    console.log('📱 WhatsApp Click tracked:', cartTotal);
  }

  // Send Event (local storage backup)
  sendEvent(event) {
    // Store locally for later analysis
    let events = JSON.parse(localStorage.getItem('analytics_events')) || [];
    events.push(event);
    if (events.length > 100) events.shift(); // Keep last 100 events
    localStorage.setItem('analytics_events', JSON.stringify(events));

    // Send to GA4 if available
    if (typeof gtag !== 'undefined' && window.dataLayer) {
      gtag('event', event.event, event);
    }

    // Send to Facebook Pixel if available
    if (typeof fbq !== 'undefined') {
      fbq('track', event.event, event);
    }
  }

  // Get Session Duration
  getSessionDuration() {
    return Math.round((Date.now() - this.sessionStartTime) / 1000);
  }

  // Get All Events
  getAllEvents() {
    return JSON.parse(localStorage.getItem('analytics_events')) || [];
  }

  // Export Events as CSV (for analysis)
  exportEventsAsCSV() {
    const events = this.getAllEvents();
    const csv = [
      ['timestamp', 'event', 'details'].join(','),
      ...events.map(e => [
        e.timestamp,
        e.event,
        JSON.stringify(e)
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  }
}

// Initialize analytics tracker
const analytics = new AnalyticsTracker();

// Track initial page view
document.addEventListener('DOMContentLoaded', () => {
  const pageName = document.title;
  analytics.trackPageView(pageName);
});
