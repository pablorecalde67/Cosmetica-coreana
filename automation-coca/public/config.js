// K-Beauty CDE Configuration
const config = {
  // WhatsApp Business
  whatsapp: {
    number: '5493624123456', // Reemplazar con número real
    businessName: 'K-Beauty CDE',
  },

  // Currency
  currency: {
    usd_to_ars: 1050,
    currencyDisplay: {
      USD: 'u$s',
      ARS: '$'
    }
  },

  // Company
  company: {
    name: 'K-Beauty CDE',
    description: 'Belleza Coreana en Argentina',
    email: 'contacto@kbeautycde.com',
    phone: '03624-123456',
    address: 'Ciudad del Este, Paraguay',
    country: 'Argentina',
    shippingCountries: ['Argentina'],
  },

  // Analytics
  analytics: {
    // Google Analytics 4
    GA4_MEASUREMENT_ID: '', // Agregar tu GA4 ID

    // Facebook Pixel
    FACEBOOK_PIXEL_ID: '', // Agregar tu Pixel ID
  },

  // Social Media
  social: {
    instagram: 'https://instagram.com/kbeautycde',
    tiktok: 'https://tiktok.com/@kbeautycde',
    whatsapp: 'https://wa.me/5493624123456',
  },

  // Product Images Path
  imgPath: './piel/img/products/',

  // API
  api: {
    productsEndpoint: './data/products.json',
  }
};

// Helper function to get WhatsApp URL
function getWhatsAppURL(message = '') {
  const url = `https://wa.me/${config.whatsapp.number}`;
  return message ? `${url}?text=${encodeURIComponent(message)}` : url;
}

// Helper function to format currency
function formatPrice(amount, currency = 'USD') {
  const symbol = config.currency.currencyDisplay[currency];
  if (currency === 'USD') {
    return `${symbol} ${amount.toFixed(2)}`;
  } else if (currency === 'ARS') {
    return `${symbol} ${Math.round(amount).toLocaleString('es-AR')}`;
  }
  return amount;
}

// Helper function to convert USD to ARS
function convertToARS(usdAmount) {
  return usdAmount * config.currency.usd_to_ars;
}
