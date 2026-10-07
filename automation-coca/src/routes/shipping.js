import { Router } from 'express';
import { config } from '../config.js';

const router = Router();

// ============= CONSTANTES DE ENVÍOS =============
const ANDREANI_RATES = {
  'AR': [
    { nombre: 'Estándar', dias: '3-5', precio: 150, id: 'andreani_standard' },
    { nombre: 'Express', dias: '1-2', precio: 350, id: 'andreani_express' },
    { nombre: 'Next Day', dias: '24hs', precio: 550, id: 'andreani_nextday' }
  ],
  'PY': [
    { nombre: 'Estándar', dias: '5-7', precio: 200, id: 'andreani_py_standard' }
  ],
  'BR': [
    { nombre: 'Estándar', dias: '7-10', precio: 300, id: 'andreani_br_standard' }
  ],
  'UY': [
    { nombre: 'Estándar', dias: '3-5', precio: 180, id: 'andreani_uy_standard' }
  ]
};

const SHIPPO_RATES = {
  'US': [
    { nombre: 'USPS Priority Mail', dias: '3-5', precio: 25, id: 'shippo_usps_priority' },
    { nombre: 'UPS Ground', dias: '5-7', precio: 35, id: 'shippo_ups_ground' }
  ],
  'OTHER': [
    { nombre: 'International Standard', dias: '15-30', precio: 50, id: 'shippo_intl_standard' },
    { nombre: 'International Express', dias: '7-10', precio: 120, id: 'shippo_intl_express' }
  ]
};

// ============= CÁLCULO DE OPCIONES DE ENVÍO =============
/**
 * GET /api/shipping/calculate
 * Query params:
 *   - pais: país de destino (AR, PY, BR, UY, US, OTHER)
 *   - peso: peso del paquete en kg (opcional, default 1)
 *   - cp: código postal (para cálculos más precisos)
 *   - ciudad: ciudad de destino
 */
router.get('/calculate', async (req, res) => {
  try {
    const { pais = 'AR', peso = 1, cp, ciudad } = req.query;

    // Validar país
    if (!pais) {
      return res.status(400).json({ error: 'País requerido' });
    }

    let opciones = [];

    // ARGENTINA: usar Andreani
    if (pais === 'AR') {
      // En producción, aquí se llamaría a API de Andreani
      // const response = await fetch('https://api.andreani.com/tarifa', { ... })
      // Por ahora, retornamos opciones precalculadas
      opciones = ANDREANI_RATES['AR'] || [];

      // Ajustar precio según peso (simulado)
      opciones = opciones.map(opt => ({
        ...opt,
        precio: Math.round(opt.precio + (peso - 1) * 20)
      }));
    }

    // PAÍSES CERCANOS: usar Andreani
    else if (['PY', 'BR', 'UY'].includes(pais)) {
      opciones = ANDREANI_RATES[pais] || ANDREANI_RATES['PY'];
      opciones = opciones.map(opt => ({
        ...opt,
        precio: Math.round(opt.precio + (peso - 1) * 30)
      }));
    }

    // RESTO DEL MUNDO: usar Shippo
    else {
      opciones = pais === 'US' ? SHIPPO_RATES['US'] : SHIPPO_RATES['OTHER'];
      opciones = opciones.map(opt => ({
        ...opt,
        precio: Math.round(opt.precio + (peso - 1) * 10)
      }));
    }

    res.json({
      success: true,
      pais,
      ciudad,
      cp,
      peso,
      opciones,
      moneda: pais === 'US' ? 'USD' : 'ARS',
      provider: ['AR', 'PY', 'BR', 'UY'].includes(pais) ? 'Andreani' : 'Shippo'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============= TRACK DE ENVÍO =============
/**
 * GET /api/shipping/track/:trackingId
 * Devuelve estado del envío
 */
router.get('/track/:trackingId', async (req, res) => {
  try {
    const { trackingId } = req.params;

    // En producción, llamar a API de Andreani/Shippo
    // const status = await andreani.track(trackingId) o shippo.track(trackingId)

    // Por ahora, simular estado
    const estados = ['pending', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered'];
    const estadoActual = estados[Math.floor(Math.random() * estados.length)];

    res.json({
      success: true,
      trackingId,
      status: estadoActual,
      lastUpdate: new Date().toISOString(),
      estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============= CREAR ENVÍO (post-pago) =============
/**
 * POST /api/shipping/create
 * Crea un envío en Andreani/Shippo después de confirmación de pago
 */
router.post('/create', async (req, res) => {
  try {
    const {
      orderId,
      recipientName,
      recipientEmail,
      recipientPhone,
      address,
      city,
      postalCode,
      country,
      weight = 1,
      shippingMethodId,
      items
    } = req.body;

    if (!orderId || !recipientName || !address || !city || !country) {
      return res.status(400).json({ error: 'Faltan datos de envío' });
    }

    // En producción:
    // if (country === 'AR' || ['PY', 'BR', 'UY'].includes(country)) {
    //   const shipment = await andreani.createShipment({ ... })
    // } else {
    //   const shipment = await shippo.createShipment({ ... })
    // }

    // Simular creación de envío
    const trackingId = `TRK-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

    res.json({
      success: true,
      orderId,
      trackingId,
      status: 'pending',
      provider: ['AR', 'PY', 'BR', 'UY'].includes(country) ? 'Andreani' : 'Shippo',
      estimatedDelivery: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      message: `Envío creado. Tracking: ${trackingId}`
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
