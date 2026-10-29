import { Router } from 'express';
import { listCatalog, getProduct, createProduct, updateProduct, deleteProduct } from '../vapersCatalog.js';
import { createOrder } from '../orders.js';
import { config } from '../config.js';

const router = Router();

// Saca la cantidad de puffs del nombre del producto para poder agrupar la
// vidriera por puffs (ej. "40K", "8000 PUFFS"). Solo reconoce los dos
// formatos que usa el catálogo real - nunca adivina a partir de un modelo
// (ej. "V300", "P100" NO son puffs, aunque tengan un número adentro), así
// que lo que no tiene un dato claro va a un grupo aparte en vez de agruparse
// mal.
function extractPuffs(name) {
  const kMatch = name.match(/(\d[\d.,]*)\s*K\b/i);
  if (kMatch) {
    const n = Math.round(parseFloat(kMatch[1].replace(',', '.')));
    if (n > 0) return { puffsSort: n * 1000, puffsLabel: `${n}K` };
  }
  const puffsMatch = name.match(/(\d{3,6})\s*PUFFS/i);
  if (puffsMatch) {
    const n = Number(puffsMatch[1]);
    if (n > 0) return { puffsSort: n, puffsLabel: n >= 1000 ? `${Math.round(n / 1000)}K` : `${n}` };
  }
  return { puffsSort: -1, puffsLabel: null };
}

// Catálogo público de /vapers - foto, descripción y precio en pesos
// argentinos, igual que el resto de la tienda. Sin límite real (tope alto
// solo para no mandar un payload infinito si el catálogo crece mucho más) -
// la vidriera necesita TODOS los productos para agruparlos por puffs, no
// una muestra parcial.
router.get('/productos', (req, res) => {
  const all = listCatalog({ onlyActive: true });
  const q = (req.query.q || '').toString().trim().toLowerCase();
  const limit = Math.min(Number(req.query.limit) || 2000, 2000);

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
      ...extractPuffs(p.name),
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
