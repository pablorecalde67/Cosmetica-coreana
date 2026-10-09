# ⚡ GO - Hacer Vivo en 2 Min

## 1️⃣ Consigue tu Stripe Key

De: https://dashboard.stripe.com/apikeys

Copia: `sk_live_...`

## 2️⃣ Ejecuta el Workflow

Abrí: https://github.com/pablorecalde67/Cosmetica-coreana/actions

Buscá: **"⚡ Configure Heroku NOW"**

Click: **"Run workflow"**

Pegá tu Stripe key en el campo:
```
STRIPE SECRET KEY (sk_live_...)
```

Click: **"Run workflow"** (el botón verde)

## 3️⃣ ¡Listo!

Esperá 2-3 minutos.

Verificá: https://kbeautycde.herokuapp.com

---

## Si Querés Agregar Más Cosas (Opcional)

Ejecutá el workflow de nuevo y agregá:
- `STRIPE_PUBLIC_KEY` (pk_live_...)
- `STRIPE_WEBHOOK_SECRET` (whsec_...)
- Email, PayPal, etc.

---

**¿Problemas?** Ver logs:
https://dashboard.heroku.com/apps/kbeautycde/logs
