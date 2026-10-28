import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', 'data');
const VISITS_FILE = path.join(DATA_DIR, 'visits.json');

fs.mkdirSync(DATA_DIR, { recursive: true });

function load() {
  if (!fs.existsSync(VISITS_FILE)) return { visits: [] };
  try {
    return JSON.parse(fs.readFileSync(VISITS_FILE, 'utf8'));
  } catch {
    return { visits: [] };
  }
}

function save(db) {
  fs.writeFileSync(VISITS_FILE, JSON.stringify(db, null, 2));
}

let db = load();

// Solo se guarda la página, de qué canal vino (si el link traía
// ?utm_source=..., para saber qué funciona mejor) y el momento - nada de IP,
// user-agent ni ningún dato que identifique a la visita (no hace falta para
// ver la evolución, y es justo el tipo de dato personal que no debería
// quedar guardado sin necesidad real).
const KNOWN_SOURCES = new Set(['instagram', 'whatsapp_channel', 'telegram', 'whatsapp_status', 'tiktok']);

export function registerVisit(page, rawSource) {
  const source = KNOWN_SOURCES.has(rawSource) ? rawSource : 'directo';
  db.visits.push({ page, source, createdAt: Date.now() });
  save(db);
}

export function listVisits() {
  return db.visits;
}
