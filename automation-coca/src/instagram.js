import fs from 'node:fs';
import path from 'node:path';
import axios from 'axios';
import { config } from './config.js';
import { createItem, MEDIA_DIR } from './store.js';
import { enhanceImageFile } from './imageEnhance.js';
import { autoPriceAndPublish } from './autoPublish.js';
import { notifyOwnerIfConnected, sendToChannel } from './whatsapp.js';
import { getSetting } from './settings.js';

// Agrupa fotos que llegan en el mismo DM (o en mensajes seguidos del mismo
// remitente) en un solo item, igual que whatsapp.js.
const GROUP_WINDOW_MS = 3000;
const pendingGroups = new Map(); // senderId -> { media, caption, timer }

export function verifyWebhook(req, res) {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  if (
    mode === 'subscribe' &&
    token &&
    config.instagramWebhookVerifyToken &&
    token === config.instagramWebhookVerifyToken
  ) {
    return res.status(200).send(challenge);
  }
  return res.sendStatus(403);
}

async function downloadAttachment(url) {
  const { data } = await axios.get(url, { responseType: 'arraybuffer' });
  return Buffer.from(data);
}

export async function handleWebhookEvent(body) {
  if (body?.object !== 'instagram') return;

  for (const entry of body.entry || []) {
    for (const event of entry.messaging || []) {
      const senderId = event.sender?.id;
      const message = event.message;
      // "is_echo" son los mensajes que la propia cuenta de COCA mandó (al
      // contestarle a alguien), no contenido que llegó - hay que ignorarlos
      // o se procesarían en bucle las fotos que nosotros mismos enviamos.
      if (!senderId || !message || message.is_echo) continue;

      const attachments = (message.attachments || []).filter(
        (a) => a.type === 'image' || a.type === 'video',
      );
      if (attachments.length === 0) continue;

      let group = pendingGroups.get(senderId);
      if (!group) {
        group = { media: [], caption: '', timer: null };
        pendingGroups.set(senderId, group);
      }
      if (!group.caption && message.text) group.caption = message.text;

      for (const att of attachments) {
        try {
          const buffer = await downloadAttachment(att.payload.url);
          const type = att.type === 'video' ? 'video' : 'image';
          const ext = type === 'video' ? 'mp4' : 'jpg';
          const filename = `${Date.now()}-ig-${senderId}-${group.media.length}.${ext}`;
          const filePath = path.join(MEDIA_DIR, filename);
          fs.writeFileSync(filePath, buffer);
          if (type === 'image') await enhanceImageFile(filePath);
          group.media.push({ file: filename, type });
        } catch (err) {
          console.error('[instagram] error descargando adjunto de DM:', err.message);
        }
      }

      clearTimeout(group.timer);
      group.timer = setTimeout(async () => {
        pendingGroups.delete(senderId);
        if (group.media.length === 0) return;

        const item = createItem({ source: 'instagram', media: group.media, caption: group.caption });
        console.log(`[instagram] Nuevo contenido vía DM: ${item.id} (${group.media.length} archivo/s), procesando...`);

        const published = await autoPriceAndPublish(item, { notifyOwner: notifyOwnerIfConnected });

        const channelJid = getSetting('whatsappChannelJid');
        if (channelJid && published.status === 'published') {
          sendToChannel(channelJid, published.media[0], published.description || '');
        }
      }, GROUP_WINDOW_MS);
    }
  }
}
