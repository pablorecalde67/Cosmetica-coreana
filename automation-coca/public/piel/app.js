const $ = (id) => document.getElementById(id);

const state = {
  capturedDataUrl: null,
  analysis: null, // { skinType, concerns, resumen, detalles, advertencia, recommendations }
  selectedIds: new Set(),
  stream: null,
};

let currentScreen = 'screen-home';

function showScreen(id) {
  document.querySelectorAll('.screen').forEach((el) => el.classList.remove('active'));
  $(id).classList.add('active');
  currentScreen = id;
  window.scrollTo(0, 0);
  if (id !== 'screen-camera') stopCamera();
}

document.querySelectorAll('[data-back]').forEach((btn) => {
  btn.addEventListener('click', () => showScreen(btn.dataset.back));
});

function money(n) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n || 0);
}

// ---------- Home → Consent ----------
$('btn-start').addEventListener('click', () => showScreen('screen-consent'));

$('chk-consent').addEventListener('change', (e) => {
  $('btn-open-camera').disabled = !e.target.checked;
});

$('btn-open-camera').addEventListener('click', () => {
  showScreen('screen-camera');
  startCamera();
});

// ---------- Camera ----------
async function startCamera() {
  $('camera-error').hidden = true;
  $('preview').hidden = true;
  $('video').hidden = false;
  $('camera-actions').hidden = false;
  $('preview-actions').hidden = true;
  state.capturedDataUrl = null;

  try {
    state.stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user', width: { ideal: 720 }, height: { ideal: 960 } },
      audio: false,
    });
    $('video').srcObject = state.stream;
  } catch (err) {
    $('camera-error').hidden = false;
    $('camera-error').textContent =
      'No pudimos acceder a tu cámara. Revisá los permisos del navegador e intentá de nuevo.';
  }
}

function stopCamera() {
  if (state.stream) {
    state.stream.getTracks().forEach((t) => t.stop());
    state.stream = null;
  }
}

$('btn-capture').addEventListener('click', () => {
  const video = $('video');
  const canvas = $('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  canvas.getContext('2d').drawImage(video, 0, 0);
  state.capturedDataUrl = canvas.toDataURL('image/jpeg', 0.9);

  $('preview').src = state.capturedDataUrl;
  $('preview').hidden = false;
  $('video').hidden = true;
  $('camera-actions').hidden = true;
  $('preview-actions').hidden = false;
  stopCamera();
});

$('btn-retake').addEventListener('click', () => startCamera());

$('btn-analyze').addEventListener('click', async () => {
  if (!state.capturedDataUrl) return;
  showScreen('screen-loading');

  try {
    const res = await fetch('/api/piel/analizar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageBase64: state.capturedDataUrl,
        consent: true,
        disclaimer: true,
      }),
    });
    const data = await res.json();
    // La foto ya cumplió su función: la borramos de memoria del lado del cliente.
    state.capturedDataUrl = null;

    if (!res.ok) throw new Error(data.error || 'No se pudo analizar la imagen.');

    if (!data.ok) {
      alert(data.resumen || 'No pudimos identificar tu piel con claridad. Probá con más luz y de frente.');
      showScreen('screen-camera');
      startCamera();
      return;
    }

    state.analysis = data;
    renderResult(data);
    showScreen('screen-result');
  } catch (err) {
    alert('Error: ' + err.message);
    showScreen('screen-camera');
    startCamera();
  }
});

// ---------- Result ----------
function renderResult(data) {
  $('res-skintype').textContent = `Piel ${data.skinType}`;
  $('res-resumen').textContent = data.resumen || '';

  const detallesEl = $('res-detalles');
  detallesEl.innerHTML = '';
  if (data.detalles) {
    const labels = { hidratacion: 'Hidratación', grasitud: 'Grasitud', poros: 'Poros', textura: 'Textura', tono: 'Tono' };
    for (const [key, label] of Object.entries(labels)) {
      if (!data.detalles[key]) continue;
      const li = document.createElement('li');
      li.innerHTML = `<b>${label}:</b> ${data.detalles[key]}`;
      detallesEl.appendChild(li);
    }
  }

  const advEl = $('res-advertencia');
  if (data.advertencia) {
    advEl.hidden = false;
    advEl.textContent = '⚠️ ' + data.advertencia;
  } else {
    advEl.hidden = true;
  }

  const grid = $('res-productos');
  grid.innerHTML = '';
  state.selectedIds = new Set(data.recommendations.map((p) => p.id));
  for (const p of data.recommendations) {
    grid.appendChild(productCard(p));
  }
}

