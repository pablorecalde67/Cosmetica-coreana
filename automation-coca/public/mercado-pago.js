// Mercado Pago Integration for K-Beauty CDE
// Requires: MercadoPago SDK library and Mercado Pago account

class MercadoPagoPayment {
  constructor(config = {}) {
    this.publicKey = config.publicKey || 'YOUR_MERCADO_PAGO_PUBLIC_KEY';
    this.accessToken = config.accessToken || 'YOUR_MERCADO_PAGO_ACCESS_TOKEN';
    this.notificationUrl = config.notificationUrl || 'https://kbeautycde.com/api/payment-notification';
    this.currency = 'ARS';
    this.country = 'AR';

    // Initialize Mercado Pago SDK
    this.initMercadoPago();
  }

  // Initialize Mercado Pago SDK
  initMercadoPago() {
    const script = document.createElement('script');
    script.src = 'https://sdk.mercadopago.com/js/v2';
    script.onload = () => {
      window.mp = new MercadoPago(this.publicKey);
      console.log('✅ Mercado Pago SDK loaded');
    };
    document.head.appendChild(script);
  }

  // Create checkout preference
  async createPreference(cartItems, totalAmount, customerInfo) {
    try {
      const items = cartItems.map(item => ({
        title: item.name,
        unit_price: Math.round(item.priceUSD * config.currency.usd_to_ars),
        quantity: item.quantity,
        currency_id: this.currency,
        description: `${item.brand} - ${item.category}`
      }));

      const preferenceData = {
        items: items,
        payer: {
          name: customerInfo.name || 'K-Beauty Customer',
          email: customerInfo.email || 'customer@kbeautycde.com',
          phone: {
            area_code: customerInfo.areaCode || '54',
            number: customerInfo.phone || '0000000'
          },
          address: {
            street_name: customerInfo.street || 'Argentina',
            street_number: customerInfo.streetNumber || 1,
            zip_code: customerInfo.zipCode || '1000'
          }
        },
        back_urls: {
          success: 'https://kbeautycde.com/checkout/success',
          failure: 'https://kbeautycde.com/checkout/failure',
          pending: 'https://kbeautycde.com/checkout/pending'
        },
        notification_url: this.notificationUrl,
        external_reference: `order_${Date.now()}`,
        expires: false,
        auto_return: 'approved',
        tracking: {
          type: 'google_ad',
          value: 'GAID'
        }
      };

      const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(preferenceData)
      });

      const preference = await response.json();
      console.log('✅ Preference created:', preference.id);
      return preference;
    } catch (error) {
      console.error('❌ Error creating preference:', error);
      throw error;
    }
  }

  // Open Mercado Pago checkout
  async openCheckout(cartItems, totalAmount, customerInfo) {
    try {
      const preference = await this.createPreference(cartItems, totalAmount, customerInfo);

      // Open Mercado Pago checkout
      window.mp.checkout({
        preference: {
          id: preference.id
        },
        render: 'wallet',
        label: 'Pagar'
      });

      return preference;
    } catch (error) {
      console.error('❌ Checkout error:', error);
      alert('Error abriendo el pago. Intenta de nuevo.');
    }
  }

  // Payment status check
  async checkPaymentStatus(paymentId) {
    try {
      const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      const payment = await response.json();
      console.log('Payment Status:', payment.status);
      return payment;
    } catch (error) {
      console.error('Error checking payment:', error);
    }
  }

  // Webhook handler (server-side)
  async handleWebhook(data) {
    try {
      const { resource, type, data: paymentData } = data;

      if (type === 'payment') {
        const payment = await this.checkPaymentStatus(resource.id);

        if (payment.status === 'approved') {
          console.log('✅ Payment approved:', resource.id);
          // Send confirmation email
          // Update order status
          // Send WhatsApp notification
          return { status: 'success', paymentId: resource.id };
        } else if (payment.status === 'pending') {
          console.log('⏳ Payment pending:', resource.id);
          return { status: 'pending', paymentId: resource.id };
        } else {
          console.log('❌ Payment declined:', resource.id);
          return { status: 'declined', paymentId: resource.id };
        }
      }
    } catch (error) {
      console.error('Webhook error:', error);
    }
  }
}

// Initialize Mercado Pago when page loads
document.addEventListener('DOMContentLoaded', () => {
  const mpConfig = {
    publicKey: config.mercadoPago?.publicKey || 'APP_USR-xxxxxxxxxxxxxx',
    accessToken: config.mercadoPago?.accessToken || 'APP_USR-xxxxxxxxxxxxxx',
    notificationUrl: 'https://kbeautycde.com/api/payment-webhook'
  };

  window.mercadoPago = new MercadoPagoPayment(mpConfig);
  console.log('🎉 Mercado Pago integration ready');
});

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MercadoPagoPayment;
}
