import { Router } from 'express';
import multer from 'multer';
import path from 'node:path';
import { createItem, addMedia, listItems, getItem, updateItem, deleteItem, MEDIA_DIR } from '../store.js';
import { publishItem, buildCaption, buildBuyLink } from '../meta.js';
import { isMetaConfigured } from '../config.js';
import { listProducts, updateProduct } from '../products.js';
import { listOrders, updateOrder } from '../orders.js';

const router = Router();

const upload = multer({
  storage: multer.diskStorage({
    destination: MEDIA_DIR,
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname) || '';
      cb(null, `${Date.now()}-manual-${Math.random().toString(36).slice(2, 8)}${ext}`);
    },
  }),
  limits: { fileSize: 200 * 1024 * 1024 },
});

function toMedia(files) {
  return files.map((f) => ({
    file: f.filename,
    type: f.mimetype.startsWith('video') ? 'video' : 'image',
  }));
}

function applyPublishResult(item, { igPostId }) {
  return updateItem(item.id, {
    igPostId,
    error: null,
    status: 'published',
    publishedAt: Date.now(),
  });
}

function withCaption(item) {
  return {
    ...item,
    finalCaption: buildCaption(item),
    buyLink: buildBuyLink(item),
    metaConfigured: isMetaConfigured(),
  };
}

router.get('/queue', (req, res) => {
  res.json(listItems().map(withCaption));
});

router.get('/status', (req, res) => {
  res.json({ metaConfigured: isMetaConfigured() });
});

router.post('/upload', upload.array('files', 10), (req, res) => {
  if (!req.files || req.files.length === 0) return res.status(400).json({ error: 'Falta el archivo.' });

  const item = createItem({
    source: 'manual',
    media: toMedia(req.files),
    caption: req.body.description || '',
  });

  res.status(201).json(withCaption(item));
});

router.post('/queue/:id/add-media', upload.array('files', 10), (req, res) => {
  if (!req.files || req.files.length === 0) return res.status(400).json({ error: 'Falta el archivo.' });

  const updated = addMedia(req.params.id, toMedia(req.files));
  if (!updated) return res.status(404).json({ error: 'No existe.' });

  res.json(withCaption(updated));
});

router.patch('/queue/:id', async (req, res) => {
  const item = getItem(req.params.id);
  if (!item) return res.status(404).json({ error: 'No existe.' });

  const patch = {};
  if (typeof req.body.description === 'string') patch.description = req.body.description;

  let priceJustSet = false;
  if (req.body.price !== undefined) {
    const price = Number(req.body.price);
    if (Number.isNaN(price) || price < 0) {
      return res.status(400).json({ error: 'Precio invalido.' });
    }
    patch.price = price;
    patch.status = 'ready';
    priceJustSet = true;
  }

  let updated = updateItem(req.params.id, patch);

  // Si en algun momento configuras las credenciales de Meta (META_ACCESS_TOKEN,
  // META_PAGE_ID, META_IG_USER_ID), esto publica solo apenas cargas el precio.
  // Mientras tanto queda en "ready" para que lo publiques vos en Meta Business Suite.
  if (priceJustSet && isMetaConfigured()) {
    try {
      const result = await publishItem(updated);
      updated = applyPublishResult(updated, result);
    } catch (err) {
      updated = updateItem(updated.id, { status: 'error', error: err.message });
    }
  }

  res.json(withCaption(updated));
});

router.post('/queue/:id/publish', async (req, res) => {
  const item = getItem(req.params.id);
  if (!item) return res.status(404).json({ error: 'No existe.' });
  if (item.price == null) {
    return res.status(400).json({ error: 'No se puede publicar sin precio.' });
  }

  try {
    const result = await publishItem(item);
    const updated = applyPublishResult(item, result);
    res.json(withCaption(updated));
  } catch (err) {
    updateItem(item.id, { status: 'error', error: err.message });
    res.status(502).json({ error: err.message });
  }
});

router.post('/queue/:id/mark-published', (req, res) => {
  const item = getItem(req.params.id);
  if (!item) return res.status(404).json({ error: 'No existe.' });
  if (item.price == null) {
    return res.status(400).json({ error: 'No se puede marcar como publicado sin precio.' });
  }

  const updated = updateItem(item.id, {
    status: 'published',
    publishedAt: Date.now(),
    error: null,
  });
  res.json(withCaption(updated));
});

router.delete('/queue/:id', (req, res) => {
  const ok = deleteItem(req.params.id);
  if (!ok) return res.status(404).json({ error: 'No existe.' });
  res.status(204).end();
});

// --- Admin: catálogo de productos usado en /piel (precio, descripción, etc.) ---

router.get('/productos', (req, res) => {
  res.json(listProducts());
});

router.patch('/productos/:id', (req, res) => {
  const patch = {};
  if (typeof req.body.name === 'string') patch.name = req.body.name;
  if (typeof req.body.description === 'string') patch.description = req.body.description;
  if (typeof req.body.image === 'string') patch.image = req.body.image;
  if (typeof req.body.active === 'boolean') patch.active = req.body.active;
  if (req.body.price !== undefined) {
    const price = Number(req.body.price);
    if (Number.isNaN(price) || price < 0) return res.status(400).json({ error: 'Precio inválido.' });
    patch.price = price;
  }

  const updated = updateProduct(req.params.id, patch);
  if (!updated) return res.status(404).json({ error: 'No existe.' });
  res.json(updated);
});

// --- Admin: pedidos generados automáticamente desde /piel ---

router.get('/pedidos', (req, res) => {
  res.json(listOrders());
});

router.patch('/pedidos/:id', (req, res) => {
  const patch = {};
  if (typeof req.body.status === 'string') {
    patch.status = req.body.status;
    if (req.body.status === 'enviado') patch.fulfilledAt = Date.now();
  }
  const updated = updateOrder(req.params.id, patch);
  if (!updated) return res.status(404).json({ error: 'No existe.' });
  res.json(updated);
});

export default router;
