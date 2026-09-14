import axios from 'axios';
import { config, isMetaConfigured, isPublicUrlConfigured } from './config.js';

const GRAPH_URL = 'https://graph.facebook.com/v20.0';

function buildCaption(item) {
  const price = item.price != null ? `\n\n💰 Precio: $${item.price}` : '';
  const hashtags = config.cocaHashtags.map((h) => `#${h}`).join(' ');
  return `${item.description}${price}\n\n${hashtags}`.trim();
}

function mediaUrl(item) {
  return `${config.publicBaseUrl}/media/${item.mediaFile}`;
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function publishToInstagram(item) {
  const caption = buildCaption(item);
  const url = mediaUrl(item);

  const createParams = {
    caption,
    access_token: config.metaAccessToken,
  };
  if (item.mediaType === 'video') {
    createParams.media_type = 'REELS';
    createParams.video_url = url;
  } else {
    createParams.image_url = url;
  }

  const { data: created } = await axios.post(
    `${GRAPH_URL}/${config.metaIgUserId}/media`,
    null,
    { params: createParams },
  );
  const creationId = created.id;

  if (item.mediaType === 'video') {
    // Los videos/reels se procesan de forma asincronica del lado de Meta.
    for (let i = 0; i < 30; i++) {
      const { data: status } = await axios.get(`${GRAPH_URL}/${creationId}`, {
        params: { fields: 'status_code', access_token: config.metaAccessToken },
      });
      if (status.status_code === 'FINISHED') break;
      if (status.status_code === 'ERROR') {
        throw new Error('Instagram no pudo procesar el video.');
      }
      await sleep(4000);
    }
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
  const url = mediaUrl(item);

  if (item.mediaType === 'video') {
    const { data } = await axios.post(
      `${GRAPH_URL}/${config.metaPageId}/videos`,
      null,
      {
        params: {
          file_url: url,
          description: caption,
          access_token: config.metaAccessToken,
        },
      },
    );
    return data.id;
  }

  const { data } = await axios.post(
    `${GRAPH_URL}/${config.metaPageId}/photos`,
    null,
    {
      params: {
        url,
        caption,
        access_token: config.metaAccessToken,
      },
    },
  );
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
