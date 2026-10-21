const db = require('../db');
const { AppError } = require('../utils/http');
const { placeholders } = require('../utils/sql');
const { normalize, keywordsFrom } = require('../utils/text');
const { freshness } = require('./freshness.service');
const { findCategoryIds } = require('./category.service');
const { mapsLink } = require('./market.service');

const TIERS = ['budget', 'mid', 'premium'];

// Base query: a shop + its market + city + rating (subqueries) + a verified rank.
// Other queries wrap this one:  SELECT * FROM ( ...this... ) WHERE ...
const SHOP_SELECT = `
  SELECT s.*,
    m.name AS market_name, m.city_id AS city_id, m.latitude AS market_lat, m.longitude AS market_lng,
    c.name AS city_name, c.slug AS city_slug,
    (SELECT ROUND(AVG(rating), 1) FROM reviews WHERE shop_id = s.id AND status = 'published') AS avg_rating,
    (SELECT COUNT(*) FROM reviews WHERE shop_id = s.id AND status = 'published') AS review_count,
    CASE s.verification_level
      WHEN 'owner_verified' THEN 3 WHEN 'admin_verified' THEN 3
      WHEN 'community_confirmed' THEN 2 ELSE 1 END AS verified_rank
  FROM shops s
  JOIN markets m ON m.id = s.market_id
  JOIN cities c ON c.id = m.city_id
`;

// Only these ORDER BY choices are allowed (never paste user text into SQL)
const SORTS = {
  best: 'verified_rank DESC, avg_rating DESC, last_updated_at DESC',
  rating: 'avg_rating DESC, review_count DESC',
  recent: 'last_updated_at DESC',
};

// Add categories and freshness to a list of shops
function addDetails(shops) {
  if (shops.length === 0) return shops;

  const ids = shops.map((shop) => shop.id);
  const rows = db.prepare(`
    SELECT sc.shop_id, c.name, c.name_hi
    FROM shop_categories sc
    JOIN categories c ON c.id = sc.category_id
    WHERE sc.shop_id IN (${placeholders(ids)})
    ORDER BY sc.is_primary DESC, c.name
  `).all(...ids);

  for (const shop of shops) {
    shop.categories = rows.filter((row) => row.shop_id === shop.id);
    shop.freshness = freshness(shop.last_updated_at);
  }
  return shops;
}

// Find shops. Every filter is optional.
// filters: marketId, cityId, categoryIds, q, tier, verified, minRating, sort, limit
function listShops(filters = {}) {
  const where = ["status = 'active'"];
  const params = [];

  if (filters.marketId) { where.push('market_id = ?'); params.push(filters.marketId); }
  if (filters.cityId)   { where.push('city_id = ?');   params.push(filters.cityId); }
  if (TIERS.includes(filters.tier)) { where.push('price_tier = ?'); params.push(filters.tier); }
  if (filters.verified) where.push("verification_level IN ('admin_verified', 'owner_verified')");
  if (filters.minRating) { where.push('avg_rating >= ?'); params.push(filters.minRating); }

  if (filters.categoryIds && filters.categoryIds.length > 0) {
    // already know which categories we want
    where.push(`id IN (SELECT shop_id FROM shop_categories WHERE category_id IN (${placeholders(filters.categoryIds)}))`);
    params.push(...filters.categoryIds);
  } else if (filters.q) {
    // free text: shop number, shop name, landmark, or a category/product word
    const words = keywordsFrom(filters.q);
    if (words.length > 0) {
      const like = `%${words.join(' ')}%`;
      const options = [
        `lower(shop_number) IN (${placeholders(words)})`,
        'lower(name) LIKE ?',
        'lower(location_hint) LIKE ?',
      ];
      params.push(...words, like, like);

      const categoryIds = findCategoryIds(words);
      if (categoryIds.length > 0) {
        options.push(`id IN (SELECT shop_id FROM shop_categories WHERE category_id IN (${placeholders(categoryIds)}))`);
        params.push(...categoryIds);
      }
      where.push(`(${options.join(' OR ')})`);
    }
  }

  const orderBy = SORTS[filters.sort] || SORTS.best;
  const sql = `SELECT * FROM (${SHOP_SELECT}) WHERE ${where.join(' AND ')} ORDER BY ${orderBy} LIMIT ?`;

  return addDetails(db.prepare(sql).all(...params, filters.limit || 50));
}

// Everything for the shop page
function getShop(id) {
  const shop = db.prepare(`SELECT * FROM (${SHOP_SELECT}) WHERE id = ?`).get(id);
  if (!shop) throw new AppError(404, 'We could not find that shop.');

  addDetails([shop]);
  shop.maps_link = mapsLink(shop.market_lat, shop.market_lng);

  shop.products = db.prepare(`
    SELECT p.name, cat.name AS category, sp.price_min, sp.price_max, sp.last_confirmed_at
    FROM shop_products sp
    JOIN products p ON p.id = sp.product_id
    JOIN categories cat ON cat.id = p.category_id
    WHERE sp.shop_id = ?
    ORDER BY cat.name, p.name
  `).all(id);
  shop.products.forEach((p) => { p.freshness = freshness(p.last_confirmed_at); });

  shop.reviews = db.prepare(`
    SELECT id, reviewer_name, rating, body, created_at
    FROM reviews
    WHERE shop_id = ? AND status = 'published'
    ORDER BY created_at DESC
  `).all(id);

  return shop;
}

// Add a new shop (used by scripts/add-shop.js)
function createShop(input) {
  const market = db.prepare('SELECT id FROM markets WHERE id = ?').get(input.marketId);
  if (!market) throw new AppError(404, 'That market does not exist.');

  const number = (input.shopNumber || '').trim() || null;
  const name = (input.name || '').trim() || null;
  const hint = (input.locationHint || '').trim() || null;
  if (!number && !name && !hint) {
    throw new AppError(400, 'Give at least one of: shop number, shop name, landmark.');
  }
  if (!TIERS.includes(input.priceTier)) throw new AppError(400, 'Price tier must be budget, mid or premium.');
  if (!input.categoryIds || input.categoryIds.length === 0) throw new AppError(400, 'Pick at least one category.');

  const save = db.transaction(() => {
    const now = new Date().toISOString();
    const result = db.prepare(`
      INSERT INTO shops (market_id, shop_number, block_area, location_hint, name, price_tier,
                         verification_level, source, last_updated_at, last_verified_at)
      VALUES (?, ?, ?, ?, ?, ?, 'admin_verified', 'admin', ?, ?)
    `).run(input.marketId, number, (input.blockArea || '').trim() || null, hint, name, input.priceTier, now, now);

    input.categoryIds.forEach((categoryId, index) => {
      db.prepare('INSERT INTO shop_categories (shop_id, category_id, is_primary) VALUES (?, ?, ?)')
        .run(result.lastInsertRowid, categoryId, index === 0 ? 1 : 0);
    });
    return result.lastInsertRowid;
  });

  try {
    return save();
  } catch (err) {
    if (String(err.code).startsWith('SQLITE_CONSTRAINT')) {
      throw new AppError(409, 'This shop number already exists in that block of the market.');
    }
    throw err;
  }
}

module.exports = { listShops, getShop, createShop };
