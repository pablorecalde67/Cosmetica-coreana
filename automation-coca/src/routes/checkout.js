import { Router } from 'express';
import { config } from '../config.js';
import { createOrder } from '../orders.js';

const router = Router();

// ============= VALIDACIONES COMUNES =============
function validateCheckoutData(data) {
  if (!data.nombre || !data.email || !data.telefono) {
    return { error: 'Faltan datos personales' };
  }
  if (!data.direccion || !data.ciudad || !data.cp || !data.provincia) {
    return { error: 'Faltan datos de dirección' };
  }
  if (!Array.isArray(data.items?.items) || data.items.items.length === 0) {
    return { error: 'El carrito está vacío' };
  }
  return null;
}

function createOrderFromCheckout(data) {
  const products = data.items.items.map(item => ({
    id: item.id || 'unknown',
    nombre: item.nombre,
    cantidad: item.cantidad,
    precio: item.precio
  }));

  const order = createOrder({
    products,
    nombre: data.nombre,
    email: data.email,
    telefono: data.telefono,
    direccion: data.direccion,
    ciudad: data.ciudad,
    cp: data.cp,
    provincia: data.provincia,
    metodo: data.metodo,
    pais: data.items.pais || 'AR',
    subtotal: data.items.subtotal,
    envio: data.items.envio,
    descuento: data.items.descuento,
    total: data.items.total,
    shippingMethodId: data.shippingMethodId || null
  });

  return order;
}

// ============= MERCADO PAGO =============
router.post('/mercadopago', async (req, res) => {
  try {
    const error = validateCheckoutData(req.body);
    if (error) return res.status(400).json(error);

    const data = req.body;
    const total = Math.round(data.items.total);

    // En producción, aquí se llamaría a Mercado Pago SDK
    // Para ahora, retornamos una URL de ejemplo
    const checkoutUrl = `https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=TEST-${Date.now()}`;

    // Crear orden con estado "pending_mercadopago"
    const order = createOrderFromCheckout(data);

    res.json({
      success: true,
      checkout_url: checkoutUrl,
      orderId: order.id
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============= STRIPE =============
router.post('/stripe', async (req, res) => {
  try {
    const error = validateCheckoutData(req.body);
    if (error) return res.status(400).json(error);

    const data = req.body;

    if (!data.token) {
      return res.status(400).json({ error: 'Falta token de Stripe' });
    }

    // En producción, aquí se procesaría el pago con Stripe SDK
    // stripe.charges.create({ amount: data.amount, currency: 'usd', source: data.token })

    const order = createOrderFromCheckout(data);

    // Simular confirmación de pago
    res.json({
      success: true,
      orderId: order.id,
      message: 'Pago procesado con Stripe',
      chargeId: `ch_test_${Date.now()}`
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============= PAYPAL =============
router.post('/paypal', async (req, res) => {
  try {
    const error = validateCheckoutData(req.body);
    if (error) return res.status(400).json(error);

    const data = req.body;

    if (!data.paypalOrderId) {
      return res.status(400).json({ error: 'Falta PayPal Order ID' });
    }

    // En producción, aquí se verificaría el pago con PayPal
    // paypal.orders.details(data.paypalOrderId)

    const order = createOrderFromCheckout(data);

    res.json({
      success: true,
      orderId: order.id,
      message: 'Pago procesado con PayPal',
      paypalOrderId: data.paypalOrderId
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============= TRANSFERENCIA BANCARIA =============
router.post('/transferencia', async (req, res) => {
  try {
    const error = validateCheckoutData(req.body);
    if (error) return res.status(400).json(error);

    const data = req.body;
    const order = createOrderFromCheckout(data);

    // Cambiar estado a "pending_transfer"
    // sendWhatsappNotification(data.telefono, `Tu orden #${order.id} está pendiente de transferencia. Alias: ${config.transferAlias}`);

    res.json({
      success: true,
      orderId: order.id,
      message: 'Orden creada. Recibirás instrucciones de transferencia por WhatsApp.',
      alias: config.transferAlias || 'kbeautycde.com',
      aliasDolares: config.transferAliasDolares || 'kbeautycde',
      whatsapp: config.whatsappOwnerNumber || '+54 9 3855 756444'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
