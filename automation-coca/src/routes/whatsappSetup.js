import { Router } from 'express';
import { getWhatsappStatus } from '../whatsapp.js';

const router = Router();

router.get('/whatsapp-status', (req, res) => {
  res.json(getWhatsappStatus());
});

router.get('/whatsapp-setup', (req, res) => {
  const { connected, qr } = getWhatsappStatus();

  res.send(`<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<title>COCA - Conectar WhatsApp</title>
<meta http-equiv="refresh" content="5">
<style>
  body { font-family: system-ui, sans-serif; background:#111; color:#eee; display:flex; flex-direction:column; align-items:center; justify-content:center; height:100vh; margin:0; }
  img { background:#fff; padding:16px; border-radius:12px; }
  .ok { color:#4ade80; font-size:1.3rem; }
</style>
</head>
<body>
  <h1>COCA · WhatsApp</h1>
  ${
    connected
      ? '<p class="ok">✅ Conectado. Ya se pueden recibir fotos y videos automáticamente.</p>'
      : qr
        ? `<p>Escaneá este código con WhatsApp (Dispositivos vinculados) desde el número que sigue tus canales:</p><img src="${qr}" width="300" height="300" />`
        : '<p>Generando código QR, esperá unos segundos...</p>'
  }
  <p style="opacity:.6">Esta página se actualiza sola cada 5 segundos.</p>
</body>
</html>`);
});

export default router;
