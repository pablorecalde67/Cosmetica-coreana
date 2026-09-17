import { Router } from 'express';
import { analyzeSkin, isAiConfigured } from '../skinAnalysis.js';
import { getProduct } from '../products.js';
import { createOrder } from '../orders.js';
import { getSite } from '../site.js';
import { config } from '../config.js';

const router = Router();

router.get('/sitio', (req, res) => {
  res.json(getSite());
});

function stripDataUrl(imageBase64) {
  const match = /^data:(image\/(?:jpeg|png|webp));base64,(.+)$/.exec(imageBase64 || '');
  if (!match) return null;
  return { mediaType: match[1], data: match[2] };
}

router.get('/estado', (req, res) => {
  res.json({ aiConfigured: isAiConfigured() });
});

// Analiza la selfie. La imagen llega en el body, se usa en memoria para
// llamar a la IA y se descarta apenas termina esta función: nunca se
// escribe a disco ni se guarda en la base de datos del servicio.
router.post('/analizar', async (req, res) => {
  const { imageBase64, consent, disclaimer } = req.body || {};

  if (!consent || !disclaimer) {
    return res.status(400).json({
      error: 'Falta el consentimiento para la selfie y/o la aceptación del descargo de responsabilidad.',
    });
  }

  const decoded = stripDataUrl(imageBase64);
  if (!decoded) {
    return res.status(400).json({ error: 'Imagen inválida.' });
  }

  try {
    const result = await analyzeSkin({ base64Image: decoded.data, mediaType: decoded.mediaType });
    res.json(result);
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

// Confirma el pedido: recalcula precios desde el catálogo actual (nunca
// confía en el precio que mande el navegador) y guarda dirección de envío.
// No requiere ninguna acción del administrador para completarse.
router.post('/pedido', (req, res) => {
  const { skinType, concerns, productIds, name, phone, address, notes, disclaimerAccepted } = req.body || {};

  if (!disclaimerAccepted) {
    return res.status(400).json({ error: 'Falta aceptar el descargo de responsabilidad para confirmar el pedido.' });
  }
  if (!Array.isArray(productIds) || productIds.length === 0) {
    return res.status(400).json({ error: 'No se seleccionó ningún producto.' });
  }
  if (!name || !phone || !address) {
    return res.status(400).json({ error: 'Faltan datos de contacto o dirección de envío.' });
  }

  const products = [];
  for (const id of productIds) {
    const p = getProduct(id);
    if (p && p.active !== false) {
      products.push({ id: p.id, name: p.name, price: p.price });
    }
  }
  if (products.length === 0) {
    return res.status(400).json({ error: 'Los productos seleccionados ya no están disponibles.' });
  }

  const order = createOrder({
    skinType: skinType || null,
    concerns: Array.isArray(concerns) ? concerns : [],
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
