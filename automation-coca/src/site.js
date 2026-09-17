import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', 'data');
const SITE_FILE = path.join(DATA_DIR, 'site.json');

fs.mkdirSync(DATA_DIR, { recursive: true });

// Textos de la portada pública (/piel). Se editan desde /fronting.html sin
// tocar código: esto es la semilla que se usa la primera vez que arranca
// el servicio, después queda guardado en data/site.json.
const SEED_SITE = {
  eyebrow: 'COCA · K-Beauty',
  heroTitle: 'Conocé tu piel\nen 30 segundos',
  heroLead:
    'Sacate una selfie, nuestra Inteligencia Artificial analiza tu piel y te recomienda qué productos coreanos son para vos.',
  step1: 'Te tomás una selfie (no se guarda)',
  step2: 'La IA describe tu piel',
  step3: 'Te sugiere productos K-Beauty a tu medida',
  ctaText: 'Descubrir mi tipo de piel',
  fineprint: 'Gratis · Sin registro · Tu foto no se almacena',
};

function load() {
  if (!fs.existsSync(SITE_FILE)) {
    save(SEED_SITE);
    return SEED_SITE;
  }
  try {
    return { ...SEED_SITE, ...JSON.parse(fs.readFileSync(SITE_FILE, 'utf8')) };
  } catch {
    return SEED_SITE;
  }
}

function save(site) {
  fs.writeFileSync(SITE_FILE, JSON.stringify(site, null, 2));
}

let site = load();

export function getSite() {
  return { ...site };
}

export function updateSite(patch) {
  const allowed = Object.keys(SEED_SITE);
  for (const key of allowed) {
    if (typeof patch[key] === 'string') site[key] = patch[key];
  }
  save(site);
  return getSite();
}
