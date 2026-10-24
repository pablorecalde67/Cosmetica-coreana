import { Router } from 'express';
import multer from 'multer';
import path from 'node:path';
import axios from 'axios';
import { createItem, addMedia, listItems, getItem, updateItem, deleteItem, deleteItemsByStatus, MEDIA_DIR, storageStats, freePublishedMedia } from '../store.js';
import { publishItem, publishRaw, buildCaption, buildBuyLink } from '../meta.js';
import { isMetaConfigured, config } from '../config.js';
import { listProducts, updateProduct, createProduct, bulkImportProducts } from '../products.js';
import { listOrders, updateOrder } from '../orders.js';
import { getSite, updateSite } from '../site.js';
import { catalogStats } from '../perfumesCatalog.js';
import { autoPriceAndPublish, hasRealText } from '../autoPublish.js';
import { notifyOwnerIfConnected } from '../whatsapp.js';
import { listVisits } from '../visits.js';

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
    // Nunca publicar sin descripción real del producto, tampoco por esta vía
    // manual - la misma regla que ya aplica al flujo automático de WhatsApp.
    if (!hasRealText(updated.description)) {
      updated = updateItem(updated.id, {
        status: 'error',
        error: 'No se puede publicar sin una descripción real del producto. Completá la descripción antes de cargar el precio.',
      });
    } else {
      try {
        const result = await publishItem(updated);
        updated = applyPublishResult(updated, result);
      } catch (err) {
        updated = updateItem(updated.id, { status: 'error', error: err.message });
      }
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
  if (!hasRealText(item.description)) {
    return res.status(400).json({ error: 'No se puede publicar sin una descripción real del producto.' });
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

// Reintenta el flujo automático (texto -> si no hay, leer precio de la
// imagen -> publicar) sobre un ítem que ya existe, sea porque quedó en
// error antes de tener el fallback de lectura de imagen, o porque falló
// la publicación en Instagram y se quiere reintentar.
router.post('/queue/:id/reintentar', async (req, res) => {
  const item = getItem(req.params.id);
  if (!item) return res.status(404).json({ error: 'No existe.' });
  const updated = await autoPriceAndPublish(item);
  res.json(withCaption(updated));
});

// Para registrar un item que ya se publicó por fuera del flujo automático
// (por ejemplo un cartel/historia/reel publicado a mano vía Graph API): no
// dispara ninguna publicación nueva, solo guarda el estado. Si el item no
// tiene precio (contenido editorial, no un producto en venta) se guarda en
// 0 en vez de exigirlo, para no bloquear el registro de carteles/historias.
router.post('/queue/:id/mark-published', (req, res) => {
  const item = getItem(req.params.id);
  if (!item) return res.status(404).json({ error: 'No existe.' });

  const patch = {
    status: 'published',
    publishedAt: Date.now(),
    error: null,
  };
  if (item.price == null) patch.price = 0;
  if (typeof req.body.igPostId === 'string' && req.body.igPostId) patch.igPostId = req.body.igPostId;

  const updated = updateItem(item.id, patch);
  res.json(withCaption(updated));
});

// Publica contenido editorial (cartel, Historia) directo en Instagram, con
// su propio caption, sin el armado automático de precio de /queue/:id/publish
// (pensado para productos reales de la cola de WhatsApp/mail). Usa el media
// ya subido vía /api/upload (item.media[0]). `mediaType`: "FEED" (default)
// o "STORIES". `cuenta`: "perfumes" para publicar en esa marca en vez de
// K-Beauty (default).
router.post('/instagram/publicar-editorial', async (req, res) => {
  const { itemId, caption, mediaType, cuenta } = req.body || {};
  if (!itemId) return res.status(400).json({ error: 'Falta "itemId".' });
  const item = getItem(itemId);
  if (!item) return res.status(404).json({ error: 'No existe.' });
  if (!item.media?.length) return res.status(400).json({ error: 'El item no tiene media.' });

  const account = cuenta === 'perfumes'
    ? { pageId: config.metaPerfumesPageId, igUserId: config.metaPerfumesIgUserId }
    : undefined;

  try {
    const result = await publishRaw({
      file: item.media[0].file,
      type: item.media[0].type,
      caption: caption || item.description || '',
      mediaType: mediaType === 'STORIES' ? 'STORIES' : 'FEED',
      account,
    });
    const updated = updateItem(item.id, {
      status: 'published',
      publishedAt: Date.now(),
      igPostId: result.igPostId,
      error: null,
      price: item.price ?? 0,
    });
    res.json(updated);
  } catch (err) {
    updateItem(item.id, { status: 'error', error: err.message });
    res.status(502).json({ error: err.message });
  }
});

// Diagnóstico: qué permisos tiene realmente el token de Meta guardado, para
// saber antes de construir algo (ej. leer DMs de Instagram) si ya alcanza o
// si hace falta pedir un permiso nuevo en el panel de la app de Meta.
router.get('/meta/permisos', async (req, res) => {
  if (!config.metaUserToken) return res.status(400).json({ error: 'META_USER_TOKEN no configurado.' });
  try {
    const { data } = await axios.get('https://graph.facebook.com/v20.0/debug_token', {
      params: {
        input_token: config.metaUserToken,
        access_token: config.metaUserToken,
      },
    });
    res.json(data.data);
  } catch (err) {
    res.status(502).json({ error: err.response?.data?.error?.message || err.message });
  }
});

router.delete('/queue/:id', (req, res) => {
  const ok = deleteItem(req.params.id);
  if (!ok) return res.status(404).json({ error: 'No existe.' });
  res.status(204).end();
});

// --- Admin: catálogo de productos usado en /piel (precio, descripción, etc.) ---

// El catálogo puede tener miles de productos (importación masiva), así que
// el panel admin no pide "todo" salvo que lo pidan explícitamente: sin
// query de búsqueda devuelve solo un resumen (para no tildar el navegador
// bajando/renderizando miles de filas de una).
router.get('/productos', (req, res) => {
  const all = listProducts();
  const q = (req.query.q || '').toString().trim().toLowerCase();
  const limit = Math.min(Number(req.query.limit) || 200, 500);

  let filtered = all;
  if (q) {
    filtered = all.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.brand || '').toLowerCase().includes(q) ||
        (p.store || '').toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q),
    );
  }

  res.json({
    total: all.length,
    matched: filtered.length,
    productos: filtered.slice(0, limit),
  });
});

