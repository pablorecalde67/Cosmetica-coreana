/**
 * SEO Module
 * Gestión de meta tags, structured data, Open Graph, etc.
 */

import { config } from './config.js';

/**
 * Genera meta tags para una página
 */
export function generateMetaTags(options = {}) {
  const {
    title = config.siteTitle || 'KBeauty CDE',
    description = config.siteDescription || 'Venta online de cosméticos coreanos',
    keywords = config.siteKeywords || 'korean beauty, skincare',
    image = 'https://kbeautycde.com/og-image.jpg',
    url = config.publicBaseUrl || 'https://kbeautycde.com',
    type = 'website',
    author = 'KBeauty CDE'
  } = options;

  return {
    // Basic meta tags
    title,
    'meta[name="description"]': description,
    'meta[name="keywords"]': keywords,
    'meta[name="author"]': author,
    'meta[name="viewport"]': 'width=device-width, initial-scale=1.0',
    'meta[name="robots"]': 'index, follow',

    // Open Graph (Facebook, LinkedIn, etc.)
    'meta[property="og:title"]': title,
    'meta[property="og:description"]': description,
    'meta[property="og:image"]': image,
    'meta[property="og:url"]': url,
    'meta[property="og:type"]': type,
    'meta[property="og:site_name"]': 'KBeauty CDE',

    // Twitter Card
    'meta[name="twitter:card"]': 'summary_large_image',
    'meta[name="twitter:title"]': title,
    'meta[name="twitter:description"]': description,
    'meta[name="twitter:image"]': image,

    // Canonical URL
    'link[rel="canonical"]': url,

    // Favicon
    'link[rel="icon"]': '/favicon.ico',
    'link[rel="apple-touch-icon"]': '/apple-touch-icon.png',

    // Preconnect to external domains
    'link[rel="preconnect"][href="https://fonts.googleapis.com"]': '',
    'link[rel="preconnect"][href="https://www.googletagmanager.com"]': ''
  };
}

/**
 * Schema.org JSON-LD for products
 */
export function generateProductSchema(product) {
  return {
    '@context': 'https://schema.org/',
    '@type': 'Product',
    name: product.nombre,
    description: product.descripcion,
    image: product.imagen || 'https://kbeautycde.com/default-product.jpg',
    brand: {
      '@type': 'Brand',
      name: product.marca || 'KBeauty'
    },
    offers: {
      '@type': 'Offer',
      url: `${config.publicBaseUrl}/producto/${product.id}`,
      priceCurrency: product.moneda || 'ARS',
      price: product.precio.toString(),
      availability: 'https://schema.org/InStock',
      seller: {
        '@type': 'Organization',
        name: 'KBeauty CDE'
      }
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      reviewCount: '128'
    }
  };
}

/**
 * Schema.org JSON-LD for organization
 */
export function generateOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'KBeauty CDE',
    url: config.publicBaseUrl,
    logo: `${config.publicBaseUrl}/logo.png`,
    description: config.siteDescription,
    sameAs: [
      'https://www.instagram.com/kbeautycde',
      'https://www.facebook.com/kbeautycde'
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+54-9-11-6246-8000',
      contactType: 'Customer Service'
    },
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Argentina',
      addressCountry: 'AR'
    }
  };
}

/**
 * Schema.org JSON-LD for local business
 */
export function generateLocalBusinessSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: 'KBeauty CDE',
    image: `${config.publicBaseUrl}/logo.png`,
    description: config.siteDescription,
    url: config.publicBaseUrl,
    telephone: '+54-9-11-6246-8000',
    priceRange: '$$',
    areaServed: ['AR', 'BR', 'PY', 'UY'],
    sameAs: [
      'https://www.instagram.com/kbeautycde',
      'https://www.facebook.com/kbeautycde'
    ]
  };
}

/**
 * Schema.org JSON-LD for breadcrumbs
 */
export function generateBreadcrumbSchema(items = []) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${config.publicBaseUrl}${item.url}`
    }))
  };
}

/**
 * Generate sitemap entry
 */
export function generateSitemapEntry(url, lastmod = new Date(), changefreq = 'weekly', priority = 0.8) {
  return {
    url,
    lastmod: lastmod.toISOString().split('T')[0],
    changefreq,
    priority
  };
}

/**
 * Robots.txt content
 */
export function generateRobotsTxt() {
  return `User-agent: *
Allow: /
Disallow: /admin
Disallow: /api/

Sitemap: ${config.publicBaseUrl}/sitemap.xml
User-agent: Googlebot
Allow: /

User-agent: Bingbot
Allow: /`;
}

/**
 * Generate SEO-friendly URL slug
 */
export function generateSlug(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special chars
    .replace(/[\s_]+/g, '-')   // Replace spaces/underscores with dashes
    .replace(/^-+|-+$/g, '');  // Remove leading/trailing dashes
}

/**
 * HTML helper to inject script tags
 */
export function generateScriptTag(src, attributes = {}) {
  const attrs = Object.entries(attributes)
    .map(([key, value]) => `${key}="${value}"`)
    .join(' ');
  return `<script src="${src}" ${attrs}></script>`;
}

/**
 * HTML helper for JSON-LD script
 */
export function generateJsonLdScript(schemaObject) {
  return `<script type="application/ld+json">${JSON.stringify(schemaObject)}</script>`;
}

/**
 * Validate SEO requirements for a page
 */
export function validateSEO(options = {}) {
  const errors = [];

  if (!options.title || options.title.length < 30 || options.title.length > 60) {
    errors.push('Title should be 30-60 characters');
  }

  if (!options.description || options.description.length < 120 || options.description.length > 160) {
    errors.push('Meta description should be 120-160 characters');
  }

  if (!options.keywords || options.keywords.split(',').length < 3) {
    errors.push('Should have at least 3 keywords');
  }

  if (options.content && options.content.length < 300) {
    errors.push('Page content should be at least 300 characters');
  }

  if (!options.image) {
    errors.push('Should have an OG image');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Generate Open Graph image for products
 */
export function generateProductOGImage(product) {
  return `${config.publicBaseUrl}/api/og-image?type=product&id=${product.id}&title=${encodeURIComponent(product.nombre)}&price=${product.precio}`;
}

/**
 * SEO checklist for blog posts
 */
export function generateBlogPostSchema(post) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt,
    image: post.image,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    author: {
      '@type': 'Person',
      name: 'KBeauty CDE',
      url: config.publicBaseUrl
    },
    publisher: {
      '@type': 'Organization',
      name: 'KBeauty CDE',
      logo: {
        '@type': 'ImageObject',
        url: `${config.publicBaseUrl}/logo.png`,
        width: 200,
        height: 60
      }
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${config.publicBaseUrl}/blog/${post.slug}`
    }
  };
}

export default {
  generateMetaTags,
  generateProductSchema,
  generateOrganizationSchema,
  generateLocalBusinessSchema,
  generateBreadcrumbSchema,
  generateSitemapEntry,
  generateRobotsTxt,
  generateSlug,
  generateScriptTag,
  generateJsonLdScript,
  validateSEO,
  generateProductOGImage,
  generateBlogPostSchema
};
