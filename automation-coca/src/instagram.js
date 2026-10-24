import fs from 'node:fs';
import path from 'node:path';
import axios from 'axios';
import { config } from './config.js';
import { createItem, updateItem, MEDIA_DIR } from './store.js';
import { enhanceImageFile } from './imageEnhance.js';
import { autoPriceAndPublish, hasRealText } from './autoPublish.js';
import { notifyOwnerIfConnected, sendToChannel } from './whatsapp.js';
import { getSetting } from './settings.js';
import { findCatalogMatch } from './catalogMatch.js';

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

      let group = pendingGroups.get(senderId);
      if (!group) {
        group = { media: [], caption: '', timer: null };
        pendingGroups.set(senderId, group);
      }

      if (attachments.length === 0) {
        // DM de solo texto (sin foto todavía): puede ser que la foto venga en
        // un mensaje aparte a continuación - esto abre/extiende la ventana de
        // agrupación en vez de perder el texto. Si la foto nunca llega, al
        // vencer la ventana se busca una en el catálogo propio (ver
        // processGroup).
        if (!message.text || !message.text.trim()) continue;
        group.caption = group.caption ? `${group.caption}\n${message.text}` : message.text;
        clearTimeout(group.timer);
        group.timer = setTimeout(() => processGroup(senderId, group), GROUP_WINDOW_MS);
        continue;
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
      group.timer = setTimeout(() => processGroup(senderId, group), GROUP_WINDOW_MS);
    }
  }
}

// Cierra un grupo acumulado (foto/s + texto, o solo texto) y lo publica. Si
// no llegó ninguna foto, busca una que corresponda en el catálogo propio
// (K-Beauty/Perfumes) en vez de dejar el texto sin publicar.
async function processGroup(senderId, group) {
  pendingGroups.delete(senderId);

  if (group.media.length === 0) {
    const text = group.caption;
    if (!text) return;
    const match = findCatalogMatch(text);

    if (!match) {
      const item = createItem({ source: 'instagram', media: [], caption: text });
      updateItem(item.id, {
        status: 'error',
        error: 'Llegó texto por DM sin foto y no encontré ningún producto parecido en el catálogo propio.',
      });
      await notifyOwnerIfConnected(
        `⚠️ Llegó este texto por DM de Instagram sin foto y no encontré un producto parecido en el catálogo para publicarlo solo:\n\n"${text}"\n\nMandá la foto del producto para poder publicarlo.`,
      );
      return;
    }

    console.log(`[instagram] Texto sin foto: encontré "${match.name}" en el catálogo (${match.type}), publico con esa foto.`);
    const caption = hasRealText(text) ? text : `${text ? text + '\n\n' : ''}${match.description || match.name}`.trim();
    const item = createItem({
      source: 'instagram',
      media: [{ file: match.image, type: 'image' }],
      caption,
    });

    const published = await autoPriceAndPublish(item, { notifyOwner: notifyOwnerIfConnected });
    const channelJid = getSetting('whatsappChannelJid');
    if (channelJid && published.status === 'published') {
      sendToChannel(channelJid, published.media[0], published.description || '');
    }
    return;
  }

  const item = createItem({ source: 'instagram', media: group.media, caption: group.caption });
  console.log(`[instagram] Nuevo contenido vía DM: ${item.id} (${group.media.length} archivo/s), procesando...`);

  const published = await autoPriceAndPublish(item, { notifyOwner: notifyOwnerIfConnected });

  const channelJid = getSetting('whatsappChannelJid');
  if (channelJid && published.status === 'published') {
    sendToChannel(channelJid, published.media[0], published.description || '');
  }
}