// Importación masiva (ej. desde un Excel). Pensado para uso puntual del
// administrador, no para el flujo público de /piel.
router.post('/productos/importar-masivo', (req, res) => {
  const items = req.body?.productos;
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Falta el array "productos".' });
  }
  for (const it of items) {
    if (typeof it.name !== 'string' || !it.name.trim()) {
      return res.status(400).json({ error: 'Todos los items necesitan "name".' });
    }
    if (typeof it.price !== 'number' || Number.isNaN(it.price) || it.price < 0) {
      return res.status(400).json({ error: `Precio inválido para "${it.name}".` });
    }
  }
  const added = bulkImportProducts(items);
  res.status(201).json({ added, total: listProducts().length });
});

router.post('/productos', (req, res) => {
  const { name, description, image, price, skinTypes, concerns, brand, id } = req.body || {};
  if (typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ error: 'Falta el nombre del producto.' });
  }
  const numericPrice = Number(price);
  if (Number.isNaN(numericPrice) || numericPrice < 0) {
    return res.status(400).json({ error: 'Precio inválido.' });
  }

  const product = createProduct({
    id,
    name,
    description: typeof description === 'string' ? description : '',
    image: typeof image === 'string' && image ? image : undefined,
    price: numericPrice,
    skinTypes: Array.isArray(skinTypes) ? skinTypes : [],
    concerns: Array.isArray(concerns) ? concerns : [],
    brand: typeof brand === 'string' ? brand : '',
  });

  res.status(201).json(product);
});

