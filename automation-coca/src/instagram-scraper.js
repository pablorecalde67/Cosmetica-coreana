import { chromium } from 'playwright';
import { config } from './config.js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', 'data');
const INSTAGRAM_LOG = path.join(DATA_DIR, 'instagram-sync.log');

fs.mkdirSync(DATA_DIR, { recursive: true });

/**
 * Logger para Instagram scraping
 */
function log(message, level = 'INFO') {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] ${level}: ${message}\n`;
  console.log(`[Instagram] ${message}`);
  fs.appendFileSync(INSTAGRAM_LOG, logEntry);
}

/**
 * Extrae información de un post de Instagram (foto, caption, comentarios con precios)
 * Busca patrones como "$X", "precio: $X", "desde $X", etc.
 */
function extractProductDataFromPost(post) {
  const products = [];

  // Extrae caption
  const caption = post.caption || '';

  // Busca patrones de precio: $XXX, ARS XXX, USD XXX, etc.
  const priceRegex = /[\$]?([\d,]+(?:\.?\d{2})?)\s*(ARS|USD|pesos)?/gi;
  const matches = [...caption.matchAll(priceRegex)];

  if (matches.length > 0) {
    matches.forEach((match, idx) => {
      const price = parseFloat(match[1].replace(',', ''));
      const currency = match[2] || 'ARS';

      products.push({
        nombre: caption.substring(0, 100) || `Producto ${idx + 1}`,
        descripcion: caption,
        precio: price,
        moneda: currency,
        fuente: 'instagram',
        postId: post.postId,
        imagen: post.image,
        fecha: post.date,
        url: post.url
      });
    });
  }

  // Si no hay precios pero hay caption, crear producto genérico
  if (products.length === 0 && caption.length > 0) {
    products.push({
      nombre: caption.substring(0, 100),
      descripcion: caption,
      precio: null,
      moneda: 'ARS',
      fuente: 'instagram',
      postId: post.postId,
      imagen: post.image,
      fecha: post.date,
      url: post.url
    });
  }

  return products;
}

/**
 * Scraping de album de Instagram usando Playwright
 * Requiere credenciales en config (INSTAGRAM_USERNAME, INSTAGRAM_PASSWORD)
 */
export async function scrapeInstagramAlbum(albumUrl) {
  if (!config.instagramUsername || !config.instagramPassword) {
    log('❌ Credenciales de Instagram no configuradas. Configura INSTAGRAM_USERNAME y INSTAGRAM_PASSWORD en .env', 'ERROR');
    return { success: false, error: 'Credenciales faltantes' };
  }

  let browser;
  try {
    log('🚀 Iniciando scraping de Instagram: ' + albumUrl);

    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    });
    const page = await context.newPage();

    // Ir a Instagram
    log('📍 Navegando a Instagram...');
    await page.goto('https://www.instagram.com/', { waitUntil: 'networkidle' });

    // Buscar botón de login
    const loginButtonSelector = 'a[href="/accounts/login/"]';
    const isLoggedOut = await page.$(loginButtonSelector) !== null;

    if (isLoggedOut) {
      log('🔐 Ingresando con credenciales...');
      await page.click(loginButtonSelector);
      await page.waitForNavigation();

      // Ingresar usuario
      await page.fill('input[name="username"]', config.instagramUsername);
      await page.fill('input[name="password"]', config.instagramPassword);
      await page.click('button[type="submit"]');

      // Esperar a que cargue
      await page.waitForNavigation({ waitUntil: 'networkidle', timeout: 30000 }).catch(() => {});
      log('✅ Login completado');
    } else {
      log('✅ Ya estás logged in');
    }

    // Ir al album
    log(`📂 Accediendo a album: ${albumUrl}`);
    await page.goto(albumUrl, { waitUntil: 'networkidle' });

    // Esperar a que carguen las fotos
    await page.waitForSelector('img[alt*="Publicación"]', { timeout: 10000 }).catch(() => {});

    // Scroll para cargar más contenido
    log('📜 Scrolleando para cargar más posts...');
    for (let i = 0; i < 5; i++) {
      await page.evaluate(() => window.scrollBy(0, window.innerHeight));
      await page.waitForTimeout(1000);
    }

    // Extraer posts (estructura simplificada de Instagram)
    const posts = await page.evaluate(() => {
      const items = [];
      const articles = document.querySelectorAll('article');

      articles.forEach((article, idx) => {
        try {
          // Buscar imagen
          const img = article.querySelector('img');
          const image = img?.src || img?.currentSrc || '';

          // Buscar caption/descripción (puede estar en varios lugares)
          let caption = '';
          const captionElements = article.querySelectorAll('h2, span, div');
          captionElements.forEach(el => {
            const text = el.innerText?.trim() || '';
            if (text.length > 0 && text.length < 500) {
              caption += ' ' + text;
            }
          });

          // Buscar link del post
          const postLink = article.querySelector('a[href*="/p/"]')?.href || '';

          // Crear ID único
          const postId = postLink.match(/\/p\/([^\/]+)/)?.[1] || `post_${idx}`;

          if (image || caption) {
            items.push({
              postId,
              image,
              caption: caption.trim().substring(0, 1000),
              url: postLink,
              date: new Date().toISOString()
            });
          }
        } catch (e) {
          console.error('Error extrayendo post:', e.message);
        }
      });

      return items;
    });

    log(`📸 Se encontraron ${posts.length} posts`);

    // Extraer productos de los posts
    const allProducts = [];
    posts.forEach(post => {
      const products = extractProductDataFromPost(post);
      allProducts.push(...products);
    });

    log(`📦 Se extrajeron ${allProducts.length} productos`);

    await context.close();
    await browser.close();

    return {
      success: true,
      postsCount: posts.length,
      productsCount: allProducts.length,
      products: allProducts,
      scrapedAt: new Date().toISOString()
    };

  } catch (err) {
    log(`❌ Error en scraping: ${err.message}`, 'ERROR');
    if (browser) await browser.close();
    return { success: false, error: err.message };
  }
}

/**
 * Scraping alternativo: usando datos JSON que Instagram expone en HTML
 * (más confiable que buscar elementos)
 */
export async function scrapeInstagramAlbumJSON(albumUrl) {
  let browser;
  try {
    log('🚀 Iniciando scraping JSON de Instagram: ' + albumUrl);

    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto(albumUrl, { waitUntil: 'networkidle' });

    // Buscar datos JSON embebidos en la página
    const data = await page.evaluate(() => {
      const scripts = document.querySelectorAll('script');
      let pageData = null;

      for (const script of scripts) {
        try {
          const content = script.textContent;
          if (content.includes('__typename') && content.includes('GraphImage')) {
            // Encontramos datos de Instagram
            const match = content.match(/window\._sharedData\s*=\s*({.*?});/s);
            if (match) {
              pageData = JSON.parse(match[1]);
              break;
            }
          }
        } catch (e) {
          // Ignorar errores de parsing
        }
      }

      return pageData;
    });

    await context.close();
    await browser.close();

    if (!data) {
      log('⚠️ No se encontraron datos JSON en la página', 'WARN');
      return { success: false, error: 'No data found' };
    }

    log('✅ Datos JSON extraídos exitosamente');
    return { success: true, data, scrapedAt: new Date().toISOString() };

  } catch (err) {
    log(`❌ Error en scraping JSON: ${err.message}`, 'ERROR');
    if (browser) await browser.close();
    return { success: false, error: err.message };
  }
}

/**
 * Guarda productos scrapeados en archivo JSON
 */
export function saveScrapedProducts(products, filename = 'instagram-products.json') {
  const filepath = path.join(DATA_DIR, filename);
  const data = {
    scrapedAt: new Date().toISOString(),
    count: products.length,
    products
  };

  fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
  log(`💾 Productos guardados en ${filename}`);
  return filepath;
}

/**
 * Carga productos previos scrapeados
 */
export function loadScrapedProducts(filename = 'instagram-products.json') {
  const filepath = path.join(DATA_DIR, filename);
  if (!fs.existsSync(filepath)) return null;

  try {
    const data = JSON.parse(fs.readFileSync(filepath, 'utf8'));
    log(`📂 Cargados ${data.count} productos desde ${filename}`);
    return data.products;
  } catch (err) {
    log(`❌ Error cargando ${filename}: ${err.message}`, 'ERROR');
    return null;
  }
}

/**
 * Sincroniza productos de Instagram con la tienda
 */
export function syncProductsToStore(products, storeFile = '../public/productos.json') {
  const storePath = path.join(DATA_DIR, storeFile);

  try {
    let storeData = { productos: [] };
    if (fs.existsSync(storePath)) {
      storeData = JSON.parse(fs.readFileSync(storePath, 'utf8'));
    }

    // Agregar productos de Instagram (sin duplicados por postId)
    const existingPostIds = new Set(
      storeData.productos.map(p => p.postId).filter(Boolean)
    );

    let added = 0;
    products.forEach(product => {
      if (!existingPostIds.has(product.postId)) {
        storeData.productos.push(product);
        added++;
      }
    });

    fs.writeFileSync(storePath, JSON.stringify(storeData, null, 2));
    log(`✅ Sincronizados ${added} nuevos productos a la tienda`);

    return { success: true, added, total: storeData.productos.length };
  } catch (err) {
    log(`❌ Error sincronizando: ${err.message}`, 'ERROR');
    return { success: false, error: err.message };
  }
}
