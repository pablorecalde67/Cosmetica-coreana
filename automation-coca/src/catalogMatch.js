import { listProducts } from './products.js';
import { listCatalog } from './perfumesCatalog.js';
import { config } from './config.js';

// Palabras genéricas (conectores, tamaños, "para hombre/mujer", etc.) que
// aparecen en decenas de productos distintos: coincidir solo en estas no
// alcanza para dar por bueno un match, o cualquier texto con un tamaño en
// ml terminaría "matcheando" cualquier perfume al azar.
const STOPWORDS = new Set([
  'de', 'la', 'el', 'los', 'las', 'en', 'con', 'para', 'por', 'un', 'una',
  'y', 'al', 'del', 'the', 'of', 'for', 'and', 'ml', 'edp', 'edt', 'eau',
  'parfum', 'perfume', 'perfumes', 'tester', 'set', 'pack', 'collection',
  'mega', 'him', 'her', 'man', 'woman', 'men', 'women', 'fem', 'masculino',
  'femenino', 'masculina', 'femenina', 'unisex', 'hombre', 'mujer',
]);

function normalize(text) {
  return (text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function significantWords(text) {
  return normalize(text)
    .split(' ')
    .filter((w) => w.length >= 3 && !STOPWORDS.has(w) && !/^\d+(ml|mg|gr|kg|oz)?$/.test(w));
}

// Cuenta cuántas palabras del texto coinciden con el nombre del producto, y
// si entre esas coincidencias hay al menos una "distintiva" (marca/nombre
// propio, no un conector o medida) - sin eso, 2 matches cortos genéricos no
// alcanzan para dar por bueno un producto al azar del catálogo.
function scoreMatch(queryWords, candidateWords) {
  const candidateSet = new Set(candidateWords);
  let hits = 0;
  let distinctive = false;
  for (const w of queryWords) {
    if (candidateSet.has(w)) {
      hits++;
      if (w.length >= 5) distinctive = true;
    }
  }
  return { hits, distinctive };
}

// Busca en el catálogo propio (K-Beauty + Perfumes) el producto cuyo
// nombre/marca coincide mejor con un texto que llegó por WhatsApp SIN foto
// adjunta. Así ese texto no se pierde: si hay un match razonable, se usa la
// foto del catálogo para publicarlo igual, sin esperar a que alguien
// reenvíe la imagen. Devuelve null si no hay ningún match con suficiente
// confianza (2+ palabras significativas en común).
export function findCatalogMatch(text) {
  const queryWords = significantWords(text);
  if (queryWords.length === 0) return null;

  let best = null;

  for (const p of listProducts({ onlyActive: true })) {
    const candidateWords = significantWords(`${p.name} ${p.brand || ''}`);
    const { hits, distinctive } = scoreMatch(queryWords, candidateWords);
    if (hits >= 2 && distinctive && (!best || hits > best.score)) {
      best = {
        score: hits,
        type: 'kbeauty',
        name: p.name,
        description: p.description,
        image: `${config.publicBaseUrl}${p.image}`,
      };
    }
  }

  for (const p of listCatalog()) {
    const candidateWords = significantWords(p.name);
    const { hits, distinctive } = scoreMatch(queryWords, candidateWords);
    if (hits >= 2 && distinctive && (!best || hits > best.score)) {
      best = {
        score: hits,
        type: 'perfumes',
        name: p.name,
        description: p.description,
        image: p.photoUrl,
      };
    }
  }

  return best;
}
