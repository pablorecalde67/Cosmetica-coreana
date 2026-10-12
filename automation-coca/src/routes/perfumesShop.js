import { Router } from 'express';
import { listCatalog } from '../perfumesCatalog.js';
import { createOrder } from '../orders.js';
import { config } from '../config.js';

const router = Router();

// Catálogo público: igual que el de /piel, sin "total" de golpe (son miles
// de productos) salvo que se busque algo puntual.
router.get('/productos', (req, res) => {
  const all = listCatalog();
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
      image: p.photoUrl,
      price: p.priceArs,
    })),
  });
});

// Confirma el pedido: recalcula el total desde el catálogo actual (nunca
// confía en el precio que mande el navegador) — acá es donde el 10% de
// margen ya aplicado en priceArs queda firme en el momento de pagar.
router.post('/pedido', (req, res) => {
  const { productIds, name, phone, address, notes } = req.body || {};

  if (!Array.isArray(productIds) || productIds.length === 0) {
    return res.status(400).json({ error: 'No se seleccionó ningún producto.' });
  }
  if (!name || !phone || !address) {
    return res.status(400).json({ error: 'Faltan datos de contacto o dirección de envío.' });
  }

  const catalog = listCatalog();
  const products = [];
  for (const id of productIds) {
    const p = catalog.find((it) => it.id === id);
    if (p) products.push({ id: p.id, name: p.name, price: p.priceArs });
  }
  if (products.length === 0) {
    return res.status(400).json({ error: 'Los productos seleccionados ya no están disponibles.' });
  }

  const order = createOrder({
    source: 'perfumes',
    products,
    name,
    phone,
    address,
    notes,
  });

  res.status(201).json({
    orderId: order.id,
    total: order.total,
    products: order.products,
    alias: config.transferAlias,
    holderName: config.transferHolderName,
    whatsappNumber: config.whatsappOwnerNumber,
  });
});

export default router;