router.patch('/productos/:id', (req, res) => {
  const patch = {};
  if (typeof req.body.name === 'string') patch.name = req.body.name;
  if (typeof req.body.description === 'string') patch.description = req.body.description;
  if (typeof req.body.image === 'string') patch.image = req.body.image;
  if (typeof req.body.brand === 'string') patch.brand = req.body.brand;
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

// --- Admin: textos de la portada pública de /piel ---

router.get('/sitio', (req, res) => {
  res.json(getSite());
});

router.patch('/sitio', (req, res) => {
  res.json(updateSite(req.body || {}));
});

// --- Admin: almacenamiento del volumen (media de WhatsApp/mail) ---

// Canal de alertas directas por WhatsApp: pensado para que, cuando se
// detecte algo que valga la pena avisar enseguida (no uno de los avisos
// automáticos por ítem que ya existen), se le mande un mensaje de WhatsApp
// al dueño en el momento, sin esperar a que entre a revisar el panel.
router.post('/alertar', async (req, res) => {
  const { texto } = req.body || {};
  if (!texto || typeof texto !== 'string') {
    return res.status(400).json({ error: 'Falta "texto".' });
  }
  try {
    await notifyOwnerIfConnected(`🔔 ${texto}`);
    res.json({ ok: true });
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

router.get('/almacenamiento', (req, res) => {
  res.json(storageStats());
});

// Borra del disco los archivos de los items YA publicados (ya están en
// Instagram) para liberar espacio del volumen cuando se llena. No toca los
// items pendientes de precio.
router.post('/almacenamiento/limpiar-publicados', (req, res) => {
  res.json(freePublishedMedia());
});

// Borrado masivo por status (ej. vaciar todo el backlog "pending_price").
// Uso puntual del administrador, acción irreversible.
router.post('/queue/borrar-por-status', (req, res) => {
  const { status } = req.body || {};
  if (typeof status !== 'string' || !status) {
    return res.status(400).json({ error: 'Falta "status".' });
  }
  const deleted = deleteItemsByStatus(status);
  res.json({ deleted });
});

// --- Admin: catálogo de perfumes (publicación automática, 1 por día) ---

router.get('/perfumes/catalogo', (req, res) => {
  res.json(catalogStats());
});

// --- Estadísticas: panel de evolución del negocio ---

function dayKey(ms) {
  return new Date(ms).toISOString().slice(0, 10); // YYYY-MM-DD
}

function groupByDay(entries, dateFn, valueFn) {
  const byDay = new Map();
  for (const entry of entries) {
    const key = dayKey(dateFn(entry));
    const prev = byDay.get(key) || { date: key, count: 0, totalArs: 0 };
    prev.count += 1;
    prev.totalArs += valueFn ? valueFn(entry) : 0;
    byDay.set(key, prev);
  }
  return [...byDay.values()].sort((a, b) => a.date.localeCompare(b.date));
}

// Junta en una sola respuesta todo lo que hace falta para ver la evolución
// del negocio: lo publicado en Instagram (cola de WhatsApp/mail + catálogo
// de perfumes), los pedidos reales recibidos (/piel y /perfumes), y el
// avance del catálogo de 1.563 perfumes. Esto es actividad propia del
// negocio (lo que nosotros controlamos) - para alcance/seguidores/
// interacciones reales de Instagram, eso lo da Meta Business Suite / las
// Estadísticas del perfil en la app, no esta API.
router.get('/estadisticas', (req, res) => {
  const items = listItems();
  const published = items.filter((it) => it.status === 'published');
  const errored = items.filter((it) => it.status === 'error');

  const byAccount = {};
  for (const it of published) {
    const label = it.account || 'Sin clasificar';
    const slot = byAccount[label] || { published: 0, revenueArs: 0 };
    slot.published += 1;
    slot.revenueArs += Number(it.price) || 0;
    byAccount[label] = slot;
  }

  const orders = listOrders();
  const ordersByAccount = {};
  for (const o of orders) {
    const label = o.source === 'perfumes' ? 'Perfumes' : 'K-Beauty (piel)';
    const slot = ordersByAccount[label] || { count: 0, totalArs: 0 };
    slot.count += 1;
    slot.totalArs += Number(o.total) || 0;
    ordersByAccount[label] = slot;
  }

  const visits = listVisits();
  const visitsByPage = {};
  for (const v of visits) visitsByPage[v.page] = (visitsByPage[v.page] || 0) + 1;

  res.json({
    generatedAt: Date.now(),
    publicaciones: {
      totalPublicado: published.length,
      totalError: errored.length,
      revenueEstimadoArs: published.reduce((sum, it) => sum + (Number(it.price) || 0), 0),
      porDia: groupByDay(published, (it) => it.publishedAt || it.createdAt, (it) => Number(it.price) || 0),
      porCuenta: byAccount,
    },
    pedidos: {
      total: orders.length,
      totalArs: orders.reduce((sum, o) => sum + (Number(o.total) || 0), 0),
      porDia: groupByDay(orders, (o) => o.createdAt, (o) => Number(o.total) || 0),
      porCuenta: ordersByAccount,
    },
    catalogoPerfumes: catalogStats(),
    visitas: {
      total: visits.length,
      porPagina: visitsByPage,
      porDia: groupByDay(visits, (v) => v.createdAt),
    },
  });
});

export default router;
