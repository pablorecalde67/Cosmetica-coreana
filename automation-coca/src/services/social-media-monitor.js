/**
 * SOCIAL MEDIA MONITOR
 * Monitorea automáticamente las 20 tiendas CDE en redes sociales
 * Extrae productos, precios, descripciones y fotos
 * Normaliza y carga al catálogo automáticamente
 */

import { TIENDAS_CDE, KEYWORDS_KBEAUTY, KEYWORDS_EXCLUDE } from '../config/tiendas-cde.js';

class SocialMediaMonitor {
  constructor() {
    this.tiendas = TIENDAS_CDE;
    this.extracted_products = [];
    this.processing_queue = [];
    this.log = [];
  }

  /**
   * PASO 1: Extraer datos de redes sociales
   * En producción: usar Apify, ScrapingBee, o Instagrapi
   * Para MVP: simular con data mock
   */
  async extractFromSocialMedia() {
    console.log('[MONITOR] 🔍 Extrayendo datos de 20 tiendas CDE...');
    
    const extracted = [];
    
    for (const tienda of this.tiendas) {
      // En producción, aquí iría scraping real
      // Para MVP: extraer posts recientes simulados
      const posts = await this.fetchTiendaPosts(tienda);
      extracted.push(...posts);
    }
    
    this.extracted_products = extracted;
    this.log.push(`[EXTRACT] ${extracted.length} posts extraídos`);
    return extracted;
  }

  /**
   * Simula extracción de posts de una tienda
   * En producción: usar Instagram Graph API o scraper
   */
  async fetchTiendaPosts(tienda) {
    // Formato simulado de post extraído de Instagram
    return [
      {
        source: tienda.nombre,
        source_instagram: tienda.redes_sociales.instagram,
        post_id: `post_${tienda.id}_${Date.now()}`,
        timestamp: new Date(),
        image_url: 'https://example.com/product.jpg', // URL de imagen extraída
        caption: 'NUEVO: Anua Foam Cleanser 150ml - Limpieza profunda coreana - $12.99',
        images_count: 1
      }
    ];
  }

  /**
   * PASO 2: Procesar caption para extraer precio, nombre, descripción
   */
  extractProductData(post) {
    const caption = post.caption || '';
    
    // Detectar precio (formato: $XX.XX o XXX.XX)
    const priceMatch = caption.match(/\$[\d,]+\.?\d*/);
    const price = priceMatch ? parseFloat(priceMatch[0].replace('$', '').replace(',', '')) : null;
    
    // Detectar marca y nombre de producto
    let brand = '';
    let productName = '';
    
    for (const keyword of KEYWORDS_KBEAUTY) {
      if (caption.toLowerCase().includes(keyword.toLowerCase())) {
        // Extraer nombre: antes del precio
        const beforePrice = caption.substring(0, priceMatch?.index || caption.length);
        productName = beforePrice.replace(/^(NUEVO:|NEW:|LAST:)/i, '').trim();
        
        // Detectar marca
        if (caption.includes('Anua')) brand = 'Anua';
        else if (caption.includes('Cosrx')) brand = 'Cosrx';
        else if (caption.includes('Laneige')) brand = 'Laneige';
        // ... más lógica de detección
        
        break;
      }
    }
    
    return {
      brand: brand || 'Unknown',
      name: productName || caption.substring(0, 50),
      price_cde: price,
      description: caption,
      image_url: post.image_url,
      source_tienda: post.source,
      source_instagram: post.source_instagram,
      extracted_at: new Date()
    };
  }

