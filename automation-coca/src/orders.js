import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { nanoid } from 'nanoid';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', 'data');
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');

fs.mkdirSync(DATA_DIR, { recursive: true });

function load() {
  if (!fs.existsSync(ORDERS_FILE)) return { orders: [] };
  try {
    return JSON.parse(fs.readFileSync(ORDERS_FILE, 'utf8'));
  } catch {
    return { orders: [] };
  }
}

function save(db) {
  fs.writeFileSync(ORDERS_FILE, JSON.stringify(db, null, 2));
}

let db = load();

export function listOrders() {
  return [...db.orders].sort((a, b) => b.createdAt - a.createdAt);
}

export function getOrder(id) {
  return db.orders.find((o) => o.id === id);
}

/**
 * Crea un pedido desde el flujo de checkout (carrito + pago).
 * Soporta pagos con Stripe, PayPal, Mercado Pago y transferencia bancaria.
 * También calcula envío dinámicamente según país.
 */
export function createOrder({
  // Flujo checkout (con email, dirección, ciudad, etc.)
  nombre,
  email,
  telefono,
  direccion,
  ciudad,
  cp,
  provincia,
  pais,
  products,
  metodo,
  subtotal,
  envio,
  descuento,
  total,
  shippingMethodId,
  // Flujo /piel (skin analysis)
  skinType,
  concerns,
  name,
  phone,
  address,
  notes,
}) {
  // Detectar cuál flujo se está usando
  const isCheckout = email && direccion && total !== undefined;

  if (isCheckout) {
    // Flujo checkout
    const order = {
      id: nanoid(10),
      nombre,
      email,
      telefono,
      direccion,
      ciudad,
      cp,
      provincia,
      pais,
      products, // snapshot: [{ id, nombre, cantidad, precio }]
      metodo, // 'stripe', 'paypal', 'mercadopago', 'transferencia'
      subtotal,
      envio,
      descuento,
      total,
      // Campos de envío (se llenan después con webhooks)
      trackingId: null,
      shippingMethodId: shippingMethodId || null,
      shippingProvider: null, // 'Andreani' o 'Shippo'
      trackingStatus: null, // 'pending', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered'
      trackingLastUpdate: null,
      // Campos de pago
      status: metodo === 'transferencia' ? 'pending_transfer' : 'pending', // pending, paid, payment_failed, refunded
      chargeId: null, // para Stripe
      paypalCaptureId: null, // para PayPal
      paidAt: null,
      createdAt: Date.now(),
      fulfilledAt: null,
    };
    db.orders.push(order);
    save(db);
    return order;
  } else {
    // Flujo /piel (skin analysis) — legacy
    const orderTotal = products.reduce((sum, p) => sum + (Number(p.price) || 0), 0);
    const order = {
      id: nanoid(10),
      skinType,
      concerns,
      products, // snapshot: [{ id, name, price }]
      total: orderTotal,
      name,
      phone,
      address,
      notes: notes || '',
      status: 'pendiente_transferencia',
      createdAt: Date.now(),
      fulfilledAt: null,
    };
    db.orders.push(order);
    save(db);
    return order;
  }
}

export function updateOrder(id, patch) {
  const order = getOrder(id);
  if (!order) return null;
  Object.assign(order, patch);
  save(db);
  return order;
}
