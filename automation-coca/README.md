# COCA — automatización de Instagram

Servicio que:

1. Recibe automáticamente las fotos/videos que llegan por WhatsApp (canales/chats que vos elijas) **o por mail** (a una casilla que vos elijas).
2. Te avisa por WhatsApp cuando hay contenido nuevo esperando precio.
3. Vos entrás al panel web, ponés precio y descripción, y tocás **PUBLICAR**.
4. El servicio publica solo en Instagram (foto, video o carrusel si mandaste varias), con el texto final armado (descripción + precio + botón "Lo quiero comprar ya" con tu WhatsApp + hashtags).

También podés arrastrar fotos/videos manuales directamente en el panel (no todo tiene que venir de WhatsApp o del mail).

Si todavía no cargaste las credenciales de Meta (ver abajo), el panel igual arma el texto y te deja los archivos listos para publicar vos mismo en Instagram.

## Lo que tenés que hacer VOS antes de que esto funcione

Esto no lo puede hacer un asistente de código por vos porque Meta y WhatsApp exigen que sea el dueño real de las cuentas quien las cree y autorice.

### 1. Cuenta de Instagram profesional

- Creá/usá una cuenta de **Instagram profesional** (Business o Creator) — ya tenés: CocabeautyCDE.
- Tiene que estar vinculada a una Página de Facebook (aunque no publiques nada ahí): es un requisito técnico de la API de Instagram, no significa que se publique en Facebook.

> Nota sobre "viralizar entre mujeres desde 12 años": las publicaciones orgánicas (posts normales) no tienen segmentación por edad/género — eso solo existe en anuncios pagos (Meta Ads), y Meta restringe fuerte la publicidad a menores. Lo que este servicio automatiza es la constancia y calidad de la publicación (buenos hashtags, formato Reels, horarios), que es lo que realmente ayuda al alcance orgánico. Si más adelante querés sumar anuncios pagos segmentados, es un paso aparte (cuenta publicitaria + presupuesto).

### 2. Deploy en Railway

1. Subí este repo (o al menos la carpeta `automation-coca/`) a Railway como un nuevo proyecto Node.
2. Agregá un **volumen persistente** montado en `/app/data` (para no perder la sesión de WhatsApp ni el historial al reiniciar). Sin esto, cada redeploy corta la conexión de WhatsApp y hay que volver a escanear el QR.
3. Cargá las variables de `.env.example`.
4. Una vez deployado, copiá la URL pública que te da Railway y ponela en `PUBLIC_BASE_URL`.

### 3. Conectar tu WhatsApp

1. Abrí `https://TU-URL-DE-RAILWAY/whatsapp-setup`.
2. Escaneá el código QR desde el WhatsApp del número que sigue tus canales (WhatsApp → Dispositivos vinculados → Vincular dispositivo).
3. Con la sesión ya conectada, mirá los logs del servicio: cada mensaje que te llegue imprime su identificador de chat (JID). Copiá el de los canales que te interesan y pegalos en `WHATSAPP_MONITORED_CHATS` (separados por coma).
4. Volvé a deployar con esa variable cargada. A partir de ahí, sólo se procesan fotos/videos de esos chats. Ojo: volver a deployar sin el volumen persistente del paso anterior corta la sesión de nuevo.

> Importante: esto usa una librería no oficial (Baileys) que simula tu WhatsApp normal, porque la API oficial de WhatsApp Business no permite "leer" canales de difusión de terceros. Es el mismo mecanismo que usan la mayoría de los bots personales de WhatsApp. El riesgo real es bajo si sólo lee mensajes (no manda spam), pero es un uso no oficial — tenelo presente.

### 4. Ingesta por mail (alternativa a WhatsApp)

No depende de vincular ningún dispositivo, así que nunca se corta ni se bloquea como WhatsApp:

1. En la cuenta de Gmail que quieras usar, activá la **Verificación en 2 pasos** (Cuenta de Google → Seguridad) si todavía no la tenés.
2. Generá una **Contraseña de aplicación** (Cuenta de Google → Seguridad → Contraseñas de aplicaciones). No es la contraseña normal de la cuenta.
3. Cargá en Railway:
   - `EMAIL_USER` = la dirección de Gmail.
   - `EMAIL_APP_PASSWORD` = la contraseña de aplicación generada.
4. Para que un mail se procese, su **asunto tiene que contener la palabra "COCA"** (configurable con `EMAIL_SUBJECT_TAG`) — así ningún newsletter ni mail con una imagen suelta termina en la cola. Cualquier foto/video adjunto en ese mail pasa a una tarjeta nueva del panel.

### 5. Credenciales de Meta para publicar automático en Instagram

1. Creá una app en https://developers.facebook.com/apps (tipo "Otro" → caso de uso "Empresa").
2. Agregale el producto **Instagram Graph API**.
3. Sacá un token de usuario con los permisos `pages_show_list`, `pages_read_engagement`, `instagram_basic`, `instagram_content_publish` (desde el Explorador de Graph API).
4. Convertilo en token de larga duración (60 días) y cargá en Railway:
   - `META_USER_TOKEN` = ese token de usuario de larga duración.
   - `META_PAGE_ID` = ID de la Página de Facebook vinculada a la cuenta de Instagram.
   - `META_IG_USER_ID` = ID de la cuenta de Instagram Business (`GET /{page-id}?fields=instagram_business_account&access_token=...`).
5. Con esas tres variables cargadas, el panel publica solo en Instagram apenas tocás **PUBLICAR** — no hace falta cambiar nada más en el código. El servicio calcula el token de la Página en cada publicación a partir del token de usuario, así no hay que renovarlo a mano mientras el de usuario siga vigente.

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

