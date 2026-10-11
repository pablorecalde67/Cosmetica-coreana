// COCA K-BEAUTY - Main Application

document.addEventListener('DOMContentLoaded', () => {
  console.log('🥥 COCA K-BEAUTY - Iniciando aplicación...');

  // Actualizar links de redes sociales
  updateSocialLinks();

  // Cargar artículos
  loadArticles();

  // Cargar videos de YouTube
  loadYouTubeVideos();

  // Cargar productos
  loadProducts();

  // Event Listeners
  setupEventListeners();
});

// Actualizar links sociales con tus URLs
function updateSocialLinks() {
  const instagramLink = document.getElementById('instagramLink');
  const facebookLink = document.getElementById('facebookLink');

  if (instagramLink) {
    instagramLink.href = CONFIG.social.instagram;
  }
  if (facebookLink) {
    facebookLink.href = CONFIG.social.facebook;
  }
}

// Cargar artículos sobre K-Beauty (placeholders)
function loadArticles() {
  const carousel = document.getElementById('articlesCarousel');

  const articles = [
    {
      title: "10 Pasos de Skincare Coreano Explicados",
      image: "https://via.placeholder.com/300x180?text=10+Pasos",
      excerpt: "Descubre la rutina completa de belleza coreana paso a paso.",
      date: "2026-10-10"
    },
    {
      title: "Ingredientes Coreanos Imprescindibles",
      image: "https://via.placeholder.com/300x180?text=Ingredientes",
      excerpt: "Hyaluronic acid, niacinamide y más explicados.",
      date: "2026-10-09"
    },
    {
      title: "Mejor Routine para Piel Grasa",
      image: "https://via.placeholder.com/300x180?text=Piel+Grasa",
      excerpt: "Productos y pasos para controlar el brillo.",
      date: "2026-10-08"
    },
    {
      title: "Mascarillas de Tela vs Sheet Masks",
      image: "https://via.placeholder.com/300x180?text=Mascarillas",
      excerpt: "Diferencias y cómo elegir la mejor para ti.",
      date: "2026-10-07"
    }
  ];

  carousel.innerHTML = articles.map(article => `
    <div class="article-card">
      <img src="${article.image}" alt="${article.title}">
      <div class="content">
        <h3>${article.title}</h3>
        <p>${article.excerpt}</p>
        <small>${article.date}</small>
      </div>
    </div>
  `).join('');
}

// Cargar videos de YouTube
function loadYouTubeVideos() {
  const carousel = document.getElementById('videosCarousel');

  // Mostrar loading
  carousel.innerHTML = '<div class="video-card loading"><div class="skeleton"></div><p>Cargando videos...</p></div>';

  // NOTA: Esta función se completará en youtube.js
  // Aquí mostraremos placeholders por ahora

  const placeholders = [
    { id: "dQw4w9WgXcQ", title: "K-Beauty Routine Tutorial" },
    { id: "9bZkp7q19f0", title: "Skincare Myths Debunked" },
    { id: "jNQXAC9IVRw", title: "Product Haul 2026" }
  ];

  carousel.innerHTML = placeholders.map(video => `
    <div class="video-card">
      <img src="https://img.youtube.com/vi/${video.id}/hqdefault.jpg" alt="${video.title}">
      <div class="content">
        <h3>${video.title}</h3>
        <p>🎬 Video en YouTube</p>
      </div>
    </div>
  `).join('');
}

// Cargar productos desde Firebase/JSON
function loadProducts() {
  const grid = document.getElementById('productsGrid');

  // Usar los productos que ya tenemos del archivo XLSX
  const products = [
    { id: 1, name: "Anua Foam Cleanser", brand: "Anua", image: "/coca/assets/product-1.jpg", priceUSD: 12.48 },
    { id: 2, name: "Beauty of Joseon Toner", brand: "Beauty of Joseon", image: "/coca/assets/product-2.jpg", priceUSD: 21.42 },
    { id: 3, name: "Cosrx Toner Pads", brand: "Cosrx", image: "/coca/assets/product-3.jpg", priceUSD: 24.90 },
    { id: 4, name: "Medicube Snail Essence", brand: "Medicube", image: "/coca/assets/product-4.jpg", priceUSD: 22.09 },
    { id: 5, name: "Torriden Centella", brand: "Torriden", image: "/coca/assets/product-5.jpg", priceUSD: 16.13 },
    { id: 6, name: "Round Lab Serum", brand: "Round Lab", image: "/coca/assets/product-6.jpg", priceUSD: 14.38 },
    { id: 7, name: "Mixsoon Cream", brand: "Mixsoon", image: "/coca/assets/product-7.jpg", priceUSD: 19.50 },
    { id: 8, name: "Dr. Althea Sunscreen", brand: "Dr. Althea", image: "/coca/assets/product-8.jpg", priceUSD: 16.42 },
  ];

  grid.innerHTML = products.map(product => `
    <div class="product-card" data-product-id="${product.id}">
      <img src="${product.image}" alt="${product.name}" onerror="this.src='https://via.placeholder.com/200x220?text=${product.brand}'">
      <div class="info">
        <div class="brand">${product.brand}</div>
        <div class="name">${product.name}</div>
        <div class="price">
          <span class="price-usd">u$s ${product.priceUSD.toFixed(2)}</span>
          <span class="price-ars">$ ${(product.priceUSD * 1600).toLocaleString('es-AR')}</span>
        </div>
        <button onclick="addToCart('${product.id}', '${product.name}', ${product.priceUSD})">
          🛒 Agregar
        </button>
      </div>
    </div>
  `).join('');
}

