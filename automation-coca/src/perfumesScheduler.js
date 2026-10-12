import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config, isPerfumesAccountConfigured } from './config.js';
import { publishItem } from './meta.js';
import { getPendingBatch, markResult } from './perfumesCatalog.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STATE_FILE = path.join(__dirname, '..', 'data', 'perfumesSchedulerState.json');

// Entrada agresiva al mercado (pedido explícito del dueño, oct-2026): 1
// producto del catálogo cada 8hs (3 por día), en vez de 1 por día.
const POSTS_PER_RUN = 1;
const RUN_INTERVAL_MS = 8 * 60 * 60 * 1000;
const CHECK_EVERY_MS = 60 * 60 * 1000;

function loadState() {
  if (!fs.existsSync(STATE_FILE)) return { lastRunAt: 0 };
  try {
    return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
  } catch {
    return { lastRunAt: 0 };
  }
}

function saveState(state) {
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

async function publishOne(entry) {
  const item = {
    description: `${entry.name}\n\n${entry.description}`.trim(),
    price: entry.priceArs,
    media: [{ file: entry.photoUrl, type: 'image' }],
  };

  try {
    const result = await publishItem(item, {
      pageId: config.metaPerfumesPageId,
      igUserId: config.metaPerfumesIgUserId,
      hashtags: config.perfumesHashtags,
    });
    markResult(entry.id, {
      status: 'published',
      igPostId: result.igPostId,
      publishedAt: Date.now(),
      error: null,
    });
    console.log(`[perfumes-scheduler] Publicado: ${entry.name} (AR$ ${entry.priceArs})`);
  } catch (err) {
    markResult(entry.id, { status: 'error', error: err.message });
    console.error(`[perfumes-scheduler] Error publicando "${entry.name}":`, err.message);
  }
}

async function runBatch() {
  const batch = getPendingBatch(POSTS_PER_RUN);
  if (batch.length === 0) {
    console.log('[perfumes-scheduler] Catálogo de perfumes agotado, nada pendiente.');
    return;
  }
  for (const entry of batch) {
    await publishOne(entry);
  }
}

export function startPerfumesScheduler() {
  if (!isPerfumesAccountConfigured()) {
    console.log('[perfumes-scheduler] Cuenta de Perfumes no configurada, scheduler deshabilitado.');
    return;
  }

  const tick = async () => {
    const state = loadState();
    const now = Date.now();
    if (now - state.lastRunAt < RUN_INTERVAL_MS) return;
    saveState({ lastRunAt: now });
    await runBatch();
  };

  console.log(`[perfumes-scheduler] Activo: ${POSTS_PER_RUN} producto/s del catálogo cada ${RUN_INTERVAL_MS / 3600000}hs.`);
  tick();
  setInterval(tick, CHECK_EVERY_MS);
}
