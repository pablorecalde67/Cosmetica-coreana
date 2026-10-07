import { Router } from 'express';
import { config } from '../config.js';
import { updateOrder } from '../orders.js';

const router = Router();

// ============= WEBHOOK STRIPE =============
/**
 * POST /api/webhooks/stripe
 * Recibe eventos de Stripe (charge.succeeded, charge.failed, etc.)
 *
 * En producción:
 * 1. Verifica firma de webhook con stripe.webhooks.constructEvent()
 * 2. Verifica que venga de Stripe (no de attacker)
 * 3. Procesa según tipo de evento
 */
router.post('/stripe', async (req, res) => {
  try {
    const event = req.body;

    // En producción, verificar firma:
    // const sig = req.headers['stripe-signature'];
    // const event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);

    switch (event.type) {
      case 'charge.succeeded':
        await handleStripeChargeSucceeded(event.data.object);
        break;

      case 'charge.failed':
        await handleStripeChargeFailed(event.data.object);
        break;

      case 'charge.refunded':
        await handleStripeChargeRefunded(event.data.object);
        break;

      default:
        console.log(`Evento Stripe no manejado: ${event.type}`);
    }

    // Responder 200 OK para que Stripe no reintente
    res.json({ received: true });
  } catch (err) {
    console.error('Error en webhook Stripe:', err);
    res.status(400).json({ error: err.message });
  }
});

async function handleStripeChargeSucceeded(charge) {
  const orderId = charge.metadata?.orderId;
  const customerEmail = charge.billing_details?.email;
  const customerPhone = charge.metadata?.phone;

  console.log(`✅ Pago Stripe confirmado: ${orderId}`);

  // Actualizar orden a "paid"
  if (orderId) {
    updateOrder(orderId, {
      status: 'paid',
      paymentMethod: 'stripe',
      chargeId: charge.id,
      paidAt: Date.now()
    });

    // Aquí va: sendWhatsappNotification(customerPhone, `Tu pago ha sido confirmado. Orden: ${orderId}`)
  }
}

async function handleStripeChargeFailed(charge) {
  const orderId = charge.metadata?.orderId;
  console.log(`❌ Pago Stripe fallido: ${orderId}`);

  if (orderId) {
    updateOrder(orderId, {
      status: 'payment_failed',
      paymentMethod: 'stripe',
      error: charge.failure_message
    });
  }
}

async function handleStripeChargeRefunded(charge) {
  const orderId = charge.metadata?.orderId;
  console.log(`🔄 Pago Stripe reembolsado: ${orderId}`);

  if (orderId) {
    updateOrder(orderId, {
      status: 'refunded',
      paymentMethod: 'stripe'
    });
  }
}

// ============= WEBHOOK PAYPAL =============
/**
 * POST /api/webhooks/paypal
 * Recibe eventos de PayPal (PAYMENT.CAPTURE.COMPLETED, etc.)
 *
 * En producción:
 * 1. Verifica firma de webhook con PayPal SDK
 * 2. Verifica que venga de PayPal
 * 3. Procesa según tipo de evento
 */
router.post('/paypal', async (req, res) => {
  try {
    const event = req.body;

    // En producción, verificar con:
    // const isValid = await paypal.webhooks.verify(
    //   process.env.PAYPAL_WEBHOOK_ID,
    //   req.headers['paypal-transmission-id'],
    //   req.headers['paypal-transmission-time'],
    //   req.headers['paypal-cert-url'],
    //   req.headers['paypal-auth-algo'],
    //   req.headers['paypal-transmission-sig'],
    //   JSON.stringify(event)
    // );

    switch (event.event_type) {
      case 'PAYMENT.CAPTURE.COMPLETED':
        await handlePayPalCaptureCompleted(event.resource);
        break;

      case 'PAYMENT.CAPTURE.DENIED':
        await handlePayPalCaptureDenied(event.resource);
        break;

      case 'PAYMENT.CAPTURE.REFUNDED':
        await handlePayPalCaptureRefunded(event.resource);
        break;

      default:
        console.log(`Evento PayPal no manejado: ${event.event_type}`);
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Error en webhook PayPal:', err);
    res.status(400).json({ error: err.message });
  }
});

async function handlePayPalCaptureCompleted(capture) {
  const orderId = capture.custom_id; // Enviamos orderId como custom_id
  const payerEmail = capture.payer?.email_address;

  console.log(`✅ Pago PayPal confirmado: ${orderId}`);

  if (orderId) {
    updateOrder(orderId, {
      status: 'paid',
      paymentMethod: 'paypal',
      paypalCaptureId: capture.id,
      paidAt: Date.now()
    });

    // Aquí va: sendWhatsappNotification(customerPhone, ...)
  }
}

async function handlePayPalCaptureDenied(capture) {
  const orderId = capture.custom_id;
  console.log(`❌ Pago PayPal denegado: ${orderId}`);

  if (orderId) {
    updateOrder(orderId, {
      status: 'payment_failed',
      paymentMethod: 'paypal',
      error: 'Pago denegado por PayPal'
    });
  }
}

async function handlePayPalCaptureRefunded(capture) {
  const orderId = capture.custom_id;
  console.log(`🔄 Pago PayPal reembolsado: ${orderId}`);

  if (orderId) {
    updateOrder(orderId, {
      status: 'refunded',
      paymentMethod: 'paypal'
    });
  }
}

// ============= WEBHOOK ANDREANI (TRACKING) =============
/**
 * POST /api/webhooks/andreani
 * Notificación de cambios en estado de envío
 */
router.post('/andreani', async (req, res) => {
  try {
    const event = req.body;

    // event.trackingId, event.status, event.timestamp, etc.
    const { trackingId, status, timestamp, orderId } = event;

    console.log(`📦 Actualización Andreani: ${trackingId} → ${status}`);

    if (orderId) {
      updateOrder(orderId, {
        trackingStatus: status,
        trackingLastUpdate: timestamp
      });

      // Aquí va: notificar al cliente por WhatsApp
      // sendWhatsappNotification(customerPhone, `Tu envío está en estado: ${status}`)
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Error en webhook Andreani:', err);
    res.status(400).json({ error: err.message });
  }
});

// ============= WEBHOOK SHIPPO (TRACKING) =============
/**
 * POST /api/webhooks/shippo
 * Notificación de cambios en estado de envío
 */
router.post('/shippo', async (req, res) => {
  try {
    const event = req.body;

    // event.tracking_number, event.tracking_status, event.timestamp, etc.
    const { tracking_number, tracking_status, timestamp, metadata } = event;
    const orderId = metadata?.orderId;

    console.log(`📦 Actualización Shippo: ${tracking_number} → ${tracking_status}`);

    if (orderId) {
      updateOrder(orderId, {
        trackingStatus: tracking_status,
        trackingLastUpdate: timestamp
      });
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Error en webhook Shippo:', err);
    res.status(400).json({ error: err.message });
  }
});

export default router;
