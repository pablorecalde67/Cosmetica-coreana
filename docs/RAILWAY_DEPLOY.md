# 🚀 K-BEAUTY CDE - DEPLOYMENT A RAILWAY

## ✅ LISTO PARA PRODUCCIÓN

Tu sitio está completamente configurado y listo para deployar en **Railway.app**.

**Estado:** 🟢 PRODUCTION READY  
**Repositorio:** pablorecalde67/Cosmetica-coreana  
**Rama:** main  

---

## 🎯 DEPLOY EN UN CLICK

### Opción 1: Click Automático (RECOMENDADO)
Simplemente abre este link en tu navegador:

```
https://railway.app/new?templateUrl=https://github.com/pablorecalde67/Cosmetica-coreana
```

**Qué pasa:**
1. Railway se conecta a tu GitHub (pablorecalde67)
2. Se configura automáticamente
3. Te pide llenar las variables de environment
4. Deploy automático en ~2 minutos
5. Tu sitio está en vivo con URL tipo: `kbeautycde-production.up.railway.app`

---

## 🔑 VARIABLES DE ENVIRONMENT NECESARIAS

Cuando Railway te pida las variables, cópiala de `.env.example`:

```
INSTAGRAM_ACCESS_TOKEN=tu_token
INSTAGRAM_BUSINESS_ACCOUNT_ID=tu_id
WHATSAPP_ACCESS_TOKEN=tu_token
WHATSAPP_BUSINESS_PHONE_ID=tu_id
WHATSAPP_CONTACTS=+595972020202,+5491234567890
TIKTOK_ACCESS_TOKEN=tu_token
TIKTOK_BUSINESS_ACCOUNT_ID=tu_id
GA4_MEASUREMENT_ID=G-XXXXXXXXXX
GA4_API_SECRET=tu_secret
FACEBOOK_PIXEL_ID=123456789
FACEBOOK_ACCESS_TOKEN=tu_token
NODE_ENV=production
PORT=8080
```

---

## 📋 QUÉ INCLUYE

✅ Landing page responsive con 12 productos  
✅ 13 endpoints API (social media + analytics)  
✅ Google Analytics 4 integrado  
✅ Facebook Pixel integrado  
✅ Instagram Graph API  
✅ WhatsApp Business API  
✅ TikTok API  
✅ Precios USD + ARS (Argentina)  
✅ Análisis de piel con IA (endpoint)  
✅ Conversión automática de monedas  

---

## 🔗 ENDPOINTS DISPONIBLES

### Social Media (5 endpoints)
- `POST /api/social/publish` - Publicar a todas las plataformas
- `POST /api/social/instagram` - Solo Instagram
- `POST /api/social/whatsapp` - Solo WhatsApp
- `POST /api/social/tiktok` - Solo TikTok
- `GET /api/social/stats` - Ver estadísticas

### Analytics (7 endpoints)
- `POST /api/social/analytics/pageview` - Vistas
- `POST /api/social/analytics/view-item` - Producto visto
- `POST /api/social/analytics/add-to-cart` - Carrito
- `POST /api/social/analytics/purchase` - Compra
- `POST /api/social/analytics/ai-analysis` - Análisis IA
- `GET /api/social/analytics/stats` - Estadísticas
- `POST /api/social/analytics/custom-event` - Eventos custom

---

## 🌐 DESPUÉS DEL DEPLOY

Una vez que esté en vivo:

1. **Acceder a tu sitio:** `https://kbeautycde-production.up.railway.app`
2. **Agregar dominio:** En Railway dashboard → Settings → Domain
3. **Agregar fotos reales:** Edita `/public/landing.html` y sube nuevas versiones

---

## 🔒 SEGURIDAD

- Variables de environment protegidas en Railway
- No hay secretos en el código
- HTTPS automático
- Logs accesibles desde Railway dashboard

---

## 📞 PRÓXIMOS PASOS

1. ✅ Abre el link de Railway arriba
2. ✅ Conecta tu GitHub (pablorecalde67)
3. ✅ Llena las variables de environment
4. ✅ Espera 2 minutos
5. ✅ Tu sitio está en vivo

¿Preguntas? Chequea el API_INTEGRATION_GUIDE.md para configurar cada API.

---

**Versión:** 2.0.0 - Production Ready  
**Fecha:** 2026-10-08  
**Status:** 🟢 READY FOR PRODUCTION
