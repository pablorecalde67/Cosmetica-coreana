# K-Beauty CDE - API Integration Guide

## 📋 Overview

Este documento explica cómo configurar e integrar las APIs externas para viralización y tracking de conversiones.

**APIs Integradas:**
- ✅ Instagram Graph API (publicar productos)
- ✅ WhatsApp Business API (alertas)
- ✅ TikTok API (videos)
- ✅ Google Analytics 4 (conversiones)
- ✅ Facebook Pixel (retargeting)

---

## 🔧 Quick Setup

### 1. Copiar archivo de configuración

```bash
cp automation-coca/.env.example automation-coca/.env
```

### 2. Llenar valores en `.env`

Editar `automation-coca/.env` y reemplazar valores reales.

### 3. Reiniciar servidor

```bash
npm start
```

---

## 📱 Instagram Graph API

### Obtener Credenciales

1. Ir a https://developers.facebook.com
2. Crear nueva app (o usar existente)
3. Agregar "Instagram Graph API" como producto
4. En Settings → Basic, copiar **App ID** y **App Secret**
5. En Roles → Instagram Accounts, conectar cuenta de Instagram Business
6. Generar **Long-Lived Access Token** (válido por 60 días)

### Configuración en `.env`

```env
INSTAGRAM_ACCESS_TOKEN=IGQVJf...
INSTAGRAM_BUSINESS_ACCOUNT_ID=17841406338772155
```

### Usar API

**Publicar producto:**
```bash
curl -X POST http://localhost:3000/api/social/instagram \
  -H "Content-Type: application/json" \
  -d '{
    "product": {
      "name": "COSRX Advanced Snail 96",
      "brand": "COSRX",
      "price": 16.89,
      "reviews": 284,
      "rating": 4.3,
      "image_url": "https://cdn.kbeautycde.com/products/image.jpg"
    }
  }'
```

### Publicar a TODAS las plataformas (Instagram + WhatsApp + TikTok):

```bash
curl -X POST http://localhost:3000/api/social/publish \
  -H "Content-Type: application/json" \
  -d '{
    "product": {
      "name": "Laneige Lip Sleeping Mask",
      "brand": "Laneige",
      "price": 22.99,
      "reviews": 512,
      "rating": 4.3,
      "image_url": "https://...",
      "stock": 150
    }
  }'
```

---

## 💬 WhatsApp Business API

### Obtener Credenciales

1. Ir a https://developers.facebook.com
2. Ir a tu app → WhatsApp → Configuration
3. Crear cuenta de WhatsApp Business (si no existe)
4. Obtener **Business Phone Number ID**
5. Generar **Access Token**

### Configuración en `.env`

```env
WHATSAPP_ACCESS_TOKEN=EAAx...
WHATSAPP_BUSINESS_PHONE_ID=104123...
WHATSAPP_CONTACTS=+595972020202,+5491234567890
```

### Usar API

**Enviar alerta a un contacto:**
```bash
curl -X POST http://localhost:3000/api/social/whatsapp \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+5491234567890",
    "product": {
      "name": "3CE Velvet Lip Tint",
      "price": 13.99,
      "reviews": 398,
      "rating": 4.3,
      "stock": 75
    }
  }'
```

**El sistema envía automáticamente a todos los contactos en WHATSAPP_CONTACTS cuando se publica un producto trending.**

---

## 🎵 TikTok API

### Obtener Credenciales

1. Ir a https://developer.tiktok.com
2. Crear Developer Account
3. Crear Application
4. Solicitar acceso a **Video Upload API** (requiere aprobación manual de TikTok)
5. Obtener **Access Token**

### Nota

TikTok requiere aprobación manual. Para videos de prueba, puedes usar:
- TikTok Creator Studio (sin API)
- O subir manualmente mientras esperas aprobación de API

### Configuración en `.env`

```env
TIKTOK_ACCESS_TOKEN=your_token...
TIKTOK_BUSINESS_ACCOUNT_ID=your_account_id...
```

---

## 📊 Google Analytics 4

### Obtener Credenciales

1. Ir a https://analytics.google.com
2. Crear propiedad GA4 para kbeautycde.com
3. En Admin → Data Streams, crear stream web
4. Copiar **Measurement ID** (G-...)
5. En Admin → Data API, habilitar Google Analytics Admin API
6. Crear Service Account y generar **API Secret**

### Configuración en `.env`

```env
GA4_MEASUREMENT_ID=G-XXXXXXXXXX
GA4_API_SECRET=your_api_secret...
```

### Trackear eventos

**Page View:**
```bash
curl -X POST http://localhost:3000/api/social/analytics/pageview \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "session_12345",
    "userId": "user_12345",
    "pageTitle": "K-Beauty CDE - Tienda",
    "pagePath": "/"
  }'
```

**Ver producto:**
```bash
curl -X POST http://localhost:3000/api/social/analytics/view-item \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "session_12345",
    "userId": "user_12345",
    "product": {
      "id": "prod_001",
      "name": "COSRX Advanced Snail 96",
      "brand": "COSRX",
      "category": "Skincare",
      "price": 16.89
    }
  }'
```

