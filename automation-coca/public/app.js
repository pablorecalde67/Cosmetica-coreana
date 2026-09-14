const dropzone = document.getElementById('dropzone');
const fileInput = document.getElementById('fileInput');
const queueEl = document.getElementById('queue');

const STATUS_LABEL = {
  pending_price: 'Falta precio',
  ready: 'Listo para publicar',
  published: 'Publicado ✅',
  error: 'Error al publicar',
};

async function fetchQueue() {
  const res = await fetch('/api/queue');
  const items = await res.json();
  render(items);
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

function renderCard(item) {
  const card = document.createElement('div');
  card.className = 'card';

  const preview = document.createElement('div');
  preview.className = 'preview';
  if (item.mediaType === 'video') {
    preview.innerHTML = `<video src="/media/${item.mediaFile}" muted></video>`;
  } else {
    preview.innerHTML = `<img src="/media/${item.mediaFile}" alt="">`;
  }

  const fields = document.createElement('div');
  fields.className = 'fields';

  const badge = document.createElement('span');
  badge.className = `badge ${item.status}`;
  badge.textContent = `${STATUS_LABEL[item.status]} · ${item.source === 'whatsapp' ? 'WhatsApp' : 'Manual'}`;

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

    const priceRow = document.createElement('div');
    priceRow.className = 'price-row';

    const priceInput = document.createElement('input');
    priceInput.type = 'number';
    priceInput.min = '0';
    priceInput.step = '0.01';
    priceInput.placeholder = 'Precio $';

    const saveBtn = document.createElement('button');
    saveBtn.textContent = 'Guardar precio';
    saveBtn.onclick = async () => {
      if (!priceInput.value) {
        alert('Poné un precio antes de guardar.');
        return;
      }
      saveBtn.disabled = true;
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
    fields.append(desc, priceRow);
  } else {
    // ready / error / published: ya tiene precio. Mostramos el texto final
    // para copiar y publicar a mano en Meta Business Suite.
    const captionBox = document.createElement('textarea');
    captionBox.value = item.finalCaption || '';
    captionBox.readOnly = true;
    fields.appendChild(captionBox);

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

      const downloadLink = document.createElement('a');
      downloadLink.href = `/media/${item.mediaFile}`;
      downloadLink.download = item.mediaFile;
      downloadLink.textContent = '⬇️ Descargar archivo';
      downloadLink.style.alignSelf = 'center';

      const businessSuiteLink = document.createElement('a');
      businessSuiteLink.href = 'https://business.facebook.com/latest/composer';
      businessSuiteLink.target = '_blank';
      businessSuiteLink.rel = 'noopener';
      businessSuiteLink.textContent = '↗️ Abrir Meta Business Suite';
      businessSuiteLink.style.alignSelf = 'center';

      const markBtn = document.createElement('button');
      markBtn.textContent = 'Ya lo publiqué ✅';
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

      row.append(copyBtn, downloadLink, businessSuiteLink, markBtn, deleteBtn);
      fields.appendChild(row);
    }

    if (item.status === 'error' && item.error) {
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

  card.append(preview, fields);
  return card;
}

async function uploadFile(file) {
  const formData = new FormData();
  formData.append('file', file);
  await fetch('/api/upload', { method: 'POST', body: formData });
  fetchQueue();
}

dropzone.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', () => {
  if (fileInput.files[0]) uploadFile(fileInput.files[0]);
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
  const file = e.dataTransfer.files[0];
  if (file) uploadFile(file);
});

fetchQueue();
setInterval(fetchQueue, 4000);
