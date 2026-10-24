import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', 'data');
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');

// Configuración chica y ad-hoc (ej. el JID del Canal de WhatsApp) que no
// amerita una variable de entorno de Railway: se guarda acá, en el volumen
// persistente, y se administra con un par de endpoints en vez de tener que
// tocar el dashboard de Railway para cada dato nuevo.
function load() {
  if (!fs.existsSync(SETTINGS_FILE)) return {};
  try {
    return JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8'));
  } catch {
    return {};
  }
}

function save(settings) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2));
}

export function getSetting(key) {
  return load()[key];
}

export function setSetting(key, value) {
  const settings = load();
  settings[key] = value;
  save(settings);
  return settings;
}

export function getAllSettings() {
  return load();
}
