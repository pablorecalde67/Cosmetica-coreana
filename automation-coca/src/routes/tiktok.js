import express from 'express';
import { isTiktokAppConfigured, isTiktokConnected, getAuthUrl, exchangeCodeForToken, publishVideo, getPublishStatus } from '../tiktok.js';

const router = express.Router();

router.get('/api/tiktok/estado', (req, res) => {
  res.json({ appConfigured: isTiktokAppConfigured(), connected: isTiktokConnected() });
});

router.get('/auth/tiktok', (req, res) => {
  if (!isTiktokAppConfigured()) {
    return res.status(400).send('Falta configurar TIKTOK_CLIENT_KEY / TIKTOK_CLIENT_SECRET en Railway.');
  }
  res.redirect(getAuthUrl());
});

router.get('/auth/tiktok/callback', async (req, res) => {
  const { code, error, error_description: errorDescription } = req.query;
  if (error) {
    return res.status(400).send(`TikTok rechazó la conexión: ${errorDescription || error}`);
  }
  try {
    await exchangeCodeForToken(code);
    res.send('<h1>TikTok conectado ✅</h1><p>Ya podés cerrar esta ventana. Las próximas publicaciones de COCA van a subirse solas.</p>');
  } catch (err) {
    res.status(500).send(`Error conectando TikTok: ${err.message}`);
  }
});

// Usado por la rutina automática que arma los Reels: publica directo si ya
// hay token, para que el video no dependa de que el dueño lo suba a mano.
router.post('/api/tiktok/publicar', async (req, res) => {
  const { videoUrl, caption } = req.body || {};
  if (!videoUrl) return res.status(400).json({ error: 'Falta videoUrl' });
  try {
    const result = await publishVideo({ videoUrl, caption: caption || '' });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/api/tiktok/publicar/:publishId', async (req, res) => {
  try {
    const status = await getPublishStatus(req.params.publishId);
    res.json(status);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
