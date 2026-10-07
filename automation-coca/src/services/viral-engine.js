// 🚀 VIRAL ENGINE - Generador de contenido para publicaciones virales
// Crea posts optimizados para cada red social automáticamente

export class ViralEngine {
  constructor(config = {}) {
    this.config = config;
    this.templates = {
      instagram: this.generateInstagramPost,
      tiktok: this.generateTikTokCaption,
      facebook: this.generateFacebookPost,
      whatsapp: this.generateWhatsAppMessage,
    };
  }

  // 📸 Instagram: Visual + Storytelling
  generateInstagramPost(product) {
    const emojis = ['✨', '💅', '🌟', '😍', '🔥', '💯'];
    const hooks = [
      '¡DESCUBIERTO EN CDE!',
      '🇵🇾 La belleza coreana que TODOS quieren',
      'NO VA A CREER el precio en CDE',
      'LLEGÓ LO QUE ESTABAS ESPERANDO',
    ];

    const hook = hooks[Math.floor(Math.random() * hooks.length)];
    const emoji = emojis[Math.floor(Math.random() * emojis.length)];

    return {
      caption: `${hook} ${emoji}

${product.name}
💵 Precio: $${product.price}
📍 DISPONIBLE EN CDE

${this.generateProductBenefit(product)}

✅ Stock limitado
✅ Envío a todo el país
✅ Garantía original

¿Te interesa? 👉 Link en bio

#CosméticaCoreana #KBeauty #OfertaCDE #Belleza #SkinCare #ProductoOriginal #CiudadDelEste #Viral`,
      hashtags: [
        '#KBeauty',
        '#CiudadDelEste',
        '#CosméticaCoreana',
        '#OfertasYA',
        '#BellezaCoreana',
        '#Skincare',
        '#ProductosOriginales',
        '#CDE',
        '#Paraguay',
      ],
      bestTime: '19:00', // 7 PM Argentina time
      engagement: {
        callToAction: 'Ver en bio',
        incentive: '¡Stock limitado!',
      },
    };
  }

  // 📱 TikTok: Corto, dinámico, trend
  generateTikTokCaption(product) {
    const trends = [
      'POV: Encontraste el producto de belleza más buscado a precio CDE',
      'Mi rutina nocturna cambió cuando descubrí esto en CDE 🤯',
      'No puedo creer que cuesta ESTO en CDE 😱',
      'La mejor compra que hice en Belleza fue...',
    ];

    return {
      caption: `${trends[Math.floor(Math.random() * trends.length)]}

${product.name} ✨
💰 $${product.price} en CDE
🇰🇷 Belleza coreana ORIGINAL

#foryou #parati #kbeauty #cde #belleza #skincare #viral #fyp`,
      hashtags: [
        '#FYP',
        '#ForYou',
        '#ParaTi',
        '#KBeauty',
        '#CDE',
        '#Belleza',
        '#Viral',
        '#SkinCare',
      ],
      bestTime: '18:00', // 6 PM
      videoIdeas: [
        'Before/After aplicación',
        'Rutina de skincare completa',
        'Reacción desboxing',
        'Comparación con productos caros',
        'Story tiempo (cuándo lo descubriste)',
      ],
    };
  }

  // 👥 Facebook: Community + Trust
  generateFacebookPost(product) {
    return {
      caption: `✨ ¡NOVEDAD EN CDE! ✨

Acaba de llegar a Ciudad del Este: ${product.name}

Este producto es SUPER popular en Corea del Sur y finalmente lo conseguimos con el mejor precio.

📊 LO QUE LAS CHICAS DICEN:
⭐ Resultados visibles en 7 días
⭐ No reseca la piel
⭐ Olor delicioso
⭐ Rinde mucho

💰 Precio: $${product.price}
📍 Ciudad del Este
🚚 Envíos a todo el país

¿Quién se anima a probarlo? 👇

IMPORTANTE: Stock limitado. Consulta disponibilidad.`,
      engagement: {
        shareReward: 'Descuento extra por compartir',
        groupTarget: ['Belleza', 'Skincare', 'CDE', 'Paraguay'],
      },
      bestTime: '20:00',
    };
  }

  // 📞 WhatsApp: Directo y personal
  generateWhatsAppMessage(product, businessName) {
    return {
      title: `¡NUEVA OFERTA VIRAL! ${product.name}`,
      body: `¡Hola! 👋

Te aviso que acaba de publicarse en redes sociales una nueva oferta:

📦 ${product.name}
💰 $${product.price}
⭐ Stock: ${product.stock} unidades

Esta publicación ya está generando engagement en:
✅ Instagram
✅ TikTok
✅ Facebook

Si tienes ${product.name} en tu local:
1️⃣ Prepara stock
2️⃣ Crea tu propia oferta
3️⃣ Captura esa demanda

🔥 Este tipo de productos viral generan:
• +300% visitantes al local
• Compras impulsivas
• Recomendaciones boca a boca

¿Necesitas el contenido para publicar en TU local?
Responde: "SÍ" y te paso todo listo para copiar.`,
      cta: {
        action: 'Copiar oferta',
        url: 'https://kbeautycde.herokuapp.com/viral-content',
      },
    };
  }

