const form = document.getElementById('form-sitio');
const savedTag = document.getElementById('saved-tag');

const FIELDS = ['eyebrow', 'heroTitle', 'heroLead', 'step1', 'step2', 'step3', 'ctaText', 'fineprint'];

async function load() {
  const res = await fetch('/api/sitio');
  const site = await res.json();
  for (const key of FIELDS) {
    document.getElementById(`f-${key}`).value = site[key] || '';
  }
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const patch = {};
  for (const key of FIELDS) {
    patch[key] = document.getElementById(`f-${key}`).value;
  }
  const btn = form.querySelector('button[type="submit"]');
  btn.disabled = true;
  try {
    const res = await fetch('/api/sitio', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });
    if (!res.ok) throw new Error('No se pudo guardar.');
    savedTag.classList.add('show');
    setTimeout(() => savedTag.classList.remove('show'), 1800);
  } catch (err) {
    alert('Error: ' + err.message);
  }
  btn.disabled = false;
});

load();
