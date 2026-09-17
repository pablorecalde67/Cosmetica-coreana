import axios from 'axios';
import { config } from './config.js';
import { recommendProducts } from './products.js';

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';

export const SKIN_TYPES = ['grasa', 'seca', 'mixta', 'sensible', 'normal'];
export const CONCERN_TAGS = [
  'poros-visibles',
  'brillo-excesivo',
  'textura-irregular',
  'tono-desparejo',
  'opacidad',
  'manchas',
  'signos-de-edad',
  'deshidratacion',
  'enrojecimiento',
  'barrera-danada',
  'con-acne',
];

export function isAiConfigured() {
  return Boolean(config.anthropicApiKey);
}

// El prompt le pide EXPLÍCITAMENTE a la IA que hable solo de piel: nada de
// edad, género, identidad, atractivo ni diagnóstico médico. Esto no es un
// dispositivo médico ni reemplaza a un dermatólogo — el texto legal de esto
// se muestra siempre junto al resultado en la página.
const SYSTEM_PROMPT = `Sos un asistente de estética que describe ÚNICAMENTE características visibles de la piel del rostro en una selfie, para sugerir cosmética coreana de cuidado facial.

Reglas estrictas:
- Hablá SOLO de la piel: hidratación, grasitud/brillo, poros, textura, enrojecimiento, tono/manchas, signos de edad visibles (líneas finas), y presencia de granitos o marcas de acné.
- NUNCA menciones ni infieras edad, género, identidad, etnia, atractivo, estado de ánimo ni nada que no sea la piel.
- NO das diagnóstico médico ni nombras enfermedades dermatológicas. Si ves algo que parece necesitar atención médica (lunar irregular, lesión, etc.) decilo en "advertencia" sugiriendo consultar a un dermatólogo, sin diagnosticar.
- Si la imagen no muestra un rostro con claridad suficiente, devolvé skinType null y explicá por qué en "resumen".
- Respondé EXCLUSIVAMENTE con un JSON válido, sin texto adicional, con este formato exacto:

{
  "skinType": "grasa" | "seca" | "mixta" | "sensible" | "normal" | null,
  "concerns": string[] (elegí solo de esta lista: ${CONCERN_TAGS.join(', ')}),
  "resumen": string (2 a 4 oraciones, en español, describiendo solo la piel, tono cercano y profesional),
  "detalles": {
    "hidratacion": string breve,
    "grasitud": string breve,
    "poros": string breve,
    "textura": string breve,
    "tono": string breve
  },
  "advertencia": string | null
}`;

function extractJson(text) {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('La IA no devolvió un JSON válido.');
  return JSON.parse(match[0]);
}

/**
 * Analiza una selfie (base64, sin el prefijo data:) con Claude vision.
 * IMPORTANTE: la imagen viaja solo en memoria hacia la API de IA. Este
 * servicio nunca la escribe a disco ni a la base de datos.
 */
export async function analyzeSkin({ base64Image, mediaType }) {
  if (!isAiConfigured()) {
    throw new Error('Falta configurar ANTHROPIC_API_KEY para poder analizar la piel.');
  }

  const { data } = await axios.post(
    ANTHROPIC_URL,
    {
      model: config.aiModel,
      max_tokens: 700,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: mediaType, data: base64Image },
            },
            {
              type: 'text',
              text: 'Analizá la piel del rostro en esta selfie y respondé solo con el JSON pedido.',
            },
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

  if (!parsed.skinType) {
    return { ok: false, resumen: parsed.resumen || 'No se pudo identificar la piel con claridad en la foto.' };
  }

  const recommendations = recommendProducts(
    { skinType: parsed.skinType, concerns: parsed.concerns || [] },
    5,
  );

  return {
    ok: true,
    skinType: parsed.skinType,
    concerns: parsed.concerns || [],
    resumen: parsed.resumen,
    detalles: parsed.detalles || null,
    advertencia: parsed.advertencia || null,
    recommendations,
  };
}