**Compra (Conversión):**
```bash
curl -X POST http://localhost:3000/api/social/analytics/purchase \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "session_12345",
    "userId": "user_12345",
    "orderId": "order_001",
    "products": [
      {
        "id": "prod_001",
        "name": "COSRX Advanced Snail 96",
        "price": 16.89,
        "quantity": 1
      }
    ],
    "totalValue": 16.89
  }'
```

**Análisis de piel con IA:**
```bash
curl -X POST http://localhost:3000/api/social/analytics/ai-analysis \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "session_12345",
    "userId": "user_12345",
    "skinType": "combinada",
    "analysisTime": 2500
  }'
```

---

## 🎯 Facebook Pixel

### Obtener Credenciales

1. Ir a https://business.facebook.com/pixels
2. Crear o seleccionar Pixel
3. Copiar **Pixel ID**
4. Generar **Access Token** (desde Business Manager)

### Configuración en `.env`

```env
FACEBOOK_PIXEL_ID=123456789
FACEBOOK_ACCESS_TOKEN=EAAx...
```

### Eventos Tracked

- **PageView** - Automático
- **ViewItem** - Cuando miran un producto
- **AddToCart** - Cuando agregan al carrito
- **Purchase** - Cuando compran

### Usar manualmente

```bash
curl -X POST http://localhost:3000/api/social/analytics/add-to-cart \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "session_12345",
    "userId": "user_12345",
    "product": {
      "id": "prod_001",
      "name": "Laneige Lip Sleeping Mask",
      "price": 22.99
    },
    "quantity": 1
  }'
```

---

## 📈 Integración en Frontend

### Agregar a HTML landing page

```html
<!-- Google Analytics 4 -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>

<!-- Facebook Pixel -->
<script>
  !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
  n.callMethod.apply(n,arguments):n.queue.push(arguments)};
  // ... (código completo del pixel)
  fbq('init', '123456789');
  fbq('track', 'PageView');
</script>
```

### Trackear eventos desde JavaScript

```javascript
// Cuando ven un producto
fetch('/api/social/analytics/view-item', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    sessionId: sessionStorage.getItem('session_id'),
    userId: getCurrentUserId(),
    product: productData
  })
});

// Cuando compran
fetch('/api/social/analytics/purchase', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    sessionId: sessionStorage.getItem('session_id'),
    userId: getCurrentUserId(),
    orderId: orderId,
    products: cartItems,
    totalValue: totalPrice
  })
});
```

---

## 🚀 Flujo Automático de Viralización

### 1. Producto Trending Detectado
Sistema automático identifica trending
```
/api/viral/detect-trending → trending product selected
```

### 2. Publicar en Redes
Se publica automáticamente:
```
POST /api/social/publish → Instagram + WhatsApp + TikTok
```

### 3. Trackear Viralidad
Monitorear tráfico y conversiones:
```
GET /api/social/stats → números de engagement
GET /api/social/analytics/stats → conversiones
```

---

## 📱 Endpoints Disponibles

### Social Media
- `POST /api/social/publish` - Publicar a todas las plataformas
- `POST /api/social/instagram` - Solo Instagram
- `POST /api/social/whatsapp` - Solo WhatsApp
- `POST /api/social/tiktok` - Solo TikTok
- `GET /api/social/stats` - Ver estadísticas

### Analytics
- `POST /api/social/analytics/pageview` - Trackear vista de página
- `POST /api/social/analytics/view-item` - Trackear vista de producto
- `POST /api/social/analytics/add-to-cart` - Trackear carrito
- `POST /api/social/analytics/purchase` - Trackear compra
- `POST /api/social/analytics/ai-analysis` - Trackear análisis de piel
- `GET /api/social/analytics/stats` - Ver estadísticas de eventos

---

## ⚠️ Troubleshooting

### Instagram no publica
- Verificar access token no expiró
- Verificar Instagram Business Account está vinculado
- Revisar logs del servidor: `tail -f /tmp/server.log`

### WhatsApp no envía
- Verificar número en formato internacional (+5491234567890)
- Verificar cuenta no está limitada

### Analytics no trackea
- Verificar Measurement ID y API Secret correctos
- Revisar en GA4 Dashboard que eventos aparezcan

### Facebook Pixel no funciona
- Verificar Pixel ID en eventos de Facebook
- Comprobar en EventManager que eventos se reciben

---

## 🔐 Security Notes

1. **Nunca commitear .env** - Agregar a `.gitignore`
2. **Usar variables de entorno** - No hardcodear credenciales
3. **Rotar tokens regularmente** - Especialmente long-lived tokens
4. **Monitorear uso de APIs** - Para detectar abusos

---

## 📞 Support

Para errores o preguntas, revisar:
- Logs del servidor: `npm run logs`
- Dashboard de APIs correspondientes
- Documentación oficial de cada plataforma

---

## 🎯 Next Steps

1. ✅ Configurar `.env` con credenciales reales
2. ✅ Testear cada API con curl
3. ✅ Integrar analytics en frontend
4. ✅ Automatizar publicación de productos trending
5. ✅ Monitorear conversiones en tiempo real

¡Listo para viralizar! 🚀
