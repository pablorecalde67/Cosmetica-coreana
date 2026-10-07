/**
 * Email Campaign Manager
 * Automated flows for orders, newsletters, and customer engagement
 */

const fs = require('fs');
const path = require('path');
const { sendOrderConfirmation, sendNewsletterWelcome, sendShippingUpdate, sendAbandonedCart } = require('./email-notifications');

const CAMPAIGNS_FILE = path.join(__dirname, '../data/campaigns.json');

class EmailCampaignManager {
  constructor() {
    this.campaigns = this.loadCampaigns();
  }

  loadCampaigns() {
    try {
      if (fs.existsSync(CAMPAIGNS_FILE)) {
        const data = fs.readFileSync(CAMPAIGNS_FILE, 'utf-8');
        return JSON.parse(data);
      }
    } catch (err) {
      console.error('Error loading campaigns:', err);
    }
    return this.getDefaultCampaigns();
  }

  saveCampaigns() {
    try {
      fs.writeFileSync(CAMPAIGNS_FILE, JSON.stringify(this.campaigns, null, 2));
    } catch (err) {
      console.error('Error saving campaigns:', err);
    }
  }

  getDefaultCampaigns() {
    return {
      orderConfirmation: {
        enabled: true,
        trigger: 'order.created',
        delay: 0,
        template: 'order-confirmation',
        description: 'Enviado automáticamente cuando se crea una orden',
        lastRun: null,
        runCount: 0
      },
      welcomeNewsletter: {
        enabled: true,
        trigger: 'newsletter.signup',
        delay: 0,
        template: 'newsletter-welcome',
        description: 'Bienvenida a nuevos suscriptores con código de descuento',
        lastRun: null,
        runCount: 0
      },
      shippingUpdate: {
        enabled: true,
        trigger: 'order.shipped',
        delay: 0,
        template: 'shipping-update',
        description: 'Enviado cuando una orden es enviada',
        lastRun: null,
        runCount: 0
      },
      abandonedCart: {
        enabled: true,
        trigger: 'cart.abandoned',
        delay: 3600000, // 1 hour in ms
        template: 'abandoned-cart',
        description: 'Recuperación de carritos abandonados después de 1 hora',
        lastRun: null,
        runCount: 0
      },
      weeklyNewsletter: {
        enabled: false,
        trigger: 'schedule.weekly',
        delay: 0,
        template: 'weekly-newsletter',
        description: 'Boletín semanal con nuevos productos',
        schedule: 'every monday 10:00 AM',
        lastRun: null,
        runCount: 0
      },
      birthdayPromo: {
        enabled: false,
        trigger: 'customer.birthday',
        delay: 0,
        template: 'birthday-promo',
        description: 'Promoción especial en cumpleaños',
        lastRun: null,
        runCount: 0
      }
    };
  }

  // Event handlers
  async onOrderCreated(order) {
    if (!this.campaigns.orderConfirmation.enabled) return;

    try {
      await sendOrderConfirmation(order);
      this.updateCampaignStats('orderConfirmation');
    } catch (err) {
      console.error('Error in orderConfirmation campaign:', err);
    }
  }

  async onNewsletterSignup(email) {
    if (!this.campaigns.welcomeNewsletter.enabled) return;

    try {
      await sendNewsletterWelcome(email);
      this.updateCampaignStats('welcomeNewsletter');
    } catch (err) {
      console.error('Error in welcomeNewsletter campaign:', err);
    }
  }

  async onOrderShipped(order) {
    if (!this.campaigns.shippingUpdate.enabled) return;

    try {
      await sendShippingUpdate(order);
      this.updateCampaignStats('shippingUpdate');
    } catch (err) {
      console.error('Error in shippingUpdate campaign:', err);
    }
  }

  async onCartAbandoned(email, items, total) {
    if (!this.campaigns.abandonedCart.enabled) return;

    try {
      // Check if enough time has passed
      const delay = this.campaigns.abandonedCart.delay;
      setTimeout(async () => {
        await sendAbandonedCart(email, items, total);
        this.updateCampaignStats('abandonedCart');
      }, delay);
    } catch (err) {
      console.error('Error in abandonedCart campaign:', err);
    }
  }

  updateCampaignStats(campaignKey) {
    this.campaigns[campaignKey].lastRun = new Date().toISOString();
    this.campaigns[campaignKey].runCount++;
    this.saveCampaigns();
  }

  enableCampaign(campaignKey) {
    if (this.campaigns[campaignKey]) {
      this.campaigns[campaignKey].enabled = true;
      this.saveCampaigns();
      return { success: true, message: `Campaign '${campaignKey}' enabled` };
    }
    return { success: false, error: 'Campaign not found' };
  }

  disableCampaign(campaignKey) {
    if (this.campaigns[campaignKey]) {
      this.campaigns[campaignKey].enabled = false;
      this.saveCampaigns();
      return { success: true, message: `Campaign '${campaignKey}' disabled` };
    }
    return { success: false, error: 'Campaign not found' };
  }

  getCampaignStatus() {
    const status = {};
    for (const [key, campaign] of Object.entries(this.campaigns)) {
      status[key] = {
        enabled: campaign.enabled,
        lastRun: campaign.lastRun,
        runCount: campaign.runCount,
        description: campaign.description
      };
    }
    return status;
  }

  getAnalytics() {
    const analytics = {
      totalCampaigns: Object.keys(this.campaigns).length,
      activeCampaigns: Object.values(this.campaigns).filter(c => c.enabled).length,
      totalSent: Object.values(this.campaigns).reduce((sum, c) => sum + c.runCount, 0),
      byType: {}
    };

    for (const [key, campaign] of Object.entries(this.campaigns)) {
      analytics.byType[key] = {
        enabled: campaign.enabled,
        sent: campaign.runCount,
        lastRun: campaign.lastRun
      };
    }

    return analytics;
  }
}

module.exports = new EmailCampaignManager();
