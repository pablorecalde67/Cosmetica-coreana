import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', 'data');
const PRODUCTS_FILE = path.join(DATA_DIR, 'products.json');

fs.mkdirSync(DATA_DIR, { recursive: true });

// Catálogo base (semilla). Vos podés editar precio, descripción, imagen y
// disponibilidad desde el panel admin (/admin) en cualquier momento: eso
// pisa este catálogo por defecto la primera vez que arranca el servicio y
// queda guardado en data/products.json.
//
// "skinTypes": tipos de piel a los que le sirve el producto.
// Valores posibles: grasa | seca | mixta | sensible | normal
//
// "concerns": preocupaciones/objetivos que ataca el producto. La IA que
// analiza la selfie devuelve estos mismos tags, así se hace el matching.
const SEED_PRODUCTS = [
  {
    id: 'zero-pore-toner',
    name: 'Tónico Facial Zero Pore',
    description:
      'Tónico exfoliante suave con AHA/BHA/PHA y niacinamida. Afina la textura, cierra poros visibles y despareja la superficie de la piel sin resecar.',
    image: '/piel/img/products/zero-pore-toner.webp',
    price: 25000,
    skinTypes: ['grasa', 'mixta', 'normal'],
    concerns: ['poros-visibles', 'textura-irregular', 'brillo-excesivo'],
    active: true,
  },
  {
    id: 'zero-pore-serum',
    name: 'Sérum Facial Zero Pore 2.0',
    description:
      'Sérum control de poros y sebo, textura ligera. Ideal para pieles grasas o mixtas con brillo en zona T y poros dilatados.',
    image: '/piel/img/products/zero-pore-serum.webp',
    price: 32000,
    skinTypes: ['grasa', 'mixta'],
    concerns: ['poros-visibles', 'brillo-excesivo', 'textura-irregular'],
    active: true,
  },
  {
    id: 'glutathione-glow-serum',
    name: 'Sérum Glutathione Glow',
    description:
      'Sérum luminosidad con glutatión liposomal y niacinamida al 5%. Ayuda a unificar el tono y aportar un brillo saludable a pieles opacas.',
    image: '/piel/img/products/glutathione-glow-serum.webp',
    price: 34000,
    skinTypes: ['normal', 'mixta', 'seca'],
    concerns: ['tono-desparejo', 'opacidad', 'manchas'],
    active: true,
  },
  {
    id: 'vita-c-capsule',
    name: 'Sérum Deep Vita C Capsule',
    description:
      'Sérum en cápsula con vitamina C estabilizada. Antioxidante, ilumina y ayuda a atenuar manchas y marcas de acné.',
    image: '/piel/img/products/vita-c-capsule.webp',
    price: 33000,
    skinTypes: ['normal', 'mixta', 'grasa'],
    concerns: ['manchas', 'opacidad', 'tono-desparejo'],
    active: true,
  },
  {
    id: 'deep-vita-a-retinol',
    name: 'Sérum Deep Vita A Retinol',
    description:
      'Sérum con retinol para renovación celular. Suaviza líneas finas y mejora la textura en pieles con signos de edad.',
    image: '/piel/img/products/deep-vita-a-retinol.webp',
    price: 36000,
    skinTypes: ['normal', 'mixta', 'seca'],
    concerns: ['signos-de-edad', 'textura-irregular'],
    active: true,
  },
  {
    id: 'collagen-jelly-cream',
    name: 'Crema Hidratante Collagen Jelly Cream',
    description:
      'Crema gel con colágeno. Hidratación profunda y efecto relleno, para pieles secas o deshidratadas que buscan firmeza.',
    image: '/piel/img/products/collagen-jelly-cream.webp',
    price: 38000,
    skinTypes: ['seca', 'normal'],
    concerns: ['deshidratacion', 'signos-de-edad'],
    active: true,
  },
  {
    id: 'red-cream-plus',
    name: 'Crema Facial Red Cream Plus',
    description:
      'Crema calmante y nutritiva pensada para pieles sensibles o con tendencia al enrojecimiento. Fortalece la barrera cutánea.',
    image: '/piel/img/products/red-cream-plus.webp',
    price: 37000,
    skinTypes: ['sensible', 'seca'],
    concerns: ['enrojecimiento', 'deshidratacion', 'barrera-danada'],
    active: true,
  },
  {
    id: 'exosome-cica-serum',
    name: 'Sérum Exosome Cica',
    description:
      'Sérum reparador con centella asiática y exosomas. Calma irritación y ayuda a recuperar piel sensibilizada o post-procedimiento.',
    image: '/piel/img/products/exosome-cica-serum.webp',
    price: 39000,
    skinTypes: ['sensible', 'seca', 'normal'],
    concerns: ['enrojecimiento', 'barrera-danada', 'deshidratacion'],
    active: true,
  },
  {
    id: 'azelaic-niacinamide-cleanser',
    name: 'Espuma Limpiadora Azelaic Acid + Niacinamide',
    description:
      'Limpiador suave con ácido azelaico y niacinamida. Pensado para piel con tendencia acneica o rojeces, sin resecar.',
    image: '/piel/img/products/azelaic-niacinamide-cleanser.webp',
    price: 24000,
    skinTypes: ['grasa', 'mixta', 'sensible'],
    concerns: ['con-acne', 'enrojecimiento', 'poros-visibles'],
    active: true,
  },
  {
    id: 'hypochlorous-mist',
    name: 'Mist Facial Hypochlorous Acid Daily',
    description:
      'Bruma calmante de uso diario. Ayuda a controlar brotes y mantener la piel fresca e hidratada durante el día.',
    image: '/piel/img/products/hypochlorous-mist.webp',
    price: 21000,
    skinTypes: ['grasa', 'mixta', 'sensible', 'normal'],
    concerns: ['con-acne', 'deshidratacion', 'enrojecimiento'],
    active: true,
  },
  {
    id: 'kojic-turmeric-pad',
    name: 'Almohadillas Tónicas Kojic Acid Turmeric',
    description:
      'Pads exfoliantes con ácido kójico y cúrcuma. Ayudan a atenuar manchas y marcas post-acné y a uniformar el tono.',
    image: '/piel/img/products/kojic-turmeric-pad.webp',
    price: 27000,
    skinTypes: ['grasa', 'mixta', 'normal'],
    concerns: ['manchas', 'tono-desparejo', 'con-acne'],
    active: true,
  },
  {
    id: 'pdrn-hydrating-serum',
    name: 'Sérum PDRN Pink Peptide',
    description:
      'Sérum regenerador e hidratante con PDRN. Repara la barrera cutánea y aporta luminosidad a pieles deshidratadas o sensibles.',
    image: '/piel/img/products/pdrn-hydrating-serum.webp',
    price: 35000,
    skinTypes: ['seca', 'sensible', 'normal'],
    concerns: ['deshidratacion', 'barrera-danada', 'opacidad'],
    active: true,
  },
  {
    id: 'collagen-glow-sunscreen',
    name: 'Protector Solar Collagen Glow Sunscreen SPF50',
    description:
      'Protector solar con efecto luminoso. Recomendado como paso final para cualquier tipo de piel, todos los días.',
    image: '/piel/img/products/collagen-glow-sunscreen.webp',
    price: 22000,
    skinTypes: ['grasa', 'mixta', 'seca', 'sensible', 'normal'],
    concerns: ['signos-de-edad', 'manchas', 'tono-desparejo'],
    active: true,
  },
];

