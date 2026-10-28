import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', 'data');
const CONTACTS_FILE = path.join(DATA_DIR, 'contacts.json');

fs.mkdirSync(DATA_DIR, { recursive: true });

function load() {
  if (!fs.existsSync(CONTACTS_FILE)) return {};
  try {
    return JSON.parse(fs.readFileSync(CONTACTS_FILE, 'utf8'));
  } catch {
    return {};
  }
}

let contacts = load(); // jid -> { name, savedAt }
let saveTimer = null;

function scheduleSave() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    fs.writeFileSync(CONTACTS_FILE, JSON.stringify(contacts, null, 2));
  }, 2000);
}

// Guarda contactos personales reales de la agenda del teléfono vinculado
// (los que manda Baileys por contacts.set/contacts.upsert al sincronizar).
// Solo @s.whatsapp.net - nunca grupos (@g.us) ni canales (@newsletter).
export function upsertContacts(list) {
  let added = 0;
  for (const c of list || []) {
    const jid = c.id;
    if (!jid || !jid.endsWith('@s.whatsapp.net')) continue;
    if (!contacts[jid]) added += 1;
    contacts[jid] = { name: c.name || c.notify || contacts[jid]?.name || '', savedAt: contacts[jid]?.savedAt || Date.now() };
  }
  if (added > 0) scheduleSave();
  return added;
}

export function listContacts() {
  return Object.entries(contacts).map(([jid, info]) => ({ jid, ...info }));
}

export function contactsCount() {
  return Object.keys(contacts).length;
}
