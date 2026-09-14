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

  metaAccessToken: process.env.META_ACCESS_TOKEN || '',
  metaPageId: process.env.META_PAGE_ID || '',
  metaIgUserId: process.env.META_IG_USER_ID || '',

  cocaHashtags: list(process.env.COCA_HASHTAGS || 'COCA,KBeauty,SkincareTips,GlowUp,BeautyTok,Belleza,Skincare'),
};

export function isMetaConfigured() {
  return Boolean(config.metaAccessToken && config.metaPageId && config.metaIgUserId);
}

export function isPublicUrlConfigured() {
  return Boolean(config.publicBaseUrl);
}
