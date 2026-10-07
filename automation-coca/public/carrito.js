// Sistema de Carrito de Compras K-Beauty CDE
// Automatizado con localStorage y cálculos dinámicos

class CarritoManager {
  constructor() {
    this.carrito = this.loadCarrito();
    this.pais = this.getPaisSeleccionado();
    this.init();
  }

  loadCarrito() {
    try {
      return JSON.parse(localStorage.getItem('carrito_kbeautycde')) || [];
    } catch (e) {
      return [];
    }
  }

  saveCarrito() {
    localStorage.setItem('carrito_kbeautycde', JSON.stringify(this.carrito));
  }

  getPaisSeleccionado() {
    return localStorage.getItem('pais_envio') || 'AR';
  }

  setPaisSeleccionado(pais) {
    this.pais = pais;
    localStorage.setItem('pais_envio', pais);
    this.actualizarResumen();
  }

  init() {
    this.renderCarrito();
    this.setupEventListeners();
    this.actualizarResumen();
  }

  setupEventListeners() {
    document.getElementById('pais-select').addEventListener('change', (e) => {
      this.setPaisSeleccionado(e.target.value);
    });

    // Cargar país guardado
    document.getElementById('pais-select').value = this.pais;
  }

  renderCarrito() {
    const container = document.getElementById('carrito-items');
    const vacioMsg = document.getElementById('carrito-vacio-msg');
    const contenido = document.getElementById('carrito-contenido');

    if (this.carrito.length === 0) {
      vacioMsg.style.display = 'block';
      contenido.style.display = 'none';
      return;
    }

    vacioMsg.style.display = 'none';
    contenido.style.display = 'grid';

    container.innerHTML = this.carrito.map((item, index) => `
      <div class="carrito-item">
        <div class="carrito-item-imagen">
          <img src="${item.imagen || '/placeholder.png'}" alt="${item.nombre}" onerror="this.src='/placeholder.png'">
        </div>
        <div class="carrito-item-info">
          <div>
            <div class="carrito-item-titulo">${item.nombre}</div>
            <div class="carrito-item-tienda">📍 ${item.tienda || 'K-Beauty CDE'}</div>
          </div>
          <div class="carrito-item-precio">$${this.formatNumber(item.precio)}</div>
        </div>
        <div class="carrito-item-controles">
          <div class="cantidad-control">
            <button onclick="carrito.cambiarCantidad(${index}, -1)">−</button>
            <input type="number" value="${item.cantidad}" min="1" onchange="carrito.setCantidad(${index}, this.value)">
            <button onclick="carrito.cambiarCantidad(${index}, 1)">+</button>
          </div>
          <button class="carrito-item-eliminar" onclick="carrito.eliminar(${index})">Eliminar</button>
        </div>
      </div>
    `).join('');
  }

  cambiarCantidad(index, delta) {
    const nuevaCantidad = Math.max(1, this.carrito[index].cantidad + delta);
    this.carrito[index].cantidad = nuevaCantidad;
    this.saveCarrito();
    this.renderCarrito();
    this.actualizarResumen();
  }

  setCantidad(index, cantidad) {
    const num = parseInt(cantidad) || 1;
    this.carrito[index].cantidad = Math.max(1, num);
    this.saveCarrito();
    this.renderCarrito();
    this.actualizarResumen();
  }

  eliminar(index) {
    if (confirm('¿Eliminar este producto?')) {
      this.carrito.splice(index, 1);
      this.saveCarrito();
      this.renderCarrito();
      this.actualizarResumen();
    }
  }

  agregarProducto(producto) {
    const existente = this.carrito.find(item => item.id === producto.id && item.tienda === producto.tienda);

    if (existente) {
      existente.cantidad += producto.cantidad || 1;
    } else {
      this.carrito.push({
        ...producto,
        cantidad: producto.cantidad || 1
      });
    }

    this.saveCarrito();
    this.renderCarrito();
    this.actualizarResumen();
  }

  getSubtotal() {
    return this.carrito.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
  }

