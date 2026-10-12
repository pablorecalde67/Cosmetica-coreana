import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', 'data');
const CATALOG_FILE = path.join(DATA_DIR, 'perfumesCatalog.json');
// `data/` vive en el volumen persistente de Railway, que no se re-siembra
// con cada deploy: la semilla real (los 1.563 perfumes importados del
// listado) vive acá, afuera del volumen, para que el primer arranque la
// copie una sola vez. Después de eso, los cambios (status, igPostId) se
// guardan solo en data/perfumesCatalog.json, nunca se vuelve a tocar la
// semilla.
const SEED_FILE = path.join(__dirname, '..', 'seed', 'perfumesCatalog.json');

function load() {
  if (!fs.existsSync(CATALOG_FILE)) {
    if (!fs.existsSync(SEED_FILE)) return [];
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.copyFileSync(SEED_FILE, CATALOG_FILE);
  }
  try {
    return JSON.parse(fs.readFileSync(CATALOG_FILE, 'utf8'));
  } catch {
    return [];
  }
}

function save(items) {
  fs.writeFileSync(CATALOG_FILE, JSON.stringify(items, null, 2));
}

export function catalogStats() {
  const items = load();
  const byStatus = {};
  for (const it of items) byStatus[it.status] = (byStatus[it.status] || 0) + 1;
  return { total: items.length, byStatus };
}

export function getPendingBatch(n) {
  return load()
    .filter((it) => it.status === 'pending')
    .slice(0, n);
}

export function markResult(id, patch) {
  const items = load();
  const item = items.find((it) => it.id === id);
  if (!item) return null;
  Object.assign(item, patch);
  save(items);
  return item;
}
