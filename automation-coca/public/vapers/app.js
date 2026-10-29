const $ = (id) => document.getElementById(id);

const state = {
  selected: new Map(), // id -> { id, name, price }
};

function showScreen(id) {
  document.querySelectorAll('.screen').forEach((el) => el.classList.remove('active'));
  $(id).classList.add('active');
  window.scrollTo(0, 0);
}

document.querySelectorAll('[data-back]').forEach((btn) => {
  btn.addEventListener('click', () => showScreen(btn.dataset.back));
});

function money(n) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n || 0);
}

// ---------- Catálogo ----------
let searchTimer = null;

async function loadCatalog(q) {
  const hint = $('catalog-hint');
  const list = $('catalog-list');
  hint.textContent = 'Buscando...';
  try {
    const res = await fetch(`/api/vapers/productos?q=${encodeURIComponent(q || '')}`);
    const data = await res.json();
    renderCatalog(data);
  } catch {
    hint.textContent = 'No se pudo cargar el catálogo, probá de nuevo.';
    list.innerHTML = '';
  }
}

function renderItem(p) {
  const row = document.createElement('label');
  row.className = 'select-item';
  const checked = state.selected.has(p.id);
  row.innerHTML = `
    <input type="checkbox" data-id="${p.id}" ${checked ? 'checked' : ''}>
    <div class="thumb"><img src="${p.image}" alt="" loading="lazy" onerror="this.src='/piel/img/placeholder.svg'"></div>
    <div class="info">
      <div class="name">${p.name}</div>
      <div class="price">${money(p.price)}</div>
    </div>`;
  row.querySelector('input').addEventListener('change', (e) => {
    if (e.target.checked) state.selected.set(p.id, { id: p.id, name: p.name, price: p.price });
    else state.selected.delete(p.id);
    updateTotal();
  });
  return row;
}

function renderCatalog(data) {
  const list = $('catalog-list');
  const hint = $('catalog-hint');
  list.innerHTML = '';

  if (data.total === 0) {
    hint.textContent = 'Todavía no hay vapers cargados en el catálogo.';
    list.innerHTML = '<p class="catalog-empty">Muy pronto vas a poder elegir acá. Mientras tanto, escribinos por WhatsApp.</p>';
    return;
  }

  if (data.productos.length === 0) {
    hint.textContent = `Sin resultados entre ${data.total} vapers.`;
    list.innerHTML = '<p class="catalog-empty">No encontramos nada con ese nombre. Probá otra palabra.</p>';
    return;
  }

  hint.textContent =
    data.matched === data.total
      ? `${data.productos.length} vapers disponibles.`
      : `${data.matched} resultados de ${data.total} vapers.`;

  // Agrupa por cantidad de puffs (de mayor a menor) para que la vidriera se
  // vea ordenada en vez de una lista plana de cientos de ítems. Lo que no
  // tiene un dato de puffs reconocible (kits, accesorios, líquidos, modelos
  // que se nombran por versión y no por puffs) va en un grupo aparte al final.
  const groups = new Map(); // puffsLabel|null -> { puffsSort, items }
  for (const p of data.productos) {
    const key = p.puffsLabel || '__otros__';
    if (!groups.has(key)) groups.set(key, { label: p.puffsLabel, puffsSort: p.puffsSort, items: [] });
    groups.get(key).items.push(p);
  }
  const ordered = [...groups.values()].sort((a, b) => b.puffsSort - a.puffsSort);

  for (const group of ordered) {
    const heading = document.createElement('h3');
    heading.className = 'puffs-heading';
    heading.textContent = group.label ? `${group.label} puffs` : 'Otros (kits, accesorios y líquidos)';
    list.appendChild(heading);

    const sub = document.createElement('div');
    sub.className = 'select-list';
    for (const p of group.items) sub.appendChild(renderItem(p));
    list.appendChild(sub);
  }
}

$('catalog-search').addEventListener('input', (e) => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => loadCatalog(e.target.value.trim()), 300);
});

function updateTotal() {
  let total = 0;
  for (const p of state.selected.values()) total += p.price;
  $('select-total').textContent = money(total);
  $('btn-want').disabled = state.selected.size === 0;
}

loadCatalog('');

$('btn-want').addEventListener('click', () => {
  if (state.selected.size === 0) return;
  showScreen('screen-form');
});

// ---------- Shipping form ----------
$('form-pedido').addEventListener('submit', async (e) => {
  e.preventDefault();
  $('form-error').hidden = true;

  const btn = $('btn-confirm');
  btn.disabled = true;
  btn.textContent = 'Confirmando...';

  try {
    const res = await fetch('/api/vapers/pedido', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productIds: [...state.selected.keys()],
        name: $('f-name').value.trim(),
        phone: $('f-phone').value.trim(),
        address: $('f-address').value.trim(),
        notes: $('f-notes').value.trim(),
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
  const text = `Hola! Te mando el comprobante de mi pedido de vapers #${data.orderId}:\n${productList}\nTotal: ${money(data.total)}`;
  const target = data.whatsappNumber ? data.whatsappNumber : '';
  $('conf-whatsapp').href = `https://wa.me/${target}?text=${encodeURIComponent(text)}`;
}

$('btn-home').addEventListener('click', () => {
  state.selected.clear();
  updateTotal();
  showScreen('screen-catalog');
});
