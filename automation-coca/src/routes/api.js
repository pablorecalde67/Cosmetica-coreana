import { Router } from 'express';
import multer from 'multer';
import path from 'node:path';
import { createItem, listItems, getItem, updateItem, deleteItem, MEDIA_DIR } from '../store.js';
import { publishItem } from '../meta.js';

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

router.get('/queue', (req, res) => {
  res.json(listItems());
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

  res.status(201).json(item);
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

  // Apenas se carga el precio, se publica solo: no hace falta un paso mas.
  if (priceJustSet) {
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

  res.json(updated);
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
    res.json(updated);
  } catch (err) {
    updateItem(item.id, { status: 'error', error: err.message });
    res.status(502).json({ error: err.message });
  }
});

router.delete('/queue/:id', (req, res) => {
  const ok = deleteItem(req.params.id);
  if (!ok) return res.status(404).json({ error: 'No existe.' });
  res.status(204).end();
});

export default router;
