import fs from 'node:fs';
import path from 'node:path';
import axios from 'axios';
import { config } from './config.js';

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';

const MEDIA_TYPE_BY_EXT = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
};

// Muchos proveedores (sobre todo canales mayoristas) mandan la foto del
// producto con el precio y el nombre escritos ENCIMA de la imagen, sin
// poner nada en el texto del mensaje de WhatsApp. extractPriceUSD() en
// autoPublish.js solo lee el texto del mensaje, así que esos casos
// quedaban siempre en error. Esto es el fallback: le pide a Claude que lea
// lo que está escrito en la propia imagen.
const SYSTEM_PROMPT = `Sos un asistente que lee fotos de catálogos de productos (cosmética coreana o perfumes árabes) que proveedores mandan por WhatsApp. Muchas veces el precio y el nombre del producto están escritos directamente SOBRE la imagen (cartel, etiqueta, superpuesto), no en el texto del mensaje.

Reglas:
- Leé ÚNICAMENTE texto que esté escrito/impreso dentro de la imagen. No inventes nada que no veas.
- Si hay más de un precio en dólares (ej. "P.U" precio unitario y "P.M" precio mayorista), usá el precio UNITARIO ("P.U"), nunca el mayorista ("P.M").
- El precio tiene que estar en dólares (señales: "$", "USD", "U$S", "U$D"). Si el único precio visible es en otra moneda, o no hay ningún precio visible en la imagen, "priceUsd" tiene que ser null.
- Respondé EXCLUSIVAMENTE con un JSON válido, sin texto adicional, con este formato exacto:

{
  "priceUsd": number | null,
  "title": string | null (nombre/modelo del producto si se lee, corto),
  "descripcion": string | null (1-2 oraciones describiendo el producto si hay info visible, si no null)
}`;

function extractJson(text) {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('La IA no devolvió un JSON válido al leer la imagen.');
  return JSON.parse(match[0]);
}

export function isVisionConfigured() {
  return Boolean(config.anthropicApiKey);
}

// Lee precio/título/descripción escritos sobre una foto de producto ya
// guardada en disco (dentro de MEDIA_DIR). Devuelve null si no hay API key
// configurada o si la imagen no tiene ningún precio en dólares visible.
export async function readProductImage(filePath) {
  if (!isVisionConfigured()) return null;

  const ext = path.extname(filePath).toLowerCase();
  const mediaType = MEDIA_TYPE_BY_EXT[ext];
  if (!mediaType) return null;

  const base64Image = fs.readFileSync(filePath).toString('base64');

  const { data } = await axios.post(
    ANTHROPIC_URL,
    {
      model: config.aiModel,
      max_tokens: 400,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64Image } },
            { type: 'text', text: 'Leé el precio y el nombre del producto escritos en esta imagen y respondé solo con el JSON pedido.' },
          ],
        },
      ],
    },
    {
      headers: {
        'x-api-key': config.anthropicApiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      timeout: 30000,
    },
  );

  const textBlock = data.content?.find((b) => b.type === 'text')?.text || '';
  const parsed = extractJson(textBlock);

  return {
    priceUsd: Number.isFinite(parsed.priceUsd) && parsed.priceUsd > 0 ? parsed.priceUsd : null,
    title: parsed.title || null,
    descripcion: parsed.descripcion || null,
  };
}