// Setup Event Listeners
function setupEventListeners() {
  // Botón "ANALIZA TU PIEL"
  document.getElementById('btnAnalizarPiel').addEventListener('click', () => {
    document.getElementById('skinAnalyzerModal').classList.remove('hidden');
  });

  // Cerrar modal de análisis
  document.getElementById('closeAnalyzer').addEventListener('click', () => {
    document.getElementById('skinAnalyzerModal').classList.add('hidden');
  });

  // Cerrar modal de recomendaciones
  document.getElementById('closeRecommendations').addEventListener('click', () => {
    document.getElementById('recommendationsModal').classList.add('hidden');
  });

  // Cerrar modales al hacer click fuera
  document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.add('hidden');
      }
    });
  });

  // Botón "Ir a Pagar"
  document.getElementById('btnCheckout').addEventListener('click', () => {
    proceedToCheckout();
  });
}

// Agregar producto al carrito
function addToCart(productId, productName, priceUSD) {
  console.log(`📦 Agregando a carrito: ${productName} - u$s ${priceUSD}`);

  let cart = JSON.parse(localStorage.getItem('cart')) || [];

  // Buscar si el producto ya existe
  const existingItem = cart.find(item => item.id === productId);

  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cart.push({
      id: productId,
      name: productName,
      priceUSD: priceUSD,
      quantity: 1
    });
  }

  localStorage.setItem('cart', JSON.stringify(cart));
  updateCartDisplay();

  // Mostrar feedback
  alert(`✅ ${productName} agregado al carrito`);
}

// Actualizar visualización del carrito
function updateCartDisplay() {
  const cart = JSON.parse(localStorage.getItem('cart')) || [];
  const cartItemsContainer = document.getElementById('cartItems');

  if (cart.length === 0) {
    cartItemsContainer.innerHTML = '<p class="empty">Tu carrito está vacío</p>';
    updateCartSummary([]);
    return;
  }

  cartItemsContainer.innerHTML = cart.map(item => `
    <div class="cart-item">
      <div>
        <strong>${item.name}</strong>
        <small>x${item.quantity}</small>
      </div>
      <div>
        <span>u$s ${(item.priceUSD * item.quantity).toFixed(2)}</span>
        <span class="remove" onclick="removeFromCart('${item.id}')">✕</span>
      </div>
    </div>
  `).join('');

  updateCartSummary(cart);
}

// Remover producto del carrito
function removeFromCart(productId) {
  let cart = JSON.parse(localStorage.getItem('cart')) || [];
  cart = cart.filter(item => item.id !== productId);
  localStorage.setItem('cart', JSON.stringify(cart));
  updateCartDisplay();
}

// Actualizar resumen del carrito
function updateCartSummary(cart) {
  const subtotalUSD = cart.reduce((sum, item) => sum + (item.priceUSD * item.quantity), 0);
  const subtotalARS = subtotalUSD * 1600;
  const comision = subtotalARS * 0.15;
  const flete = (subtotalARS + comision) * 0.10;
  const total = subtotalARS + comision + flete;

  document.getElementById('subtotalUSD').textContent = `u$s ${subtotalUSD.toFixed(2)}`;
  document.getElementById('subtotalARS').textContent = `$ ${subtotalARS.toLocaleString('es-AR')}`;
  document.getElementById('comisionARS').textContent = `$ ${comision.toLocaleString('es-AR')}`;
  document.getElementById('fleteARS').textContent = `$ ${flete.toLocaleString('es-AR')}`;
  document.getElementById('totalARS').textContent = `$ ${total.toLocaleString('es-AR')}`;
}

// Proceder al checkout con MercadoPago
function proceedToCheckout() {
  const cart = JSON.parse(localStorage.getItem('cart')) || [];

  if (cart.length === 0) {
    alert('⚠️ Tu carrito está vacío');
    return;
  }

  const subtotalUSD = cart.reduce((sum, item) => sum + (item.priceUSD * item.quantity), 0);
  const subtotalARS = subtotalUSD * 1600;
  const comision = subtotalARS * 0.15;
  const flete = (subtotalARS + comision) * 0.10;
  const total = subtotalARS + comision + flete;

  console.log('💳 Procediendo a checkout...');
  console.log(`Total: $ ${total.toLocaleString('es-AR')}`);

  // Aquí se integraría MercadoPago
  // Por ahora, mostrar confirmación
  alert(`✅ Procediendo a pago...\nTotal: $ ${total.toLocaleString('es-AR')}\n\n(MercadoPago se integrará próximamente)`);
}

// Inicializar carrito al cargar la página
window.addEventListener('load', updateCartDisplay);
