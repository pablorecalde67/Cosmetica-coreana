import path from 'node:path';
import { updateItem, MEDIA_DIR } from './store.js';
import { publishItem } from './meta.js';
import { config, isMetaConfigured, isPerfumesAccountConfigured } from './config.js';
import { readProductImage } from './imageVision.js';

// Cotización fija y margen fijo, cargados a mano por el dueño del negocio
// (no vienen de ninguna API de cambio): cada precio en dólares que llega por
// WhatsApp/mail se publica siempre en pesos argentinos, nunca en dólares.
const USD_TO_ARS = 1600;
const MARKUP = 1.1;

// Busca un precio en dólares en el texto del mensaje. Reconoce varios
// formatos reales que mandan los proveedores por WhatsApp:
//   "$40", "USD 40", "U$S 40,50" (símbolo antes del número)
//   "40$", "2,70 $"              (símbolo después, típico en catálogos)
//   "P.U: 2,70$"                 (precio unitario explícito - se prioriza
//                                 sobre "P.M" / precio mayorista, que es
//                                 para compras en cantidad, no para el
//                                 cliente final de Instagram)
// Devuelve null si no encuentra nada reconocible.
export function extractPriceUSD(text) {
  if (!text) return null;

  const num = '([0-9]+(?:[.,][0-9]{1,2})?)';

  const unitLabel = text.match(new RegExp(`P\\.?U\\.?\\s*:?\\s*${num}\\s*\\$`, 'i'));
  if (unitLabel) {
    const value = Number(unitLabel[1].replace(',', '.'));
    if (Number.isFinite(value) && value > 0) return value;
  }

  const symbolBefore = text.match(new RegExp(`(?:USD|U\\$S|U\\$D|\\$)\\s*${num}`, 'i'));
  if (symbolBefore) {
    const value = Number(symbolBefore[1].replace(',', '.'));
    if (Number.isFinite(value) && value > 0) return value;
  }

  const symbolAfter = text.match(new RegExp(`${num}\\s*(?:USD|U\\$S|U\\$D|\\$)`, 'i'));
  if (symbolAfter) {
    const value = Number(symbolAfter[1].replace(',', '.'));
    if (Number.isFinite(value) && value > 0) return value;
  }

  return null;
}

export function usdToFinalArs(usd) {
  return Math.round(usd * MARKUP * USD_TO_ARS);
}

export function formatArs(ars) {
  return new Intl.NumberFormat('es-AR').format(ars);
}

// Decide a qué marca/cuenta de Instagram va cada contenido. Por defecto todo
// va a K-Beauty; si el texto del mensaje contiene la palabra "perfume" (o
// "perfumes"), se publica en la cuenta de Perfumes Árabes en su lugar, y esa
// palabra se saca del texto final (era solo una marca para el enrutamiento,
// no algo para mostrar en el posteo).
function resolveAccount(caption) {
  const match = (caption || '').match(/\bperfumes?\b/i);
  if (!match) {
    return { label: 'K-Beauty', account: undefined, configured: isMetaConfigured() };
  }
  const cleanCaption = (caption.slice(0, match.index) + caption.slice(match.index + match[0].length))
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  return {
    label: 'Perfumes',
    cleanCaption,
    account: {
      pageId: config.metaPerfumesPageId,
      igUserId: config.metaPerfumesIgUserId,
      hashtags: config.perfumesHashtags,
    },
    configured: isPerfumesAccountConfigured(),
  };
}

// Flujo completo sin intervención humana: si el mensaje trae un precio en
// dólares, se le suma el margen, se convierte a pesos argentinos y se publica
// directo en Instagram (en K-Beauty o en Perfumes, según el texto). Si no
// trae precio reconocible, el item queda en estado "error" (ya no hay panel
// para cargarlo a mano) y se avisa al dueño.
export async function autoPriceAndPublish(item, { notifyOwner } = {}) {
  let usd = extractPriceUSD(item.caption);
  let visionText = null;

  // Fallback: muchos proveedores (sobre todo canales mayoristas que se
  // siguen por WhatsApp) mandan el precio y el nombre escritos ENCIMA de la
  // foto, sin poner nada en el texto del mensaje. Si el texto no trajo
  // precio, antes de darnos por vencidos le pedimos a la IA que lea la
  // imagen y busque el precio ahí.
  if (usd == null) {
    const firstImage = item.media?.find((m) => m.type === 'image');
    if (firstImage) {
      try {
        const vision = await readProductImage(path.join(MEDIA_DIR, firstImage.file));
        if (vision?.priceUsd != null) {
          usd = vision.priceUsd;
          visionText = [vision.title, vision.descripcion].filter(Boolean).join('\n\n');
        }
      } catch (err) {
        console.error('[autoPublish] no se pudo leer el precio desde la imagen:', err.message);
      }
    }
  }

  if (usd == null) {
    const updated = updateItem(item.id, {
      status: 'error',
      error: 'No se encontró un precio en dólares ni en el mensaje ni escrito en la imagen (ej: escribir "$40" en el texto, o que la foto lo muestre con claridad).',
    });
    if (notifyOwner) {
      await notifyOwner(
        `⚠️ Llegó contenido nuevo pero no pude publicarlo: no encontré un precio en el mensaje ni en la imagen.\nReenviá el mismo contenido con el precio en dólares en el texto (ej: "$40").`,
      );
    }
    return updated;
  }

  const ars = usdToFinalArs(usd);
  const captionForRouting = item.caption || visionText || '';
  const routed = resolveAccount(captionForRouting);
  const patch = { price: ars, status: 'ready' };
  const finalDescription = routed.cleanCaption || captionForRouting;
  if (finalDescription) patch.description = finalDescription;
  let updated = updateItem(item.id, patch);

  if (!routed.configured) {
    updated = updateItem(item.id, {
      status: 'error',
      error: `Falta configurar las credenciales de Meta para la cuenta de ${routed.label}.`,
    });
    if (notifyOwner) {
      await notifyOwner(`⚠️ Llegó contenido nuevo (${routed.label}, precio AR$ ${formatArs(ars)}) pero esa cuenta no está configurada, no se pudo publicar.`);
    }
    return updated;
  }

  try {
    const result = await publishItem(updated, routed.account);
    updated = updateItem(updated.id, {
      igPostId: result.igPostId,
      error: null,
      status: 'published',
      publishedAt: Date.now(),
    });
    if (notifyOwner) {
      await notifyOwner(`✅ Publicado automáticamente en Instagram (${routed.label}), AR$ ${formatArs(ars)}.`);
    }
  } catch (err) {
    updated = updateItem(updated.id, { status: 'error', error: err.message });
    if (notifyOwner) {
      await notifyOwner(`⚠️ Llegó contenido nuevo (${routed.label}, precio AR$ ${formatArs(ars)}) pero falló la publicación en Instagram: ${err.message}`);
    }
  }

  return updated;
}
