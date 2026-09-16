const dropzone = document.getElementById('dropzone');
const fileInput = document.getElementById('fileInput');
const queueEl = document.getElementById('queue');
const statusBanner = document.getElementById('statusBanner');

const STATUS_LABEL = {
  pending_price: 'Falta precio',
  ready: 'Listo para publicar',
  published: 'Publicado ✅',
  partial: 'Publicado parcial ⚠️',
  error: 'Error al publicar',
};

async function fetchQueue() {
  // Si estás escribiendo en un campo de la cola, no lo pisamos con el refresco
  // automático: esperamos a que termines (salgas del campo) para actualizar.
  if (queueEl.contains(document.activeElement)) return;

  const res = await fetch('/api/queue');
  const items = await res.json();
  render(items);
}

async function refreshStatusBanner() {
  const res = await fetch('/api/status');
  const { metaConfigured } = await res.json();
  if (metaConfigured) {
    statusBanner.hidden = true;
  } else {
    statusBanner.hidden = false;
    statusBanner.textContent =
      '🔧 PUBLICAR todavía no publica solo: falta autorizar una vez la conexión con Meta (Instagram/Facebook). Mientras eso no esté, cada tarjeta te va a dar el texto y las fotos listas para publicar vos mismo en Meta Business Suite.';
  }
}

function render(items) {
  queueEl.innerHTML = '';
  if (items.length === 0) {
    queueEl.innerHTML = '<p style="text-align:center;opacity:.6">No hay contenido en cola por ahora.</p>';
    return;
  }

  for (const item of items) {
    queueEl.appendChild(renderCard(item));
  }
}

function renderGallery(item) {
  const gallery = document.createElement('div');
  gallery.className = 'gallery';

  for (const media of item.media) {
    const thumb = document.createElement('div');
    thumb.className = 'thumb';
    if (media.type === 'video') {
      thumb.innerHTML = `<video src="/media/${media.file}" muted></video>`;
    } else {
      thumb.innerHTML = `<img src="/media/${media.file}" alt="">`;
    }
    gallery.appendChild(thumb);
  }

  return gallery;
}

