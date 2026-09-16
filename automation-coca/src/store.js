import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { nanoid } from 'nanoid';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');
export const MEDIA_DIR = path.join(DATA_DIR, 'media');

fs.mkdirSync(MEDIA_DIR, { recursive: true });

function load() {
  if (!fs.existsSync(DB_FILE)) return { items: [] };
  try {
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  } catch {
    return { items: [] };
  }
}

function save(db) {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

let db = load();

export function listItems() {
  return [...db.items].sort((a, b) => b.createdAt - a.createdAt);
}

export function getItem(id) {
  return db.items.find((it) => it.id === id);
}

export function createItem({ source, media, caption }) {
  const item = {
    id: nanoid(10),
    source, // 'whatsapp' | 'manual'
    media, // [{ file: filename inside MEDIA_DIR, type: 'image' | 'video' }, ...]
    caption: caption || '',
    description: caption || '',
    price: null,
    status: 'pending_price', // pending_price | ready | published | error
    error: null,
    igPostId: null,
    createdAt: Date.now(),
    publishedAt: null,
  };
  db.items.push(item);
  save(db);
  return item;
}

export function addMedia(id, media) {
  const item = getItem(id);
  if (!item) return null;
  item.media.push(...media);
  save(db);
  return item;
}

export function updateItem(id, patch) {
  const item = getItem(id);
  if (!item) return null;
  Object.assign(item, patch);
  save(db);
  return item;
}

export function deleteItem(id) {
  const before = db.items.length;
  db.items = db.items.filter((it) => it.id !== id);
  save(db);
  return db.items.length < before;
}
