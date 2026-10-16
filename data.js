/* ============================================================
   ROADKILL — product data (shared by app.js)
   One source of truth for all product/variant information.
   ============================================================ */

const PRODUCTS = [
  {
    id: 'bunny-chewed',
    name: 'Ripped Long-Ear Bunny Beanie',
    slug: 'ripped-long-ear-bunny-beanie',
    price: 48.00,
    category: 'beanies',
    colors: [
      { name: 'Asphalt Black', hex: '#0d0d0d', image: 'assets/bunny-beanie.png' },
      { name: 'Off-White', hex: '#ece8e1', image: 'assets/product-2.png' },
      { name: 'Faded Grey', hex: '#6b6b6b', image: 'assets/product-3.png' },
    ],
    defaultColor: 'Asphalt Black',
    description:
      'The flagship. A wide, snug cold-weather beanie built for the turnpike. One ear has been deliberately chewed to a rounded point — exactly how it looked after the driver backed into the shelf. Extra-durable double knit, weighted to stay put on the wind.',
    damageReport: {
      material: 'Double-knit acrylic / wool blend',
      fit: 'Snug, brim-1.5"',
      whatGotChewed: 'Dog (unidentified, possibly a food-motivated SUV driver)',
      origin: 'Northeastern PA, Route 11',
      batch: 'Rarities Batch #001',
    },
    inventory: 47,
    available: true,
    tags: ['Flagship', 'Beanies'],
    featured: true,
  },
  {
    id: 'cat-frayed',
    name: 'Frayed Cat Ear Beanie',
    slug: 'frayed-cat-ear-beanie',
    price: 44.00,
    category: 'beanies',
    colors: [
      { name: 'Asphalt Black', hex: '#0d0d0d', image: 'assets/cat-ear-beanie.webp' },
    ],
    defaultColor: 'Asphalt Black',
    description:
      'Two pointed ears, one of them torn open at the tip with the threads left hanging. Same thick rib knit and cuffed brim as the flagship, with the star patch stitched low on the cuff.',
    damageReport: {
      material: 'Double-knit acrylic / wool blend',
      fit: 'Snug, cuffed brim',
      whatGotChewed: 'Right ear, torn at the tip. Loose threads left in.',
      origin: 'Northeastern PA, Route 11',
      batch: 'Rarities Batch #002',
    },
    inventory: 30,
    available: true,
    tags: ['New', 'Beanies'],
    featured: true,
  },
  {
    id: 'beanie-cream',
    name: 'Midnight Tannery Beanie',
    slug: 'midnight-tannery-beanie',
    price: 38.00,
    category: 'beanies',
    colors: [
      { name: 'Cream', hex: '#ece8e1', image: 'assets/product-2.png' },
      { name: 'Charcoal', hex: '#3a3a3a', image: 'assets/product-1.png' },
    ],
    defaultColor: 'Cream',
    description:
      'A clean, classic beanie that finally got its texture. Waterlogged ski-socks, salt stains, the whole story — written in the grain of the knit. Warm enough to walk through a PA winter without asking for it.',
    damageReport: {
      material: 'Merino / acrylic blend',
      fit: 'Relaxed, brim-2"',
      whatGotChewed: 'Not chewed. Just lived in.',
      origin: 'NEPA truck stop, 2:13 a.m.',
      batch: 'Winter 2026',
    },
    inventory: 62,
    available: true,
    tags: ['Core', 'Wool'],
    featured: true,
  },
  {
    id: 'beanie-grey',
    name: 'Faded Road Runner Beanie',
    slug: 'faded-road-runner-beanie',
    price: 34.00,
    category: 'beanies',
    colors: [
      { name: 'Charcoal', hex: '#3a3a3a', image: 'assets/product-3.png' },
      { name: 'Black', hex: '#0d0d0d', image: 'assets/product-1.png' },
    ],
    defaultColor: 'Charcoal',
    description:
      'A road-worn beanie that refused to be discarded. The grain, the fray at the brim, the subtle yellow fade — this piece walked the road and came back talking. Comfortable, warm, and already a story.',
    damageReport: {
      material: 'Acrylic / polyester blend',
      fit: 'Loose, brim-2.5"',
      whatGotChewed: 'A tire tread, once. Still rolling.',
      origin: 'Highway 61 fallout',
      batch: 'Flavor of the Month',
    },
    inventory: 0,
    available: false,
    tags: ['Road', 'Streetwear'],
    featured: false,
  },
  {
    id: 'beanie-spot',
    name: 'Cornmeal Stain Beanie',
    slug: 'cornmeal-stain-beanie',
    price: 30.00,
    category: 'beanies',
    colors: [
      { name: 'Black', hex: '#0d0d0d', image: 'assets/product-3.png' },
      { name: 'Grey', hex: '#6b6b6b', image: 'assets/product-1.png' },
    ],
    defaultColor: 'Black',
    description:
      'Real cornmeal and soy sauce, spilled on a bench in October. The stain is part of the piece now. We added a small matching patch in the shops so it can stay put in the fray.',
    damageReport: {
      material: 'Wool / bamboo blend',
      fit: 'Snug, brim-1.5"',
      whatGotChewed: 'Nothing — a spill, then a choice.',
      origin: 'Market Street, Allentown',
      batch: 'Aug 2026',
    },
    inventory: 35,
    available: true,
    tags: ['Core', 'Textured'],
    featured: false,
  },
];

/* ===== For stock invalidation ===== */
const STOCK = {};
PRODUCTS.forEach((p) => {
  if (p.inventory === 0) {
    STOCK[p.id] = { label: 'sold', qty: '0 — ROADKILL\'d' };
  } else if (p.inventory <= 5) {
    STOCK[p.id] = { label: 'last', qty: `only ${p.inventory} left` };
  } else {
    STOCK[p.id] = { label: 'in', qty: p.inventory };
  }
});

/* ===== Live / next-inventory snake (route sketching) ===== */
const LIVE = {
  name: 'Ripped Long-Ear Bunny Beanie',
  price: 48.00,
  color: 'Asphalt Black',
  image: 'assets/bunny-beanie.png',
};

/* ===== Expose to app.js (top-level const does not create window properties) ===== */
window.PRODUCTS = PRODUCTS;
window.STOCK = STOCK;
window.LIVE = LIVE;