function renderCard(item) {
  const card = document.createElement('div');
  card.className = 'card';

  const fields = document.createElement('div');
  fields.className = 'fields';

  const badge = document.createElement('span');
  badge.className = `badge ${item.status}`;
  const countLabel = item.media.length > 1 ? ` · ${item.media.length} fotos` : '';
  badge.textContent = `${STATUS_LABEL[item.status]} · ${item.source === 'whatsapp' ? 'WhatsApp' : 'Manual'}${countLabel}`;

  fields.appendChild(badge);

  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'secondary';
  deleteBtn.textContent = 'Descartar';
  deleteBtn.onclick = async () => {
    if (!confirm('¿Descartar este contenido?')) return;
    await fetch(`/api/queue/${item.id}`, { method: 'DELETE' });
    fetchQueue();
  };

  if (item.status === 'pending_price') {
    const desc = document.createElement('textarea');
    desc.placeholder = 'Descripción para el posteo...';
    desc.value = item.description || '';

    const addMoreBtn = document.createElement('button');
    addMoreBtn.className = 'secondary';
    addMoreBtn.textContent = '+ Agregar otra foto/video a esta publicación';
    addMoreBtn.onclick = () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*,video/*';
      input.multiple = true;
      input.onchange = async () => {
        if (!input.files.length) return;
        const formData = new FormData();
        for (const f of input.files) formData.append('files', f);
        await fetch(`/api/queue/${item.id}/add-media`, { method: 'POST', body: formData });
        fetchQueue();
      };
      input.click();
    };

    const priceRow = document.createElement('div');
    priceRow.className = 'price-row';

    const priceInput = document.createElement('input');
    priceInput.type = 'number';
    priceInput.min = '0';
    priceInput.step = '0.01';
    priceInput.placeholder = 'Precio $';

    const saveBtn = document.createElement('button');
    saveBtn.className = 'publish-btn';
    saveBtn.textContent = 'PUBLICAR';
    saveBtn.onclick = async () => {
      if (!priceInput.value) {
        alert('Poné un precio antes de publicar.');
        return;
      }
      saveBtn.disabled = true;
      saveBtn.textContent = 'Publicando...';
      try {
        const res = await fetch(`/api/queue/${item.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ description: desc.value, price: priceInput.value }),
        });
        if (!res.ok) throw new Error((await res.json()).error);
      } catch (err) {
        alert('Error: ' + err.message);
      }
      fetchQueue();
    };

    priceRow.append(priceInput, saveBtn, deleteBtn);
    fields.append(desc, addMoreBtn, priceRow);
  } else {
    // ready / error / published: ya tiene precio. Mostramos el texto final
    // para copiar y publicar a mano en Meta Business Suite.
    const captionBox = document.createElement('textarea');
    captionBox.value = item.finalCaption || '';
    captionBox.readOnly = true;
    fields.appendChild(captionBox);

    if (item.buyLink) {
      const buyNote = document.createElement('p');
      buyNote.className = 'buy-note';
      buyNote.innerHTML =
        '💬 Botón "Lo quiero comprar ya": funciona como link tocable si lo pegás en el texto de <strong>Facebook</strong>. ' +
        'En <strong>Instagram</strong> los links del texto no son tocables — poné este mismo link como el link fijo de tu biografía.';
      fields.appendChild(buyNote);

      const buyRow = document.createElement('div');
      buyRow.className = 'row';
      const buyLinkBox = document.createElement('input');
      buyLinkBox.type = 'text';
      buyLinkBox.readOnly = true;
      buyLinkBox.value = item.buyLink;
      buyLinkBox.className = 'buy-link-box';
      const copyBuyBtn = document.createElement('button');
      copyBuyBtn.className = 'secondary';
      copyBuyBtn.textContent = '📋 Copiar link de compra';
      copyBuyBtn.onclick = async () => {
        try {
          await navigator.clipboard.writeText(item.buyLink);
          copyBuyBtn.textContent = '✅ Copiado';
          setTimeout(() => (copyBuyBtn.textContent = '📋 Copiar link de compra'), 1800);
        } catch {
          buyLinkBox.select();
        }
      };
      buyRow.append(buyLinkBox, copyBuyBtn);
      fields.appendChild(buyRow);
    }

    if (item.status !== 'published') {
      const row = document.createElement('div');
      row.className = 'row';

      const copyBtn = document.createElement('button');
      copyBtn.textContent = '📋 Copiar texto';
      copyBtn.onclick = async () => {
        try {
          await navigator.clipboard.writeText(item.finalCaption || '');
          copyBtn.textContent = '✅ Copiado';
          setTimeout(() => (copyBtn.textContent = '📋 Copiar texto'), 1800);
        } catch {
          alert('No se pudo copiar. Mantené presionado el texto de arriba para copiarlo manualmente.');
        }
      };

      const downloadLinks = document.createElement('div');
      downloadLinks.className = 'download-links';
      item.media.forEach((media, i) => {
        const a = document.createElement('a');
        a.href = `/media/${media.file}`;
        a.download = media.file;
        a.textContent = item.media.length > 1 ? `⬇️ Archivo ${i + 1}` : '⬇️ Descargar archivo';
        downloadLinks.appendChild(a);
      });

      const businessSuiteLink = document.createElement('a');
      businessSuiteLink.href = 'https://business.facebook.com/latest/composer';
      businessSuiteLink.target = '_blank';
      businessSuiteLink.rel = 'noopener';
      businessSuiteLink.textContent = '↗️ Abrir Meta Business Suite';
      businessSuiteLink.style.alignSelf = 'center';

      const markBtn = document.createElement('button');
      markBtn.textContent = 'Marcar como publicado ✅';
      markBtn.onclick = async () => {
        markBtn.disabled = true;
        try {
          const res = await fetch(`/api/queue/${item.id}/mark-published`, { method: 'POST' });
          if (!res.ok) throw new Error((await res.json()).error);
        } catch (err) {
          alert('Error: ' + err.message);
        }
        fetchQueue();
      };

      row.append(copyBtn, downloadLinks, businessSuiteLink, markBtn, deleteBtn);

      // Reintentar automático solo tiene sentido si fallaron las DOS
      // plataformas: si una ya se publicó (estado "partial"), reintentar
      // la volvería a publicar duplicada.
      if (item.status === 'error' && item.metaConfigured) {
        const retryBtn = document.createElement('button');
        retryBtn.className = 'publish-btn';
        retryBtn.textContent = '🔁 Reintentar automático';
        retryBtn.onclick = async () => {
          retryBtn.disabled = true;
          retryBtn.textContent = 'Publicando...';
          try {
            const res = await fetch(`/api/queue/${item.id}/publish`, { method: 'POST' });
            if (!res.ok) throw new Error((await res.json()).error);
          } catch (err) {
            alert('Error: ' + err.message);
          }
          fetchQueue();
        };
        row.appendChild(retryBtn);
      }

      fields.appendChild(row);
    }

    if ((item.status === 'error' || item.status === 'partial') && item.error) {
      const errText = document.createElement('p');
      errText.className = 'error-text';
      errText.textContent = item.error;
      fields.appendChild(errText);
    }

    if (item.status === 'published') {
      const links = document.createElement('p');
      links.style.fontSize = '0.85rem';
      links.textContent = 'Marcado como publicado.';
      fields.appendChild(links);
    }
  }

  card.append(renderGallery(item), fields);
  return card;
}

async function uploadFiles(files) {
  const formData = new FormData();
  for (const f of files) formData.append('files', f);
  await fetch('/api/upload', { method: 'POST', body: formData });
  fetchQueue();
}

dropzone.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', () => {
  if (fileInput.files.length) uploadFiles(fileInput.files);
  fileInput.value = '';
});

['dragenter', 'dragover'].forEach((evt) =>
  dropzone.addEventListener(evt, (e) => {
    e.preventDefault();
    dropzone.classList.add('drag-over');
  }),
);
['dragleave', 'drop'].forEach((evt) =>
  dropzone.addEventListener(evt, (e) => {
    e.preventDefault();
    dropzone.classList.remove('drag-over');
  }),
);
dropzone.addEventListener('drop', (e) => {
  if (e.dataTransfer.files.length) uploadFiles(e.dataTransfer.files);
});

refreshStatusBanner();
fetchQueue();
setInterval(fetchQueue, 4000);
setInterval(refreshStatusBanner, 15000);
