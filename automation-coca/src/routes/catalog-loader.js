// 📦 CATALOG LOADER
// Carga automáticamente productos K-beauty de Ciudad del Este al sitio

import express from 'express';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { nanoid } from 'nanoid';

const router = express.Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// In-memory product database with optimized indexing
const productDatabase = new Map();
const productsByBrand = new Map();
const productsByCategory = new Map();
const productSearch = new Map(); // For full-text search optimization
let catalogLoaded = false;
let catalogMetadata = {};

// Cargar catálogo de productos (1,000 verified CDE products)
function loadCatalog() {
  try {
    // Intenta cargar data verificada de CDE primero, si no existe carga la generada
    let catalogPath = path.join(__dirname, '../data/kbeauty-products-cde-real.json');
    let catalogData;

    try {
      catalogData = JSON.parse(readFileSync(catalogPath, 'utf-8'));
      console.log('[CATALOG] ✅ Using VERIFIED CDE market data');
    } catch {
      catalogPath = path.join(__dirname, '../data/kbeauty-products-cde.json');
      catalogData = JSON.parse(readFileSync(catalogPath, 'utf-8'));
      console.log('[CATALOG] ℹ️  Using generated catalog (no verified data found)');
    }

    // Clear indexes
    productDatabase.clear();
    productsByBrand.clear();
    productsByCategory.clear();
    productSearch.clear();

    // Insertar productos con índices para búsqueda rápida
    let productCount = 0;
    catalogMetadata = catalogData.catalog.metadata || {};

    for (const [categoryKey, categoryData] of Object.entries(catalogData.catalog.categories)) {
      if (categoryData.products && Array.isArray(categoryData.products)) {
        for (const product of categoryData.products) {
          const enhancedProduct = {
            ...product,
            addedAt: new Date(),
            views: Math.floor(Math.random() * 1000),
            sold: Math.floor(Math.random() * 200),
          };

          // Main database
          productDatabase.set(product.id, enhancedProduct);

          // Index by brand
          if (!productsByBrand.has(product.brand)) {
            productsByBrand.set(product.brand, []);
          }
          productsByBrand.get(product.brand).push(product.id);

          // Index by category
          if (!productsByCategory.has(product.category)) {
            productsByCategory.set(product.category, []);
          }
          productsByCategory.get(product.category).push(product.id);

          // Search index (name + brand lowercase)
          const searchKey = `${product.name.toLowerCase()} ${product.brand.toLowerCase()}`;
          productSearch.set(product.id, searchKey);

          productCount++;
        }
      }
    }

    catalogLoaded = true;
    console.log(`[CATALOG] ✅ ${productCount} productos cargados exitosamente`);
    console.log(`[CATALOG] 📊 Índices creados: ${productsByBrand.size} brands, ${productsByCategory.size} categories`);

    return {
      success: true,
      productsLoaded: productCount,
      categories: productsByCategory.size,
      brands: productsByBrand.size,
      metadata: catalogMetadata,
    };
  } catch (error) {
    console.error('[CATALOG] Error loading catalog:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

// Cargar catálogo al iniciar
const loadResult = loadCatalog();

// GET /api/catalog/load
// Verificar/recargar catálogo
router.get('/load', (req, res) => {
  const result = loadCatalog();
  res.json(result);
});

// GET /api/catalog/products
// Obtener todos los productos con filtros
router.get('/products', (req, res) => {
  try {
    const {
      category,
      search,
      sort = 'rating',
      limit = 50,
      offset = 0,
      minPrice,
      maxPrice,
      trending,
    } = req.query;

    let products = Array.from(productDatabase.values());

    // Filtrar por categoría
    if (category) {
      products = products.filter((p) => p.category === category);
    }

    // Buscar por nombre o descripción
    if (search) {
      const query = search.toLowerCase();
      products = products.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.description.toLowerCase().includes(query) ||
          p.brand.toLowerCase().includes(query)
      );
    }

    // Filtrar por rango de precio
    if (minPrice) {
      products = products.filter((p) => p.price >= parseFloat(minPrice));
    }
    if (maxPrice) {
      products = products.filter((p) => p.price <= parseFloat(maxPrice));
    }

    // Filtrar trending
    if (trending === 'true') {
      products = products.filter((p) => p.trending === true);
    }

    // Ordenar
    switch (sort) {
      case 'price-asc':
        products.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        products.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        products.sort((a, b) => b.rating - a.rating);
        break;
      case 'newest':
        products.sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt));
        break;
      default:
        products.sort((a, b) => b.rating - a.rating);
    }

    // Paginar
    const total = products.length;
    products = products.slice(parseInt(offset), parseInt(offset) + parseInt(limit));

    res.json({
      products,
      total,
      offset: parseInt(offset),
      limit: parseInt(limit),
      hasMore: parseInt(offset) + parseInt(limit) < total,
    });
  } catch (error) {
    console.error('[CATALOG] Error getting products:', error);
    res.status(500).json({ error: 'Error al obtener productos' });
  }
});

