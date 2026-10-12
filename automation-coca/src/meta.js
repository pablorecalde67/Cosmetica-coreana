import axios from 'axios';
import { config, isPublicUrlConfigured } from './config.js';

const GRAPH_URL = 'https://graph.facebook.com/v20.0';

// Todos los precios se muestran en pesos argentinos, nunca en dólares
// (política del negocio): "AR$" deja esto inequívoco en vez de un "$" pelado
// que se podría leer como dólares.
function formatPrice(price) {
  return `AR$ ${new Intl.NumberFormat('es-AR').format(price)}`;
}

export function buildBuyLink(item) {
  if (!config.whatsappOwnerNumber) return '';
  const text = `Hola! Quiero comprar: ${item.description}${item.price != null ? ` - ${formatPrice(item.price)}` : ''}`;
  return `https://wa.me/${config.whatsappOwnerNumber}?text=${encodeURIComponent(text)}`;
}

// El link de wa.me completo (con toda la descripcion codificada) queda
// espantoso como texto plano en el posteo, y en Instagram el texto no es
// clickeable de todas formas: por eso el llamado a la accion es corto y el
// link de compra real va solo en la biografia (buildBuyLink sigue existiendo
// para que el panel te lo pueda mostrar/copiar aparte).
// `hashtags` es opcional: cada cuenta/marca (K-Beauty, Perfumes) tiene los
// suyos propios; si no se pasa ninguno, usa los de K-Beauty por compatibilidad.
export function buildCaption(item, hashtagList) {
  const price = item.price != null ? `\n\n💰 Precio: ${formatPrice(item.price)}` : '';
  const hashtags = (hashtagList || config.cocaHashtags).map((h) => `#${h}`).join(' ');
  const buyLine = config.whatsappOwnerNumber
    ? '\n\n😍 LO QUIERO COMPRAR YA 👉 escribinos por WhatsApp, link en la bio'
    : '';
  return `${item.description}${price}${buyLine}\n\n${hashtags}`.trim();
}

// `file` suele ser el nombre de un archivo que vive en nuestro MEDIA_DIR
// (WhatsApp/mail/manual), pero el catálogo de perfumes trae fotos ya
// alojadas en otros sitios (links completos): en ese caso se usan tal cual,
// Meta las descarga directo de ahí.
function mediaUrl(file) {
  if (/^https?:\/\//i.test(file)) return file;
  return `${config.publicBaseUrl}/media/${file}`;
}

// axios solo dice "Request failed with status code 400"; Meta manda el
// motivo real adentro del cuerpo de la respuesta. Esto lo rescata para que
// el panel muestre algo util en vez del codigo pelado.
function describeGraphError(err, platform) {
  const graphError = err.response?.data?.error;
  if (graphError) {
    const parts = [graphError.message];
    if (graphError.error_user_msg) parts.push(graphError.error_user_msg);
    if (graphError.code) parts.push(`(código ${graphError.code}${graphError.error_subcode ? '/' + graphError.error_subcode : ''})`);
    return new Error(`${platform}: ${parts.filter(Boolean).join(' — ')}`);
  }
  return new Error(`${platform}: ${err.message}`);
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Calcula el token de la Pagina a partir del token de usuario de larga
// duracion. Asi no hace falta ir a buscar/renovar el token de la Pagina a
// mano nunca mas: mientras el token de usuario siga vigente (60 dias), esto
// siempre consigue uno valido. Sirve para cualquier Pagina (K-Beauty o
// Perfumes) que administre este token de usuario.
async function getPageAccessToken(pageId) {
  try {
    const { data } = await axios.get(`${GRAPH_URL}/${pageId}`, {
      params: { fields: 'access_token', access_token: config.metaUserToken },
    });
    return data.access_token;
  } catch (err) {
    throw describeGraphError(err, 'Meta (token de la Página)');
  }
}

async function waitUntilFinished(creationId, pageAccessToken) {
  for (let i = 0; i < 30; i++) {
    const { data: status } = await axios.get(`${GRAPH_URL}/${creationId}`, {
      params: { fields: 'status_code', access_token: pageAccessToken },
    });
    if (status.status_code === 'FINISHED') return;
    if (status.status_code === 'ERROR') {
      throw new Error('Instagram no pudo procesar uno de los archivos.');
    }
    await sleep(4000);
  }
}

async function createIgMediaContainer(media, pageAccessToken, igUserId, { asCarouselItem }) {
  const url = mediaUrl(media.file);
  const params = { access_token: pageAccessToken };
  if (asCarouselItem) params.is_carousel_item = true;

  if (media.type === 'video') {
    params.media_type = asCarouselItem ? 'VIDEO' : 'REELS';
    params.video_url = url;
  } else {
    params.image_url = url;
  }

  const { data } = await axios.post(`${GRAPH_URL}/${igUserId}/media`, null, { params });
  // Instagram tarda un rato en procesar el archivo (mas con video, pero
  // tambien con fotos): hay que esperar a que este "FINISHED" antes de
  // poder usarlo, sea para publicarlo solo o como parte de un carrusel.
  await waitUntilFinished(data.id, pageAccessToken);
  return data.id;
}

async function publishToInstagram(item, pageAccessToken, igUserId, hashtagList) {
  const caption = buildCaption(item, hashtagList);

  try {
    let creationId;

    if (item.media.length > 1) {
      const childIds = [];
      for (const media of item.media) {
        childIds.push(await createIgMediaContainer(media, pageAccessToken, igUserId, { asCarouselItem: true }));
      }
      const { data } = await axios.post(`${GRAPH_URL}/${igUserId}/media`, null, {
        params: {
          media_type: 'CAROUSEL',
          children: childIds.join(','),
          caption,
          access_token: pageAccessToken,
        },
      });
      creationId = data.id;
      await waitUntilFinished(creationId, pageAccessToken);
    } else {
      creationId = await createIgMediaContainer(item.media[0], pageAccessToken, igUserId, { asCarouselItem: false });
    }

    const { data: published } = await axios.post(
      `${GRAPH_URL}/${igUserId}/media_publish`,
      null,
      { params: { creation_id: creationId, access_token: pageAccessToken } },
    );

    return published.id;
  } catch (err) {
    throw describeGraphError(err, 'Instagram');
  }
}

/**
 * Publica un item en Instagram. Por defecto usa la cuenta de K-Beauty; para
 * publicar en otra marca (ej. Perfumes) pasar `account`: { pageId, igUserId,
 * hashtags }. Lanza error si falta configuracion de Meta o si el servicio
 * todavia no tiene una URL publica (necesaria para que Meta pueda descargar
 * el archivo).
 */
export async function publishItem(item, account) {
  const pageId = account?.pageId || config.metaPageId;
  const igUserId = account?.igUserId || config.metaIgUserId;

  if (!isPublicUrlConfigured()) {
    throw new Error(
      'Falta configurar PUBLIC_BASE_URL: Meta necesita una URL publica para descargar la foto/video.',
    );
  }
  if (!config.metaUserToken || !pageId || !igUserId) {
    throw new Error(
      'Falta configurar las credenciales de Meta para esta cuenta (META_USER_TOKEN, página e IG user id).',
    );
  }

  const pageAccessToken = await getPageAccessToken(pageId);
  const igPostId = await publishToInstagram(item, pageAccessToken, igUserId, account?.hashtags);
  return { igPostId };
}
