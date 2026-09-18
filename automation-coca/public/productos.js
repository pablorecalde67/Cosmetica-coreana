const list = document.getElementById('productos');
const conteo = document.getElementById('conteo');
const buscador = document.getElementById('buscador');

let debounceTimer;
buscador.addEventListener('input', () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(load, 300);
});

async function load() {
  const q = buscador.value.trim();
  const url = q ? `/api/productos?q=${encodeURIComponent(q)}` : '/api/productos?limit=100';
  const res = await fetch(url);
  const { total, matched, productos } = await res.json();

  if (q) {
    conteo.textContent = `${matched} de ${total} productos coinciden con "${q}"${matched > productos.length ? ` (mostrando los primeros ${productos.length})` : ''}`;
  } else {
    conteo.textContent = `${total} productos en el catálogo — mostrando los primeros ${productos.length}. Buscá arriba para encontrar uno puntual.`;
  }

  productos.sort((a, b) => (a.brand || '').localeCompare(b.brand || '') || a.name.localeCompare(b.name));
  render(productos);
}

function render(productos) {
  list.innerHTML = '';
  for (const p of productos) {
    list.appendChild(renderRow(p));
  }
}

function renderRow(p) {
  const row = document.createElement('div');
  row.className = 'table-row';

  const img = document.createElement('img');
  img.className = 'thumb';
  img.src = p.image;
  img.alt = '';
  img.onerror = () => { img.src = '/piel/img/placeholder.svg'; };

  const fields = document.createElement('div');
  fields.className = 'fields';

  if (p.brand || p.store) {
    const brandTag = document.createElement('p');
    brandTag.className = 'order-meta';
    brandTag.style.margin = '0';
    brandTag.style.fontWeight = '700';
    brandTag.textContent = [p.brand, p.store].filter(Boolean).join(' · ');
    fields.appendChild(brandTag);
  }

  const nameInput = document.createElement('input');
  nameInput.type = 'text';
  nameInput.value = p.name;

  const descInput = document.createElement('textarea');
  descInput.value = p.description;

  const imageInput = document.createElement('input');
  imageInput.type = 'text';
  imageInput.value = p.image;
  imageInput.placeholder = 'Ruta o URL de la foto';
  imageInput.oninput = () => { img.src = imageInput.value; };

  const row2 = document.createElement('div');
  row2.className = 'row2';

  const priceInput = document.createElement('input');
  priceInput.type = 'number';
  priceInput.min = '0';
  priceInput.style.width = '140px';
  priceInput.value = p.price;

  const activeLabel = document.createElement('label');
  activeLabel.className = 'inline';
  const activeInput = document.createElement('input');
  activeInput.type = 'checkbox';
  activeInput.checked = p.active !== false;
  activeLabel.append(activeInput, document.createTextNode('Disponible'));

  const saveBtn = document.createElement('button');
  saveBtn.textContent = 'Guardar';

  const savedTag = document.createElement('span');
  savedTag.className = 'saved-tag';
  savedTag.textContent = '✅ Guardado';

  saveBtn.onclick = async () => {
    saveBtn.disabled = true;
    try {
      const res = await fetch(`/api/productos/${p.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: nameInput.value,
          description: descInput.value,
          image: imageInput.value,
          price: priceInput.value,
          active: activeInput.checked,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      savedTag.classList.add('show');
      setTimeout(() => savedTag.classList.remove('show'), 1500);
    } catch (err) {
      alert('Error: ' + err.message);
    }
    saveBtn.disabled = false;
  };

  row2.append(priceInput, activeLabel, saveBtn, savedTag);
  fields.append(nameInput, descInput, imageInput, row2);
  row.append(img, fields);
  return row;
}

load();