function load() {
  if (!fs.existsSync(PRODUCTS_FILE)) {
    save(SEED_PRODUCTS);
    return SEED_PRODUCTS;
  }
  try {
    return JSON.parse(fs.readFileSync(PRODUCTS_FILE, 'utf8'));
  } catch {
    return SEED_PRODUCTS;
  }
}

function save(products) {
  fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(products, null, 2));
}

let products = load();

export function listProducts({ onlyActive = false } = {}) {
  return onlyActive ? products.filter((p) => p.active !== false) : [...products];
}

export function getProduct(id) {
  return products.find((p) => p.id === id);
}

export function updateProduct(id, patch) {
  const product = getProduct(id);
  if (!product) return null;
  Object.assign(product, patch);
  save(products);
  return product;
}

/**
 * Ordena el catálogo activo según qué tan bien matchea con el tipo de piel
 * y las preocupaciones ("concerns") que devolvió el análisis de IA.
 * Devuelve los primeros `limit` (por defecto 5).
 */
export function recommendProducts({ skinType, concerns = [] }, limit = 5) {
  const active = listProducts({ onlyActive: true });

  const scored = active.map((p) => {
    let score = 0;
    if (skinType && p.skinTypes.includes(skinType)) score += 3;
    for (const c of concerns) {
      if (p.concerns.includes(c)) score += 2;
    }
    return { product: p, score };
  });

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.product);
}
