// COCA K-BEAUTY - Configuration
// ⚠️ IMPORTANTE: Estos valores deben ser reemplazados con tus credenciales reales

const CONFIG = {
  // FIREBASE Configuration
  firebase: {
    apiKey: "AIzaSyDemoKey123456789_REPLACE_ME",
    authDomain: "coca-kbeauty.firebaseapp.com",
    databaseURL: "https://coca-kbeauty-default-rtdb.firebaseio.com",
    projectId: "coca-kbeauty",
    storageBucket: "coca-kbeauty.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abcdef123456"
  },

  // OpenAI Vision API (para análisis de piel)
  openai: {
    apiKey: "sk-demo_REPLACE_ME_WITH_YOUR_KEY",
    modelId: "gpt-4-vision-preview"
  },

  // YouTube API (para videos automáticos)
  youtube: {
    apiKey: "AIzaSyDemoYouTubeKey_REPLACE_ME",
    searchQuery: "k-beauty skincare routine tips",
    maxResults: 6
  },

  // MercadoPago (Argentina)
  mercadopago: {
    publicKey: "APP_USR-demo_REPLACE_ME_WITH_YOUR_KEY",
    integrationUrl: "https://www.mercadopago.com.ar/checkout/v1/redirect"
  },

  // Social Media (REEMPLAZA CON TUS URLS)
  social: {
    instagram: "https://instagram.com/pablorecalde67", // ← REEMPLAZA CON TU USUARIO
    facebook: "https://facebook.com/tu-pagina"         // ← REEMPLAZA CON TU PÁGINA
  },

  // Tiendas en Ciudad del Este (datos que ya tienes)
  stores: {
    // Estos datos se cargarán desde el Excel que subiste
  },

  // Configuración de análisis de piel con IA
  skinAnalysis: {
    // Prompts para OpenAI Vision API
    systemPrompt: `Eres un dermatólogo experto en análisis de piel coreana.
    Analiza esta foto de rostro y proporciona:
    1. Tipo de piel (seca, grasa, mixta, sensible)
    2. Problemas principales (acné, arrugas, manchas, etc.)
    3. Necesidades de cuidado (hidratación, luminosidad, etc.)

    Responde EXACTAMENTE en este formato JSON:
    {
      "skinType": "tipo de piel",
      "characteristics": ["característica 1", "característica 2"],
      "problems": ["problema 1", "problema 2"],
      "needs": ["necesidad 1", "necesidad 2"],
      "recommendations": ["recomendación 1", "recomendación 2"]
    }`,

    recommendationPrompt: "Recomiendo estos productos coreanos para tu piel:"
  },

  // Productos por tipo de piel (para recomendaciones)
  productsByType: {
    "piel seca": ["moisturizer", "essence", "cream"],
    "piel grasa": ["toner", "cleanser", "pads"],
    "piel mixta": ["balancing-toner", "light-moisturizer"],
    "piel sensible": ["soothing-cream", "calming-serum"]
  }
};

// Validar que las configuraciones críticas estén presentes
function validateConfig() {
  const criticalKeys = [
    'firebase.apiKey',
    'openai.apiKey',
    'youtube.apiKey',
    'mercadopago.publicKey'
  ];

  criticalKeys.forEach(key => {
    const value = key.split('.').reduce((obj, k) => obj?.[k], CONFIG);
    if (value?.includes('REPLACE_ME') || value?.includes('demo')) {
      console.warn(`⚠️ COCA K-BEAUTY: Reemplaza ${key} con tu valor real`);
    }
  });
}

// Ejecutar validación
window.addEventListener('load', validateConfig);