  // Generar beneficios del producto
  generateProductBenefit(product) {
    const benefits = {
      'BB Cream': '✓ Cobertura total\n✓ SPF 50+ protección\n✓ 12 horas durabilidad',
      'Sheet Mask': '✓ Hidratación inmediata\n✓ Piel radiante en 20 min\n✓ Apto pieles sensibles',
      'Cleanser': '✓ Limpia profundo\n✓ No resseca\n✓ Apto todos los tipos',
      'Serum': '✓ Vitamina C pura\n✓ Antienvejecimiento\n✓ Resultados visibles',
    };

    for (const [key, value] of Object.entries(benefits)) {
      if (product.category.includes(key)) {
        return value;
      }
    }

    return '✓ Producto original de Corea\n✓ Garantizado\n✓ Mejor precio CDE';
  }

  // Generar contenido para TODAS las redes
  generateFullCampaign(product) {
    return {
      product: {
        id: product.id,
        name: product.name,
        price: product.price,
      },
      platforms: {
        instagram: this.generateInstagramPost(product),
        tiktok: this.generateTikTokCaption(product),
        facebook: this.generateFacebookPost(product),
      },
      whatsapp: {
        forCustomers: this.generateWhatsAppMessage(product, 'K-Beauty CDE'),
        forBusinesses: this.generateBusinessNotification(product),
      },
      timing: {
        instagram: '19:00',
        tiktok: '18:00',
        facebook: '20:00',
        whatsappBlast: '16:00',
      },
      metrics: {
        expectedReach: this.calculateExpectedReach(product),
        viralScore: this.calculateViralScore(product),
      },
    };
  }

  // Notificación para negocios de CDE
  generateBusinessNotification(product) {
    return {
      title: '🔥 ALERTA DE TENDENCIA: Producto Viral en Redes',
      body: `¡Atención emprendedores de CDE! 📢

El producto "${product.name}" está siendo promocionado en las principales redes sociales y está generando MUCHO engagement.

📊 OPORTUNIDAD AHORA MISMO:
• Miles viendo el anuncio
• Demanda garantizada
• +500% de probabilidad de venta

👉 SI TIENES STOCK DE ESTE PRODUCTO:

1. COPIA el contenido que preparé ✅
2. PEGA en tu Instagram/Facebook
3. RECIBE clientes HOY MISMO

Negocios que hicieron esto hace 3 días:
• Tirsa Cosmética: +240 visitas
• Beauty CDE: +3 ventas en 1 hora
• Perfumería del Centro: +150 mensajes

¿Qué haces? 👇
A) "Quiero el contenido ya"
B) "Necesito asesoría"
C) "Muéstrame más ejemplos"

⏰ APROVECHAR MIENTRAS ESTÉ TRENDING (máx 48 hs)`,
      cta: {
        button1: 'Copiar contenido',
        button2: 'Hablar asesor',
        button3: 'Ver más ejemplos',
      },
    };
  }

  // Calcular alcance esperado
  calculateExpectedReach(product) {
    const baseReach = 5000;
    const priceMultiplier = product.price < 20 ? 1.5 : 1;
    const categoryBoost = {
      'BB Creams': 1.8,
      'Sheet Masks': 1.6,
      'Cleansers': 1.2,
      'Serums': 1.7,
    };

    const boost = categoryBoost[product.category] || 1.3;

    return Math.round(baseReach * priceMultiplier * boost);
  }

  // Calcular score de viralidad
  calculateViralScore(product) {
    let score = 60; // Base score

    // Precio atractivo = +15
    if (product.price < 30) score += 15;

    // Categoría popular = +20
    if (['BB Creams', 'Sheet Masks', 'Serums'].includes(product.category)) {
      score += 20;
    }

    // Stock disponible = +10
    if (product.stock > 50) score += 10;

    // Calidad/rating = +15
    if (product.rating >= 4.7) score += 15;

    // Alta demanda = +10
    if (product.reviews > 100) score += 10;

    return Math.min(score, 100);
  }

  // Obtener mejor horario para publicar
  getBestPostingTimes() {
    return {
      instagram: ['19:00', '20:00'], // Noche (más engagement)
      tiktok: ['18:00', '21:00'], // Hora pico
      facebook: ['20:00', '21:00'], // Prime time
      whatsapp: ['15:00', '16:00', '20:00'], // Multiple slots
    };
  }

  // Generar hashtags trending
  generateTrendingHashtags() {
    return [
      '#KBeauty',
      '#CiudadDelEste',
      '#CDE',
      '#Belleza',
      '#SkinCare',
      '#CosméticaCoreana',
      '#Viral',
      '#OfertasYA',
      '#ParaTi',
      '#FYP',
      '#Trending',
      '#Paraguay',
      '#ProductosOriginales',
      '#BellezaCoreana',
    ];
  }
}

// Export singleton
export const viralEngine = new ViralEngine();
