/**
 * Email Notifications Module
 * Gestión de emails transaccionales: confirmación de órdenes, newsletter, shipping updates
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from './config.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', 'data');
const EMAIL_LOG_FILE = path.join(DATA_DIR, 'email-notifications-log.json');

/**
 * Log de emails enviados
 */
function logEmail(recipient, subject, type, status = 'pending') {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

  let logs = [];
  try {
    if (fs.existsSync(EMAIL_LOG_FILE)) {
      logs = JSON.parse(fs.readFileSync(EMAIL_LOG_FILE, 'utf8'));
    }
  } catch {
    logs = [];
  }

  logs.push({
    id: `email_${Date.now()}`,
    recipient,
    subject,
    type,
    status,
    sentAt: new Date().toISOString()
  });

  fs.writeFileSync(EMAIL_LOG_FILE, JSON.stringify(logs, null, 2));
}

/**
 * HTML Template: Order Confirmation
 */
function getOrderConfirmationTemplate(order) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #f5e6d3; padding: 20px; text-align: center; border-radius: 8px; }
    .header h1 { margin: 0; color: #8b4513; }
    .order-details { margin: 20px 0; border: 1px solid #ddd; padding: 15px; border-radius: 8px; }
    .item { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
    .total { font-weight: bold; font-size: 18px; margin-top: 15px; text-align: right; }
    .footer { color: #666; font-size: 12px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px; }
    .badge { display: inline-block; background-color: #4CAF50; color: white; padding: 5px 10px; border-radius: 4px; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>¡Gracias por tu compra!</h1>
      <p>Tu orden ha sido confirmada</p>
    </div>

    <div class="order-details">
      <h2>Detalles de tu orden</h2>
      <p><strong>Número de orden:</strong> ${order.id}</p>
      <p><strong>Email:</strong> ${order.email}</p>
      <p><strong>Fecha:</strong> ${new Date(order.createdAt).toLocaleDateString('es-AR')}</p>

      <h3>Productos</h3>
      ${order.items.map(item => `
        <div class="item">
          <span>${item.nombre} x${item.cantidad}</span>
          <span>${(item.precio * item.cantidad).toLocaleString('es-AR')} ${item.moneda}</span>
        </div>
      `).join('')}

      <div class="total">
        Total: ${order.total.toLocaleString('es-AR')} ${order.moneda}
      </div>

      <h3>Estado del envío</h3>
      <p><span class="badge">${order.status.toUpperCase()}</span></p>
      ${order.trackingId ? `<p><strong>Número de seguimiento:</strong> ${order.trackingId}</p>` : ''}
    </div>

    <div class="footer">
      <p>¿Preguntas? Contactanos en support@kbeautycde.com</p>
      <p>© 2026 KBeauty CDE. Todos los derechos reservados.</p>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * HTML Template: Newsletter Welcome
 */
function getNewsletterWelcomeTemplate(email) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #c49a8e 0%, #b8818b 100%); padding: 30px; text-align: center; border-radius: 8px; color: white; }
    .content { padding: 20px; }
    .promo { background-color: #f5e6d3; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: center; }
    .promo-code { font-size: 24px; font-weight: bold; color: #8b4513; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>¡Bienvenido a KBeauty CDE!</h1>
      <p>Tu newsletter de belleza coreana</p>
    </div>

    <div class="content">
      <p>Hola,</p>
      <p>Gracias por suscribirte a nuestro newsletter. Recibirás las últimas novedades en skincare coreano, tips de belleza y ofertas exclusivas.</p>

      <div class="promo">
        <p>🎁 BIENVENIDA ESPECIAL</p>
        <p>Usa el código:</p>
        <div class="promo-code">BIENVENIDO10</div>
        <p>para obtener 10% descuento en tu primera compra</p>
      </div>

      <p>No dudes en explorar nuestra tienda y descubrir los mejores productos de Korean Beauty para tu piel.</p>

      <p>Saludos,<br>El equipo de KBeauty CDE</p>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * HTML Template: Shipping Update
 */
function getShippingUpdateTemplate(order) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #4CAF50; padding: 20px; text-align: center; border-radius: 8px; color: white; }
    .tracking { background-color: #f0f0f0; padding: 15px; border-left: 4px solid #4CAF50; }
    .timeline { margin: 20px 0; }
    .timeline-item { padding: 10px 0; border-bottom: 1px solid #ddd; }
    .timeline-item:last-child { border-bottom: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Tu pedido está en camino 🚚</h1>
    </div>

    <div class="tracking">
      <h2>Información de seguimiento</h2>
      <p><strong>Número de orden:</strong> ${order.id}</p>
      <p><strong>Número de seguimiento:</strong> ${order.trackingId}</p>
      <p><strong>Estado:</strong> ${order.trackingStatus}</p>
      <p><strong>Proveedor:</strong> ${order.shippingProvider}</p>
    </div>

    <div class="timeline">
      <h3>Estado del envío</h3>
      <div class="timeline-item">
        ✓ Pedido confirmado - ${new Date(order.paidAt).toLocaleDateString('es-AR')}
      </div>
      <div class="timeline-item">
        ✓ Empaquetado - ${new Date().toLocaleDateString('es-AR')}
      </div>
      <div class="timeline-item">
        → En tránsito hacia ${order.pais}
      </div>
      <div class="timeline-item">
        ⏳ Entrega estimada: 3-5 días hábiles
      </div>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * HTML Template: Abandoned Cart
 */
function getAbandonedCartTemplate(cartItems, cartTotal) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #f5e6d3; padding: 20px; border-radius: 8px; }
    .items { margin: 20px 0; }
    .item { display: flex; justify-content: space-between; padding: 10px; border-bottom: 1px solid #eee; }
    .cta { background-color: #8b4513; color: white; padding: 12px 30px; border-radius: 8px; text-decoration: none; display: inline-block; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>¿Olvidaste completar tu compra?</h1>
      <p>Aún tienes estos productos en tu carrito</p>
    </div>

    <div class="items">
      ${cartItems.map(item => `
        <div class="item">
          <span>${item.nombre} x${item.cantidad}</span>
          <span>${(item.precio * item.cantidad).toLocaleString('es-AR')} ${item.moneda}</span>
        </div>
      `).join('')}
    </div>

    <p><strong>Total:</strong> ${cartTotal.toLocaleString('es-AR')} ARS</p>

    <p>
      <a href="${config.publicBaseUrl}/checkout" class="cta">
        Completar Compra →
      </a>
    </p>

    <p style="color: #666; font-size: 12px;">
      Este carrito expira en 7 días. No queremos que pierdas tus productos favoritos.
    </p>
  </div>
</body>
</html>
  `;
}

/**
 * Send order confirmation email
 */
export async function sendOrderConfirmation(order) {
  try {
    const htmlContent = getOrderConfirmationTemplate(order);

    // TODO: Implementar envío real con Sendgrid/Mailgun/etc
    console.log(`[EMAIL] Sending order confirmation to ${order.email}`);
    logEmail(order.email, 'Order Confirmation', 'order_confirmation', 'sent');

    return {
      success: true,
      messageId: `msg_${Date.now()}`,
      recipient: order.email
    };
  } catch (err) {
    console.error('[EMAIL] Error sending order confirmation:', err);
    logEmail(order.email, 'Order Confirmation', 'order_confirmation', 'failed');
    return { success: false, error: err.message };
  }
}

/**
 * Send newsletter welcome email
 */
export async function sendNewsletterWelcome(email) {
  try {
    const htmlContent = getNewsletterWelcomeTemplate(email);

    console.log(`[EMAIL] Sending newsletter welcome to ${email}`);
    logEmail(email, 'Welcome to Newsletter', 'newsletter_welcome', 'sent');

    return {
      success: true,
      messageId: `msg_${Date.now()}`,
      recipient: email
    };
  } catch (err) {
    console.error('[EMAIL] Error sending newsletter email:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Send shipping update email
 */
export async function sendShippingUpdate(order) {
  try {
    const htmlContent = getShippingUpdateTemplate(order);

    console.log(`[EMAIL] Sending shipping update to ${order.email}`);
    logEmail(order.email, 'Shipping Update', 'shipping_update', 'sent');

    return {
      success: true,
      messageId: `msg_${Date.now()}`,
      recipient: order.email
    };
  } catch (err) {
    console.error('[EMAIL] Error sending shipping update:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Send abandoned cart email
 */
export async function sendAbandonedCart(email, cartItems, cartTotal) {
  try {
    const htmlContent = getAbandonedCartTemplate(cartItems, cartTotal);

    console.log(`[EMAIL] Sending abandoned cart email to ${email}`);
    logEmail(email, 'Abandoned Cart', 'abandoned_cart', 'sent');

    return {
      success: true,
      messageId: `msg_${Date.now()}`,
      recipient: email
    };
  } catch (err) {
    console.error('[EMAIL] Error sending abandoned cart:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Get email logs
 */
export function getEmailNotificationLogs() {
  try {
    if (!fs.existsSync(EMAIL_LOG_FILE)) return [];
    return JSON.parse(fs.readFileSync(EMAIL_LOG_FILE, 'utf8'));
  } catch {
    return [];
  }
}

export default {
  sendOrderConfirmation,
  sendNewsletterWelcome,
  sendShippingUpdate,
  sendAbandonedCart,
  getEmailNotificationLogs
};
