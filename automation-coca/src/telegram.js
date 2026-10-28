import axios from 'axios';
import { config } from './config.js';
import { getSetting } from './settings.js';

const API_BASE = 'https://api.telegram.org/bot';

// Igual que con el Canal de WhatsApp: reenvía automáticamente cada
// publicación (cartel, Historia, Reel) al Canal de Telegram de COCA, si ya
// está configurado. Usamos la URL pública del archivo en vez de subir bytes
// (Telegram la descarga solo), que es mucho más simple que el caso de
// WhatsApp/Baileys, que sí necesita el buffer.
function mediaUrl(file) {
  if (/^https?:\/\//i.test(file)) return file;
  return `${config.publicBaseUrl}/media/${file}`;
}

export async function sendToTelegramChannel(media, caption) {
  const botToken = getSetting('telegramBotToken');
  const channelId = getSetting('telegramChannelId');
  if (!botToken || !channelId) return;

  const method = media.type === 'video' ? 'sendVideo' : 'sendPhoto';
  const field = media.type === 'video' ? 'video' : 'photo';

  try {
    await axios.post(`${API_BASE}${botToken}/${method}`, {
      chat_id: channelId,
      [field]: mediaUrl(media.file),
      caption: caption || '',
    });
  } catch (err) {
    console.error('[telegram] no se pudo publicar en el canal:', err.response?.data?.description || err.message);
  }
}