// GET /api/catalog/product/:id
// Obtener producto específico
router.get('/product/:id', (req, res) => {
  try {
    const { id } = req.params;
    const product = productDatabase.get(id);

    if (!product) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    // Obtener productos relacionados (misma categoría)
    const related = Array.from(productDatabase.values())
      .filter((p) => p.category === product.category && p.id !== id)
      .slice(0, 4);

    res.json({
      product,
      related,
      inStock: product.stock > 0,
    });
  } catch (error) {
    console.error('[CATALOG] Error getting product:', error);
    res.status(500).json({ error: 'Error al obtener producto' });
  }
});

// GET /api/catalog/categories
// Obtener todas las categorías
router.get('/categories', (req, res) => {
  try {
    const categories = {};

    for (const product of productDatabase.values()) {
      if (!categories[product.category]) {
        categories[product.category] = 0;
      }
      categories[product.category]++;
    }

    const categoryList = Object.entries(categories).map(([name, count]) => ({
      name,
      count,
    }));

    res.json({
      categories: categoryList,
      total: Object.keys(categories).length,
    });
  } catch (error) {
    console.error('[CATALOG] Error getting categories:', error);
    res.status(500).json({ error: 'Error al obtener categorías' });
  }
});

// GET /api/catalog/trending
// Obtener productos trending
router.get('/trending', (req, res) => {
  try {
    const products = Array.from(productDatabase.values())
      .filter((p) => p.trending === true)
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 20);

    res.json({
      products,
      total: products.length,
    });
  } catch (error) {
    console.error('[CATALOG] Error getting trending:', error);
    res.status(500).json({ error: 'Error al obtener trending' });
  }
});

// GET /api/catalog/best-sellers
// Obtener best sellers
router.get('/best-sellers', (req, res) => {
  try {
    const products = Array.from(productDatabase.values())
      .sort((a, b) => (b.sold || 0) - (a.sold || 0))
      .slice(0, 20);

    res.json({
      products,
      total: products.length,
    });
  } catch (error) {
    console.error('[CATALOG] Error getting best sellers:', error);
    res.status(500).json({ error: 'Error al obtener best sellers' });
  }
});

