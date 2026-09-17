const list = document.getElementById('productos');

async function load() {
  const res = await fetch('/api/productos');
  const productos = await res.json();
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
