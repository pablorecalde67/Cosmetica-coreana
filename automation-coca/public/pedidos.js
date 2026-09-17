const list = document.getElementById('pedidos');

const STATUS_LABEL = {
  pendiente_transferencia: 'Pendiente de transferencia',
  confirmado: 'Pago confirmado',
  enviado: 'Enviado ✅',
};

function money(n) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n || 0);
}

async function load() {
  const res = await fetch('/api/pedidos');
  const pedidos = await res.json();
  render(pedidos);
}

function render(pedidos) {
  list.innerHTML = '';
  if (pedidos.length === 0) {
    list.innerHTML = '<p style="text-align:center;opacity:.6">Todavía no hay pedidos.</p>';
    return;
  }
  for (const o of pedidos) list.appendChild(renderRow(o));
}

function renderRow(o) {
  const row = document.createElement('div');
  row.className = 'table-row';

  const fields = document.createElement('div');
  fields.className = 'fields';

  const badge = document.createElement('span');
  badge.className = `badge ${o.status === 'enviado' ? 'published' : o.status === 'confirmado' ? 'ready' : 'pending_price'}`;
  badge.textContent = `${STATUS_LABEL[o.status] || o.status} · #${o.id}`;

  const meta = document.createElement('p');
  meta.className = 'order-meta';
  meta.innerHTML = `<strong>${o.name}</strong> · ${o.phone}<br>${o.address}${o.notes ? `<br>Notas: ${o.notes}` : ''}<br>Piel detectada: ${o.skinType || '—'}`;

  const products = document.createElement('p');
  products.className = 'order-products';
  products.innerHTML = o.products.map((p) => `• ${p.name} — ${money(p.price)}`).join('<br>');

  const total = document.createElement('p');
  total.className = 'order-total';
  total.textContent = `Total: ${money(o.total)}`;

  const row2 = document.createElement('div');
  row2.className = 'row2';

  const select = document.createElement('select');
  for (const key of Object.keys(STATUS_LABEL)) {
    const opt = document.createElement('option');
    opt.value = key;
    opt.textContent = STATUS_LABEL[key];
    if (key === o.status) opt.selected = true;
    select.appendChild(opt);
  }
  select.onchange = async () => {
    await fetch(`/api/pedidos/${o.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: select.value }),
    });
    load();
  };

  row2.appendChild(select);
  fields.append(badge, meta, products, total, row2);
  row.append(fields);
  return row;
}

load();
setInterval(load, 8000);
