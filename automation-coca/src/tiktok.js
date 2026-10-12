import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from './config.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', 'data');
const TOKENS_FILE = path.join(DATA_DIR, 'tiktokAuth.json');

const AUTH_BASE = 'https://www.tiktok.com/v2/auth/authorize/';
const TOKEN_URL = 'https://open.tiktokapis.com/v2/oauth/token/';
const PUBLISH_INIT_URL = 'https://open.tiktokapis.com/v2/post/publish/video/init/';
const PUBLISH_STATUS_URL = 'https://open.tiktokapis.com/v2/post/publish/status/fetch/';

export function isTiktokAppConfigured() {
  return Boolean(config.tiktokClientKey && config.tiktokClientSecret);
}

function loadTokens() {
  if (!fs.existsSync(TOKENS_FILE)) return null;
  try {
    return JSON.parse(fs.readFileSync(TOKENS_FILE, 'utf8'));
  } catch {
    return null;
  }
}

function saveTokens(tokens) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(TOKENS_FILE, JSON.stringify(tokens, null, 2));
}

export function isTiktokConnected() {
  return Boolean(loadTokens()?.access_token);
}

export function getAuthUrl(state) {
  const params = new URLSearchParams({
    client_key: config.tiktokClientKey,
    scope: 'video.publish',
    response_type: 'code',
    redirect_uri: config.tiktokRedirectUri,
    state: state || 'coca',
  });
  return `${AUTH_BASE}?${params.toString()}`;
}

export async function exchangeCodeForToken(code) {
  const body = new URLSearchParams({
    client_key: config.tiktokClientKey,
    client_secret: config.tiktokClientSecret,
    code,
    grant_type: 'authorization_code',
    redirect_uri: config.tiktokRedirectUri,
  });
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  const data = await res.json();
  if (!res.ok || data.error) {
    throw new Error(`TikTok token exchange falló: ${JSON.stringify(data)}`);
  }
  saveTokens({ ...data, obtainedAt: Date.now() });
  return data;
}

async function refreshIfNeeded() {
  const tokens = loadTokens();
  if (!tokens) throw new Error('TikTok no está conectado todavía (falta hacer /auth/tiktok).');

  // El access_token de TikTok dura ~24hs; el refresh_token, ~365 días.
  const ageMs = Date.now() - (tokens.obtainedAt || 0);
  const expiresInMs = (tokens.expires_in || 0) * 1000;
  if (ageMs < expiresInMs - 5 * 60 * 1000) return tokens;

  const body = new URLSearchParams({
    client_key: config.tiktokClientKey,
    client_secret: config.tiktokClientSecret,
    grant_type: 'refresh_token',
    refresh_token: tokens.refresh_token,
  });
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  const data = await res.json();
  if (!res.ok || data.error) {
    throw new Error(`TikTok refresh de token falló: ${JSON.stringify(data)}`);
  }
  const updated = { ...tokens, ...data, obtainedAt: Date.now() };
  saveTokens(updated);
  return updated;
}

// Publica un video ya alojado en una URL pública (nuestro propio /media/...)
// usando PULL_FROM_URL, que evita tener que subir el archivo en chunks.
// Mientras la app de TikTok no esté auditada, el video solo queda visible
// para la propia cuenta (self-only) hasta que TikTok apruebe el scope
// video.publish en producción - a partir de ahí, mismo código ya publica
// público sin que haga falta tocar nada.
export async function publishVideo({ videoUrl, caption, privacyLevel = 'SELF_ONLY' }) {
  const tokens = await refreshIfNeeded();

  const res = await fetch(PUBLISH_INIT_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${tokens.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      post_info: {
        title: caption,
        privacy_level: privacyLevel,
        disable_duet: false,
        disable_comment: false,
        disable_stitch: false,
      },
      source_info: {
        source: 'PULL_FROM_URL',
        video_url: videoUrl,
      },
    }),
  });
  const data = await res.json();
  if (!res.ok || data.error?.code !== 'ok') {
    throw new Error(`TikTok publish init falló: ${JSON.stringify(data)}`);
  }
  return { publishId: data.data.publish_id };
}

export async function getPublishStatus(publishId) {
  const tokens = await refreshIfNeeded();
  const res = await fetch(PUBLISH_STATUS_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${tokens.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ publish_id: publishId }),
  });
  const data = await res.json();
  if (!res.ok || data.error?.code !== 'ok') {
    throw new Error(`TikTok publish status falló: ${JSON.stringify(data)}`);
  }
  return data.data;
}
