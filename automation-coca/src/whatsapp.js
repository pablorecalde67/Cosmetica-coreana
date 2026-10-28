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
import { createItem, updateItem, MEDIA_DIR } from './store.js';
import { enhanceImageFile } from './imageEnhance.js';
import { autoPriceAndPublish, hasRealText } from './autoPublish.js';
import { findCatalogMatch } from './catalogMatch.js';
import { getSetting } from './settings.js';
import { addLead } from './leads.js';

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

// Backoff para reintentos de conexión: si reconectamos sin pausa cada vez
// que se corta, WhatsApp interpreta eso como comportamiento de bot y puede
// bloquear temporalmente la vinculación del número ("no se puede vincular
// por el momento"). Esto espera cada vez más entre intento e intento, y se
// resetea apenas la conexión queda abierta de nuevo.
let reconnectAttempts = 0;
const MAX_RECONNECT_DELAY_MS = 5 * 60 * 1000;

function nextReconnectDelay() {
  reconnectAttempts++;
  const delay = Math.min(2000 * 2 ** (reconnectAttempts - 1), MAX_RECONNECT_DELAY_MS);
  return delay;
}

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

// Mensajes de solo texto (sin foto/video), ej. cuando el proveedor escribe
// el nombre/precio en un mensaje y manda la foto en otro aparte.
function extractText(message) {
  const content = unwrapMessage(message);
  if (!content) return null;
  return content.conversation || content.extendedTextMessage?.text || null;
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

// Permite avisarle al dueño por WhatsApp desde otros canales de ingesta
// (ej. mail), reusando la misma conexión de WhatsApp ya abierta.
export async function notifyOwnerIfConnected(text) {
  if (!state$.connected || !state$.sock) return;
  await notifyOwner(state$.sock, text);
}

// A partir de un link de invitación (https://whatsapp.com/channel/XXXX) o
// solo el código XXXX, consigue los datos del Canal (incluido su JID real,
// que termina en @newsletter) - así el dueño solo tiene que pasar el link
// una vez, sin ir a buscar el JID a mano.
export async function resolveChannelInvite(inviteCodeOrLink) {
  if (!state$.sock) throw new Error('WhatsApp no está conectado.');
  const code = inviteCodeOrLink.includes('/')
    ? inviteCodeOrLink.split('/').filter(Boolean).pop()
    : inviteCodeOrLink;
  return state$.sock.newsletterMetadata('invite', code);
}

async function loadMediaBuffer(media) {
  // `media.file` puede ser un nombre local (MEDIA_DIR) o, cuando viene de
  // un match del catálogo propio (ver catalogMatch.js), una URL completa.
  const isUrl = /^https?:\/\//i.test(media.file);
  return isUrl
    ? Buffer.from((await axios.get(media.file, { responseType: 'arraybuffer' })).data)
    : fs.readFileSync(path.join(MEDIA_DIR, media.file));
}

// Manda una foto/video (ya guardado en MEDIA_DIR) al Canal de WhatsApp de
// COCA, para que lo publicado en Instagram se reenvíe también ahí. No hace
// nada si todavía no hay un canal configurado o WhatsApp no está conectado -
// nunca debe hacer fallar la publicación en Instagram por esto.
export async function sendToChannel(channelJid, media, caption) {
  if (!channelJid || !state$.sock || !state$.connected) return;
  try {
    const buffer = await loadMediaBuffer(media);
    const content = media.type === 'video' ? { video: buffer, caption } : { image: buffer, caption };
    await state$.sock.sendMessage(channelJid, content);
  } catch (err) {
    console.error('[whatsapp] no se pudo publicar en el canal:', err.message);
  }
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Manda contenido propio, UNO POR UNO con una pausa entre cada envío (para
// no parecer un mensaje masivo automático, que es lo que hace que WhatsApp
// banee un número), solo a gente que ya inició contacto con COCA por su
// cuenta (ver leads.js) - nunca a contactos que no pidieron nada.
export async function sendToLeads(jids, media, caption, { delayMs = 4000 } = {}) {
  if (!state$.sock || !state$.connected) return { sent: 0, failed: jids.length, skipped: 'no_conectado' };
  const buffer = await loadMediaBuffer(media);
  const content = media.type === 'video' ? { video: buffer, caption } : { image: buffer, caption };
  let sent = 0;
  let failed = 0;
  for (const jid of jids) {
    try {
      await state$.sock.sendMessage(jid, content);
      sent += 1;
    } catch (err) {
      failed += 1;
      console.error(`[whatsapp] no se pudo mandar a ${jid}:`, err.message);
    }
    await sleep(delayMs);
  }
  return { sent, failed };
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
      reconnectAttempts = 0;
      console.log('[whatsapp] Conectado.');
    }

    if (connection === 'close') {
      state$.connected = false;
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
      if (shouldReconnect) {
        const delay = nextReconnectDelay();
        console.log(`[whatsapp] Conexión cerrada. Reintentando en ${Math.round(delay / 1000)}s (intento ${reconnectAttempts})...`);
        setTimeout(() => {
          startWhatsapp().catch((err) => console.error('[whatsapp] error al reconectar:', err));
        }, delay);
      } else {
        console.log('[whatsapp] Sesión cerrada, hay que volver a escanear el QR.');
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
        // Los CANALES (@newsletter) son justo lo que el dueño sigue a
        // propósito para esto, así que siempre se procesan. Cualquier otro
        // chat (personal, grupo) es contenido que no pidió explícitamente:
        // solo se procesa si está en WHATSAPP_MONITORED_CHATS. Antes se
        // procesaba cualquier chat por defecto y eso hizo que se colaran
        // fotos personales (comprobantes de transferencia con CBU/CUIL,
        // capturas de charlas ajenas al negocio) en la cola de publicación.
        const isMonitored = isChannel || config.whatsappMonitoredChats.includes(chatJid);
        // Un chat privado (1 a 1, no grupo) que nos escribe y NO es un
        // proveedor monitoreado es, por descarte, un cliente real que
        // inició contacto por su cuenta - lo guardamos como lead propio
        // (nombre + jid) antes de seguir con el filtro de arriba, que lo
        // descarta para la cola de publicación (eso sigue igual).
        if (!isMonitored && !isChannel && chatJid?.endsWith('@s.whatsapp.net')) {
          addLead(chatJid, { name: msg.pushName, source: 'whatsapp_inbound' });
        }
        if (!isMonitored) continue;
      }

      const media = extractMedia(msg.message);

      if (!media) {
        // Sin foto/video: puede ser que el proveedor escriba el nombre/precio
        // en un mensaje aparte y mande la foto después (en ese caso, esto
        // solo abre/extiende la ventana de agrupación para que la foto que
        // venga a continuación la capture). Si la foto nunca llega, al
        // vencer la ventana se intenta resolver con una foto del catálogo
        // propio en vez de perder el texto (ver processGroup).
        const text = extractText(msg.message);
        if (!text || !text.trim()) continue;

        console.log(`[whatsapp] Texto (sin foto todavía) detectado en: ${isStatus ? 'Estado de ' + groupKey : chatJid}`);

        let group = pendingGroups.get(groupKey);
        if (!group) {
          group = { media: [], caption: '', timer: null };
          pendingGroups.set(groupKey, group);
        }
        group.caption = group.caption ? `${group.caption}\n${text}` : text;

        clearTimeout(group.timer);
        group.timer = setTimeout(() => processGroup(groupKey, group), GROUP_WINDOW_MS);
        continue;
      }

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
        const filePath = path.join(MEDIA_DIR, filename);
        fs.writeFileSync(filePath, buffer);
        if (media.type === 'image') await enhanceImageFile(filePath);

        let group = pendingGroups.get(groupKey);
        if (!group) {
          group = { media: [], caption: '', timer: null };
          pendingGroups.set(groupKey, group);
        }
        group.media.push({ file: filename, type: media.type });
        if (!group.caption && media.caption) group.caption = media.caption;

        clearTimeout(group.timer);
        group.timer = setTimeout(() => processGroup(groupKey, group), GROUP_WINDOW_MS);
      } catch (err) {
        console.error('[whatsapp] error procesando media:', err.message);
      }
    }

    // Cierra un grupo acumulado (foto/s + texto, o solo texto) y lo publica.
    // Si no llegó ninguna foto, busca una que corresponda en el catálogo
    // propio (K-Beauty/Perfumes) en vez de dejar el texto sin publicar.
    async function processGroup(groupKey, group) {
      pendingGroups.delete(groupKey);
      const notify = (text) => notifyOwner(sock, text);

      if (group.media.length === 0) {
        const text = group.caption;
        const match = findCatalogMatch(text);

        if (!match) {
          const item = createItem({ source: 'whatsapp', media: [], caption: text });
          updateItem(item.id, {
            status: 'error',
            error: 'Llegó texto sin foto y no encontré ningún producto parecido en el catálogo propio.',
          });
          await notify(
            `⚠️ Llegó este texto por WhatsApp sin foto y no encontré un producto parecido en el catálogo para publicarlo solo:\n\n"${text}"\n\nMandá la foto del producto para poder publicarlo.`,
          );
          return;
        }

        console.log(`[whatsapp] Texto sin foto: encontré "${match.name}" en el catálogo (${match.type}), publico con esa foto.`);
        const caption = hasRealText(text) ? text : `${text ? text + '\n\n' : ''}${match.description || match.name}`.trim();
        const item = createItem({
          source: 'whatsapp',
          media: [{ file: match.image, type: 'image' }],
          caption,
        });

        const published = await autoPriceAndPublish(item, { notifyOwner: notify });
        const channelJid = getSetting('whatsappChannelJid');
        if (channelJid && published.status === 'published') {
          sendToChannel(channelJid, published.media[0], published.description || '');
        }
        return;
      }

      const item = createItem({ source: 'whatsapp', media: group.media, caption: group.caption });
      console.log(`[whatsapp] Nuevo contenido: ${item.id} (${group.media.length} archivo/s), procesando precio y publicación automática...`);

      const published = await autoPriceAndPublish(item, { notifyOwner: notify });

      // Reenvío al Canal de WhatsApp de COCA (si ya está configurado): todo
      // lo que se publica automáticamente en Instagram se cruza también
      // ahí, para crecer la audiencia propia del negocio.
      const channelJid = getSetting('whatsappChannelJid');
      if (channelJid && published.status === 'published') {
        sendToChannel(channelJid, published.media[0], published.description || '');
      }
    }
  });

  return sock;
}
