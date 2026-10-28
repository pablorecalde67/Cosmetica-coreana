import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { nanoid } from 'nanoid';
import { addLead } from './leads.js';

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
 * Crea un pedido automático generado por un flujo público (/piel o la
 * tienda de perfumes). NUNCA incluye la selfie: solo los productos
 * elegidos y los datos de envío que cargó la propia clienta. `source`
 * distingue de qué flujo vino ('piel' por defecto, o 'perfumes').
 */
export function createOrder({ source, skinType, concerns, products, name, phone, address, notes }) {
  const total = products.reduce((sum, p) => sum + (Number(p.price) || 0), 0);
  const order = {
    id: nanoid(10),
    source: source || 'piel',
    skinType: skinType || null,
    concerns: concerns || [],
    products, // snapshot: [{ id, name, price }]
    total,
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
  // Quien pide, nos dio el celular a propósito para coordinar ESE pedido -
  // es la fuente más clara posible de un lead con consentimiento real.
  const digits = (phone || '').replace(/\D/g, '');
  if (digits) addLead(`${digits}@s.whatsapp.net`, { name, source: `pedido_${order.source}` });
  return order;
}

export function updateOrder(id, patch) {
  const order = getOrder(id);
  if (!order) return null;
  Object.assign(order, patch);
  save(db);
  return order;
}
