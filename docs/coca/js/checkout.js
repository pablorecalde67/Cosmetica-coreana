// COCA K-BEAUTY - Checkout with MercadoPago
// Integración de pagos para Argentina

async function initMercadoPago() {
  console.log('💳 Inicializando MercadoPago...');
  
  // Cargar SDK de MercadoPago
  const script = document.createElement('script');
  script.src = 'https://sdk.mercadopago.com/js/v2';
  document.head.appendChild(script);
  
  script.onload = () => {
    const mp = new MercadoPago(CONFIG.mercadopago.publicKey, {
      locale: 'es-AR'
    });
    console.log('✅ MercadoPago inicializado');
  };
}

// Crear preferencia de pago en MercadoPago
async function createMercadoPagoPreference(orderData) {
  console.log('🔄 Creando preferencia de pago...');
  
  try {
    // Esto requiere un backend para procesar
    // Por ahora, es un placeholder
    
    const preference = {
      items: orderData.items.map(item => ({
        title: item.name,
        quantity: item.quantity,
        unit_price: item.priceUSD * 1600, // Convertir a ARS
        currency_id: 'ARS'
      })),
      payer: {
        email: orderData.email,
        name: orderData.name
      },
      back_urls: {
        success: `${window.location.origin}/coca/success.html`,
        failure: `${window.location.origin}/coca/failure.html`,
        pending: `${window.location.origin}/coca/pending.html`
      },
      notification_url: `${window.location.origin}/api/webhook`
    };
    
    console.log('✅ Preferencia creada');
    return preference;
  } catch (error) {
    console.error('❌ Error creando preferencia:', error);
    return null;
  }
}

// Redirigir a MercadoPago
function redirectToMercadoPago(preferenceId) {
  window.location.href = `${CONFIG.mercadopago.integrationUrl}?pref_id=${preferenceId}`;
}

// Inicializar al cargar
window.addEventListener('load', initMercadoPago);