  calcularEnvio() {
    const subtotal = this.getSubtotal();

    // Cálculo simplificado de envío según país
    const costos = {
      'AR': Math.min(subtotal * 0.08, 500), // 8% máximo $500
      'PY': Math.min(subtotal * 0.10, 300),
      'BR': Math.min(subtotal * 0.12, 600),
      'UY': Math.min(subtotal * 0.10, 400),
      'OTHER': Math.min(subtotal * 0.15, 800)
    };

    return costos[this.pais] || costos['OTHER'];
  }

  getDescuento() {
    const url = new URLSearchParams(window.location.search);
    const codigo = url.get('desc');
    const codigos = {
      'BIENVENIDA15': 0.15,
      'REFERIDO10': 0.10,
      'VIP20': 0.20
    };

    if (codigo && codigos[codigo]) {
      return this.getSubtotal() * codigos[codigo];
    }
    return 0;
  }

  actualizarResumen() {
    const subtotal = this.getSubtotal();
    const envio = this.calcularEnvio();
    const descuento = this.getDescuento();
    const total = subtotal + envio - descuento;

    document.getElementById('subtotal').textContent = `$${this.formatNumber(subtotal)}`;
    document.getElementById('envio').textContent = `$${this.formatNumber(envio)}`;
    document.getElementById('total').textContent = `$${this.formatNumber(total)}`;

    if (descuento > 0) {
      document.getElementById('descuento-fila').style.display = 'flex';
      document.getElementById('descuento').textContent = `-$${this.formatNumber(descuento)}`;
    } else {
      document.getElementById('descuento-fila').style.display = 'none';
    }
  }

  formatNumber(num) {
    return Math.round(num).toLocaleString('es-AR');
  }

  generarOBJson() {
    // Generar JSON para enviar a Mercado Pago / Checkout
    const items = this.carrito.map(item => ({
      id: item.id,
      title: item.nombre,
      quantity: item.cantidad,
      unit_price: item.precio,
      currency_id: 'ARS'
    }));

    return {
      items,
      payer: {
        name: '',
        email: ''
      },
      back_urls: {
        success: `${window.location.origin}/checkout-success`,
        failure: `${window.location.origin}/checkout-error`,
        pending: `${window.location.origin}/checkout-pending`
      },
      auto_return: 'approved',
      payment_type: 'all',
      processing_mode: 'aggregator',
      merchant_order_data: {
        pais: this.pais,
        subtotal: this.getSubtotal(),
        envio: this.calcularEnvio(),
        descuento: this.getDescuento(),
        total: this.getSubtotal() + this.calcularEnvio() - this.getDescuento()
      }
    };
  }
}

// Instancia global
let carrito;

document.addEventListener('DOMContentLoaded', () => {
  carrito = new CarritoManager();

  // Escuchar mensajes desde otras páginas (si agregan desde landing)
  window.addEventListener('storage', () => {
    carrito.carrito = carrito.loadCarrito();
    carrito.renderCarrito();
    carrito.actualizarResumen();
  });
});

// Función para proceder al checkout
function proceedToCheckout() {
  if (carrito.carrito.length === 0) {
    alert('Tu carrito está vacío');
    return;
  }

  // Guardar estado actual
  const checkoutData = {
    items: carrito.carrito,
    pais: carrito.pais,
    subtotal: carrito.getSubtotal(),
    envio: carrito.calcularEnvio(),
    descuento: carrito.getDescuento(),
    total: carrito.getSubtotal() + carrito.calcularEnvio() - carrito.getDescuento(),
    timestamp: new Date().toISOString()
  };

  localStorage.setItem('checkout_data', JSON.stringify(checkoutData));

  // Redirigir a checkout
  window.location.href = '/checkout.html';
}

// Función para agregar producto desde landing/tiendas
function agregarAlCarrito(producto) {
  if (!carrito) {
    carrito = new CarritoManager();
  }
  carrito.agregarProducto(producto);

  // Mensaje de confirmación
  alert(`✅ ${producto.nombre} agregado al carrito`);

  // Opcional: abrir carrito
  // window.location.href = '/carrito.html';
}
