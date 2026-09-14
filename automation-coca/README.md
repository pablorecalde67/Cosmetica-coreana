# COCA — automatización de Instagram + Facebook

Servicio que:

1. Recibe automáticamente las fotos/videos que llegan por WhatsApp (canales/chats que vos elijas).
2. Te avisa por WhatsApp cuando hay contenido nuevo esperando precio.
3. Vos entrás al panel web, ponés precio y descripción.
4. El panel te arma el texto final (descripción + precio + hashtags) listo para copiar, y vos lo publicás con un clic en **Meta Business Suite** — la app oficial de Meta para manejar Instagram y Facebook juntos, sin nada técnico.

También podés arrastrar fotos/videos manuales directamente en el panel (no todo tiene que venir de WhatsApp).

> Existe una versión que publica 100% sola (sin que tengas que apretar nada en Business Suite), pero requiere crear una app en Meta for Developers y sacar tokens de la API — un trámite bastante más largo. Quedó armada y lista en `src/meta.js` por si más adelante querés dar ese paso (ver **"Modo 100% automático"** al final). Por ahora el sistema usa el camino corto.

## Lo que tenés que hacer VOS antes de que esto funcione

Esto no lo puede hacer un asistente de código por vos porque Meta y WhatsApp exigen que sea el dueño real de las cuentas quien las cree y autorice.

### 1. Crear las páginas y vincularlas en Meta Business Suite

- Creá una **Página de Facebook** (ya tenés: COCA Beauty).
- Creá una cuenta de **Instagram profesional** (ya tenés: CocabeautyCDE) y vinculala a esa Página.
- Entrá a **business.facebook.com**, iniciá sesión, y confirmá que ahí aparecen las dos cuentas conectadas (Página + Instagram). Si no aparecen, desde ahí mismo hay un botón para conectarlas — es todo con clics normales, sin tokens.

> Nota sobre "viralizar entre mujeres desde 12 años": las publicaciones orgánicas (posts normales) no tienen segmentación por edad/género — eso solo existe en anuncios pagos (Meta Ads), y Meta restringe fuerte la publicidad a menores. Lo que este servicio automatiza es la constancia y calidad de la publicación (buenos hashtags, formato Reels, horarios), que es lo que realmente ayuda al alcance orgánico. Si más adelante querés sumar anuncios pagos segmentados, es un paso aparte (cuenta publicitaria + presupuesto).

### 2. Deploy en Railway

1. Subí este repo (o al menos la carpeta `automation-coca/`) a Railway como un nuevo proyecto Node.
2. Agregá un **volumen persistente** montado en `/app/automation-coca/data` (para no perder la sesión de WhatsApp ni el historial al reiniciar).
3. Cargá las variables de `.env.example` (para el modo simple, con dejar `WHATSAPP_OWNER_NUMBER` y `COCA_HASHTAGS` alcanza; el resto son solo para el modo 100% automático).
4. Una vez deployado, copiá la URL pública que te da Railway y ponela en `PUBLIC_BASE_URL`.

### 3. Conectar tu WhatsApp

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

1. Te llega una foto/video por un canal de WhatsApp que estás siguiendo → el bot la descarga sola y te manda un WhatsApp avisando. Si mandan varias fotos seguidas del mismo producto, quedan agrupadas en una sola tarjeta (espera 3 segundos sin fotos nuevas antes de armar la tarjeta).
2. Abrís el panel, ves las fotos/video, escribís la descripción y el precio, tocás **Guardar precio**. Si te faltó agregar alguna foto, podés sumarla antes con **"+ Agregar otra foto/video a esta publicación"**.
3. La tarjeta pasa a "Listo para publicar" con el texto final armado (descripción + precio + botón "Lo quiero comprar ya" con tu WhatsApp + hashtags).
4. Tocás **Copiar texto**, descargás los archivos y **Abrí Meta Business Suite** (te lleva directo al compositor). Pegás el texto, subís los archivos descargados (si son varios, Business Suite arma el carrusel), publicás en Instagram y Facebook desde ahí.
5. Volvés al panel y tocás **Ya lo publiqué ✅** para sacarlo de la cola.

**Sobre el botón "Lo quiero comprar ya":** es un link de WhatsApp (`wa.me`) con tu número. En **Facebook** funciona como link tocable de verdad dentro del texto del posteo — cuando alguien lo toca y te escribe, te llega el mensaje con su número real, sin nada más que configurar. En **Instagram los links del texto no son tocables** (limitación de la plataforma): ese mismo link también te lo arma el panel para copiar y pegarlo como el link fijo de tu biografía de Instagram, agregando en el texto del posteo algo como "Lo quiero comprar ya 👉 link en la bio".

## Modo 100% automático (opcional, más adelante)

Si en algún momento querés que se publique solo, sin el paso de Business Suite:

1. Creá una app en https://developers.facebook.com/apps (tipo "Otro" → caso de uso "Empresa").
2. Agregale el producto **Instagram Graph API** (y **Facebook Login for Business** si aparece disponible).
3. Sacá un token con los permisos `pages_show_list`, `pages_read_engagement`, `pages_manage_posts`, `instagram_basic`, `instagram_content_publish` (desde el Explorador de Graph API o desde la guía de configuración que trae el producto de Instagram dentro de la app).
4. Convertilo en token de larga duración y cargá en Railway:
   - `META_ACCESS_TOKEN` = el token de la página.
   - `META_PAGE_ID` = ID de la Página.
   - `META_IG_USER_ID` = ID de la cuenta de Instagram Business (`GET /{page-id}?fields=instagram_business_account&access_token=...`).
5. Con esas tres variables cargadas, el panel vuelve a publicar solo apenas guardás el precio — no hace falta cambiar nada más en el código.

## Estructura

```
automation-coca/
  src/
    index.js           servidor Express
    config.js           variables de entorno
    store.js             cola de contenido (archivo JSON)
    whatsapp.js           bot de WhatsApp (Baileys)
    meta.js                publicación en Instagram/Facebook (Graph API, modo automático opcional)
    routes/api.js           endpoints del panel
    routes/whatsappSetup.js  página con el QR de conexión
  public/                 panel web (drag&drop + cola + precio + copiar/publicar)
```