function productCard(p) {
  const card = document.createElement('div');
  card.className = 'product-card';
  card.innerHTML = `
    <div class="thumb"><img src="${p.image}" alt="" onerror="this.src='/piel/img/placeholder.svg'" draggable="false"></div>
    <div class="info">
      <p class="name">${p.name}</p>
      <p class="desc">${p.description}</p>
      <p class="price">${money(p.price)}</p>
    </div>`;
  return card;
}

// Mejor esfuerzo para desalentar copiar/guardar/imprimir el informe (no es
// una protección técnica infalible, un dispositivo siempre puede sacar una
// captura de pantalla del sistema operativo).
const informe = $('informe');
informe.addEventListener('contextmenu', (e) => e.preventDefault());
informe.addEventListener('dragstart', (e) => e.preventDefault());
informe.addEventListener('copy', (e) => e.preventDefault());
document.addEventListener('keydown', (e) => {
  if (currentScreen !== 'screen-result') return;
  const blocked = (e.ctrlKey || e.metaKey) && ['p', 's', 'c', 'u'].includes(e.key.toLowerCase());
  if (blocked) e.preventDefault();
});

// ---------- Yes / No ----------
$('btn-no').addEventListener('click', () => {
  state.analysis = null;
  showScreen('screen-home');
});

$('btn-yes').addEventListener('click', () => {
  renderSelect();
  showScreen('screen-select');
});

// ---------- Select products ----------
function renderSelect() {
  const list = $('select-productos');
  list.innerHTML = '';
  for (const p of state.analysis.recommendations) {
    const row = document.createElement('label');
    row.className = 'select-item';
    row.innerHTML = `
      <input type="checkbox" data-id="${p.id}" ${state.selectedIds.has(p.id) ? 'checked' : ''}>
      <div class="thumb"><img src="${p.image}" alt="" onerror="this.src='/piel/img/placeholder.svg'"></div>
      <div class="info">
        <div class="name">${p.name}</div>
        <div class="price">${money(p.price)}</div>
      </div>`;
    row.querySelector('input').addEventListener('change', (e) => {
      if (e.target.checked) state.selectedIds.add(p.id);
      else state.selectedIds.delete(p.id);
      updateTotal();
    });
    list.appendChild(row);
  }
  updateTotal();
}

function updateTotal() {
  const total = state.analysis.recommendations
    .filter((p) => state.selectedIds.has(p.id))
    .reduce((sum, p) => sum + p.price, 0);
  $('select-total').textContent = money(total);
  $('btn-want').disabled = state.selectedIds.size === 0;
}

$('btn-want').addEventListener('click', () => {
  if (state.selectedIds.size === 0) return;
  showScreen('screen-form');
});

// ---------- Shipping form ----------
$('form-pedido').addEventListener('submit', async (e) => {
  e.preventDefault();
  $('form-error').hidden = true;

  if (!$('chk-responsabilidad').checked) {
    $('form-error').hidden = false;
    $('form-error').textContent = 'Tenés que aceptar el descargo de responsabilidad para continuar.';
    return;
  }

  const btn = $('btn-confirm');
  btn.disabled = true;
  btn.textContent = 'Confirmando...';

  try {
    const res = await fetch('/api/piel/pedido', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        skinType: state.analysis.skinType,
        concerns: state.analysis.concerns,
        productIds: [...state.selectedIds],
        name: $('f-name').value.trim(),
        phone: $('f-phone').value.trim(),
        address: $('f-address').value.trim(),
        notes: $('f-notes').value.trim(),
        disclaimerAccepted: true,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'No se pudo confirmar el pedido.');

    renderConfirm(data);
    showScreen('screen-confirm');
    e.target.reset();
  } catch (err) {
    $('form-error').hidden = false;
    $('form-error').textContent = err.message;
  } finally {
    btn.disabled = false;
    btn.textContent = 'Confirmar pedido';
  }
});

function renderConfirm(data) {
  $('conf-total').textContent = money(data.total);
  $('conf-alias').textContent = data.alias;
  $('conf-holder').textContent = data.holderName ? `Titular: ${data.holderName}` : '';

  const productList = data.products.map((p) => `• ${p.name} (${money(p.price)})`).join('\n');
  const text = `Hola! Te mando el comprobante de mi pedido #${data.orderId}:\n${productList}\nTotal: ${money(data.total)}`;
  const target = data.whatsappNumber ? data.whatsappNumber : '';
  $('conf-whatsapp').href = `https://wa.me/${target}?text=${encodeURIComponent(text)}`;
}

$('btn-home').addEventListener('click', () => {
  state.analysis = null;
  state.selectedIds = new Set();
  showScreen('screen-home');
});
