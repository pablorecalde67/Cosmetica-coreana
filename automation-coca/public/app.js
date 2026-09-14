const dropzone = document.getElementById('dropzone');
const fileInput = document.getElementById('fileInput');
const queueEl = document.getElementById('queue');

const STATUS_LABEL = {
  pending_price: 'Falta precio',
  ready: 'Publicando...',
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

  const desc = document.createElement('textarea');
  desc.placeholder = 'Descripción para el posteo...';
  desc.value = item.description || '';
  desc.disabled = item.status === 'published';

  const priceRow = document.createElement('div');
  priceRow.className = 'price-row';

  const priceInput = document.createElement('input');
  priceInput.type = 'number';
  priceInput.min = '0';
  priceInput.step = '0.01';
  priceInput.placeholder = 'Precio $';
  if (item.price != null) priceInput.value = item.price;
  priceInput.disabled = item.status === 'published';

  const publishBtn = document.createElement('button');
  publishBtn.textContent = item.status === 'error' ? 'Reintentar publicar' : 'Guardar y publicar';
  publishBtn.disabled = item.status === 'published';
  publishBtn.onclick = async () => {
    if (!priceInput.value) {
      alert('Poné un precio antes de publicar.');
      return;
    }
    publishBtn.disabled = true;
    publishBtn.textContent = 'Publicando...';
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

  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'secondary';
  deleteBtn.textContent = 'Descartar';
  deleteBtn.onclick = async () => {
    if (!confirm('¿Descartar este contenido?')) return;
    await fetch(`/api/queue/${item.id}`, { method: 'DELETE' });
    fetchQueue();
  };

  priceRow.append(priceInput, publishBtn, deleteBtn);
  fields.append(badge, desc, priceRow);

  if (item.status === 'error' && item.error) {
    const errText = document.createElement('p');
    errText.className = 'error-text';
    errText.textContent = item.error;
    fields.appendChild(errText);
  }

  if (item.status === 'published') {
    const links = document.createElement('p');
    links.style.fontSize = '0.85rem';
    links.textContent = 'Ya está publicado en Instagram y Facebook.';
    fields.appendChild(links);
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
