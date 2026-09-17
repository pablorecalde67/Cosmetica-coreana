import 'dotenv/config';

function list(value) {
  return (value || '')
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);
}

export const config = {
  port: Number(process.env.PORT || 3000),
  publicBaseUrl: (process.env.PUBLIC_BASE_URL || '').replace(/\/$/, ''),

  whatsappOwnerNumber: process.env.WHATSAPP_OWNER_NUMBER || '',
  whatsappMonitoredChats: list(process.env.WHATSAPP_MONITORED_CHATS),
  // Numeros (sin +, sin espacios) de negocios cuyo ESTADO de WhatsApp se
  // procesa como si fuera un canal. El Estado de cualquier otro contacto
  // (personal) nunca se toca, aunque este vacio no se procesa ninguno.
  whatsappStatusSources: list(process.env.WHATSAPP_STATUS_SOURCES),

  // Token de USUARIO de larga duracion (60 dias). El servicio calcula solo,
  // en cada publicacion, el token de la Pagina a partir de este - asi no
  // hace falta ir a buscar manualmente el token de la Pagina cada vez que
  // Meta lo esconde o lo vence.
  metaUserToken: process.env.META_USER_TOKEN || '',
  metaPageId: process.env.META_PAGE_ID || '',
  metaIgUserId: process.env.META_IG_USER_ID || '',

  cocaHashtags: list(process.env.COCA_HASHTAGS || 'COCA,KBeauty,SkincareTips,GlowUp,BeautyTok,Belleza,Skincare'),

  // --- Análisis de piel con IA (página /piel) ---
  // API key de Anthropic (console.anthropic.com) usada solo para describir
  // la piel de la selfie y elegir productos. La selfie nunca se guarda.
  anthropicApiKey: process.env.ANTHROPIC_API_KEY || '',
  aiModel: process.env.AI_MODEL || 'claude-sonnet-5',

  // Alias de transferencia que se le muestra al cliente recién al final del
  // flujo, cuando ya aceptó el descargo de responsabilidad y confirmó que
  // quiere los productos. Editalo cuando quieras, no requiere reiniciar el
  // build (se toma en cada pedido desde la variable de entorno).
  transferAlias: process.env.TRANSFER_ALIAS || 'ALIAS.PENDIENTE.DE.CARGAR',
  transferHolderName: process.env.TRANSFER_HOLDER_NAME || '',
};

export function isMetaConfigured() {
  return Boolean(config.metaUserToken && config.metaPageId && config.metaIgUserId);
}

export function isPublicUrlConfigured() {
  return Boolean(config.publicBaseUrl);
}
