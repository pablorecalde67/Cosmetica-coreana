// 📦 CATALOG LOADER
// Carga automáticamente productos K-beauty de Ciudad del Este al sitio

import express from 'express';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { nanoid } from 'nanoid';

const router = express.Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// In-memory product database
const productDatabase = new Map();
let catalogLoaded = false;

// Cargar catálogo de productos
function loadCatalog() {
  try {
    const catalogPath = path.join(__dirname, '../data/kbeauty-products-cde.json');
    const catalogData = JSON.parse(readFileSync(catalogPath, 'utf-8'));

    // Insertar productos en BD
    let productCount = 0;
    for (const [categoryKey, categoryData] of Object.entries(catalogData.catalog.categories)) {
      if (categoryData.products && Array.isArray(categoryData.products)) {
        for (const product of categoryData.products) {
          productDatabase.set(product.id, {
            ...product,
            addedAt: new Date(),
            views: Math.floor(Math.random() * 1000),
            sold: Math.floor(Math.random() * 200),
          });
          productCount++;
        }
      }
    }

    catalogLoaded = true;
    console.log(`[CATALOG] ✅ ${productCount} productos cargados exitosamente`);

    return {
      success: true,
      productsLoaded: productCount,
      categories: Object.keys(catalogData.catalog.categories).length,
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
// Búsqueda avanzada
router.get('/search', (req, res) => {
  try {
    const {
      query,
      category,
      minRating = 0,
      maxPrice = 999,
      inStock = true,
    } = req.query;

    let products = Array.from(productDatabase.values());

    // Buscar en nombre, descripción, brand
    if (query) {
      const q = query.toLowerCase();
      products = products.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          (p.benefits && p.benefits.some((b) => b.toLowerCase().includes(q)))
      );
    }

    // Filtros
    if (category) {
      products = products.filter((p) => p.category === category);
    }
    products = products.filter((p) => p.rating >= parseFloat(minRating));
    products = products.filter((p) => p.price <= parseFloat(maxPrice));
    if (inStock === 'true') {
      products = products.filter((p) => p.stock > 0);
    }

    // Ordenar por relevancia (rating + reviews)
    products.sort((a, b) => {
      const scoreA = a.rating * a.reviews;
      const scoreB = b.rating * b.reviews;
      return scoreB - scoreA;
    });

    res.json({
      results: products,
      total: products.length,
      query: query || 'all',
    });
  } catch (error) {
    console.error('[CATALOG] Error searching:', error);
    res.status(500).json({ error: 'Error en búsqueda' });
  }
});

// GET /api/catalog/stats
// Estadísticas del catálogo
router.get('/stats', (req, res) => {
  try {
    const products = Array.from(productDatabase.values());

    const stats = {
      totalProducts: products.length,
      totalCategories: new Set(products.map((p) => p.category)).size,
      averagePrice: (products.reduce((sum, p) => sum + p.price, 0) / products.length).toFixed(2),
      priceRange: {
        min: Math.min(...products.map((p) => p.price)).toFixed(2),
        max: Math.max(...products.map((p) => p.price)).toFixed(2),
      },
      averageRating: (products.reduce((sum, p) => sum + p.rating, 0) / products.length).toFixed(2),
      trendingProducts: products.filter((p) => p.trending).length,
      lowStockProducts: products.filter((p) => p.stock < 50).length,
      outOfStock: products.filter((p) => p.stock === 0).length,
      catalogLoaded,
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
