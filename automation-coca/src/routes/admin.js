import { Router } from 'express';
import { listOrders, getOrder, updateOrder } from '../orders.js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', 'data');
const PRODUCTS_FILE = path.join(DATA_DIR, 'products.json');

const router = Router();

/**
 * Middleware básico de autenticación (expandir en producción)
 */
function authAdmin(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  const adminToken = process.env.ADMIN_TOKEN || 'admin-secret-123';

  if (token !== adminToken) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

// ============= ÓRDENES =============

/**
 * GET /api/admin/orders
 * Lista todas las órdenes con filtros opcionales
 */
router.get('/orders', authAdmin, (req, res) => {
  try {
    const { status, pais, metodo, limit = 50, offset = 0 } = req.query;
    let orders = listOrders();

    // Filtros
    if (status) orders = orders.filter(o => o.status === status);
    if (pais) orders = orders.filter(o => o.pais === pais);
    if (metodo) orders = orders.filter(o => o.metodo === metodo);

    // Paginación
    const total = orders.length;
    orders = orders.slice(parseInt(offset), parseInt(offset) + parseInt(limit));

    res.json({
      success: true,
      total,
      count: orders.length,
      offset: parseInt(offset),
      limit: parseInt(limit),
      orders
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/admin/orders/:id
 * Detalle de una orden
 */
router.get('/orders/:id', authAdmin, (req, res) => {
  try {
    const order = getOrder(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Orden no encontrada' });
    }
    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * PATCH /api/admin/orders/:id
 * Actualizar estado de una orden
 */
router.patch('/orders/:id', authAdmin, (req, res) => {
  try {
    const { status, trackingStatus, trackingId } = req.body;
    const order = getOrder(req.params.id);

    if (!order) {
      return res.status(404).json({ error: 'Orden no encontrada' });
    }

    const updates = {};
    if (status) updates.status = status;
    if (trackingStatus) updates.trackingStatus = trackingStatus;
    if (trackingId) updates.trackingId = trackingId;

    const updated = updateOrder(req.params.id, updates);
    res.json({ success: true, order: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ============= PRODUCTOS =============

/**
 * Carga productos desde archivo
 */
function loadProducts() {
  if (!fs.existsSync(PRODUCTS_FILE)) return [];
  try {
    return JSON.parse(fs.readFileSync(PRODUCTS_FILE, 'utf8'));
  } catch {
    return [];
  }
}

/**
 * Guarda productos a archivo
 */
function saveProducts(products) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(products, null, 2));
}

/**
 * GET /api/admin/products
 * Lista todos los productos
 */
router.get('/products', authAdmin, (req, res) => {
  try {
    const { search, limit = 50 } = req.query;
    let products = loadProducts();

    if (search) {
      const q = search.toLowerCase();
      products = products.filter(p =>
        p.nombre?.toLowerCase().includes(q) ||
        p.descripcion?.toLowerCase().includes(q)
      );
    }

    products = products.slice(0, parseInt(limit));
    res.json({ success: true, count: products.length, products });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/admin/products/:id
 * Detalle de un producto
 */
router.get('/products/:id', authAdmin, (req, res) => {
  try {
    const products = loadProducts();
    const product = products.find(p => p.id === req.params.id);

    if (!product) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    res.json({ success: true, product });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/admin/products
 * Crear nuevo producto
 */
router.post('/products', authAdmin, (req, res) => {
  try {
    const { nombre, descripcion, precio, moneda = 'ARS', imagen, fuente } = req.body;

    if (!nombre || !precio) {
      return res.status(400).json({ error: 'Faltan campos requeridos' });
    }

    const products = loadProducts();
    const newProduct = {
      id: `prod_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      nombre,
      descripcion: descripcion || '',
      precio: parseFloat(precio),
      moneda,
      imagen: imagen || null,
      fuente: fuente || 'manual',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    products.push(newProduct);
    saveProducts(products);

    res.status(201).json({ success: true, product: newProduct });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * PATCH /api/admin/products/:id
 * Actualizar producto
 */
router.patch('/products/:id', authAdmin, (req, res) => {
  try {
    const { nombre, descripcion, precio, moneda, imagen } = req.body;
    const products = loadProducts();
    const idx = products.findIndex(p => p.id === req.params.id);

    if (idx === -1) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    if (nombre) products[idx].nombre = nombre;
    if (descripcion !== undefined) products[idx].descripcion = descripcion;
    if (precio) products[idx].precio = parseFloat(precio);
    if (moneda) products[idx].moneda = moneda;
    if (imagen !== undefined) products[idx].imagen = imagen;

    products[idx].updatedAt = new Date().toISOString();
    saveProducts(products);

    res.json({ success: true, product: products[idx] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * DELETE /api/admin/products/:id
 * Eliminar producto
 */
router.delete('/products/:id', authAdmin, (req, res) => {
  try {
    const products = loadProducts();
    const idx = products.findIndex(p => p.id === req.params.id);

    if (idx === -1) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    const deleted = products.splice(idx, 1)[0];
    saveProducts(products);

    res.json({ success: true, message: 'Producto eliminado', product: deleted });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ============= ANALYTICS =============

/**
 * GET /api/admin/analytics
 * Dashboard con reportes de ventas
 */
router.get('/analytics', authAdmin, (req, res) => {
  try {
    const orders = listOrders();

    // Estadísticas básicas
    const stats = {
      totalOrders: orders.length,
      totalRevenue: 0,
      ordersByStatus: {},
      ordersByCountry: {},
      ordersByPaymentMethod: {},
      averageOrderValue: 0,
      lastUpdated: new Date().toISOString()
    };

    orders.forEach(order => {
      // Revenue
      if (order.total) stats.totalRevenue += order.total;

      // Por estado
      stats.ordersByStatus[order.status] = (stats.ordersByStatus[order.status] || 0) + 1;

      // Por país
      if (order.pais) {
        stats.ordersByCountry[order.pais] = (stats.ordersByCountry[order.pais] || 0) + 1;
      }

      // Por método de pago
      if (order.metodo) {
        stats.ordersByPaymentMethod[order.metodo] = (stats.ordersByPaymentMethod[order.metodo] || 0) + 1;
      }
    });

    stats.averageOrderValue = stats.totalOrders > 0 ? stats.totalRevenue / stats.totalOrders : 0;

    res.json({ success: true, stats });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ============= WEBHOOKS =============

/**
 * GET /api/admin/webhooks
 * Estado de integración de webhooks
 */
router.get('/webhooks', authAdmin, (req, res) => {
  try {
    const webhookStatus = {
      stripe: {
        configured: Boolean(process.env.STRIPE_WEBHOOK_SECRET),
        endpoint: '/api/webhooks/stripe',
        status: 'pending'
      },
      paypal: {
        configured: Boolean(process.env.PAYPAL_WEBHOOK_ID),
        endpoint: '/api/webhooks/paypal',
        status: 'pending'
      },
      andreani: {
        configured: Boolean(process.env.ANDREANI_API_KEY),
        endpoint: '/api/webhooks/andreani',
        status: 'pending'
      },
      shippo: {
        configured: Boolean(process.env.SHIPPO_API_KEY),
        endpoint: '/api/webhooks/shippo',
        status: 'pending'
      }
    };

    res.json({ success: true, webhooks: webhookStatus });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ============= SYNC =============

/**
 * POST /api/admin/sync/instagram
 * Trigger manual de sincronización de Instagram
 */
router.post('/sync/instagram', authAdmin, async (req, res) => {
  try {
    // Este endpoint espera que ya tengas instagram-scraper.js cargado
    // Por ahora retorna status
    res.json({
      success: true,
      message: 'Sincronización de Instagram en progreso',
      endpoint: '/api/instagram/scrape'
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/admin/health
 * Health check del sistema
 */
router.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'ok',
    timestamp: new Date().toISOString(),
    endpoints: {
      orders: '/api/admin/orders',
      products: '/api/admin/products',
      analytics: '/api/admin/analytics',
      webhooks: '/api/admin/webhooks'
    }
  });
});

export default router;
