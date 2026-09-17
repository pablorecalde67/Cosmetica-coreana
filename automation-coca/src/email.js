import path from 'node:path';
import fs from 'node:fs';
import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';
import { config, isEmailConfigured } from './config.js';
import { createItem, MEDIA_DIR } from './store.js';

const EXT_BY_CONTENT_TYPE = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/heic': 'heic',
  'video/mp4': 'mp4',
  'video/quicktime': 'mov',
};

function mediaFromAttachment(att) {
  const isImage = att.contentType?.startsWith('image/');
  const isVideo = att.contentType?.startsWith('video/');
  if (!isImage && !isVideo) return null;

  const extFromName = path.extname(att.filename || '').replace('.', '').toLowerCase();
  const ext = extFromName || EXT_BY_CONTENT_TYPE[att.contentType] || (isVideo ? 'mp4' : 'jpg');

  return { ext, type: isVideo ? 'video' : 'image' };
}

// El asunto tiene que contener el tag configurado (por defecto "COCA") para
// que un mail se procese. Sin este filtro, cualquier newsletter o mail con
// una imagen adjunta en una casilla personal terminaria en la cola.
function matchesSubjectTag(subject) {
  if (!config.emailSubjectTag) return true;
  return (subject || '').toLowerCase().includes(config.emailSubjectTag.toLowerCase());
}

async function processMessage(client, uid) {
  const { content } = await client.download(uid, undefined, { uid: true });
  const parsed = await simpleParser(content);

  if (!matchesSubjectTag(parsed.subject)) {
    console.log(`[email] Ignorado (el asunto no tiene "${config.emailSubjectTag}"): "${parsed.subject || '(sin asunto)'}"`);
    return;
  }

  const media = [];
  for (const att of parsed.attachments) {
    const info = mediaFromAttachment(att);
    if (!info) continue;
    const filename = `${Date.now()}-mail-${Math.random().toString(36).slice(2, 8)}.${info.ext}`;
    fs.writeFileSync(path.join(MEDIA_DIR, filename), att.content);
    media.push({ file: filename, type: info.type });
  }

  if (media.length === 0) {
    console.log(`[email] Mail "${parsed.subject || '(sin asunto)'}" no tenia fotos/videos adjuntos, se ignora.`);
    return;
  }

  const caption = (parsed.text || parsed.subject || '').trim();
  const item = createItem({ source: 'email', media, caption });
  console.log(`[email] Nuevo contenido en cola: ${item.id} (${media.length} archivo/s) desde ${parsed.from?.text || 'remitente desconocido'}`);
}

export async function startEmailIngest() {
  if (!isEmailConfigured()) {
    console.log('[email] Ingesta por mail deshabilitada (falta EMAIL_USER / EMAIL_APP_PASSWORD).');
    return;
  }

  const client = new ImapFlow({
    host: config.emailImapHost,
    port: config.emailImapPort,
    secure: true,
    auth: { user: config.emailUser, pass: config.emailAppPassword },
    logger: false,
    socketTimeout: 60_000,
  });

  let checking = false;
  async function checkNewMessages() {
    if (checking) return;
    checking = true;
    try {
      const lock = await client.getMailboxLock('INBOX');
      try {
        const uids = await client.search({ seen: false }, { uid: true });
        for (const uid of uids) {
          try {
            await processMessage(client, uid);
          } catch (err) {
            console.error('[email] error procesando un mail:', err.message);
          }
          await client.messageFlagsAdd(uid, ['\\Seen'], { uid: true });
        }
      } finally {
        lock.release();
      }
    } catch (err) {
      console.error('[email] error revisando la bandeja:', err.message);
    } finally {
      checking = false;
    }
  }

  client.on('exists', () => {
    checkNewMessages();
  });

  client.on('error', (err) => {
    console.error('[email] error de conexion IMAP:', err.message);
  });

  client.on('close', () => {
    console.log('[email] conexion cerrada, reconectando en 15s...');
    setTimeout(connectAndWatch, 15000);
  });

  async function connectAndWatch() {
    try {
      await client.connect();
      console.log(`[email] Conectado a ${config.emailUser}. Esperando mails con "${config.emailSubjectTag}" en el asunto.`);
      await checkNewMessages();
    } catch (err) {
      console.error('[email] no se pudo conectar, reintentando en 30s:', err.message);
      setTimeout(connectAndWatch, 30000);
    }
  }

  await connectAndWatch();
}
