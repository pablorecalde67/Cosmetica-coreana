# COCA — automatización de Instagram + Facebook

Servicio que:

1. Recibe automáticamente las fotos/videos que llegan por WhatsApp (canales/chats que vos elijas).
2. Te avisa por WhatsApp cuando hay contenido nuevo esperando precio.
3. Vos entrás al panel web, ponés precio y descripción.
4. Apenas guardás el precio, se publica solo en Instagram y en la página de Facebook "COCA".

También podés arrastrar fotos/videos manuales directamente en el panel (no todo tiene que venir de WhatsApp).

## Lo que tenés que hacer VOS antes de que esto funcione

Esto no lo puede hacer un asistente de código por vos porque Meta y WhatsApp exigen que sea el dueño real de las cuentas quien las cree y autorice.

### 1. Crear las páginas "COCA"

- Creá una **Página de Facebook** llamada `COCA`.
- Creá (o convertí) una cuenta de **Instagram** llamada `COCA` en cuenta **Profesional → Creador de contenido/Empresa**, y vinculala a esa Página de Facebook (Instagram → Configuración → Cuentas vinculadas).

### 2. Crear la app de Meta for Developers

1. Entrá a https://developers.facebook.com/apps y creá una app de tipo "Empresa".
2. Agregale los productos **Facebook Login for Business** y **Instagram Graph API**.
3. Generá un **token de acceso de la Página** con estos permisos:
   `pages_show_list`, `pages_read_engagement`, `pages_manage_posts`, `instagram_basic`, `instagram_content_publish`.
4. Convertí ese token en uno de **larga duración** (60 días) con el "Access Token Debugger/Extender" de Meta, o configurá una app revisada para tokens permanentes de página.
5. Anotá:
   - `META_ACCESS_TOKEN` = el token de la página.
   - `META_PAGE_ID` = ID de la página de Facebook COCA.
   - `META_IG_USER_ID` = ID de la cuenta de Instagram Business vinculada (se obtiene con `GET /{page-id}?fields=instagram_business_account&access_token=...`).

> Nota sobre "viralizar entre mujeres desde 12 años": las publicaciones orgánicas (posts normales) no tienen segmentación por edad/género — eso solo existe en anuncios pagos (Meta Ads), y Meta restringe fuerte la publicidad a menores. Lo que este servicio automatiza es la constancia y calidad de la publicación (buenos hashtags, formato Reels, horarios), que es lo que realmente ayuda al alcance orgánico. Si más adelante querés sumar anuncios pagos segmentados, es un paso aparte (cuenta publicitaria + presupuesto).

### 3. Deploy en Railway

1. Subí este repo (o al menos la carpeta `automation-coca/`) a Railway como un nuevo proyecto Node.
2. Agregá un **volumen persistente** montado en `/app/automation-coca/data` (para no perder la sesión de WhatsApp ni el historial al reiniciar).
3. Cargá las variables de entorno de `.env.example` en Railway (con tus valores reales).
4. Una vez deployado, copiá la URL pública que te da Railway y ponela en `PUBLIC_BASE_URL`.

### 4. Conectar tu WhatsApp

1. Abrí `https://TU-URL-DE-RAILWAY/whatsapp-setup`.
2. Escaneá el código QR desde el WhatsApp del número que sigue tus canales (WhatsApp → Dispositivos vinculados → Vincular dispositivo).
3. Con la sesión ya conectada, mirá los logs del servicio: cada mensaje que te llegue imprime su identificador de chat (JID). Copiá el de los canales que te interesan y pegalos en `WHATSAPP_MONITORED_CHATS` (separados por coma).
4. Volvé a deployar con esa variable cargada. A partir de ahí, sólo se procesan fotos/videos de esos chats.

> Importante: esto usa una librería no oficial (Baileys) que simula tu WhatsApp normal, porque la API oficial de WhatsApp Business no permite "leer" canales de difusión de terceros. Es el mismo mecanismo que usan la mayoría de los bots personales de WhatsApp. El riesgo real es bajo si sólo lee mensajes (no manda spam), pero es un uso no oficial — tenelo presente.

## Correr en local (para probar)

```bash
cd automation-coca
cp .env.example .env   # completá tus valores
npm install
npm start
```

- Panel: http://localhost:3000
- Setup de WhatsApp: http://localhost:3000/whatsapp-setup

## Cómo queda el flujo del día a día

1. Te llega una foto/video por un canal de WhatsApp que estás siguiendo → el bot la descarga sola y te manda un WhatsApp: "🆕 Llegó contenido nuevo para COCA, poné el precio: [link]".
2. Abrís el link (o el panel), ves la foto/video, escribís la descripción y el precio.
3. Al guardar, se publica automáticamente en Instagram (como Reel si es video, o foto) y en la Página de Facebook COCA, con el precio y los hashtags incluidos en el texto.
4. Si algo falla (token vencido, etc.), la tarjeta queda marcada en rojo con el motivo y un botón para reintentar.

## Estructura

```
automation-coca/
  src/
    index.js           servidor Express
    config.js           variables de entorno
    store.js             cola de contenido (archivo JSON)
    whatsapp.js           bot de WhatsApp (Baileys)
    meta.js                publicación en Instagram/Facebook (Graph API)
    routes/api.js           endpoints del panel
    routes/whatsappSetup.js  página con el QR de conexión
  public/                 panel web (drag&drop + cola + precio)
```
