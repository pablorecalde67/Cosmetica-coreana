import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import pino from 'pino';
import QRCode from 'qrcode';
import {
  default as makeWASocket,
  useMultiFileAuthState,
  downloadMediaMessage,
  DisconnectReason,
} from '@whiskeysockets/baileys';
import { config } from './config.js';
import { createItem, MEDIA_DIR } from './store.js';

// Agrupa las fotos/videos que llegan seguidas del mismo chat en una sola
// tarjeta: cada vez que llega una, se espera este tiempo sin que llegue otra
// antes de crear el item con todo lo acumulado.
const GROUP_WINDOW_MS = 3000;
const pendingGroups = new Map(); // chatJid -> { media: [], caption, timer }

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SESSION_DIR = path.join(__dirname, '..', 'data', 'whatsapp-session');
fs.mkdirSync(SESSION_DIR, { recursive: true });

const state$ = {
  latestQrDataUrl: null,
  connected: false,
  sock: null,
};

export function getWhatsappStatus() {
  return { connected: state$.connected, qr: state$.latestQrDataUrl };
}

function jidToNumber(jid) {
  return jid.replace(/@.*/, '');
}

function extractMedia(message) {
  if (!message) return null;
  if (message.imageMessage) return { type: 'image', node: message.imageMessage, caption: message.imageMessage.caption };
  if (message.videoMessage) return { type: 'video', node: message.videoMessage, caption: message.videoMessage.caption };
  return null;
}

async function notifyOwner(sock, text) {
  if (!config.whatsappOwnerNumber) return;
  const jid = `${config.whatsappOwnerNumber}@s.whatsapp.net`;
  try {
    await sock.sendMessage(jid, { text });
  } catch (err) {
    console.error('[whatsapp] no se pudo notificar al dueño:', err.message);
  }
}

export async function startWhatsapp() {
  const { state, saveCreds } = await useMultiFileAuthState(SESSION_DIR);

  const sock = makeWASocket({
    auth: state,
    logger: pino({ level: 'silent' }),
    printQRInTerminal: false,
  });
  state$.sock = sock;

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      state$.latestQrDataUrl = await QRCode.toDataURL(qr);
      console.log('[whatsapp] Escaneá el QR en /whatsapp-setup para conectar tu cuenta.');
    }

    if (connection === 'open') {
      state$.connected = true;
      state$.latestQrDataUrl = null;
      console.log('[whatsapp] Conectado.');
    }

    if (connection === 'close') {
      state$.connected = false;
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
      console.log('[whatsapp] Conexión cerrada.', shouldReconnect ? 'Reintentando...' : 'Sesión cerrada, hay que volver a escanear el QR.');
      if (shouldReconnect) {
        startWhatsapp().catch((err) => console.error('[whatsapp] error al reconectar:', err));
      }
    }
  });

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;

    for (const msg of messages) {
      if (!msg.message || msg.key.fromMe) continue;

      const chatJid = msg.key.remoteJid;
      if (chatJid === 'status@broadcast') continue;

      // Por defecto se procesa cualquier chat/canal. Si WHATSAPP_MONITORED_CHATS
      // tiene algo cargado, sólo se procesan esos (para restringir más adelante).
      const isMonitored =
        config.whatsappMonitoredChats.length === 0 ||
        config.whatsappMonitoredChats.includes(chatJid);
      if (!isMonitored) continue;

      console.log(`[whatsapp] Mensaje recibido de chat/canal: ${chatJid}`);

      const media = extractMedia(msg.message);
      if (!media) continue;

      try {
        const buffer = await downloadMediaMessage(msg, 'buffer', {});
        const ext = media.type === 'video' ? 'mp4' : 'jpg';
        const filename = `${Date.now()}-${jidToNumber(chatJid)}-${pendingGroups.get(chatJid)?.media.length || 0}.${ext}`;
        fs.writeFileSync(path.join(MEDIA_DIR, filename), buffer);

        let group = pendingGroups.get(chatJid);
        if (!group) {
          group = { media: [], caption: '', timer: null };
          pendingGroups.set(chatJid, group);
        }
        group.media.push({ file: filename, type: media.type });
        if (!group.caption && media.caption) group.caption = media.caption;

        clearTimeout(group.timer);
        group.timer = setTimeout(() => {
          pendingGroups.delete(chatJid);

          const item = createItem({
            source: 'whatsapp',
            media: group.media,
            caption: group.caption,
          });

          console.log(`[whatsapp] Nuevo contenido en cola: ${item.id} (${group.media.length} archivo/s)`);

          const panelUrl = config.publicBaseUrl || 'http://localhost:' + config.port;
          notifyOwner(
            sock,
            `🆕 Llegó contenido nuevo para COCA (${group.media.length} archivo${group.media.length > 1 ? 's' : ''}).\nFalta ponerle el precio antes de que se publique.\n\n👉 ${panelUrl}`,
          );
        }, GROUP_WINDOW_MS);
      } catch (err) {
        console.error('[whatsapp] error procesando media:', err.message);
      }
    }
  });

  return sock;
}
