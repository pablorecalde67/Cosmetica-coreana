import { Router } from 'express';
import { verifyWebhook, handleWebhookEvent } from '../instagram.js';

const router = Router();

// Meta llama a esto una vez, al suscribir el webhook, para confirmar que el
// dueño de esta URL es quien dice ser (manda el token que configuramos).
router.get('/webhooks/instagram', verifyWebhook);

// Meta espera una respuesta 200 rápida (menos de 5s) o reintenta el envío;
// por eso se responde primero y se procesa el contenido después, sin hacer
// esperar la respuesta HTTP.
router.post('/webhooks/instagram', (req, res) => {
  res.sendStatus(200);
  handleWebhookEvent(req.body).catch((err) => {
    console.error('[instagram] error procesando webhook:', err.message);
  });
});

export default router;
