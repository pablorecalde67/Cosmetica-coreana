import { Router } from 'express';
import { config } from '../config.js';
import {
  scrapeInstagramAlbum,
  saveScrapedProducts,
  loadScrapedProducts,
  syncProductsToStore
} from '../instagram-scraper.js';

const router = Router();

/**
 * POST /api/instagram/scrape
 * Dispara un scraping manual del album privado de Instagram
 *
 * Body:
 *   - albumUrl: URL del album a scrapear (ej: https://www.instagram.com/kbeautycde/channel/XXXXXX/)
 *   - sync: boolean - sincronizar con la tienda después de scrapear (default: true)
 */
router.post('/scrape', async (req, res) => {
  try {
    const { albumUrl, sync = true } = req.body;

    if (!albumUrl) {
      return res.status(400).json({ error: 'albumUrl es requerido' });
    }

    console.log(`[Instagram] Iniciando scrape de ${albumUrl}`);

    // Ejecutar scraping
    const scrapResult = await scrapeInstagramAlbum(albumUrl);

    if (!scrapResult.success) {
      return res.status(500).json({
        success: false,
        error: scrapResult.error
      });
    }

    // Guardar productos
    saveScrapedProducts(scrapResult.products);

    // Sincronizar con tienda si se solicita
    let syncResult = null;
    if (sync && scrapResult.products.length > 0) {
      syncResult = syncProductsToStore(scrapResult.products);
    }

    res.json({
      success: true,
      postsScraped: scrapResult.postsCount,
      productsExtracted: scrapResult.productsCount,
      productsSynced: syncResult?.added || 0,
      scrapedAt: scrapResult.scrapedAt,
      message: `Scraping completado: ${scrapResult.productsCount} productos extraídos`
    });

  } catch (err) {
    console.error('[Instagram] Error en scrape:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * GET /api/instagram/status
 * Devuelve el estado del último scraping
 */
router.get('/status', (req, res) => {
  try {
    const products = loadScrapedProducts();

    if (!products) {
      return res.json({
        success: true,
        status: 'never_scraped',
        message: 'No hay datos de scraping aún'
      });
    }

    res.json({
      success: true,
      status: 'scraped',
      productsCount: products.length,
      lastScraped: products[0]?.fecha || null,
      message: `${products.length} productos disponibles`
    });

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/instagram/products
 * Devuelve todos los productos scrapeados de Instagram
 *
 * Query:
 *   - limit: número de productos a devolver (default: 50)
 *   - search: buscar por nombre/descripción
 */
router.get('/products', (req, res) => {
  try {
    const { limit = 50, search } = req.query;
    let products = loadScrapedProducts() || [];

    // Filtrar por búsqueda
    if (search) {
      const query = search.toLowerCase();
      products = products.filter(p =>
        p.nombre.toLowerCase().includes(query) ||
        p.descripcion?.toLowerCase().includes(query)
      );
    }

    // Limitar resultados
    products = products.slice(0, parseInt(limit));

    res.json({
      success: true,
      count: products.length,
      products
    });

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/instagram/sync
 * Sincroniza productos scrapeados con la tienda
 * (útil si se hizo scraping pero no se sincronizó automáticamente)
 */
router.post('/sync', (req, res) => {
  try {
    const products = loadScrapedProducts();

    if (!products || products.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No hay productos para sincronizar. Haz un scraping primero.'
      });
    }

    const result = syncProductsToStore(products);

    if (!result.success) {
      return res.status(500).json(result);
    }

    res.json({
      success: true,
      message: `Sincronización completada: ${result.added} nuevos productos`,
      details: result
    });

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * DELETE /api/instagram/clear
 * Limpia los datos de scraping (admin only)
 */
router.delete('/clear', (req, res) => {
  try {
    // En producción, verificar autenticación aquí
    const fs = require('fs');
    const path = require('path');

    const dataFile = path.join(__dirname, '../../data/instagram-products.json');
    if (fs.existsSync(dataFile)) {
      fs.unlinkSync(dataFile);
    }

    res.json({
      success: true,
      message: 'Datos de Instagram limpiados'
    });

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
