# 🥥 COCA K-BEAUTY

Plataforma profesional de análisis de piel con IA + e-commerce de productos coreanos para Argentina.

## 📋 Estructura del Proyecto

```
docs/coca/
├── index.html              # Página principal
├── css/
│   └── styles.css         # Estilos profesionales
├── js/
│   ├── config.js          # Configuración de APIs (⚠️ REEMPLAZAR)
│   ├── main.js            # Orquestación principal
│   ├── firebase.js        # Base de datos en tiempo real
│   ├── skin-analyzer.js   # Análisis de piel con OpenAI Vision
│   ├── youtube.js         # Videos automáticos de YouTube
│   ├── products.js        # Gestión de productos
│   ├── cart.js            # Carrito de compras
│   └── checkout.js        # Integración MercadoPago
└── data/
    └── stores.json        # Info de tiendas en CDE
```

## 🚀 Fases de Desarrollo

### ✅ FASE 1 - COMPLETADA
- [x] Landing page con hero section
- [x] Feed de artículos (placeholders)
- [x] Botón "ANALIZA TU PIEL" prominente
- [x] Estructura de modales
- [x] Carrito básico con localStorage

### 📝 FASE 2 - EN PROGRESO
- [ ] Integrar OpenAI Vision API para análisis de piel
- [ ] Búsqueda automática de videos YouTube
- [ ] Sistema de recomendaciones basado en análisis
- [ ] Conectar con tus cuentas Instagram/Facebook

### 💳 FASE 3 - PRÓXIMO
- [ ] Integrar MercadoPago para pagos en Argentina
- [ ] Firebase Realtime Database para órdenes
- [ ] Panel admin con login

### 🔧 FASE 4 - FINAL
- [ ] Dashboard de administración
- [ ] Seguimiento de envíos
- [ ] Notificaciones en tiempo real

## ⚙️ CONFIGURACIÓN REQUERIDA

### 1. Credenciales de OpenAI (Análisis de Piel)

Obtén tu API key en: https://platform.openai.com/api-keys

```javascript
// En js/config.js
openai: {
  apiKey: "sk-tu-clave-aqui",
  modelId: "gpt-4-vision-preview"
}
```

### 2. Firebase (Base de Datos + Admin)

1. Ir a https://console.firebase.google.com
2. Crear nuevo proyecto: "COCA K-Beauty"
3. Habilitar Realtime Database
4. Copiar configuración a `config.js`:

```javascript
firebase: {
  apiKey: "AIzaSy...",
  authDomain: "coca-kbeauty.firebaseapp.com",
  databaseURL: "https://coca-kbeauty-default-rtdb.firebaseio.com",
  projectId: "coca-kbeauty",
  storageBucket: "coca-kbeauty.appspot.com",
  messagingSenderId: "...",
  appId: "1:..."
}
```

### 3. YouTube API (Videos Automáticos)

1. Ir a https://console.cloud.google.com
2. Habilitar YouTube Data API v3
3. Crear API key
4. Reemplazar en `config.js`:

```javascript
youtube: {
  apiKey: "AIzaSy...",
  searchQuery: "k-beauty skincare routine tips",
  maxResults: 6
}
```

### 4. MercadoPago (Pagos)

1. Ir a https://www.mercadopago.com.ar
2. Crear cuenta de negocio
3. Obtener Public Key
4. Reemplazar en `config.js`:

```javascript
mercadopago: {
  publicKey: "APP_USR-...",
  integrationUrl: "https://www.mercadopago.com.ar/checkout/v1/redirect"
}
```

### 5. Tus Redes Sociales

```javascript
social: {
  instagram: "https://instagram.com/tu-usuario",  // ← REEMPLAZA
  facebook: "https://facebook.com/tu-pagina"       // ← REEMPLAZA
}
```

## 🎯 Flujo del Usuario

```
1. Usuario entra a kbeautycde.com/coca
2. Ve feed de artículos + videos YouTube
3. Clickea "ANALIZA TU PIEL"
4. Captura/sube foto
5. IA analiza con OpenAI Vision
6. Ve resultados (tipo de piel, problemas, necesidades)
7. Clickea "YO TE DOY UNA MANO"
8. Ve 5 productos recomendados
9. Agregar al carrito
10. Checkout con MercadoPago
11. Orden se guarda en Firebase
12. Tú ves la orden en admin panel
13. Cambias estado: Pendiente → Enviado → Entregado
14. Usuario recibe notificación en tiempo real
```

## 💻 Desarrollo Local

Para probar en tu iPad/Chrome:

```bash
# 1. Reemplaza las credenciales en js/config.js
# 2. Abre: http://localhost:8000/coca/
# 3. Usa herramientas de desarrollador (F12)
```

## 📱 Optimizado para iPad

- ✅ Responsive design (Grid + Flexbox)
- ✅ Touch-friendly buttons
- ✅ Soporte para cámara en iPad
- ✅ Scroll suave y transiciones
- ✅ Funciona en Safari

## 🔐 Seguridad

- ⚠️ Las API keys en `config.js` son públicas en GitHub
  - SOLUCIÓN: Usar variables de entorno en producción
  - O usar backend proxy para proteger claves

## 📊 Próximas Tareas

1. [ ] Confirmar URLs de Instagram/Facebook
2. [ ] Obtener credenciales de las 4 APIs
3. [ ] Hacer commit de Fase 1
4. [ ] Proceder con Fase 2 (Análisis de piel)

## 🚨 Notas Importantes

- Esta es FASE 1 de un proyecto de 4 fases
- Cada API requiere credenciales separadas
- La mayoría tiene capa gratuita / versión trial
- Todo funciona en GitHub Pages + servicios externos

---

**COCA K-BEAUTY** © 2026 | Made with ❤️ for K-Beauty lovers in Argentina
