// 🚀 VIRAL AUTOMATION - Automatización de contenido viral en redes sociales
// Crea campañas virales, publica en múltiples plataformas, notifica a clientes y negocios

import express from 'express';
import { nanoid } from 'nanoid';
import { ViralEngine } from '../services/viral-engine.js';
import { WhatsAppViral } from '../services/whatsapp-viral.js';
import { SocialMediaIntegrator } from '../services/social-media-integrator.js';
import { JobScheduler } from '../services/job-scheduler.js';

const router = express.Router();

// In-memory campaign storage (usar DB en producción)
const campaigns = new Map();
const campaignMetrics = new Map();

// Initialize services
const viralEngine = new ViralEngine();
const whatsappViral = new WhatsAppViral();
const socialMedia = new SocialMediaIntegrator();
const jobScheduler = new JobScheduler();

// ============= POST /api/viral/campaign =============
// Crear nueva campaña viral para un producto
router.post('/campaign', async (req, res) => {
  try {
    const { productId, productName, productPrice, category, stock, rating, reviews } = req.body;

    if (!productId || !productName) {
      return res.status(400).json({ error: 'productId y productName requeridos' });
    }

    // Crear producto objeto para el ViralEngine
    const product = {
      id: productId,
      name: productName,
      price: productPrice || 25.99,
      category: category || 'BB Creams',
      stock: stock || 50,
      rating: rating || 4.7,
      reviews: reviews || 100,
    };

    // Generar contenido para todas las plataformas
    const fullCampaign = viralEngine.generateFullCampaign(product);

    // Crear ID de campaña
    const campaignId = nanoid();

    // Guardar campaña con metadata
    const campaign = {
      id: campaignId,
      productId,
      product,
      content: fullCampaign,
      status: 'created', // created, scheduled, published, completed
      createdAt: new Date(),
      publishedAt: null,
      scheduledTimes: fullCampaign.timing,
    };

    campaigns.set(campaignId, campaign);

    // Inicializar métricas
    campaignMetrics.set(campaignId, {
      campaignId,
      impressions: 0,
      clicks: 0,
      shares: 0,
      conversions: 0,
      whatsappNotifications: {
        sent: 0,
        failed: 0,
      },
      platformMetrics: {
        instagram: { reach: 0, engagement: 0 },
        tiktok: { reach: 0, engagement: 0 },
        facebook: { reach: 0, engagement: 0 },
        whatsapp: { delivered: 0 },
      },
    });

    res.status(201).json({
      success: true,
      campaign: {
        id: campaignId,
        productId,
        productName,
        status: 'created',
        viralScore: fullCampaign.metrics.viralScore,
        expectedReach: fullCampaign.metrics.expectedReach,
        scheduledTimes: fullCampaign.timing,
      },
      message: 'Campaña viral creada exitosamente',
    });
  } catch (error) {
    console.error('[VIRAL] Error creating campaign:', error);
    res.status(500).json({ error: 'Error al crear campaña viral' });
  }
});

