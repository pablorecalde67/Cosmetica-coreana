import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', 'data');
const PRODUCTS_FILE = path.join(DATA_DIR, 'products.json');

fs.mkdirSync(DATA_DIR, { recursive: true });

// Catálogo base (semilla). Vos podés editar precio, descripción, imagen y
// disponibilidad desde el panel admin (/admin) en cualquier momento: eso
// pisa este catálogo por defecto la primera vez que arranca el servicio y
// queda guardado en data/products.json.
//
// "skinTypes": tipos de piel a los que le sirve el producto.
// Valores posibles: grasa | seca | mixta | sensible | normal
//
// "concerns": preocupaciones/objetivos que ataca el producto. La IA que
// analiza la selfie devuelve estos mismos tags, así se hace el matching.
//
// Precios (sept. 2026): tomados del precio de venta real de Medicube en el
// mercado paraguayo (mismos importadores que abastecen Ciudad del Este,
// donde no se vende por catálogo propio online) en guaraníes, convertidos a
// dólares al tipo de cambio del día (~1 USD = 6.140 Gs) y de ahí a pesos
// argentinos a $1600 por dólar, como se pidió. Los productos sin una
// coincidencia exacta en el listado paraguayo (zero-pore-serum,
// glutathione-glow-serum, hypochlorous-mist, collagen-glow-sunscreen) se
// estimaron con el precio internacional (USD) de Medicube para ese mismo
// producto o de la categoría más parecida. Revisalo/ajustalo vos desde
// /productos.html si tenés un precio más preciso.
const SEED_PRODUCTS = [
  {
    id: 'zero-pore-toner',
    name: 'Tónico Facial Zero Pore',
    description:
      'Tónico exfoliante suave con AHA/BHA/PHA y niacinamida. Afina la textura, cierra poros visibles y despareja la superficie de la piel sin resecar.',
    image: '/piel/img/products/zero-pore-toner.webp',
    price: 49700,
    skinTypes: ['grasa', 'mixta', 'normal'],
    concerns: ['poros-visibles', 'textura-irregular', 'brillo-excesivo'],
    active: true,
    brand: 'MEDICUBE',
  },
  {
    id: 'zero-pore-serum',
    name: 'Sérum Facial Zero Pore 2.0',
    description:
      'Sérum control de poros y sebo, textura ligera. Ideal para pieles grasas o mixtas con brillo en zona T y poros dilatados.',
    image: '/piel/img/products/zero-pore-serum.webp',
    price: 53700,
    skinTypes: ['grasa', 'mixta'],
    concerns: ['poros-visibles', 'brillo-excesivo', 'textura-irregular'],
    active: true,
    brand: 'MEDICUBE',
  },
  {
    id: 'glutathione-glow-serum',
    name: 'Sérum Glutathione Glow',
    description:
      'Sérum luminosidad con glutatión liposomal y niacinamida al 5%. Ayuda a unificar el tono y aportar un brillo saludable a pieles opacas.',
    image: '/piel/img/products/glutathione-glow-serum.webp',
    price: 44800,
    skinTypes: ['normal', 'mixta', 'seca'],
    concerns: ['tono-desparejo', 'opacidad', 'manchas'],
    active: true,
    brand: 'MEDICUBE',
  },
  {
    id: 'vita-c-capsule',
    name: 'Sérum Deep Vita C Capsule',
    description:
      'Sérum en cápsula con vitamina C estabilizada. Antioxidante, ilumina y ayuda a atenuar manchas y marcas de acné.',
    image: '/piel/img/products/vita-c-capsule.webp',
    price: 49300,
    skinTypes: ['normal', 'mixta', 'grasa'],
    concerns: ['manchas', 'opacidad', 'tono-desparejo'],
    active: true,
    brand: 'MEDICUBE',
  },
  {
    id: 'deep-vita-a-retinol',
    name: 'Sérum Deep Vita A Retinol',
    description:
      'Sérum con retinol para renovación celular. Suaviza líneas finas y mejora la textura en pieles con signos de edad.',
    image: '/piel/img/products/deep-vita-a-retinol.webp',
    price: 58300,
    skinTypes: ['normal', 'mixta', 'seca'],
    concerns: ['signos-de-edad', 'textura-irregular'],
    active: true,
    brand: 'MEDICUBE',
  },
  {
    id: 'collagen-jelly-cream',
    name: 'Crema Hidratante Collagen Jelly Cream',
    description:
      'Crema gel con colágeno. Hidratación profunda y efecto relleno, para pieles secas o deshidratadas que buscan firmeza.',
    image: '/piel/img/products/collagen-jelly-cream.webp',
    price: 54000,
    skinTypes: ['seca', 'normal'],
    concerns: ['deshidratacion', 'signos-de-edad'],
    active: true,
    brand: 'MEDICUBE',
  },
  {
    id: 'red-cream-plus',
    name: 'Crema Facial Red Cream Plus',
    description:
      'Crema calmante y nutritiva pensada para pieles sensibles o con tendencia al enrojecimiento. Fortalece la barrera cutánea.',
    image: '/piel/img/products/red-cream-plus.webp',
    price: 58600,
    skinTypes: ['sensible', 'seca'],
    concerns: ['enrojecimiento', 'deshidratacion', 'barrera-danada'],
    active: true,
    brand: 'MEDICUBE',
  },
  {
    id: 'exosome-cica-serum',
    name: 'Sérum Exosome Cica',
    description:
      'Sérum reparador con centella asiática y exosomas. Calma irritación y ayuda a recuperar piel sensibilizada o post-procedimiento.',
    image: '/piel/img/products/exosome-cica-serum.webp',
    price: 53700,
    skinTypes: ['sensible', 'seca', 'normal'],
    concerns: ['enrojecimiento', 'barrera-danada', 'deshidratacion'],
    active: true,
    brand: 'MEDICUBE',
  },
  {
    id: 'azelaic-niacinamide-cleanser',
    name: 'Espuma Limpiadora Azelaic Acid + Niacinamide',
    description:
      'Limpiador suave con ácido azelaico y niacinamida. Pensado para piel con tendencia acneica o rojeces, sin resecar.',
    image: '/piel/img/products/azelaic-niacinamide-cleanser.webp',
    price: 48200,
    skinTypes: ['grasa', 'mixta', 'sensible'],
    concerns: ['con-acne', 'enrojecimiento', 'poros-visibles'],
    active: true,
    brand: 'MEDICUBE',
  },
  {
    id: 'hypochlorous-mist',
    name: 'Mist Facial Hypochlorous Acid Daily',
    description:
      'Bruma calmante de uso diario. Ayuda a controlar brotes y mantener la piel fresca e hidratada durante el día.',
    image: '/piel/img/products/hypochlorous-mist.webp',
    price: 40000,
    skinTypes: ['grasa', 'mixta', 'sensible', 'normal'],
    concerns: ['con-acne', 'deshidratacion', 'enrojecimiento'],
    active: true,
    brand: 'MEDICUBE',
  },
  {
    id: 'kojic-turmeric-pad',
    name: 'Almohadillas Tónicas Kojic Acid Turmeric',
    description:
      'Pads exfoliantes con ácido kójico y cúrcuma. Ayudan a atenuar manchas y marcas post-acné y a uniformar el tono.',
    image: '/piel/img/products/kojic-turmeric-pad.webp',
    price: 56700,
    skinTypes: ['grasa', 'mixta', 'normal'],
    concerns: ['manchas', 'tono-desparejo', 'con-acne'],
    active: true,
    brand: 'MEDICUBE',
  },
  {
    id: 'pdrn-hydrating-serum',
    name: 'Sérum PDRN Pink Peptide',
    description:
      'Sérum regenerador e hidratante con PDRN. Repara la barrera cutánea y aporta luminosidad a pieles deshidratadas o sensibles.',
    image: '/piel/img/products/pdrn-hydrating-serum.webp',
    price: 53700,
    skinTypes: ['seca', 'sensible', 'normal'],
    concerns: ['deshidratacion', 'barrera-danada', 'opacidad'],
    active: true,
    brand: 'MEDICUBE',
  },
  {
    id: 'collagen-glow-sunscreen',
    name: 'Protector Solar Collagen Glow Sunscreen SPF50',
    description:
      'Protector solar con efecto luminoso. Recomendado como paso final para cualquier tipo de piel, todos los días.',
    image: '/piel/img/products/collagen-glow-sunscreen.webp',
    price: 22400,
    skinTypes: ['grasa', 'mixta', 'seca', 'sensible', 'normal'],
    concerns: ['signos-de-edad', 'manchas', 'tono-desparejo'],
    active: true,
    brand: 'MEDICUBE',
  },

  // --- Resto de marcas K-beauty (sept. 2026) ---
  // Misma metodologia de precio que Medicube: primero precio real de venta
  // en el mercado paraguayo (Shopping Terra Nova, megaelectronicos.com.py)
  // en guaranies convertido a USD (~6.140 Gs) y de ahi a ARS a $1600/USD;
  // si no habia coincidencia puntual en ese mercado, precio internacional
  // oficial de la marca (YesStyle, Stylevana, sitio oficial) x1600. El campo
  // "brand" es solo informativo para el panel admin, no afecta el matching.
  {
    id: 'anua-heartleaf-77-soothing-toner',
    name: 'Anua Heartleaf 77% Soothing Toner',
    description:
      'Tónico calmante con 77% de extracto de asperilla (heartleaf) que baja rojeces e irritación al toque. Ideal si tenés piel sensible, reactiva o con tendencia a granitos.',
    image: '/piel/img/products/anua-heartleaf-77-soothing-toner.webp',
    price: 46370,
    skinTypes: ['sensible', 'mixta', 'grasa'],
    concerns: ['enrojecimiento', 'barrera-danada', 'deshidratacion'],
    active: true,
    brand: 'ANUA',
  },
  {
    id: 'anua-peach-70-niacinamide-serum',
    name: 'Anua Peach 70% Niacinamide Serum',
    description:
      'Sérum con 70% de extracto de durazno y niacinamida que empareja el tono y afina la textura sin resecar. Perfecto para piel mixta a grasa con poros marcados.',
    image: '/piel/img/products/anua-peach-70-niacinamide-serum.webp',
    price: 35200,
    skinTypes: ['mixta', 'grasa', 'normal'],
    concerns: ['poros-visibles', 'tono-desparejo', 'textura-irregular'],
    active: true,
    brand: 'ANUA',
  },
  {
    id: 'anua-heartleaf-pore-control-cleansing-oil',
    name: 'Anua Heartleaf Pore Control Cleansing Oil',
    description:
      'Aceite limpiador que disuelve maquillaje, protector solar y exceso de sebo sin dejar la piel tirante. Muy pedido por quienes tienen poros visibles y piel grasa o mixta.',
    image: '/piel/img/products/anua-heartleaf-pore-control-cleansing-oil.webp',
    price: 38400,
    skinTypes: ['grasa', 'mixta', 'normal'],
    concerns: ['poros-visibles', 'brillo-excesivo', 'con-acne'],
    active: true,
    brand: 'ANUA',
  },
  {
    id: 'beauty-of-joseon-relief-sun-spf50',
    name: 'Beauty of Joseon Relief Sun: Rice + Probiotics SPF50+',
    description:
      'El protector solar coreano más viral: textura súper liviana, no deja blanco ni brillo graso, y lleva arroz y probióticos que además cuidan la barrera de la piel.',
    image: '/piel/img/products/beauty-of-joseon-relief-sun-spf50.webp',
    price: 28800,
    skinTypes: ['normal', 'mixta', 'seca', 'sensible'],
    concerns: ['proteccion-solar', 'deshidratacion', 'barrera-danada'],
    active: true,
    brand: 'BEAUTY OF JOSEON',
  },
  {
    id: 'beauty-of-joseon-glow-deep-serum',
    name: 'Beauty of Joseon Glow Deep Serum: Rice + Alpha-Arbutin',
    description:
      'Sérum iluminador con agua de arroz y alfa-arbutina que ataca manchas y tono desparejo, dejando la piel más pareja y con luz.',
    image: '/piel/img/products/beauty-of-joseon-glow-deep-serum.webp',
    price: 27200,
    skinTypes: ['mixta', 'normal', 'seca'],
    concerns: ['manchas', 'tono-desparejo', 'opacidad'],
    active: true,
    brand: 'BEAUTY OF JOSEON',
  },
  {
    id: 'beauty-of-joseon-dynasty-cream',
    name: 'Beauty of Joseon Dynasty Cream',
    description:
      'Crema nutritiva con aceite de camelia y ginseng, pensada para pieles secas o maduras que necesitan hidratación profunda y un extra anti-edad.',
    image: '/piel/img/products/beauty-of-joseon-dynasty-cream.webp',
    price: 56000,
    skinTypes: ['seca', 'normal'],
    concerns: ['signos-de-edad', 'deshidratacion'],
    active: true,
    brand: 'BEAUTY OF JOSEON',
  },
  {
    id: 'cosrx-low-ph-good-morning-gel-cleanser',
    name: 'COSRX Low pH Good Morning Gel Cleanser',
    description:
      'Limpiador en gel de pH bajo (5.5) que lava sin resecar ni alterar la barrera cutánea. El básico de rutina para piel sensible o con acné.',
    image: '/piel/img/products/cosrx-low-ph-good-morning-gel-cleanser.webp',
    price: 16350,
    skinTypes: ['sensible', 'grasa', 'mixta', 'normal'],
    concerns: ['barrera-danada', 'con-acne', 'control-oleosidad'],
    active: true,
    brand: 'COSRX',
  },
  {
    id: 'cosrx-advanced-snail-96-mucin-essence',
    name: 'COSRX Advanced Snail 96 Mucin Power Essence',
    description:
      'La esencia de baba de caracol más famosa del K-beauty: hidrata en profundidad y ayuda a reparar la piel dañada o deshidratada, con ese efecto "glass skin".',
    image: '/piel/img/products/cosrx-advanced-snail-96-mucin-essence.webp',
    price: 28800,
    skinTypes: ['seca', 'sensible', 'normal', 'mixta'],
    concerns: ['deshidratacion', 'barrera-danada', 'textura-irregular'],
    active: true,
    brand: 'COSRX',
  },
  {
    id: 'cosrx-aha-bha-clarifying-toner',
    name: 'COSRX AHA/BHA Clarifying Treatment Toner',
    description:
      'Tónico exfoliante suave con AHA y BHA que despeja poros y afina la textura. Ideal para piel grasa o mixta con puntos negros y brillo.',
    image: '/piel/img/products/cosrx-aha-bha-clarifying-toner.webp',
    price: 32000,
    skinTypes: ['grasa', 'mixta'],
    concerns: ['poros-visibles', 'textura-irregular', 'con-acne', 'brillo-excesivo'],
    active: true,
    brand: 'COSRX',
  },
  {
    id: 'seoul1988-retinal-2-black-ginseng-serum',
    name: 'Seoul 1988 Retinal Liposome 2% + Black Ginseng Serum',
    description:
      'Sérum anti-edad con retinal encapsulado y ginseng negro que trabaja arrugas y firmeza sin la irritación típica del retinol tradicional.',
    image: '/piel/img/products/seoul1988-retinal-2-black-ginseng-serum.webp',
    price: 39560,
    skinTypes: ['normal', 'mixta', 'seca'],
    concerns: ['signos-de-edad', 'textura-irregular', 'opacidad'],
    active: true,
    brand: 'SEOUL 1988',
  },
  {
    id: 'seoul1988-retinal-4-fermented-bean-eye-cream',
    name: 'Seoul 1988 Retinal Liposome 4% + Fermented Bean Eye Cream',
    description:
      'Contorno de ojos con retinal de alta concentración y poroto fermentado, pensado para líneas finas y ojeras. Se usa de noche.',
    image: '/piel/img/products/seoul1988-retinal-4-fermented-bean-eye-cream.webp',
    price: 35200,
    skinTypes: ['normal', 'seca', 'mixta'],
    concerns: ['signos-de-edad', 'deshidratacion'],
    active: true,
    brand: 'SEOUL 1988',
  },
  {
    id: 'skin1004-centella-ampoule',
    name: 'Skin1004 Madagascar Centella Ampoule',
    description:
      'El sérum calmante estrella de la marca, con extracto 100% de centella asiática: hidrata y calma rojeces e irritaciones, apto para piel sensible.',
    image: '/piel/img/products/skin1004-centella-ampoule.webp',
    price: 40390,
    skinTypes: ['sensible', 'seca', 'normal', 'mixta'],
    concerns: ['enrojecimiento', 'deshidratacion', 'barrera-danada'],
    active: true,
    brand: 'SKIN1004',
  },
  {
    id: 'skin1004-centella-poremizing-ampoule',
    name: 'Skin1004 Madagascar Centella Poremizing Fresh Ampoule',
    description:
      'Versión más liviana de la línea Centella, pensada para piel grasa o con poros abiertos: controla el brillo mientras calma.',
    image: '/piel/img/products/skin1004-centella-poremizing-ampoule.webp',
    price: 31050,
    skinTypes: ['grasa', 'mixta'],
    concerns: ['poros-visibles', 'brillo-excesivo', 'control-oleosidad'],
    active: true,
    brand: 'SKIN1004',
  },
  {
    id: 'skin1004-centella-hyalucica-first-ampoule',
    name: 'Skin1004 Madagascar Centella Hyalu-Cica First Ampoule',
    description:
      'Primer paso de rutina tipo esencia, con centella y ácido hialurónico, para dar un extra de hidratación y luminosidad antes del sérum.',
    image: '/piel/img/products/skin1004-centella-hyalucica-first-ampoule.webp',
    price: 29200,
    skinTypes: ['seca', 'normal', 'mixta'],
    concerns: ['deshidratacion', 'opacidad'],
    active: true,
    brand: 'SKIN1004',
  },
  {
    id: 'tocobo-vita-tone-up-sun-cream-spf50',
    name: 'Tocobo Vita Tone Up Sun Cream SPF50+',
    description:
      'Protector solar con un ligero efecto "tono up" que ilumina al toque, sin dejar blanco. Buena opción para piel normal a mixta que quiere un extra de luminosidad.',
    image: '/piel/img/products/tocobo-vita-tone-up-sun-cream-spf50.webp',
    price: 41230,
    skinTypes: ['normal', 'mixta', 'seca'],
    concerns: ['proteccion-solar', 'opacidad', 'luminosidad'],
    active: true,
    brand: 'TOCOBO',
  },
  {
    id: 'tocobo-bio-watery-sun-cream-spf50',
    name: 'Tocobo Bio Watery Sun Cream SPF50+',
    description:
      'El protector solar "aguado" más famoso de Tocobo: textura gel-agua que se siente como nada, ideal para piel grasa o mixta que odia sentirse pesada.',
    image: '/piel/img/products/tocobo-bio-watery-sun-cream-spf50.webp',
    price: 40000,
    skinTypes: ['grasa', 'mixta', 'normal'],
    concerns: ['proteccion-solar', 'brillo-excesivo', 'control-oleosidad'],
    active: true,
    brand: 'TOCOBO',
  },
  {
    id: 'tocobo-cica-calming-serum',
    name: 'Tocobo Cica Calming Serum',
    description:
      'Sérum calmante a base de centella que baja la inflamación y las rojeces, pensado para piel sensible o reactiva que necesita reparar su barrera.',
    image: '/piel/img/products/tocobo-cica-calming-serum.webp',
    price: 41600,
    skinTypes: ['sensible', 'seca', 'normal'],
    concerns: ['enrojecimiento', 'barrera-danada', 'deshidratacion'],
    active: true,
    brand: 'TOCOBO',
  },
  {
    id: 'somebymi-aha-bha-pha-30days-miracle-toner',
    name: 'Some By Mi AHA-BHA-PHA 30 Days Miracle Toner',
    description:
      'El tónico exfoliante ícono de Some By Mi: combina tres ácidos para destapar poros y afinar la textura en piel grasa o con tendencia acnéica.',
    image: '/piel/img/products/somebymi-aha-bha-pha-30days-miracle-toner.webp',
    price: 44140,
    skinTypes: ['grasa', 'mixta'],
    concerns: ['poros-visibles', 'textura-irregular', 'con-acne', 'brillo-excesivo'],
    active: true,
    brand: 'SOME BY MI',
  },
  {
    id: 'somebymi-snail-truecica-repair-cream',
    name: 'Some By Mi Snail Truecica Miracle Repair Cream',
    description:
      'Crema reparadora con mucina de caracol y centella, pensada para calmar la piel después de tratamientos exfoliantes o con acné activo.',
    image: '/piel/img/products/somebymi-snail-truecica-repair-cream.webp',
    price: 38400,
    skinTypes: ['sensible', 'mixta', 'seca'],
    concerns: ['barrera-danada', 'enrojecimiento', 'con-acne'],
    active: true,
    brand: 'SOME BY MI',
  },
  {
    id: 'somebymi-galactomyces-vitamin-c-glow-serum',
    name: 'Some By Mi Galactomyces Pure Vitamin C Glow Serum',
    description:
      'Sérum luminoso con galactomyces fermentado y vitamina C derivada, para dar brillo saludable y parejo a pieles opacas.',
    image: '/piel/img/products/somebymi-galactomyces-vitamin-c-glow-serum.webp',
    price: 31520,
    skinTypes: ['normal', 'mixta', 'seca'],
    concerns: ['opacidad', 'tono-desparejo', 'luminosidad'],
    active: true,
    brand: 'SOME BY MI',
  },
  {
    id: 'torriden-dive-in-hyaluronic-serum',
    name: 'Torriden Dive-In Low Molecule Hyaluronic Acid Serum',
    description:
      'Sérum con 5 tipos de ácido hialurónico de bajo peso molecular que hidrata en profundidad sin sensación pegajosa. Un básico para piel deshidratada.',
    image: '/piel/img/products/torriden-dive-in-hyaluronic-serum.webp',
    price: 38400,
    skinTypes: ['seca', 'normal', 'mixta', 'sensible'],
    concerns: ['deshidratacion', 'barrera-danada'],
    active: true,
    brand: 'TORRIDEN',
  },
  {
    id: 'torriden-dive-in-soothing-cream',
    name: 'Torriden Dive-In Soothing Cream',
    description:
      'Crema calmante e hidratante de la misma línea Dive-In, pensada para sellar la hidratación y calmar la piel sensible o reactiva.',
    image: '/piel/img/products/torriden-dive-in-soothing-cream.webp',
    price: 34990,
    skinTypes: ['sensible', 'seca', 'normal'],
    concerns: ['deshidratacion', 'enrojecimiento', 'barrera-danada'],
    active: true,
    brand: 'TORRIDEN',
  },
  {
    id: 'mixsoon-bean-essence',
    name: 'Mixsoon Bean Essence',
    description:
      'Esencia fermentada a base de poroto de soja que exfolia suavemente y da un brillo tipo "piel de vidrio". Furor en redes por su efecto glow inmediato.',
    image: '/piel/img/products/mixsoon-bean-essence.webp',
    price: 56000,
    skinTypes: ['normal', 'mixta', 'seca'],
    concerns: ['opacidad', 'textura-irregular', 'luminosidad'],
    active: true,
    brand: 'MIXSOON',
  },
  {
    id: 'mixsoon-bean-toner',
    name: 'Mixsoon Bean Toner',
    description:
      'Tónico hidratante y calmante de la línea Bean, pensado como primer paso para preparar la piel y darle un extra de luminosidad.',
    image: '/piel/img/products/mixsoon-bean-toner.webp',
    price: 44800,
    skinTypes: ['normal', 'mixta', 'seca', 'sensible'],
    concerns: ['deshidratacion', 'opacidad'],
    active: true,
    brand: 'MIXSOON',
  },
  {
    id: 'numbuzin-no5-dark-spot-ampoule',
    name: 'Numbuzin No.5+ Glutathione TXA Advanced Dark Spot Ampoule Concentrate',
    description:
      'Ampolla concentrada con glutatión y ácido tranexámico para atacar manchas puntuales y marcas de acné.',
    image: '/piel/img/products/numbuzin-no5-dark-spot-ampoule.webp',
    price: 39220,
    skinTypes: ['normal', 'mixta', 'grasa'],
    concerns: ['manchas', 'tono-desparejo'],
    active: true,
    brand: 'NUMBUZIN',
  },
  {
    id: 'numbuzin-no3-skin-softening-serum',
    name: 'Numbuzin No.3 Skin Softening Serum',
    description:
      'El sérum más viral de Numbuzin: combina niacinamida y adenosina para afinar poros y dar ese efecto piel de bebé o "glass skin".',
    image: '/piel/img/products/numbuzin-no3-skin-softening-serum.webp',
    price: 44800,
    skinTypes: ['mixta', 'grasa', 'normal'],
    concerns: ['poros-visibles', 'textura-irregular', 'opacidad'],
    active: true,
    brand: 'NUMBUZIN',
  },
  {
    id: 'numbuzin-no5-vitamin-concentrated-serum',
    name: 'Numbuzin No.5+ Glutathione Vitamin Concentrated Serum',
    description:
      'Sérum brightening con vitamina C y niacinamida en alta concentración, para tono parejo y luminosidad.',
    image: '/piel/img/products/numbuzin-no5-vitamin-concentrated-serum.webp',
    price: 41600,
    skinTypes: ['mixta', 'normal', 'seca'],
    concerns: ['tono-desparejo', 'opacidad', 'manchas'],
    active: true,
    brand: 'NUMBUZIN',
  },
  {
    id: 'dr-althea-147-barrier-cream',
    name: 'Dr. Althea 147 Barrier Cream',
    description:
      'Crema reparadora de barrera con pantenol y centella, para pieles sensibles o resecas que necesitan calma y reconstrucción.',
    image: '/piel/img/products/dr-althea-147-barrier-cream.webp',
    price: 44370,
    skinTypes: ['sensible', 'seca', 'normal'],
    concerns: ['barrera-danada', 'deshidratacion', 'enrojecimiento'],
    active: true,
    brand: 'DR. ALTHEA',
  },
  {
    id: 'dr-althea-345-relief-cream',
    name: 'Dr. Althea 345 Relief Cream',
    description:
      'Crema calmante multiuso pensada para piel con acné activo o post-acné: hidrata sin tapar los poros y ayuda a bajar la inflamación.',
    image: '/piel/img/products/dr-althea-345-relief-cream.webp',
    price: 43200,
    skinTypes: ['sensible', 'mixta', 'grasa'],
    concerns: ['con-acne', 'enrojecimiento', 'barrera-danada'],
    active: true,
    brand: 'DR. ALTHEA',
  },
  {
    id: 'dr-althea-melaclear-cream',
    name: 'Dr. Althea MelaClear Cream',
    description:
      'Crema despigmentante suave para trabajar manchas y marcas de acné, con un enfoque más gentil que otros tratamientos con ácidos fuertes.',
    image: '/piel/img/products/dr-althea-melaclear-cream.webp',
    price: 40390,
    skinTypes: ['normal', 'mixta', 'seca'],
    concerns: ['manchas', 'tono-desparejo'],
    active: true,
    brand: 'DR. ALTHEA',
  },
  {
    id: 'jumiso-all-day-vitamin-brightening-serum',
    name: 'Jumiso All Day Vitamin Brightening & Balancing Facial Serum',
    description:
      'Sérum con niacinamida al 20.000ppm y vitaminas que despareja el tono y controla el brillo. Ideal para piel mixta a grasa.',
    image: '/piel/img/products/jumiso-all-day-vitamin-brightening-serum.webp',
    price: 38400,
    skinTypes: ['mixta', 'grasa', 'normal'],
    concerns: ['tono-desparejo', 'brillo-excesivo', 'opacidad'],
    active: true,
    brand: 'JUMISO',
  },
  {
    id: 'jumiso-waterfull-hyaluronic-serum',
    name: 'Jumiso Waterfull Hyaluronic Acid Serum',
    description:
      'Sérum hidratante ligero con múltiples pesos de ácido hialurónico, para dar un chorro de hidratación instantánea a cualquier tipo de piel.',
    image: '/piel/img/products/jumiso-waterfull-hyaluronic-serum.webp',
    price: 40000,
    skinTypes: ['seca', 'normal', 'mixta', 'sensible'],
    concerns: ['deshidratacion'],
    active: true,
    brand: 'JUMISO',
  },
  {
    id: 'jumiso-snail-mucin-88-peptide-cream',
    name: 'Jumiso Snail Mucin 88 + Peptide Facial Cream',
    description:
      'Crema reparadora con alta concentración de mucina de caracol y péptidos, pensada para pieles maduras o dañadas que buscan firmeza e hidratación.',
    image: '/piel/img/products/jumiso-snail-mucin-88-peptide-cream.webp',
    price: 29600,
    skinTypes: ['seca', 'normal', 'sensible'],
    concerns: ['signos-de-edad', 'deshidratacion', 'barrera-danada'],
    active: true,
    brand: 'JUMISO',
  },
];

