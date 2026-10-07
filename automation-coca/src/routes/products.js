// 🛍️ ADVANCED PRODUCT MANAGEMENT
// Catálogo completo con filtros, búsqueda, recomendaciones

import express from 'express';
import { cacheMiddleware } from '../middleware/cache.js';
import { apiLimiter } from '../middleware/security.js';

const router = express.Router();

// In-memory product database (reemplazar con DB real)
const products = [
  {
    id: 'kr-bb-001',
    name: 'BB Cream Coreano Premium',
    category: 'BB Creams',
    price: 25.99,
    currency: 'USD',
    stock: 50,
    rating: 4.8,
    reviews: 124,
    image: '/products/bb-cream-1.jpg',
    description: 'BB cream con SPF 50+, cobertura total',
    ingredients: ['niacinamida', 'ácido hialurónico', 'extracto de ginseng'],
    tags: ['popular', 'bestseller', 'new'],
  },
  {
    id: 'kr-sheet-001',
    name: 'Sheet Mask Hidratante',
    category: 'Sheet Masks',
    price: 3.99,
    currency: 'USD',
    stock: 200,
    rating: 4.6,
    reviews: 456,
    image: '/products/sheet-mask-1.jpg',
    description: 'Máscara de hoja con extracto de bambú',
    ingredients: ['bambú', 'miel', 'colágeno'],
    tags: ['bestseller', 'hydrating'],
  },
  {
    id: 'kr-cleanser-001',
    name: 'Limpiador Micelar 2-en-1',
    category: 'Cleansers',
    price: 18.99,
    currency: 'USD',
    stock: 75,
    rating: 4.7,
    reviews: 289,
    image: '/products/cleanser-1.jpg',
    description: 'Limpiador micelar de doble acción',
    ingredients: ['agua micelar', 'glicerina', 'pantenol'],
    tags: ['bestseller', 'cleanser'],
  },
];

// GET /api/products - List all products with filters
router.get('/', cacheMiddleware(10 * 60 * 1000), apiLimiter, (req, res) => {
  try {
    const { category, search, sort, limit = 50, offset = 0 } = req.query;

    let filtered = [...products];

    // Category filter
    if (category) {
      filtered = filtered.filter((p) =>
        p.category.toLowerCase().includes(category.toLowerCase())
      );
    }

    // Search filter
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(searchLower) ||
          p.description.toLowerCase().includes(searchLower) ||
          p.tags.some((t) => t.toLowerCase().includes(searchLower))
      );
    }

    // Sorting
    if (sort === 'price-asc') {
      filtered.sort((a, b) => a.price - b.price);
    } else if (sort === 'price-desc') {
      filtered.sort((a, b) => b.price - a.price);
    } else if (sort === 'rating') {
      filtered.sort((a, b) => b.rating - a.rating);
    } else if (sort === 'newest') {
      filtered.reverse();
    }

    // Pagination
    const total = filtered.length;
    const paged = filtered.slice(offset, offset + parseInt(limit));

    res.json({
      products: paged,
      total,
      offset: parseInt(offset),
      limit: parseInt(limit),
      hasMore: offset + parseInt(limit) < total,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// GET /api/products/:id - Get product details
router.get('/:id', cacheMiddleware(10 * 60 * 1000), (req, res) => {
  try {
    const product = products.find((p) => p.id === req.params.id);

    if (!product) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    // Get related products
    const related = products
      .filter(
        (p) =>
          p.category === product.category &&
          p.id !== product.id
      )
      .slice(0, 4);

    res.json({
      product,
      related,
      inStock: product.stock > 0,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// GET /api/products/featured - Featured/trending products
router.get('/featured/trending', cacheMiddleware(5 * 60 * 1000), (req, res) => {
  try {
    const featured = products
      .filter((p) => p.tags.includes('bestseller') || p.tags.includes('popular'))
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 8);

    res.json({
      featured,
      count: featured.length,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch featured products' });
  }
});

// GET /api/products/categories - List all categories
router.get('/categories/list', cacheMiddleware(1 * 60 * 60 * 1000), (req, res) => {
  try {
    const categories = [...new Set(products.map((p) => p.category))];

    const categoriesWithCount = categories.map((cat) => ({
      name: cat,
      count: products.filter((p) => p.category === cat).length,
      image: `/categories/${cat.toLowerCase().replace(' ', '-')}.jpg`,
    }));

    res.json({
      categories: categoriesWithCount,
      total: categories.length,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// GET /api/products/search - Advanced search
router.post('/search', apiLimiter, (req, res) => {
  try {
    const { query, filters = {}, sort = 'relevance' } = req.body;

    let results = products;

    // Text search
    if (query) {
      const queryLower = query.toLowerCase();
      results = results.filter(
        (p) =>
          p.name.toLowerCase().includes(queryLower) ||
          p.description.toLowerCase().includes(queryLower) ||
          p.ingredients.some((ing) => ing.toLowerCase().includes(queryLower))
      );
    }

    // Price range filter
    if (filters.priceMin || filters.priceMax) {
      results = results.filter(
        (p) =>
          p.price >= (filters.priceMin || 0) &&
          p.price <= (filters.priceMax || 999)
      );
    }

    // Rating filter
    if (filters.minRating) {
      results = results.filter((p) => p.rating >= filters.minRating);
    }

    // In stock only
    if (filters.inStock) {
      results = results.filter((p) => p.stock > 0);
    }

    res.json({
      results,
      count: results.length,
      query,
      filters,
    });
  } catch (error) {
    res.status(400).json({ error: 'Search failed' });
  }
});

// GET /api/products/recommendations - Personalized recommendations
router.get('/recommendations/for-you', cacheMiddleware(5 * 60 * 1000), (req, res) => {
  try {
    // In real app, would use user history and ML
    const recommendations = products
      .sort((a, b) => b.reviews - a.reviews)
      .slice(0, 6);

    res.json({
      recommendations,
      reason: 'Based on popular products',
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch recommendations' });
  }
});

export default router;