// ============= GET /api/viral/campaign/:id =============
// Obtener estado y métricas de campaña
router.get('/campaign/:id', (req, res) => {
  try {
    const { id } = req.params;
    const campaign = campaigns.get(id);

    if (!campaign) {
      return res.status(404).json({ error: 'Campaña no encontrada' });
    }

    const metrics = campaignMetrics.get(id) || {};

    res.json({
      campaign: {
        id: campaign.id,
        productId: campaign.productId,
        productName: campaign.product.name,
        status: campaign.status,
        createdAt: campaign.createdAt,
        publishedAt: campaign.publishedAt,
        viralScore: campaign.content.metrics.viralScore,
        expectedReach: campaign.content.metrics.expectedReach,
      },
      metrics,
      content: {
        instagram: campaign.content.platforms.instagram,
        tiktok: campaign.content.platforms.tiktok,
        facebook: campaign.content.platforms.facebook,
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener campaña' });
  }
});

// ============= POST /api/viral/publish =============
// Publicar campaña en todas las plataformas
router.post('/publish', async (req, res) => {
  try {
    const { campaignId } = req.body;

    if (!campaignId) {
      return res.status(400).json({ error: 'campaignId requerido' });
    }

    const campaign = campaigns.get(campaignId);
    if (!campaign) {
      return res.status(404).json({ error: 'Campaña no encontrada' });
    }

    if (campaign.status === 'published') {
      return res.status(400).json({ error: 'Campaña ya fue publicada' });
    }

    // Actualizar estado
    campaign.status = 'published';
    campaign.publishedAt = new Date();

    // Publicar en plataformas (integración real en producción)
    const publishResults = {
      instagram: {
        status: 'scheduled',
        scheduledTime: campaign.content.timing.instagram,
        postUrl: `https://instagram.com/kbeautycde/posts/${nanoid()}`,
      },
      tiktok: {
        status: 'scheduled',
        scheduledTime: campaign.content.timing.tiktok,
        videoUrl: `https://tiktok.com/@kbeautycde/video/${nanoid()}`,
      },
      facebook: {
        status: 'scheduled',
        scheduledTime: campaign.content.timing.facebook,
        postUrl: `https://facebook.com/kbeautycde/posts/${nanoid()}`,
      },
    };

    // Programar trabajos para publicar a la hora óptima
    jobScheduler.schedulePost(campaignId, campaign.content.timing.instagram, 'instagram', campaign.content.platforms.instagram);
    jobScheduler.schedulePost(campaignId, campaign.content.timing.tiktok, 'tiktok', campaign.content.platforms.tiktok);
    jobScheduler.schedulePost(campaignId, campaign.content.timing.facebook, 'facebook', campaign.content.platforms.facebook);

    // Enviar notificaciones por WhatsApp a clientes
    await whatsappViral.notifyCustomers(campaign);

    // Enviar alertas a negocios de CDE
    await whatsappViral.alertCDEBusinesses(campaign);

    res.json({
      success: true,
      campaignId,
      status: 'published',
      publishResults,
      message: 'Campaña publicada. Contenido programado para publicarse a horas óptimas.',
    });
  } catch (error) {
    console.error('[VIRAL] Error publishing campaign:', error);
    res.status(500).json({ error: 'Error al publicar campaña' });
  }
});

// ============= GET /api/viral/trending =============
// Obtener productos trending y campaña sugerida
router.get('/trending', (req, res) => {
  try {
    // Productos trending de ejemplo (en producción, consultar DB)
    const trendingProducts = [
      {
        id: 'kr-bb-001',
        name: 'BB Cream Coreano Premium',
        category: 'BB Creams',
        price: 25.99,
        stock: 75,
        rating: 4.8,
        reviews: 245,
        trendScore: 92,
        reason: 'Bestseller en TikTok',
      },
      {
        id: 'kr-mask-002',
        name: 'Sheet Mask Hidratante',
        category: 'Sheet Masks',
        price: 8.99,
        stock: 150,
        rating: 4.9,
        reviews: 389,
        trendScore: 88,
        reason: 'Viral en Instagram Reels',
      },
      {
        id: 'kr-serum-003',
        name: 'Serum Vitamina C',
        category: 'Serums',
        price: 32.99,
        stock: 45,
        rating: 4.7,
        reviews: 167,
        trendScore: 85,
        reason: 'Recomendado por influencers',
      },
    ];

    res.json({
      trending: trendingProducts,
      recommendation: {
        message: 'Estos productos son ideales para campañas virales. Usa POST /api/viral/campaign para crear una.',
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener trending' });
  }
});

// ============= POST /api/viral/notify-businesses =============
// Enviar alerta manual a negocios de CDE
router.post('/notify-businesses', async (req, res) => {
  try {
    const { campaignId } = req.body;

    if (!campaignId) {
      return res.status(400).json({ error: 'campaignId requerido' });
    }

    const campaign = campaigns.get(campaignId);
    if (!campaign) {
      return res.status(404).json({ error: 'Campaña no encontrada' });
    }

    // Enviar notificaciones a negocios
    const notificationResults = await whatsappViral.alertCDEBusinesses(campaign);

    res.json({
      success: true,
      message: 'Alertas enviadas a negocios de CDE',
      results: notificationResults,
    });
  } catch (error) {
    console.error('[VIRAL] Error notifying businesses:', error);
    res.status(500).json({ error: 'Error al notificar negocios' });
  }
});

// ============= GET /api/viral/metrics/:campaignId =============
// Obtener métricas en tiempo real
router.get('/metrics/:campaignId', (req, res) => {
  try {
    const { campaignId } = req.params;
    const metrics = campaignMetrics.get(campaignId);

    if (!metrics) {
      return res.status(404).json({ error: 'Métricas no encontradas' });
    }

    // Simular actualización de métricas en tiempo real
    const totalReach = metrics.platformMetrics.instagram.reach +
                      metrics.platformMetrics.tiktok.reach +
                      metrics.platformMetrics.facebook.reach;

    const engagementRate = totalReach > 0 ? ((metrics.clicks + metrics.shares) / totalReach * 100).toFixed(2) : 0;

    res.json({
      campaignId,
      metrics: {
        totalReach,
        engagementRate: `${engagementRate}%`,
        impressions: metrics.impressions,
        clicks: metrics.clicks,
        shares: metrics.shares,
        conversions: metrics.conversions,
        conversionRate: totalReach > 0 ? ((metrics.conversions / totalReach) * 100).toFixed(2) + '%' : '0%',
        platforms: metrics.platformMetrics,
        whatsapp: metrics.whatsappNotifications,
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener métricas' });
  }
});

// ============= POST /api/viral/simulate-engagement =============
// Simular engagement (para testing)
router.post('/simulate-engagement', (req, res) => {
  try {
    const { campaignId } = req.body;

    if (!campaignId) {
      return res.status(400).json({ error: 'campaignId requerido' });
    }

    let metrics = campaignMetrics.get(campaignId);
    if (!metrics) {
      return res.status(404).json({ error: 'Campaña no encontrada' });
    }

    // Simular engagement
    const expectedReach = campaigns.get(campaignId)?.content.metrics.expectedReach || 5000;
    metrics.impressions = Math.floor(expectedReach * 0.8);
    metrics.clicks = Math.floor(metrics.impressions * 0.15);
    metrics.shares = Math.floor(metrics.clicks * 0.3);
    metrics.conversions = Math.floor(metrics.clicks * 0.08);

    // Distribuir por plataforma
    metrics.platformMetrics.instagram.reach = Math.floor(metrics.impressions * 0.4);
    metrics.platformMetrics.tiktok.reach = Math.floor(metrics.impressions * 0.35);
    metrics.platformMetrics.facebook.reach = Math.floor(metrics.impressions * 0.25);

    res.json({
      success: true,
      message: 'Engagement simulado',
      metrics,
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al simular engagement' });
  }
});

export default router;