function load() {
  if (!fs.existsSync(PRODUCTS_FILE)) {
    save(SEED_PRODUCTS);
    return SEED_PRODUCTS;
  }
  try {
    return JSON.parse(fs.readFileSync(PRODUCTS_FILE, 'utf8'));
  } catch {
    return SEED_PRODUCTS;
  }
}

function save(products) {
  fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(products, null, 2));
}

let products = load();

export function listProducts({ onlyActive = false } = {}) {
  return onlyActive ? products.filter((p) => p.active !== false) : [...products];
}

export function getProduct(id) {
  return products.find((p) => p.id === id);
}

export function updateProduct(id, patch) {
  const product = getProduct(id);
  if (!product) return null;
  Object.assign(product, patch);
  save(products);
  return product;
}

function slugify(name) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Crea un producto nuevo en el catalogo. Si no mandan id, se genera uno a
// partir del nombre (agregando un sufijo numerico si ya existe).
export function createProduct({ name, description = '', image = '/piel/img/placeholder.svg', price, skinTypes = [], concerns = [], brand = '', active = true, id }) {
  let finalId = id || slugify(name);
  let n = 2;
  while (getProduct(finalId)) {
    finalId = `${id || slugify(name)}-${n}`;
    n++;
  }

  const product = { id: finalId, name, description, image, price, skinTypes, concerns, active, brand };
  products.push(product);
  save(products);
  return product;
}

