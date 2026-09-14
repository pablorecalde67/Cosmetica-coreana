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

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitUntilFinished(creationId) {
  for (let i = 0; i < 30; i++) {
    const { data: status } = await axios.get(`${GRAPH_URL}/${creationId}`, {
      params: { fields: 'status_code', access_token: config.metaAccessToken },
    });
    if (status.status_code === 'FINISHED') return;
    if (status.status_code === 'ERROR') {
      throw new Error('Instagram no pudo procesar uno de los archivos.');
    }
    await sleep(4000);
  }
}

async function createIgMediaContainer(media, { asCarouselItem }) {
  const url = mediaUrl(media.file);
  const params = { access_token: config.metaAccessToken };
  if (asCarouselItem) params.is_carousel_item = true;

  if (media.type === 'video') {
    params.media_type = asCarouselItem ? 'VIDEO' : 'REELS';
    params.video_url = url;
  } else {
    params.image_url = url;
  }

  const { data } = await axios.post(`${GRAPH_URL}/${config.metaIgUserId}/media`, null, { params });
  if (media.type === 'video') await waitUntilFinished(data.id);
  return data.id;
}

async function publishToInstagram(item) {
  const caption = buildCaption(item);
  let creationId;

  if (item.media.length > 1) {
    const childIds = [];
    for (const media of item.media) {
      childIds.push(await createIgMediaContainer(media, { asCarouselItem: true }));
    }
    const { data } = await axios.post(`${GRAPH_URL}/${config.metaIgUserId}/media`, null, {
      params: {
        media_type: 'CAROUSEL',
        children: childIds.join(','),
        caption,
        access_token: config.metaAccessToken,
      },
    });
    creationId = data.id;
  } else {
    creationId = await createIgMediaContainer(item.media[0], { asCarouselItem: false });
  }

  const { data: published } = await axios.post(
    `${GRAPH_URL}/${config.metaIgUserId}/media_publish`,
    null,
    { params: { creation_id: creationId, access_token: config.metaAccessToken } },
  );

  return published.id;
}

async function publishToFacebook(item) {
  const caption = buildCaption(item);

  if (item.media.length > 1) {
    const attachedMedia = [];
    for (const media of item.media) {
      if (media.type === 'video') {
        const { data } = await axios.post(`${GRAPH_URL}/${config.metaPageId}/videos`, null, {
          params: { file_url: mediaUrl(media.file), published: false, access_token: config.metaAccessToken },
        });
        attachedMedia.push({ media_fbid: data.id });
      } else {
        const { data } = await axios.post(`${GRAPH_URL}/${config.metaPageId}/photos`, null, {
          params: { url: mediaUrl(media.file), published: false, access_token: config.metaAccessToken },
        });
        attachedMedia.push({ media_fbid: data.id });
      }
    }
    const { data } = await axios.post(`${GRAPH_URL}/${config.metaPageId}/feed`, null, {
      params: {
        message: caption,
        attached_media: JSON.stringify(attachedMedia),
        access_token: config.metaAccessToken,
      },
    });
    return data.id;
  }

  const media = item.media[0];
  if (media.type === 'video') {
    const { data } = await axios.post(`${GRAPH_URL}/${config.metaPageId}/videos`, null, {
      params: { file_url: mediaUrl(media.file), description: caption, access_token: config.metaAccessToken },
    });
    return data.id;
  }

  const { data } = await axios.post(`${GRAPH_URL}/${config.metaPageId}/photos`, null, {
    params: { url: mediaUrl(media.file), caption, access_token: config.metaAccessToken },
  });
  return data.id;
}

/**
 * Publica un item en Instagram y Facebook. Lanza error si falta configuracion
 * de Meta o si el servicio todavia no tiene una URL publica (necesaria para
 * que Meta pueda descargar el archivo).
 */
export async function publishItem(item) {
  if (!isPublicUrlConfigured()) {
    throw new Error(
      'Falta configurar PUBLIC_BASE_URL: Meta necesita una URL publica para descargar la foto/video.',
    );
  }
  if (!isMetaConfigured()) {
    throw new Error(
      'Falta configurar las credenciales de Meta (META_ACCESS_TOKEN, META_PAGE_ID, META_IG_USER_ID).',
    );
  }

  const [igPostId, fbPostId] = await Promise.all([
    publishToInstagram(item),
    publishToFacebook(item),
  ]);

  return { igPostId, fbPostId };
}
