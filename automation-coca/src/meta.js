import axios from 'axios';
import { config, isMetaConfigured, isPublicUrlConfigured } from './config.js';

const GRAPH_URL = 'https://graph.facebook.com/v20.0';

export function buildBuyLink(item) {
  if (!config.whatsappOwnerNumber) return '';
  const text = `Hola! Quiero comprar: ${item.description}${item.price != null ? ` - $${item.price}` : ''}`;
  return `https://wa.me/${config.whatsappOwnerNumber}?text=${encodeURIComponent(text)}`;
}

export function buildCaption(item) {
  const price = item.price != null ? `\n\n💰 Precio: $${item.price}` : '';
  const hashtags = config.cocaHashtags.map((h) => `#${h}`).join(' ');
  const buyLink = buildBuyLink(item);
  const buyLine = buyLink ? `\n\n😍 LO QUIERO COMPRAR YA 👉 ${buyLink}` : '';
  return `${item.description}${price}${buyLine}\n\n${hashtags}`.trim();
}

function mediaUrl(file) {
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
// siempre consigue uno valido.
async function getPageAccessToken() {
  try {
    const { data } = await axios.get(`${GRAPH_URL}/${config.metaPageId}`, {
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

async function createIgMediaContainer(media, pageAccessToken, { asCarouselItem }) {
  const url = mediaUrl(media.file);
  const params = { access_token: pageAccessToken };
  if (asCarouselItem) params.is_carousel_item = true;

  if (media.type === 'video') {
    params.media_type = asCarouselItem ? 'VIDEO' : 'REELS';
    params.video_url = url;
  } else {
    params.image_url = url;
  }

  const { data } = await axios.post(`${GRAPH_URL}/${config.metaIgUserId}/media`, null, { params });
  // Instagram tarda un rato en procesar el archivo (mas con video, pero
  // tambien con fotos): hay que esperar a que este "FINISHED" antes de
  // poder usarlo, sea para publicarlo solo o como parte de un carrusel.
  await waitUntilFinished(data.id, pageAccessToken);
  return data.id;
}

async function publishToInstagram(item, pageAccessToken) {
  const caption = buildCaption(item);

  try {
    let creationId;

    if (item.media.length > 1) {
      const childIds = [];
      for (const media of item.media) {
        childIds.push(await createIgMediaContainer(media, pageAccessToken, { asCarouselItem: true }));
      }
      const { data } = await axios.post(`${GRAPH_URL}/${config.metaIgUserId}/media`, null, {
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
      creationId = await createIgMediaContainer(item.media[0], pageAccessToken, { asCarouselItem: false });
    }

    const { data: published } = await axios.post(
      `${GRAPH_URL}/${config.metaIgUserId}/media_publish`,
      null,
      { params: { creation_id: creationId, access_token: pageAccessToken } },
    );

    return published.id;
  } catch (err) {
    throw describeGraphError(err, 'Instagram');
  }
}

/**
 * Publica un item en Instagram. Lanza error si falta configuracion de Meta
 * o si el servicio todavia no tiene una URL publica (necesaria para que
 * Meta pueda descargar el archivo).
 */
export async function publishItem(item) {
  if (!isPublicUrlConfigured()) {
    throw new Error(
      'Falta configurar PUBLIC_BASE_URL: Meta necesita una URL publica para descargar la foto/video.',
    );
  }
  if (!isMetaConfigured()) {
    throw new Error(
      'Falta configurar las credenciales de Meta (META_USER_TOKEN, META_PAGE_ID, META_IG_USER_ID).',
    );
  }

  const pageAccessToken = await getPageAccessToken();
  const igPostId = await publishToInstagram(item, pageAccessToken);
  return { igPostId };
}