// Carga muchos productos de una sola vez (ej. importación desde un Excel).
// A diferencia de createProduct, resuelve colisiones de id en memoria contra
// un Set y hace UN solo guardado en disco al final — createProduct llamado
// en loop miles de veces sería carísimo (recorre todo el catálogo y
// reescribe el archivo entero en cada llamada).
export function bulkImportProducts(rawProducts) {
  const existingIds = new Set(products.map((p) => p.id));
  let added = 0;

  for (const raw of rawProducts) {
    const base = raw.id || slugify(raw.name);
    let finalId = base;
    let n = 2;
    while (existingIds.has(finalId)) {
      finalId = `${base}-${n}`;
      n++;
    }
    existingIds.add(finalId);

    products.push({
      id: finalId,
      name: raw.name,
      description: raw.description || '',
      image: raw.image || '/piel/img/placeholder.svg',
      price: raw.price,
      skinTypes: Array.isArray(raw.skinTypes) ? raw.skinTypes : [],
      concerns: Array.isArray(raw.concerns) ? raw.concerns : [],
      active: raw.active !== false,
      brand: raw.brand || '',
      store: raw.store || '',
    });
    added++;
  }

  save(products);
  return added;
}

/**
 * Ordena el catálogo activo según qué tan bien matchea con el tipo de piel
 * y las preocupaciones ("concerns") que devolvió el análisis de IA.
 * Devuelve los primeros `limit` (por defecto 5).
 */
export function recommendProducts({ skinType, concerns = [] }, limit = 5) {
  const active = listProducts({ onlyActive: true });

  const scored = active.map((p) => {
    let score = 0;
    if (skinType && p.skinTypes.includes(skinType)) score += 3;
    for (const c of concerns) {
      if (p.concerns.includes(c)) score += 2;
    }
    return { product: p, score };
  });

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.product);
}
