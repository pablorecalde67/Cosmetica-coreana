import 'dotenv/config';
import { getSetting } from './settings.js';

function list(value) {
  return (value || '')
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);
}

export const config = {
  port: Number(process.env.PORT || 3000),
  // Token de USUARIO de larga duracion (60 dias). Se lee primero de
  // settings.js (lo que guarda el renovador automático) y si no hay nada
  // ahí, de la variable de entorno - así una renovación automática no
  // depende de poder tocar las variables de Railway en caliente.
  get metaUserToken() {
    return getSetting('metaUserToken') || process.env.META_USER_TOKEN || '';
  },
  publicBaseUrl: (process.env.PUBLIC_BASE_URL || '').replace(/\/$/, ''),

  whatsappOwnerNumber: process.env.WHATSAPP_OWNER_NUMBER || '',
  whatsappMonitoredChats: list(process.env.WHATSAPP_MONITORED_CHATS),
  // Numeros (sin +, sin espacios) de negocios cuyo ESTADO de WhatsApp se
  // procesa como si fuera un canal. El Estado de cualquier otro contacto
  // (personal) nunca se toca, aunque este vacio no se procesa ninguno.
  whatsappStatusSources: list(process.env.WHATSAPP_STATUS_SOURCES),

  metaPageId: process.env.META_PAGE_ID || '',
  metaIgUserId: process.env.META_IG_USER_ID || '',
  // El secreto de la app (Configuración > Básica en el panel de Meta) se usa
  // para renovar el token de usuario solo, antes de que venza - sin esto,
  // habría que volver a generarlo a mano en el Explorer cada 60 días.
  get metaAppSecret() {
    return getSetting('metaAppSecret') || process.env.META_APP_SECRET || '';
  },
  metaAppId: process.env.META_APP_ID || '29493748220227157',

  // Token arbitrario (lo define el dueño) que Meta manda de vuelta al
  // verificar el webhook de mensajes directos de Instagram. Si no coincide,
  // se rechaza la suscripción - evita que cualquiera registre un webhook
  // falso apuntando a otro lado. Se lee primero de settings.js (se puede
  // cargar vía API sin tocar Railway) y si no hay nada ahí, de la variable
  // de entorno.
  get instagramWebhookVerifyToken() {
    return getSetting('instagramWebhookVerifyToken') || process.env.INSTAGRAM_WEBHOOK_VERIFY_TOKEN || '';
  },

  cocaHashtags: list(process.env.COCA_HASHTAGS || 'COCA,KBeauty,SkincareTips,GlowUp,BeautyTok,Belleza,Skincare'),

  // Segunda marca/cuenta de Instagram (perfumes árabes), publicada con el
  // mismo token de usuario de Meta pero otra Página/cuenta de IG. Si el
  // mensaje que llega por WhatsApp/mail contiene la palabra "perfume" (ver
  // src/autoPublish.js), se publica acá en vez de en la cuenta de K-Beauty.
  metaPerfumesPageId: process.env.META_PERFUMES_PAGE_ID || '',
  metaPerfumesIgUserId: process.env.META_PERFUMES_IG_USER_ID || '',
  perfumesHashtags: list(process.env.PERFUMES_HASHTAGS || 'COCA,Perfumes,PerfumesArabes,Fragancias,CiudadDelEste'),

  // Ingesta por mail: alternativa a WhatsApp que no depende de vincular
  // ningun dispositivo. Se conecta por IMAP a esta casilla y cada mail que
  // llegue con fotos/videos adjuntos y el tag en el asunto pasa a la cola.
  emailImapHost: process.env.EMAIL_IMAP_HOST || 'imap.gmail.com',
  emailImapPort: Number(process.env.EMAIL_IMAP_PORT || 993),
  emailUser: process.env.EMAIL_USER || '',
  emailAppPassword: process.env.EMAIL_APP_PASSWORD || '',
  // Filtro para no juntar cualquier newsletter/spam con imagenes: solo se
  // procesan mails cuyo asunto contenga esta palabra (no importa mayus/minus).
  // Si se deja vacio, se procesa CUALQUIER mail con foto/video adjunto (no
  // recomendado en una casilla personal).
  emailSubjectTag: process.env.EMAIL_SUBJECT_TAG ?? 'COCA',

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

  // --- TikTok (Content Posting API) ---
  // Se consiguen creando una app en developers.tiktok.com y pidiendo el
  // scope "video.publish". Mientras la app no esté auditada por TikTok,
  // lo que se publique con este token solo queda visible para la propia
  // cuenta (no público) - una vez que TikTok aprueba la app, el mismo
  // código empieza a publicar público sin cambiar nada.
  tiktokClientKey: process.env.TIKTOK_CLIENT_KEY || '',
  tiktokClientSecret: process.env.TIKTOK_CLIENT_SECRET || '',
  tiktokRedirectUri: process.env.TIKTOK_REDIRECT_URI || `${(process.env.PUBLIC_BASE_URL || '').replace(/\/$/, '')}/auth/tiktok/callback`,
};

export function isMetaConfigured() {
  return Boolean(config.metaUserToken && config.metaPageId && config.metaIgUserId);
}

export function isPerfumesAccountConfigured() {
  return Boolean(config.metaUserToken && config.metaPerfumesPageId && config.metaPerfumesIgUserId);
}

export function isPublicUrlConfigured() {
  return Boolean(config.publicBaseUrl);
}

export function isEmailConfigured() {
  return Boolean(config.emailUser && config.emailAppPassword);
}
