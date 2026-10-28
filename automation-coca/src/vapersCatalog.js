import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', 'data');
const CATALOG_FILE = path.join(DATA_DIR, 'vapersCatalog.json');

fs.mkdirSync(DATA_DIR, { recursive: true });

// Catálogo de Vapers: arranca VACÍO a propósito. A diferencia de K-Beauty y
// Perfumes (que tenían un listado real para sembrar), acá no hay productos
// todavía - se cargan vía /api/vapers/productos (panel) a medida que el
// dueño los va dando de alta, cada uno con su foto y precio reales.
function load() {
  if (!fs.existsSync(CATALOG_FILE)) return [];
  try {
    return JSON.parse(fs.readFileSync(CATALOG_FILE, 'utf8'));
  } catch {
    return [];
  }
}

function save(items) {
  fs.writeFileSync(CATALOG_FILE, JSON.stringify(items, null, 2));
}

let catalog = load();

export function listCatalog({ onlyActive = false } = {}) {
  return onlyActive ? catalog.filter((p) => p.active !== false) : [...catalog];
}

export function getProduct(id) {
  return catalog.find((p) => p.id === id);
}

export function updateProduct(id, patch) {
  const product = getProduct(id);
  if (!product) return null;
  Object.assign(product, patch);
  save(catalog);
  return product;
}

function slugify(name) {
  return (name || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function createProduct({ name, description = '', image, price, brand = '', active = true, id }) {
  let finalId = id || slugify(name);
  let n = 2;
  while (getProduct(finalId)) {
    finalId = `${id || slugify(name)}-${n}`;
    n++;
  }
  const product = { id: finalId, name, description, image, price, brand, active, createdAt: Date.now() };
  catalog.push(product);
  save(catalog);
  return product;
}

export function deleteProduct(id) {
  const before = catalog.length;
  catalog = catalog.filter((p) => p.id !== id);
  save(catalog);
  return catalog.length < before;
}

export function catalogStats() {
  return { total: catalog.length, active: catalog.filter((p) => p.active !== false).length };
}
