// Loads sample data into the database.
//   npm run seed                      -> uses data/seed.json
//   node src/seed.js my-data.json     -> uses your own file (process.argv)
const fs = require('fs');
const path = require('path');
const db = require('./db');
const { slugify } = require('./utils/text');

const seedFile = process.argv[2]
  ? path.resolve(process.argv[2])
  : path.join(__dirname, '..', 'data', 'seed.json');

const data = JSON.parse(fs.readFileSync(seedFile, 'utf8'));
const daysAgo = (n) => new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString();

// 1. create empty tables
db.exec(fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8'));

// 2. insert everything in one transaction (all or nothing)
const loadData = db.transaction(() => {
  const cityId = {};
  const categoryId = {};
  const productId = {};

  for (const city of data.cities) {
    const result = db
      .prepare('INSERT INTO cities (name, slug, state, aliases) VALUES (?, ?, ?, ?)')
      .run(city.name, slugify(city.name), city.state, city.aliases || null);
    cityId[city.name] = result.lastInsertRowid;
  }

  for (const cat of data.categories) {
    const result = db
      .prepare('INSERT INTO categories (name, name_hi, icon) VALUES (?, ?, ?)')
      .run(cat.name, cat.name_hi, cat.icon);
    categoryId[cat.name] = result.lastInsertRowid;
  }

  for (const product of data.products) {
    const result = db
      .prepare('INSERT INTO products (category_id, name) VALUES (?, ?)')
      .run(categoryId[product.category], product.name);
    productId[product.name] = result.lastInsertRowid;
  }

  for (const [categoryName, terms] of Object.entries(data.synonyms)) {
    for (const term of terms) {
      db.prepare('INSERT OR IGNORE INTO synonyms (term, category_id) VALUES (?, ?)')
        .run(term.toLowerCase(), categoryId[categoryName]);
    }
  }

  for (const market of data.markets) {
    const result = db
      .prepare(`INSERT INTO markets
        (city_id, name, area, description, market_type, numbering_notes, latitude, longitude)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(cityId[market.city], market.name, market.area, market.description,
        market.type, market.numbering, market.lat, market.lng);
    const marketId = result.lastInsertRowid;

    for (const shop of market.shops) {
      const updated = daysAgo(shop.daysAgo);
      const isVerified = ['admin_verified', 'owner_verified'].includes(shop.verification);

      const shopResult = db
        .prepare(`INSERT INTO shops
          (market_id, shop_number, block_area, location_hint, name, price_tier,
           verification_level, source, last_updated_at, last_verified_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
        .run(marketId, shop.number || null, shop.block || null, shop.hint || null,
          shop.name || null, shop.tier, shop.verification, shop.source,
          updated, isVerified ? updated : null);
      const shopId = shopResult.lastInsertRowid;

      // first category in the list is the main one
      shop.categories.forEach((categoryName, index) => {
        db.prepare('INSERT INTO shop_categories (shop_id, category_id, is_primary) VALUES (?, ?, ?)')
          .run(shopId, categoryId[categoryName], index === 0 ? 1 : 0);
      });

      for (const item of shop.products) {
        if (!productId[item.name]) throw new Error(`Unknown product in seed file: ${item.name}`);
        db.prepare(`INSERT INTO shop_products
          (shop_id, product_id, price_min, price_max, last_confirmed_at) VALUES (?, ?, ?, ?, ?)`)
          .run(shopId, productId[item.name], item.min, item.max, updated);
      }

      for (const review of shop.reviews || []) {
        db.prepare(`INSERT INTO reviews (shop_id, reviewer_name, rating, body, created_at)
          VALUES (?, ?, ?, ?, ?)`)
          .run(shopId, review.name, review.rating, review.body, daysAgo(review.daysAgo));
      }
    }
  }
});

loadData();

const count = (table) => db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get().n;
console.log(`Seed file: ${seedFile}`);
console.log(`Loaded ${count('cities')} cities, ${count('markets')} markets, ${count('shops')} shops, ` +
  `${count('products')} products, ${count('reviews')} reviews.`);
