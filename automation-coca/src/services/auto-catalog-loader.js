/**
 * AUTO CATALOG LOADER
 * Carga automáticamente productos procesados al catálogo
 * - Valida información
 * - Aplica precios con 30% markup
 * - Integra con el catálogo en vivo
 * - Sin intervención manual
 */

import fs from 'fs';
import path from 'path';

class AutoCatalogLoader {
  constructor() {
    this.loaded_products = [];
    this.rejected_products = [];
    this.catalog_path = '/home/claude/cosmetica-coreana/automation-coca/src/data/kbeauty-products-cde-real.json';
  }

  /**
   * PASO 1: Cargar catálogo actual
   */
  loadCurrentCatalog() {
    try {
      const data = JSON.parse(fs.readFileSync(this.catalog_path, 'utf-8'));
      return data;
    } catch (error) {
      console.error('[LOADER] Error cargando catálogo:', error.message);
      return { catalog: { categories: {} } };
    }
  }

  /**
   * PASO 2: Validar producto antes de cargar
   */
  validateProduct(product) {
    const validations = {
      has_id: !!product.id,
      has_name: !!product.name && product.name.length > 3,
      has_brand: !!product.brand,
      has_price: product.price_final > 0,
      has_category: !!product.category,
      has_description: !!product.description && product.description.length > 5,
      has_image: !!product.image_url || !!product.final_image_url,
      no_cde_reference: !product.description?.toLowerCase().includes('cde') && 
                        !product.description?.toLowerCase().includes('ciudad del este'),
      has_benefits: Array.isArray(product.benefits) && product.benefits.length >= 2
    };
    
    const score = Object.values(validations).filter(v => v).length;
    
    return {
      valid: score >= 8, // Mínimo 8 de 9 validaciones
      score: score,
      details: validations
    };
  }

  /**
   * PASO 3: Enriquecer producto con metadata
   */
  enrichProduct(product) {
    return {
      id: product.id,
      name: product.name,
      brand: product.brand,
      category: product.category,
      price: product.price_final, // Precio con 30% ya aplicado
      stock: 100, // Stock inicial
      rating: 4.3, // Rating conservador
      reviews: 45,
      description: product.description,
      benefits: product.benefits,
      image_url: product.final_image_url || product.image_url,
      trending: false,
      demand: 'medium',
      source: 'social_media_monitor',
      auto_loaded: true,
      loaded_at: new Date().toISOString()
    };
  }

  /**
   * PASO 4: Verificar no hay duplicados
   */
  isDuplicate(newProduct, existingProducts) {
    // Buscar por nombre similar
    for (const existing of existingProducts) {
      if (existing.name?.toLowerCase() === newProduct.name.toLowerCase() &&
          existing.brand?.toLowerCase() === newProduct.brand.toLowerCase()) {
        return true;
      }
    }
    return false;
  }

  /**
   * PASO 5: Agregar al catálogo
   */
  addToCatalog(catalog, product) {
    const category = product.category;
    
    // Crear categoría si no existe
    if (!catalog.catalog.categories[category]) {
      catalog.catalog.categories[category] = {
        products: []
      };
    }
    
    // Agregar producto
    catalog.catalog.categories[category].products.push(product);
    
    return catalog;
  }

  /**
   * PASO 6: Actualizar metadata del catálogo
   */
  updateCatalogMetadata(catalog) {
    // Contar totales
    let totalProducts = 0;
    const brands = new Set();
    const categories = Object.keys(catalog.catalog.categories);
    
    for (const category of categories) {
      const products = catalog.catalog.categories[category].products || [];
      totalProducts += products.length;
      products.forEach(p => brands.add(p.brand));
    }
    
    catalog.catalog.metadata = {
      totalProducts,
      uniqueBrands: brands.size,
      uniqueCategories: categories.length,
      lastUpdated: new Date().toISOString(),
      version: '2.2-AUTO-LOADED',
      source: 'CDE market data + Social Media Auto-Monitor'
    };
    
    return catalog;
  }

  /**
   * PASO 7: Guardar catálogo actualizado
   */
  saveCatalog(catalog) {
    try {
      fs.writeFileSync(
        this.catalog_path,
        JSON.stringify(catalog, null, 2)
      );
      return { success: true };
    } catch (error) {
      console.error('[LOADER] Error guardando catálogo:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * CARGAR PRODUCTOS AL CATÁLOGO
   */
  async loadProducts(products) {
    console.log('\n═══════════════════════════════════════════');
    console.log('💾 AUTO CATALOG LOADER - CARGANDO PRODUCTOS');
    console.log('═══════════════════════════════════════════\n');

    // 1. Cargar catálogo actual
    const catalog = this.loadCurrentCatalog();
    const allExistingProducts = [];
    
    Object.values(catalog.catalog.categories || {}).forEach(cat => {
      if (cat.products) allExistingProducts.push(...cat.products);
    });
    
    // 2. Procesar cada producto
    let accepted = 0;
    let rejected = 0;
    
    for (const product of products) {
      // Validar
      const validation = this.validateProduct(product);
      
      if (!validation.valid) {
        this.rejected_products.push({
          product: product.name,
          reason: `Validación fallida (score: ${validation.score}/9)`,
          details: validation.details
        });
        rejected++;
        console.log(`❌ ${product.name} - Rechazado`);
        continue;
      }
      
      // Verificar duplicados
      if (this.isDuplicate(product, allExistingProducts)) {
        rejected++;
        console.log(`⏭️  ${product.name} - Ya existe en catálogo`);
        continue;
      }
      
      // Enriquecer
      const enriched = this.enrichProduct(product);
      
      // Agregar al catálogo
      const updatedCatalog = this.addToCatalog(catalog, enriched);
      Object.assign(catalog, updatedCatalog);
      
      this.loaded_products.push(enriched);
      accepted++;
      
      console.log(`✅ ${product.name} - $${product.price_final} - Cargado`);
    }
    
    // 3. Actualizar metadata
    this.updateCatalogMetadata(catalog);
    
    // 4. Guardar
    const saved = this.saveCatalog(catalog);
    
    console.log('\n═══════════════════════════════════════════');
    console.log('📊 RESULTADOS:');
    console.log(`   Productos procesados: ${products.length}`);
    console.log(`   Aceptados: ${accepted}`);
    console.log(`   Rechazados: ${rejected}`);
    console.log(`   Tasa aceptación: ${((accepted / products.length) * 100).toFixed(1)}%`);
    console.log('═══════════════════════════════════════════\n');
    
    return {
      success: saved.success,
      loaded: accepted,
      rejected: rejected,
      total: products.length,
      loaded_products: this.loaded_products,
      rejected_products: this.rejected_products
    };
  }
}

export default AutoCatalogLoader;
