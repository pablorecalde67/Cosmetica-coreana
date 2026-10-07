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

  // --- Instagram Scraper ---
  // Credenciales de Instagram para scraping automático de albums privados
  instagramUsername: process.env.INSTAGRAM_USERNAME || '',
  instagramPassword: process.env.INSTAGRAM_PASSWORD || '',
  instagramAlbumUrl: process.env.INSTAGRAM_ALBUM_URL || '',
  // Intervalo de scraping automático en minutos (0 = deshabilitado)
  instagramSyncInterval: Number(process.env.INSTAGRAM_SYNC_INTERVAL || 0),

  // --- Stripe & PayPal ---
  stripePublicKey: process.env.STRIPE_PUBLIC_KEY || 'pk_test_123456789',
  stripeSecretKey: process.env.STRIPE_SECRET_KEY || '',
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
  paypalClientId: process.env.PAYPAL_CLIENT_ID || 'TEST-sandbox-id',
  paypalClientSecret: process.env.PAYPAL_CLIENT_SECRET || '',
  paypalWebhookId: process.env.PAYPAL_WEBHOOK_ID || '',

  // --- Envíos ---
  andreaniApiKey: process.env.ANDREANI_API_KEY || '',
  shippoApiKey: process.env.SHIPPO_API_KEY || '',
};

export function isMetaConfigured() {
  return Boolean(config.metaUserToken && config.metaPageId && config.metaIgUserId);
}

export function isPublicUrlConfigured() {
  return Boolean(config.publicBaseUrl);
}

export function isEmailConfigured() {
  return Boolean(config.emailUser && config.emailAppPassword);
}

export function isInstagramConfigured() {
  return Boolean(config.instagramUsername && config.instagramPassword && config.instagramAlbumUrl);
}

export function isStripeConfigured() {
  return Boolean(config.stripeSecretKey && config.stripeWebhookSecret);
}

export function isPayPalConfigured() {
  return Boolean(config.paypalClientSecret && config.paypalWebhookId);
}
