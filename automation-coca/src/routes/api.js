import { Router } from 'express';
import multer from 'multer';
import path from 'node:path';
import { createItem, listItems, getItem, updateItem, deleteItem, MEDIA_DIR } from '../store.js';
import { publishItem, buildCaption } from '../meta.js';
import { isMetaConfigured } from '../config.js';

const router = Router();

const upload = multer({
  storage: multer.diskStorage({
    destination: MEDIA_DIR,
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname) || '';
      cb(null, `${Date.now()}-manual${ext}`);
    },
  }),
  limits: { fileSize: 200 * 1024 * 1024 },
});

function withCaption(item) {
  return { ...item, finalCaption: buildCaption(item) };
}

router.get('/queue', (req, res) => {
  res.json(listItems().map(withCaption));
});

router.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Falta el archivo.' });

  const mediaType = req.file.mimetype.startsWith('video') ? 'video' : 'image';
  const item = createItem({
    source: 'manual',
    mediaFile: req.file.filename,
    mediaType,
    caption: req.body.description || '',
  });

  res.status(201).json(withCaption(item));
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
      const { igPostId, fbPostId } = await publishItem(updated);
      updated = updateItem(updated.id, {
        status: 'published',
        igPostId,
        fbPostId,
        publishedAt: Date.now(),
        error: null,
      });
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
    const { igPostId, fbPostId } = await publishItem(item);
    const updated = updateItem(item.id, {
      status: 'published',
      igPostId,
      fbPostId,
      publishedAt: Date.now(),
      error: null,
    });
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

export default router;
