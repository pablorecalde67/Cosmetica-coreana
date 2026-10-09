# K-Beauty CDE - Tienda Dinámoca Completa

## 🎯 Estado: LISTO PARA VENTA

Fecha de Despliegue: 2026-10-09  
Versión: 2.0 (Catálogo Completo)

---

## 📁 Estructura de Archivos

### Archivos Principales
- **`landing.html`** - Página de inicio con hero section y 8 productos destacados
- **`shop.html`** - Tienda dinámaca con catálogo completo (46 productos)
- **`config.js`** - Configuración global (WhatsApp, monedas, APIs)
- **`analytics.js`** - Sistema de tracking de eventos
- **`data/products.json`** - Base de datos de 46 productos

### Imágenes
- `piel/img/products/` - 46 imágenes de productos en formato WebP

---

## 🛒 Características de la Tienda

### Productos
- **46 productos K-beauty** completamente catalogados
- Marcas incluidas: COSRX, ANUA, Beauty of Joseon, PURITO, Dr. Althea, SKIN1004, JUMISO, TOCOBO, y más
- Categorías: Sérum, Tónico, Crema, Limpiador, Protector Solar, Ampollas, etc.

### Funcionalidades
✅ **Búsqueda** - Búsqueda por nombre o marca  
✅ **Filtros** - Filtrar por categoría de producto  
✅ **Carrito** - Carrito persistente (localStorage)  
✅ **Precios Duales** - USD (u$s) y Pesos Argentinos ($)  
✅ **Conversión** - 1 USD = 1050 ARS  
✅ **WhatsApp** - Envío directo del carrito por WhatsApp  
✅ **Analytics** - Tracking de eventos (vistas, búsquedas, compras)  
✅ **Responsivo** - Funciona perfectamente en iPad/móvil  

---

## 💰 Precios

Todos los productos tienen precios en:
- **Dólares (USD)** - Mostrado como `u$s 25.00`
- **Pesos Argentinos (ARS)** - Convertido automáticamente

Ejemplo:
```
Producto: ANUA Heartleaf Toner
Precio USD: u$s 22
Precio ARS: $ 23,100
```

---

## 📊 Analytics & Tracking

El sistema rastrea automáticamente:
- **Page Views** - Cuándo los usuarios visitan el shop
- **Product Views** - Cuándo ven detalles de un producto
- **Searches** - Términos buscados
- **Filters** - Categorías seleccionadas
- **Add to Cart** - Productos agregados al carrito
- **WhatsApp Clicks** - Intención de compra

Los eventos se guardan en `localStorage` bajo `analytics_events`.

**Integración Opcional:**
- Google Analytics 4 (si configuras `GA4_MEASUREMENT_ID` en `config.js`)
- Facebook Pixel (si configuras `FACEBOOK_PIXEL_ID` en `config.js`)

---

## 🔗 URLs

### GitHub Pages (Producción)
- **Landing Page:** `https://pablorecalde67.github.io/Cosmetica-coreana/landing.html`
- **Tienda Completa:** `https://pablorecalde67.github.io/Cosmetica-coreana/shop.html`

### Locales (Desarrollo)
- Landing: `localhost:8000/landing.html`
- Shop: `localhost:8000/shop.html`

---

## ⚙️ Configuración

### Modificar Número de WhatsApp

Editar `config.js`:
```javascript
whatsapp: {
  number: '5493624123456', // Reemplazar con tu número
  businessName: 'K-Beauty CDE',
}
```

### Agregar Google Analytics

En `config.js`:
```javascript
analytics: {
  GA4_MEASUREMENT_ID: 'G-XXXXXXXX', // Tu GA4 ID
  FACEBOOK_PIXEL_ID: '', // Tu Pixel ID
}
```

### Cambiar Tasa de Conversión

En `config.js`:
```javascript
currency: {
  usd_to_ars: 1050, // Modificar según tasa actual
}
```

---

## 🧪 Verificación Local

Para testear en tu computadora:

```bash
# Terminal 1: Ir a la carpeta public
cd automation-coca/public

# Iniciar servidor HTTP
python3 -m http.server 8000

# Terminal 2: Abrir en navegador
# Landing: http://localhost:8000/landing.html
# Shop: http://localhost:8000/shop.html
```

---

## 📦 Datos de Productos

Estructura JSON ejemplo:
```json
{
  "id": "anua-77",
  "name": "ANUA Heartleaf 77 Soothing Toner",
  "brand": "ANUA",
  "category": "toner",
  "description": "Tónico calmante...",
  "benefits": ["Calmante", "Hidratante"],
  "image": "./piel/img/products/anua-heartleaf-77-soothing-toner.webp",
  "priceUSD": 22,
  "rating": 4.8,
  "reviews": 142
}
```

Para agregar más productos, editar `data/products.json`.

---

## 🚀 Próximos Pasos (Opcionales)

1. **Dominio Personalizado** - Conectar kbeautycde.com a GitHub Pages
2. **Sistema de Órdenes** - Backend para guardar pedidos en BD
3. **Métodos de Pago** - Stripe, Mercado Pago, etc.
4. **Autenticación** - Sistema de usuarios y favoritos
5. **Reseñas** - Calificaciones de clientes
6. **Inventory** - Control de stock en tiempo real
7. **Email Marketing** - Newsletter y notificaciones

---

## 🐛 Troubleshooting

### Las fotos no cargan
- Verificar que `piel/img/products/` exista
- Verificar que los nombres de archivo coincidan en `data/products.json`
- Limpiar caché del navegador (Cmd+Shift+R)

### WhatsApp no funciona
- Verificar el número en `config.js` está en formato correcto
- Revisar que sea un número de WhatsApp Business válido
- Probar en Safari/Chrome

### El carrito se limpia al actualizar
- Normal: está en `localStorage`
- Si necesitas persistencia permanente, migrar a backend

---

## 📞 Soporte

Para cambios o mejoras, editaremos los archivos:
1. `data/products.json` - Para agregar/editar productos
2. `config.js` - Para cambiar números, monedas, APIs
3. `shop.html` - Para cambios en diseño/funcionalidad
4. `analytics.js` - Para tracking avanzado

---

**Sitio listo para vender. ¡A vender belleza coreana en Argentina! 🇦🇷💄**
