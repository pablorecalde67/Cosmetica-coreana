import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from './config.js';
import { MEDIA_DIR } from './store.js';
import apiRouter from './routes/api.js';
import whatsappSetupRouter from './routes/whatsappSetup.js';
import { startWhatsapp } from './whatsapp.js';
import { startEmailIngest } from './email.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));
app.use('/media', express.static(MEDIA_DIR));

app.use('/api', apiRouter);
app.use('/', whatsappSetupRouter);

app.listen(config.port, () => {
  console.log(`[COCA] Panel corriendo en http://localhost:${config.port}`);
  console.log(`[COCA] Andá a /whatsapp-setup para conectar WhatsApp con un QR.`);
});

startWhatsapp().catch((err) => {
  console.error('[COCA] No se pudo iniciar WhatsApp:', err);
});

startEmailIngest().catch((err) => {
  console.error('[COCA] No se pudo iniciar la ingesta por mail:', err);
});
