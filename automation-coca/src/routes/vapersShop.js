import { Router } from 'express';
import { listCatalog, getProduct, createProduct, updateProduct, deleteProduct } from '../vapersCatalog.js';
import { createOrder } from '../orders.js';
import { config } from '../config.js';

const router = Router();

// Catálogo público de /vapers - foto, descripción y precio en pesos
// argentinos, igual que el resto de la tienda.
router.get('/productos', (req, res) => {
  const all = listCatalog({ onlyActive: true });
  const q = (req.query.q || '').toString().trim().toLowerCase();
  const limit = Math.min(Number(req.query.limit) || 60, 200);

  let filtered = all;
  if (q) {
    filtered = all.filter(
      (p) => p.name.toLowerCase().includes(q) || (p.description || '').toLowerCase().includes(q),
    );
  }

  res.json({
    total: all.length,
    matched: filtered.length,
    productos: filtered.slice(0, limit).map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      image: p.image,
      price: p.price,
      brand: p.brand,
    })),
  });
});

router.post('/pedido', (req, res) => {
  const { productIds, name, phone, address, notes } = req.body || {};

  if (!Array.isArray(productIds) || productIds.length === 0) {
    return res.status(400).json({ error: 'No se seleccionó ningún producto.' });
  }
  if (!name || !phone || !address) {
    return res.status(400).json({ error: 'Faltan datos de contacto o dirección de envío.' });
  }

  const products = [];
  for (const id of productIds) {
    const p = getProduct(id);
    if (p && p.active !== false) products.push({ id: p.id, name: p.name, price: p.price });
  }
  if (products.length === 0) {
    return res.status(400).json({ error: 'Los productos seleccionados ya no están disponibles.' });
  }

  const order = createOrder({ source: 'vapers', products, name, phone, address, notes });

  res.status(201).json({
    orderId: order.id,
    total: order.total,
    products: order.products,
    alias: config.transferAlias,
    holderName: config.transferHolderName,
    whatsappNumber: config.whatsappOwnerNumber,
  });
});

// --- Admin: alta/edición/baja de productos (no hay catálogo semilla acá,
// se carga a mano con foto y precio reales de cada vaper) ---

router.get('/admin/productos', (req, res) => {
  res.json(listCatalog());
});

router.post('/admin/productos', (req, res) => {
  const { name, description, image, price, brand } = req.body || {};
  if (!name || price == null || !image) {
    return res.status(400).json({ error: 'Faltan "name", "price" o "image".' });
  }
  const product = createProduct({ name, description, image, price: Number(price), brand });
  res.status(201).json(product);
});

router.patch('/admin/productos/:id', (req, res) => {
  const updated = updateProduct(req.params.id, req.body || {});
  if (!updated) return res.status(404).json({ error: 'No existe.' });
  res.json(updated);
});

router.delete('/admin/productos/:id', (req, res) => {
  const ok = deleteProduct(req.params.id);
  if (!ok) return res.status(404).json({ error: 'No existe.' });
  res.status(204).end();
});

export default router;