  /**
   * PASO 3: Validar calidad del producto
   */
  validateProduct(product) {
    const validations = {
      has_brand: !!product.brand && product.brand !== 'Unknown',
      has_name: !!product.name && product.name.length > 3,
      has_price: product.price_cde && product.price_cde > 0,
      has_image: !!product.image_url,
      has_description: !!product.description && product.description.length > 5,
      is_kbeauty: KEYWORDS_KBEAUTY.some(k => 
        product.description?.toLowerCase().includes(k.toLowerCase())
      )
    };
    
    // Producto válido si cumple mínimo 5 de 6 validaciones
    const score = Object.values(validations).filter(v => v).length;
    
    return {
      valid: score >= 5,
      score: score,
      details: validations
    };
  }

  /**
   * PASO 4: Normalizar - aplicar 30% markup
   */
  normalizeProduct(product) {
    return {
      ...product,
      price_final: parseFloat((product.price_cde * 1.30).toFixed(2)),
      markup_percentage: 30,
      category: this.detectCategory(product.name),
      benefits: [
        'Exclusive to kbeautycde.com',
        this.detectCategory(product.name),
        'Authentic K-beauty'
      ],
      description: `${product.brand} ${product.name} - Premium K-beauty product`.substring(0, 150),
      // Remover referencias a tienda CDE
      source_tienda: null // Limpieza de información de origen
    };
  }

  /**
   * Detectar categoría automáticamente
   */
  detectCategory(productName) {
    const name = productName.toLowerCase();
    
    if (name.includes('cleanser')) return 'Foam Cleanser';
    if (name.includes('toner')) return 'Soothing Toner';
    if (name.includes('mask') || name.includes('mascarilla')) return 'Mask';
    if (name.includes('serum')) return 'Serum';
    if (name.includes('cream')) return 'Face Cream';
    if (name.includes('essence')) return 'Essence';
    if (name.includes('cushion')) return 'Cushion Compact';
    if (name.includes('tint')) return 'Lip Tint';
    if (name.includes('sunscreen') || name.includes('spf')) return 'Sunscreen';
    if (name.includes('eye')) return 'Eye Care';
    if (name.includes('lip')) return 'Lip Care';
    
    return 'Skincare';
  }

  /**
   * PASO 5: Procesar pipeline completo
   */
  async processPipeline(post) {
    try {
      // 1. Extraer datos
      const productData = this.extractProductData(post);
      
      // 2. Validar
      const validation = this.validateProduct(productData);
      if (!validation.valid) {
        this.log.push(`[REJECT] ${productData.name} - Score: ${validation.score}/6`);
        return null;
      }
      
      // 3. Normalizar
      const normalized = this.normalizeProduct(productData);
      
      // 4. Crear ID único
      normalized.id = `kbeauty-social-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      this.log.push(`[ACCEPT] ${normalized.name} - $${normalized.price_cde} → $${normalized.price_final}`);
      
      return normalized;
    } catch (error) {
      this.log.push(`[ERROR] ${error.message}`);
      return null;
    }
  }

  /**
   * EJECUTAR MONITOR COMPLETO
   */
  async run() {
    console.log('\n═══════════════════════════════════════════');
    console.log('🚀 SOCIAL MEDIA MONITOR - EJECUTANDO');
    console.log('═══════════════════════════════════════════\n');

    // Extraer
    const posts = await this.extractFromSocialMedia();
    console.log(`✅ Extraídos ${posts.length} posts\n`);
    
    // Procesar
    const processed = [];
    for (const post of posts) {
      const product = await this.processPipeline(post);
      if (product) processed.push(product);
    }
    
    console.log('\n═══════════════════════════════════════════');
    console.log('📊 RESULTADOS:');
    console.log(`   Posts extraídos: ${posts.length}`);
    console.log(`   Productos válidos: ${processed.length}`);
    console.log(`   Aceptación: ${((processed.length / posts.length) * 100).toFixed(1)}%`);
    console.log('═══════════════════════════════════════════\n');
    
    console.log('📋 LOG:\n');
    this.log.forEach(line => console.log(line));
    
    return {
      total_posts: posts.length,
      valid_products: processed.length,
      products: processed,
      logs: this.log
    };
  }
}

export default SocialMediaMonitor;