1. Te llega una foto/video por un canal de WhatsApp que estás siguiendo → el bot la descarga sola y te manda un WhatsApp avisando. Si mandan varias fotos seguidas del mismo producto, quedan agrupadas en una sola tarjeta (espera 3 segundos sin fotos nuevas antes de armar la tarjeta).
2. Abrís el panel, ves las fotos/video, escribís la descripción y el precio, tocás **PUBLICAR**. Si te faltó agregar alguna foto, podés sumarla antes con **"+ Agregar otra foto/video a esta publicación"**.
3. Si las credenciales de Meta están cargadas, el servicio publica solo en Instagram (foto, video o carrusel) y la tarjeta pasa a "Publicado ✅".
4. Si todavía no cargaste las credenciales, la tarjeta queda en "Listo para publicar" con el texto final armado. Tocás **Copiar texto**, descargás los archivos y los subís vos mismo a Instagram; después tocás **Marcar como publicado ✅** para sacarla de la cola.

**Sobre el botón "Lo quiero comprar ya":** es un link de WhatsApp (`wa.me`) con tu número, incluido siempre en el texto del posteo. En Instagram los links del texto no son tocables (limitación de la plataforma): ese mismo link te lo arma el panel para copiar y pegarlo como el link fijo de tu biografía de Instagram.

## Página pública `/piel`: análisis de piel con IA + venta automática

Además del panel de publicación, el servicio expone una página pública pensada para poner como **link en la bio de Instagram**: `https://TU-URL/piel`.

Flujo, 100% automático, sin que vos tengas que intervenir en cada caso:

1. **Landing**: explica en 3 pasos qué va a pasar y lleva a la persona a "Descubrir mi tipo de piel".
2. **Consentimiento**: antes de activar la cámara, se muestra un texto que dice explícitamente que la selfie **no se guarda** y el **descargo de responsabilidad** completo (no es diagnóstico médico, la persona usa las recomendaciones bajo su responsabilidad). Hay que tildar el check para continuar.
3. **Selfie**: se activa la cámara del navegador, la persona se saca la foto. La foto viaja al servidor solo para la llamada a la IA y **nunca se escribe a disco ni a ninguna base de datos** (ver `src/skinAnalysis.js` y `src/routes/piel.js`).
4. **Resultado**: la IA (Claude, vía `ANTHROPIC_API_KEY`) describe únicamente características de la piel (hidratación, grasitud, poros, textura, tono) y sugiere hasta 5 productos del catálogo que matchean. Ese bloque de resultado tiene protecciones (sin selección de texto, sin clic derecho, sin arrastrar imágenes, bloqueo de atajos de copiar/imprimir/guardar) para desalentar copiarlo — **no es una protección técnica infalible** (nada evita una captura de pantalla del sistema operativo), pero cubre las formas normales de copiar/guardar/imprimir desde el navegador.
5. Botón **"¿Querés probar estos productos bajo tu absoluta responsabilidad?"** con **Sí / No**. "No" vuelve al inicio. "Sí" muestra el listado con precios para elegir.
6. La persona confirma **"Quiero tenerlo"**, vuelve a ver el descargo de responsabilidad, y completa nombre, teléfono y **dirección de envío**.
7. Al confirmar, el servicio crea el pedido (sin la foto) y muestra el **alias de transferencia** (`TRANSFER_ALIAS`) y un botón para mandar el comprobante por WhatsApp. Todo esto sin que el administrador tenga que hacer nada en el momento.
8. Vos ves los pedidos en `/pedidos.html` (dirección, teléfono, productos, total) y los vas marcando como "Pago confirmado" / "Enviado" a medida que los procesás.

### Configurar esta parte

En Railway (o tu `.env` local) agregá:

- `ANTHROPIC_API_KEY`: se genera en https://console.anthropic.com. Sin esto, el análisis de piel no funciona (el resto del panel de publicación sigue funcionando igual).
- `AI_MODEL`: dejalo en `claude-sonnet-5` salvo que quieras cambiarlo.
- `TRANSFER_ALIAS` / `TRANSFER_HOLDER_NAME`: alias de Mercado Pago/CBU que se le muestra a la clienta al confirmar el pedido.
- `WHATSAPP_OWNER_NUMBER` (ya existente): se usa también para el botón "Enviar comprobante por WhatsApp".

### Catálogo de productos (`/productos.html`)

El catálogo que la IA usa para recomendar viene con una selección inicial de productos Medicube (semilla en `src/products.js`), pero **vos editás precio, nombre, descripción, foto y disponibilidad** desde `/productos.html` en cualquier momento — se guarda en `data/products.json` y se refleja al instante en `/piel`. Las fotos van en `public/piel/img/products/` (hoy solo hay dos fotos reales cargadas; para el resto se muestra un placeholder hasta que cargues la imagen real).

## Estructura

```
automation-coca/
  src/
    index.js           servidor Express
    config.js           variables de entorno
    store.js             cola de contenido (archivo JSON)
    products.js          catálogo editable de productos (para /piel)
    orders.js             pedidos generados desde /piel (sin la selfie)
    skinAnalysis.js        análisis de piel con IA (Claude vision)
    whatsapp.js             bot de WhatsApp (Baileys)
    email.js                 ingesta por mail (IMAP)
    meta.js                    publicación en Instagram (Graph API)
    routes/api.js                endpoints del panel (cola, productos, pedidos)
    routes/piel.js                  endpoints públicos de /piel (analizar, pedido)
    routes/whatsappSetup.js          página con el QR de conexión
  public/                 panel web admin (cola, productos, pedidos)
  public/piel/             página pública de análisis de piel con IA
```
