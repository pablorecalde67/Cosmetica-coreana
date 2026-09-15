import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import pino from 'pino';
import QRCode from 'qrcode';
import axios from 'axios';
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

// Los canales (a diferencia de chats/grupos normales) a veces envuelven la
// foto/video adentro de otro mensaje (efímero, "ver una vez", etc.). Esto
// desenvuelve esas capas hasta llegar al contenido real.
function unwrapMessage(message) {
  let current = message;
  for (let i = 0; i < 5 && current; i++) {
    const wrapped =
      current.ephemeralMessage?.message ||
      current.viewOnceMessage?.message ||
      current.viewOnceMessageV2?.message ||
      current.viewOnceMessageV2Extension?.message ||
      current.documentWithCaptionMessage?.message ||
      current.editedMessage?.message;
    if (!wrapped) break;
    current = wrapped;
  }
  return current;
}

function extractMedia(message) {
  const content = unwrapMessage(message);
  if (!content) return null;
  if (content.imageMessage) return { type: 'image', node: content.imageMessage, caption: content.imageMessage.caption };
  if (content.videoMessage) return { type: 'video', node: content.videoMessage, caption: content.videoMessage.caption };
  return null;
}

// Las fotos/videos de un CANAL no usan la misma clave de cifrado por mensaje
// que los chats normales (mediaKey viene vacia), asi que el descargador
// cifrado de Baileys falla con "Cannot derive from empty media key". En ese
// caso el archivo se puede bajar directo de su URL, sin descifrar.
function hasMediaKey(node) {
  return Boolean(node?.mediaKey && node.mediaKey.length > 0);
}

async function downloadChannelMedia(node) {
  const { data } = await axios.get(node.url, { responseType: 'arraybuffer' });
  return Buffer.from(data);
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
    console.log(`[whatsapp] Evento messages.upsert tipo="${type}" con ${messages.length} mensaje/s.`);

    for (const msg of messages) {
      const chatJid = msg.key.remoteJid;
      const isChannel = chatJid?.endsWith('@newsletter');

      // Log de diagnostico: que forma tiene cada mensaje que llega, sea de
      // canal, chat o grupo. Ayuda a ver por que un canal no sube contenido.
      console.log(
        `[whatsapp]   msg de ${chatJid} | fromMe=${msg.key.fromMe} | tipo upsert=${type} | claves del mensaje=${
          msg.message ? Object.keys(msg.message).join(',') : '(sin message)'
        }`,
      );

      if (!msg.message) continue;
      // Los canales publican con fromMe=false para todos los que lo siguen,
      // pero por las dudas no filtramos fromMe para chats de canal.
      if (msg.key.fromMe && !isChannel) continue;

      const isStatus = chatJid === 'status@broadcast';
      let groupKey = chatJid;

      if (isStatus) {
        // El Estado es de un negocio puntual, nunca "de todos los contactos":
        // solo se procesa si el numero de quien lo publico esta en la lista
        // WHATSAPP_STATUS_SOURCES que cargaste vos mismo.
        const authorJid = msg.key.participant || msg.key.participantPn || '';
        const authorNumber = jidToNumber(authorJid);
        const isAuthorizedBusiness =
          authorNumber && config.whatsappStatusSources.includes(authorNumber);
        console.log(`[whatsapp]   Estado publicado por ${authorJid || '(desconocido)'} | autorizado=${isAuthorizedBusiness}`);
        if (!isAuthorizedBusiness) continue;
        groupKey = authorJid;
      } else {
        // Por defecto se procesa cualquier chat/canal. Si WHATSAPP_MONITORED_CHATS
        // tiene algo cargado, sólo se procesan esos (para restringir más adelante).
        const isMonitored =
          config.whatsappMonitoredChats.length === 0 ||
          config.whatsappMonitoredChats.includes(chatJid);
        if (!isMonitored) continue;
      }

      const media = extractMedia(msg.message);
      if (!media) continue;

      console.log(`[whatsapp] Contenido detectado (${media.type}) en: ${isStatus ? 'Estado de ' + groupKey : chatJid}`);

      try {
        let buffer;
        if (hasMediaKey(media.node)) {
          const unwrapped = { ...msg, message: unwrapMessage(msg.message) };
          buffer = await downloadMediaMessage(unwrapped, 'buffer', {});
        } else {
          console.log('[whatsapp] Sin mediaKey (típico de canales), descargando directo de la URL.');
          buffer = await downloadChannelMedia(media.node);
        }
        const ext = media.type === 'video' ? 'mp4' : 'jpg';
        const filename = `${Date.now()}-${jidToNumber(groupKey)}-${pendingGroups.get(groupKey)?.media.length || 0}.${ext}`;
        fs.writeFileSync(path.join(MEDIA_DIR, filename), buffer);

        let group = pendingGroups.get(groupKey);
        if (!group) {
          group = { media: [], caption: '', timer: null };
          pendingGroups.set(groupKey, group);
        }
        group.media.push({ file: filename, type: media.type });
        if (!group.caption && media.caption) group.caption = media.caption;

        clearTimeout(group.timer);
        group.timer = setTimeout(() => {
          pendingGroups.delete(groupKey);

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