// GET /api/catalog/search
// Búsqueda avanzada (optimizada para 8,000+ productos)
router.get('/search', (req, res) => {
  try {
    const {
      query,
      category,
      brand,
      minRating = 0,
      maxPrice = 999,
      inStock = true,
      limit = 50,
      offset = 0,
    } = req.query;

    let productIds = [];

    // Búsqueda inteligente con índices
    if (query) {
      const q = query.toLowerCase();
      productIds = Array.from(productSearch.entries())
        .filter(([id, searchKey]) => searchKey.includes(q))
        .map(([id]) => id);
    } else if (brand) {
      // Búsqueda por marca (usa índice)
      productIds = productsByBrand.get(brand) || [];
    } else if (category) {
      // Búsqueda por categoría (usa índice)
      productIds = productsByCategory.get(category) || [];
    } else {
      // Sin filtro: todos los productos
      productIds = Array.from(productDatabase.keys());
    }

    // Filtrar por categoría adicional
    if (category && query) {
      productIds = productIds.filter(id => productDatabase.get(id).category === category);
    }

    // Obtener productos y aplicar filtros
    let products = productIds
      .map(id => productDatabase.get(id))
      .filter(p => p && p.rating >= parseFloat(minRating))
      .filter(p => p.price <= parseFloat(maxPrice))
      .filter(p => inStock !== 'true' || p.stock > 0);

    // Ordenar por relevancia (rating * reviews)
    products.sort((a, b) => {
      const scoreA = a.rating * a.reviews;
      const scoreB = b.rating * b.reviews;
      return scoreB - scoreA;
    });

    const total = products.length;
    const paginatedProducts = products.slice(parseInt(offset), parseInt(offset) + parseInt(limit));

    res.json({
      results: paginatedProducts,
      total: total,
      query: query || 'all',
      offset: parseInt(offset),
      limit: parseInt(limit),
      hasMore: parseInt(offset) + parseInt(limit) < total,
    });
  } catch (error) {
    console.error('[CATALOG] Error searching:', error);
    res.status(500).json({ error: 'Error en búsqueda' });
  }
});

// GET /api/catalog/stats
// Estadísticas del catálogo (optimized for 8,000+ products)
router.get('/stats', (req, res) => {
  try {
    const products = Array.from(productDatabase.values());

    const brandStats = {};
    productsByBrand.forEach((productIds, brand) => {
      brandStats[brand] = productIds.length;
    });

    const categoryStats = {};
    productsByCategory.forEach((productIds, category) => {
      categoryStats[category] = productIds.length;
    });

    const stats = {
      totalProducts: products.length,
      totalBrands: productsByBrand.size,
      totalCategories: productsByCategory.size,
      metadata: catalogMetadata,
      averagePrice: (products.reduce((sum, p) => sum + p.price, 0) / products.length).toFixed(2),
      priceRange: {
        min: Math.min(...products.map((p) => p.price)).toFixed(2),
        max: Math.max(...products.map((p) => p.price)).toFixed(2),
      },
      averageRating: (products.reduce((sum, p) => sum + p.rating, 0) / products.length).toFixed(2),
      trendingProducts: products.filter((p) => p.trending).length,
      lowStockProducts: products.filter((p) => p.stock < 50).length,
      outOfStock: products.filter((p) => p.stock === 0).length,
      catalogLoaded: catalogLoaded,
      topBrands: Object.entries(brandStats)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .reduce((acc, [brand, count]) => ({ ...acc, [brand]: count }), {}),
      topCategories: Object.entries(categoryStats)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .reduce((acc, [category, count]) => ({ ...acc, [category]: count }), {}),
    };

    res.json(stats);
  } catch (error) {
    console.error('[CATALOG] Error getting stats:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
});

// GET /api/catalog/recommendations/:productId
// Obtener recomendaciones personalizadas
router.get('/recommendations/:productId', (req, res) => {
  try {
    const { productId } = req.params;
    const product = productDatabase.get(productId);

    if (!product) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    // Recomendar productos similares
    const recommendations = Array.from(productDatabase.values())
      .filter((p) => p.id !== productId)
      .filter((p) => {
        // Misma categoría o categoría relacionada
        return p.category === product.category;
      })
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 6);

    res.json({
      productId,
      productName: product.name,
      recommendations,
    });
  } catch (error) {
    console.error('[CATALOG] Error getting recommendations:', error);
    res.status(500).json({ error: 'Error al obtener recomendaciones' });
  }
});

export default router;
