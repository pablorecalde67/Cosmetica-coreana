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

export function storageStats() {
  const files = fs.readdirSync(MEDIA_DIR);
  let totalBytes = 0;
  for (const f of files) {
    try {
      totalBytes += fs.statSync(path.join(MEDIA_DIR, f)).size;
    } catch {
      // archivo pudo haber sido borrado entre el readdir y el stat
    }
  }
  const byStatus = {};
  for (const it of db.items) byStatus[it.status] = (byStatus[it.status] || 0) + 1;
  return { totalFiles: files.length, totalBytes, itemsByStatus: byStatus, totalItems: db.items.length };
}

// Borra del disco los archivos de los items YA publicados (ya están en
// Instagram, no hace falta conservar el original) para liberar espacio del
// volumen. Deja el registro del item (para historial) pero vacio de media.
export function freePublishedMedia() {
  let freedBytes = 0;
  let freedFiles = 0;
  let touchedItems = 0;

  for (const item of db.items) {
    if (item.status !== 'published' || !item.media?.length) continue;
    let touched = false;
    for (const m of item.media) {
      const filePath = path.join(MEDIA_DIR, m.file);
      try {
        const size = fs.statSync(filePath).size;
        fs.unlinkSync(filePath);
        freedBytes += size;
        freedFiles++;
        touched = true;
      } catch {
        // ya no estaba en disco, no pasa nada
      }
    }
    if (touched) {
      item.media = [];
      touchedItems++;
    }
  }

  if (touchedItems > 0) save(db);
  return { freedBytes, freedFiles, touchedItems };
}
