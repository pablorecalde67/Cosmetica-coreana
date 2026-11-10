import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from './config.js';
import { MEDIA_DIR } from './store.js';
import apiRouter from './routes/api.js';
import whatsappSetupRouter from './routes/whatsappSetup.js';
import pielRouter from './routes/piel.js';
import perfumesShopRouter from './routes/perfumesShop.js';
import vapersShopRouter from './routes/vapersShop.js';
import tiktokRouter from './routes/tiktok.js';
import instagramWebhookRouter from './routes/instagramWebhook.js';
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
    if (req.path === '/piel/') registerVisit('piel', req.query.utm_source);
    else if (req.path === '/perfumes/') registerVisit('perfumes', req.query.utm_source);
    else if (req.path === '/vapers/') registerVisit('vapers', req.query.utm_source);
  }
  next();
});

// Protege el panel admin (precios, pedidos con nombre/telefono/direccion,
// portada editable) con usuario/clave si se cargó ADMIN_PASSWORD. Si no se
// cargó, queda igual que antes (sin login) para no romper nada de un día
// para el otro - pero es fuertemente recomendable cargarla, porque hoy
// cualquiera con la URL puede ver o editar todo esto sin loguearse.
const ADMIN_PATHS = ['/', '/productos.html', '/pedidos.html', '/fronting.html', '/whatsapp-setup'];
function requireAdminAuth(req, res, next) {
  if (!config.adminPassword) return next();
  const isAdminPath = ADMIN_PATHS.some((p) => req.path === p || req.path.startsWith(`${p}/`));
  if (!isAdminPath) return next();

  const header = req.headers.authorization || '';
  const [scheme, encoded] = header.split(' ');
  if (scheme === 'Basic' && encoded) {
    const [user, pass] = Buffer.from(encoded, 'base64').toString('utf8').split(':');
    if (user === config.adminUser && pass === config.adminPassword) return next();
  }
  res.set('WWW-Authenticate', 'Basic realm="COCA admin"');
  return res.status(401).send('Autenticación requerida.');
}
app.use(requireAdminAuth);

app.use(express.static(path.join(__dirname, '..', 'public')));
app.use('/media', express.static(MEDIA_DIR));

// La cola manual de WhatsApp/mail se eliminó: ahora se publica solo, sin
// intervención humana. El panel admin que queda arranca en el catálogo.
app.get('/', (req, res) => res.redirect('/productos.html'));

app.use('/api/piel', pielRouter);
app.use('/api/perfumes', perfumesShopRouter);
app.use('/api/vapers', vapersShopRouter);
app.use('/api', apiRouter);
app.use('/', whatsappSetupRouter);
app.use('/', tiktokRouter);
app.use('/', instagramWebhookRouter);

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
