import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from './config.js';
import { MEDIA_DIR } from './store.js';
import apiRouter from './routes/api.js';
import whatsappSetupRouter from './routes/whatsappSetup.js';
import pielRouter from './routes/piel.js';
import perfumesShopRouter from './routes/perfumesShop.js';
import tiktokRouter from './routes/tiktok.js';
import { startWhatsapp } from './whatsapp.js';
import { startEmailIngest } from './email.js';
import { startPerfumesScheduler } from './perfumesScheduler.js';
import { registerVisit } from './visits.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
// La selfie llega en base64 dentro del JSON: subimos el límite normal de
// express.json() para que entre una foto de cámara sin problema. Igual
// nunca se guarda en disco (ver src/skinAnalysis.js).
app.use(express.json({ limit: '10mb' }));

// Cuenta visitas a las páginas públicas (/piel, /perfumes) para poder verlas
// en el panel de estadísticas. Solo cuenta la carga de la página en sí (con
// barra al final, que es la que sirve express.static después del redirect),
// nunca sus archivos (app.js, imágenes) ni nada con datos personales.
app.use((req, res, next) => {
  if (req.method === 'GET') {
    if (req.path === '/piel/') registerVisit('piel');
    else if (req.path === '/perfumes/') registerVisit('perfumes');
  }
  next();
});

app.use(express.static(path.join(__dirname, '..', 'public')));
app.use('/media', express.static(MEDIA_DIR));

// La cola manual de WhatsApp/mail se eliminó: ahora se publica solo, sin
// intervención humana. El panel admin que queda arranca en el catálogo.
app.get('/', (req, res) => res.redirect('/productos.html'));

app.use('/api/piel', pielRouter);
app.use('/api/perfumes', perfumesShopRouter);
app.use('/api', apiRouter);
app.use('/', whatsappSetupRouter);
app.use('/', tiktokRouter);

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

startPerfumesScheduler();
