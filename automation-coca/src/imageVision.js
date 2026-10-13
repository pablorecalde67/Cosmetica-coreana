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

// Dos trabajos en un solo chequeo de imagen, porque los dos aparecieron
// juntos en la práctica (canales/grupos mayoristas que mandan de todo):
//
// 1) Fallback de precio: muchos proveedores mandan la foto del producto con
//    el precio y el nombre escritos ENCIMA de la imagen, sin poner nada en
//    el texto del mensaje de WhatsApp. extractPriceUSD() en autoPublish.js
//    solo lee el texto del mensaje, así que esos casos quedaban en error.
// 2) Filtro de rubro/contenido: el WhatsApp del dueño también recibe cosas
//    que NO son para publicar - comprobantes de transferencia con datos
//    personales (CBU/CUIL), capturas de chats ajenos, fotos personales, y
//    catálogos de rubros sin relación (se vio un canal mayorista de
//    electrónica, parlantes y termos). Esto tiene que bloquearse SIEMPRE,
//    exista o no un precio ya puesto en el texto del mensaje - por eso
//    checkProductImage() se llama en todos los casos, no solo cuando falta
//    el precio.
const SYSTEM_PROMPT = `Sos un asistente que controla fotos que llegan por WhatsApp a un negocio que vende ÚNICAMENTE dos cosas: cosmética/cuidado de la piel coreano (K-Beauty) y perfumes/fragancias árabes.

Reglas:
- "relevant" es true si la imagen muestra con claridad: (a) un producto de cosmética/skincare/maquillaje/cuidado personal (coreano o no - también cuenta jabón, shampoo, cepillos, esponjas de maquillaje, algodones/discos desmaquillantes, peines, cepillos para el pelo, pinzas/broches/hebillas/vinchas/scrunchies para el cabello aunque tengan forma decorativa de flor u otro adorno, gorros de baño, kits de rizado, cualquier accesorio de rutina de belleza o peinado genérico sin marca puntual), o (b) un perfume/fragancia/aromatizante (árabe o no). No hace falta que sea una marca coreana específica ni que tenga nombre de marca: un accesorio genérico de belleza (ej. "Cotton Ball" para uso cosmético, o pinzas para el pelo con forma de flor) también es "relevant" true - no los confundas con el ejemplo de "una flor" de la lista de abajo, que se refiere a una foto de una flor/planta real, NUNCA a un accesorio con forma decorativa de flor. En cualquier otro caso (otro rubro sin relación con belleza/peinado/perfumería: electrónica, parlantes, electrodomésticos, ropa, juguetes, comida, medicamentos, etc.; comprobante de pago/transferencia bancaria de cualquier billetera o banco; captura de pantalla de una conversación de chat; documento personal o con datos personales como nombre completo/CBU/CUIT/CUIL/DNI; foto sin ningún producto como una flor/planta real, un paisaje o una mascota; cartel genérico sin un producto puntual) "relevant" tiene que ser false.
- Si "relevant" es false, "priceUsd", "title" y "descripcion" tienen que ser null siempre, SIN IMPORTAR que se vea algún número con "$" en la imagen.
- Si "relevant" es true, PRECIO: leé ÚNICAMENTE el precio que esté escrito/impreso dentro de la imagen, no inventes ningún número. Si hay más de un precio en dólares (ej. "P.U" precio unitario y "P.M" precio mayorista), usá el UNITARIO ("P.U"), nunca el mayorista. El precio tiene que estar en dólares (señales: "$", "USD", "U$S", "U$D") - si el único precio visible es en otra moneda, o no hay ningún precio visible, "priceUsd" tiene que ser null (pero "relevant" sigue siendo true si el producto corresponde al rubro).
- Si "relevant" es true, TÍTULO Y DESCRIPCIÓN: a diferencia del precio, acá SÍ podés (y tenés que) usar tu conocimiento del producto - nunca los dejes null si "relevant" es true, aunque la imagen no tenga nada de texto escrito. Identificá el producto por lo que se ve (envase, marca, tipo de producto, diseño) y, si reconocés la marca o el tipo, completá con lo que sabés de productos similares.
  - "title": nombre corto del producto (marca + tipo si se puede, ej. "Sérum Vitamina C" o "Perfume Lattafa Yara").
  - "descripcion": 2-3 oraciones en ESPAÑOL, estilo descripción de venta para Instagram, con tono cercano y vendedor, pensada para VIRALIZAR - usá palabras clave de búsqueda/tendencia típicas del rubro (para K-Beauty: términos como "rutina coreana", "hidratación", "glow", "poros", "piel sensible"; para perfumes árabes: "fragancia árabe", "larga duración", "unisex", "aroma oriental", según corresponda al producto). No inventes datos técnicos específicos que no puedas sostener (ingredientes exactos, certificaciones) si no los ves - describí en términos generales del tipo de producto.
- Respondé EXCLUSIVAMENTE con un JSON válido, sin texto adicional, con este formato exacto:

{
  "relevant": boolean,
  "priceUsd": number | null,
  "title": string | null (null solo si relevant es false),
  "descripcion": string | null (null solo si relevant es false)
}`;

function extractJson(text) {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('La IA no devolvió un JSON válido al leer la imagen.');
  return JSON.parse(match[0]);
}

export function isVisionConfigured() {
  return Boolean(config.anthropicApiKey);
}

// Controla una foto ya guardada en disco (dentro de MEDIA_DIR): si
// corresponde al rubro del negocio (cosmética K-Beauty o perfumes árabes),
// y de paso lee precio/título/descripción si están escritos sobre la
// imagen. Devuelve null si no hay API key configurada (en ese caso el
// único filtro que queda activo es el del texto del mensaje).
export async function checkProductImage(filePath) {
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
            { type: 'text', text: 'Controlá esta imagen y respondé solo con el JSON pedido.' },
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
  const relevant = parsed.relevant !== false;

  return {
    relevant,
    priceUsd: relevant && Number.isFinite(parsed.priceUsd) && parsed.priceUsd > 0 ? parsed.priceUsd : null,
    title: relevant ? parsed.title || null : null,
    descripcion: relevant ? parsed.descripcion || null : null,
  };
}
