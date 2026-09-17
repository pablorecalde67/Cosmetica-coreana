import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from './config.js';
import { MEDIA_DIR } from './store.js';
import apiRouter from './routes/api.js';
import whatsappSetupRouter from './routes/whatsappSetup.js';
import pielRouter from './routes/piel.js';
import { startWhatsapp } from './whatsapp.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
// La selfie llega en base64 dentro del JSON: subimos el límite normal de
// express.json() para que entre una foto de cámara sin problema. Igual
// nunca se guarda en disco (ver src/skinAnalysis.js).
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, '..', 'public')));
app.use('/media', express.static(MEDIA_DIR));

app.use('/api/piel', pielRouter);
app.use('/api', apiRouter);
app.use('/', whatsappSetupRouter);

app.listen(config.port, () => {
  console.log(`[COCA] Panel corriendo en http://localhost:${config.port}`);
  console.log(`[COCA] Andá a /whatsapp-setup para conectar WhatsApp con un QR.`);
});

startWhatsapp().catch((err) => {
  console.error('[COCA] No se pudo iniciar WhatsApp:', err);
});
