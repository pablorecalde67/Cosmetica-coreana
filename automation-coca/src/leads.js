import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', 'data');
const LEADS_FILE = path.join(DATA_DIR, 'leads.json');

fs.mkdirSync(DATA_DIR, { recursive: true });

function load() {
  if (!fs.existsSync(LEADS_FILE)) return { leads: {} };
  try {
    return JSON.parse(fs.readFileSync(LEADS_FILE, 'utf8'));
  } catch {
    return { leads: {} };
  }
}

function save(db) {
  fs.writeFileSync(LEADS_FILE, JSON.stringify(db, null, 2));
}

let db = load();

// Base de gente que YA inició contacto con COCA por su cuenta (nos escribió
// por WhatsApp o completó un pedido) - nunca gente que solo visitó la web o
// vio una publicación. Guarda lo mínimo: el JID de WhatsApp, un nombre si
// está disponible, y cuándo fue el primer/último contacto.
export function addLead(jid, { name, source } = {}) {
  if (!jid) return;
  const existing = db.leads[jid];
  db.leads[jid] = {
    jid,
    name: name || existing?.name || null,
    source: source || existing?.source || 'whatsapp',
    firstContactAt: existing?.firstContactAt || Date.now(),
    lastContactAt: Date.now(),
  };
  save(db);
}

export function listLeads() {
  return Object.values(db.leads);
}
