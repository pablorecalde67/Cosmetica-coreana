# ⚡ Setup Rápido - Todo Automatizado (iPad-Compatible)

**Estado**: ✅ Listo para ejecutar  
**Tiempo estimado**: 5 minutos  
**Requisitos**: Solo tu iPad + las keys de pago

---

## 🚀 Paso 1: Recolectar tus Keys (2 min)

Reúne estos valores de tus proveedores:

### Stripe (dashboard.stripe.com)
```
✓ STRIPE_PUBLIC_KEY (pk_live_...)
✓ STRIPE_SECRET_KEY (sk_live_...)
✓ STRIPE_WEBHOOK_SECRET (whsec_...)
```

### PayPal (developer.paypal.com) - OPCIONAL
```
○ PAYPAL_CLIENT_ID
○ PAYPAL_CLIENT_SECRET
○ PAYPAL_WEBHOOK_ID
```

### Google (myaccount.google.com) - OPCIONAL
```
○ EMAIL_USER (tu@gmail.com)
○ EMAIL_APP_PASSWORD (16 chars - generar aquí: https://myaccount.google.com/apppasswords)
```

### Meta (business.facebook.com) - OPCIONAL
```
○ META_USER_TOKEN
○ META_PAGE_ID
○ META_IG_USER_ID
```

---

## 🚀 Paso 2: Ejecutar Workflow Automático (1 min)

Dos opciones (igual resultado):

### Opción A: GitHub Actions (Recomendado para iPad)

1. Abre: https://github.com/pablorecalde67/Cosmetica-coreana/actions

2. En la izquierda, haz clic en: **"🔧 Configure Heroku Environment"**

3. Haz clic en: **"Run workflow"** (botón azul derecha)

4. Se abrirá un formulario. Completa tus keys:
   - STRIPE_PUBLIC_KEY
   - STRIPE_SECRET_KEY
   - STRIPE_WEBHOOK_SECRET
   - (El resto es opcional)

5. Haz clic en: **"Run workflow"** abajo

6. ¡Listo! El workflow se ejecuta automáticamente y configura todo en Heroku

### Opción B: Formulario Interactivo

1. Abre este archivo en tu navegador:
   ```
   https://raw.githubusercontent.com/pablorecalde67/Cosmetica-coreana/main/automation-coca/heroku-config-setup.html
   ```

2. Completa los campos con tus keys

3. Haz clic en "⚡ Configurar Heroku"

4. Se abrirá una página de GitHub Actions con los datos pre-completados

5. ¡Listo!

---

## ✨ Qué Pasa Automáticamente

El workflow hace esto sin que hagas nada más:

```
1. ✅ Conecta con Heroku API
2. ✅ Establece todas las variables de entorno
3. ✅ Configura Stripe, PayPal, Email, etc.
4. ✅ Reinicia la app automáticamente
5. ✅ Verifica que todo esté funcionando
6. ✅ Te muestra si fue exitoso o hay errores
```

**Tiempo total**: ~3-5 minutos

---

## 🔍 Paso 3: Verificar que Funciona (1 min)

Abre estas URLs para confirmar:

```
App viva:
https://kbeautycde.herokuapp.com/

Health check:
https://kbeautycde.herokuapp.com/api/admin/health

Logs si hay problemas:
https://dashboard.heroku.com/apps/kbeautycde/logs
```

---

## 🎯 Paso 4: Configurar Webhooks (2 min) - OPCIONAL

Si agregaste Stripe/PayPal, configura webhooks:

### Stripe
1. Dashboard: https://dashboard.stripe.com/webhooks
2. Crear endpoint: `https://kbeautycde.herokuapp.com/api/webhooks/stripe`
3. Eventos: `payment_intent.succeeded`, `charge.refunded`

### PayPal
1. Developer: https://developer.paypal.com/webhooks
2. URL: `https://kbeautycde.herokuapp.com/api/webhooks/paypal`
3. Eventos: `PAYMENT.SALE.COMPLETED`, `PAYMENT.SALE.REFUNDED`

---

## ❌ Si Algo Falla

### Ver logs de error
```
https://dashboard.heroku.com/apps/kbeautycde/logs
```

### Re-ejecutar configuración
Simplemente vuelve a ir a:
```
https://github.com/pablorecalde67/Cosmetica-coreana/actions
```

Y ejecuta el workflow de nuevo con los valores corregidos.

### Si la app crashea
El workflow automáticamente reinicia la app. Si sigue fallando:
1. Verifica que los valores estén correctos
2. Verifica que sean keys de PRODUCCIÓN (no de test)
3. Revisa los logs para ver el error específico

---

## 📊 URLs de Referencia

| Servicio | URL |
|----------|-----|
| **GitHub Actions** | https://github.com/pablorecalde67/Cosmetica-coreana/actions |
| **Heroku Dashboard** | https://dashboard.heroku.com/apps/kbeautycde |
| **Heroku Logs** | https://dashboard.heroku.com/apps/kbeautycde/logs |
| **Stripe Keys** | https://dashboard.stripe.com/apikeys |
| **PayPal Keys** | https://developer.paypal.com/apps/sandbox |
| **Google App Passwords** | https://myaccount.google.com/apppasswords |
| **Meta Business** | https://business.facebook.com |

---

## 🎉 ¡Listo!

Una vez que el workflow termine:
- ✅ App configurada en Heroku
- ✅ Pagos con Stripe listos
- ✅ Email funcionando (opcional)
- ✅ Analytics conectado (opcional)
- ✅ Todo listo para vender

**Próximo paso**: Editar productos y precios en tu panel de admin

---

## 💡 Tips

- **Guarda tus keys en un lugar seguro** (no en GitHub, ni en mensajes)
- **Usa keys LIVE (pk_live_) no TEST (pk_test_)**
- **El workflow se puede ejecutar varias veces** si necesitas actualizar algo
- **Cualquier cambio futuro** solo requiere editar el repo y hacer push - ¡se deploya solo!

---

**Problemas?** Ver `DEPLOYMENT.md` para info técnica completa.
