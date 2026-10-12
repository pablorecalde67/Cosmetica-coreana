import { updateItem } from './store.js';
import { publishItem } from './meta.js';
import { isMetaConfigured } from './config.js';

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

// Flujo completo sin intervención humana: si el mensaje trae un precio en
// dólares, se le suma el margen, se convierte a pesos argentinos y se publica
// directo en Instagram. Si no trae precio reconocible, el item queda en
// estado "error" (ya no hay panel para cargarlo a mano) y se avisa al dueño.
export async function autoPriceAndPublish(item, { notifyOwner } = {}) {
  const usd = extractPriceUSD(item.caption);

  if (usd == null) {
    const updated = updateItem(item.id, {
      status: 'error',
      error: 'No se encontró un precio en dólares en el mensaje (ej: escribir "$40" en el texto).',
    });
    if (notifyOwner) {
      await notifyOwner(
        `⚠️ Llegó contenido nuevo pero no pude publicarlo: no encontré un precio en el mensaje.\nReenviá el mismo contenido con el precio en dólares en el texto (ej: "$40").`,
      );
    }
    return updated;
  }

  const ars = usdToFinalArs(usd);
  let updated = updateItem(item.id, { price: ars, status: 'ready' });

  if (!isMetaConfigured()) {
    updated = updateItem(item.id, {
      status: 'error',
      error: 'Falta configurar las credenciales de Meta.',
    });
    if (notifyOwner) {
      await notifyOwner(`⚠️ Llegó contenido nuevo (precio AR$ ${formatArs(ars)}) pero Meta no está configurado, no se pudo publicar.`);
    }
    return updated;
  }

  try {
    const result = await publishItem(updated);
    updated = updateItem(updated.id, {
      igPostId: result.igPostId,
      error: null,
      status: 'published',
      publishedAt: Date.now(),
    });
    if (notifyOwner) {
      await notifyOwner(`✅ Publicado automáticamente en Instagram, AR$ ${formatArs(ars)}.`);
    }
  } catch (err) {
    updated = updateItem(updated.id, { status: 'error', error: err.message });
    if (notifyOwner) {
      await notifyOwner(`⚠️ Llegó contenido nuevo (precio AR$ ${formatArs(ars)}) pero falló la publicación en Instagram: ${err.message}`);
    }
  }

  return updated;
}
