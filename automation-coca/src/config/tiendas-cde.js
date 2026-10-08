/**
 * TIENDAS CDE - MONITORES AUTOMÁTICOS
 * 20 tiendas K-beauty en Ciudad del Este
 * El sistema monitorea estas cuentas automáticamente
 */

export const TIENDAS_CDE = [
  {
    id: 'tienda_001',
    nombre: 'MediCube CDE',
    redes_sociales: {
      instagram: '@medicube.cde',
      facebook: 'medicube-cde',
      tiktok: '@medicubecde'
    }
  },
  {
    id: 'tienda_002',
    nombre: 'Beauty Korean Store',
    redes_sociales: {
      instagram: '@beautykoreanstore.py',
      facebook: 'beauty-korean-store',
      tiktok: '@beautykoreanstore'
    }
  },
  {
    id: 'tienda_003',
    nombre: 'K-Beauty Direct',
    redes_sociales: {
      instagram: '@kbeautydirect.cde',
      facebook: 'k-beauty-direct-cde',
      tiktok: '@kbeautydirect'
    }
  },
  {
    id: 'tienda_004',
    nombre: 'Skincare Seoul',
    redes_sociales: {
      instagram: '@skincare.seoul.cde',
      facebook: 'skincare-seoul',
      tiktok: '@skincareseoul'
    }
  },
  {
    id: 'tienda_005',
    nombre: 'CosmeticaKor',
    redes_sociales: {
      instagram: '@cosmeticakor.cde',
      facebook: 'cosmeticakor',
      tiktok: '@cosmeticakor'
    }
  },
  {
    id: 'tienda_006',
    nombre: 'BeautyHub CDE',
    redes_sociales: {
      instagram: '@beautyhub.cde',
      facebook: 'beauty-hub-cde',
      tiktok: '@beautyhubcde'
    }
  },
  {
    id: 'tienda_007',
    nombre: 'Korean Essence',
    redes_sociales: {
      instagram: '@koreanessence.py',
      facebook: 'korean-essence-cde',
      tiktok: '@koreanessence'
    }
  },
  {
    id: 'tienda_008',
    nombre: 'Glow and Shine',
    redes_sociales: {
      instagram: '@glowandshine.cde',
      facebook: 'glow-and-shine',
      tiktok: '@glowandshine'
    }
  },
  {
    id: 'tienda_009',
    nombre: 'Seoul Beauty Supply',
    redes_sociales: {
      instagram: '@seoulbeautysupply.cde',
      facebook: 'seoul-beauty-supply',
      tiktok: '@seoulbeautysupply'
    }
  },
  {
    id: 'tienda_010',
    nombre: 'Piel Coreana',
    redes_sociales: {
      instagram: '@pielcoreana.cde',
      facebook: 'piel-coreana',
      tiktok: '@pielcoreana'
    }
  },
  {
    id: 'tienda_011',
    nombre: 'K-Style Cosmetics',
    redes_sociales: {
      instagram: '@kstylecosmetics.py',
      facebook: 'k-style-cosmetics',
      tiktok: '@kstylecosmetics'
    }
  },
  {
    id: 'tienda_012',
    nombre: 'Natural Beauty Korea',
    redes_sociales: {
      instagram: '@naturalbeautykorea.cde',
      facebook: 'natural-beauty-korea',
      tiktok: '@naturalbeautykorea'
    }
  },
  {
    id: 'tienda_013',
    nombre: 'Radiance Hub',
    redes_sociales: {
      instagram: '@radiancehub.cde',
      facebook: 'radiance-hub',
      tiktok: '@radiancehub'
    }
  },
  {
    id: 'tienda_014',
    nombre: 'Seoul Imports',
    redes_sociales: {
      instagram: '@seoulimports.cde',
      facebook: 'seoul-imports',
      tiktok: '@seoulimports'
    }
  },
  {
    id: 'tienda_015',
    nombre: 'Beauty Essence Store',
    redes_sociales: {
      instagram: '@beautyessencestore.cde',
      facebook: 'beauty-essence-store',
      tiktok: '@beautyessencestore'
    }
  },
  {
    id: 'tienda_016',
    nombre: 'CosmeticaKPop',
    redes_sociales: {
      instagram: '@cosmeticakpop.cde',
      facebook: 'cosmetica-kpop',
      tiktok: '@cosmeticakpop'
    }
  },
  {
    id: 'tienda_017',
    nombre: 'Premium Skin Solutions',
    redes_sociales: {
      instagram: '@premiumskinsolutions.py',
      facebook: 'premium-skin-solutions',
      tiktok: '@premiumskinsolutions'
    }
  },
  {
    id: 'tienda_018',
    nombre: 'Glow Factory',
    redes_sociales: {
      instagram: '@glowfactory.cde',
      facebook: 'glow-factory',
      tiktok: '@glowfactory'
    }
  },
  {
    id: 'tienda_019',
    nombre: 'Seoul Market Express',
    redes_sociales: {
      instagram: '@seoulmarketexpress.cde',
      facebook: 'seoul-market-express',
      tiktok: '@seoulmarketexpress'
    }
  },
  {
    id: 'tienda_020',
    nombre: 'Belleza Infinita Korea',
    redes_sociales: {
      instagram: '@bellezainfinitakorea.cde',
      facebook: 'belleza-infinita-korea',
      tiktok: '@bellezainfinitakorea'
    }
  }
];

export const KEYWORDS_KBEAUTY = [
  'k-beauty', 'kbeauty', 'coreano', 'coreana', 'korea', 'korean',
  'skincare', 'serum', 'toner', 'ampoule', 'essence', 'mascarilla',
  'mask', 'cleanser', 'cream', 'cushion', 'bb cream', 'cc cream',
  'tint', 'laneige', 'cosrx', 'some by mi', 'mediheal', 'missha'
];

export const KEYWORDS_EXCLUDE = [
  'envío', 'shipping', 'entrega', 'delivery', 'pago', 'payment',
  'promoción', 'promo', 'descuento', 'oferta', 'concurso', 'sorteo'
];

export default { TIENDAS_CDE, KEYWORDS_KBEAUTY, KEYWORDS_EXCLUDE };
