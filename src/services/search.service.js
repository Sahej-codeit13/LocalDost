const db = require('../db');
const events = require('../events');
const { placeholders } = require('../utils/sql');
const { normalize, keywordsFrom } = require('../utils/text');
const { findCategoryIds, getCategoriesByIds, listCategories } = require('./category.service');
const { listShops } = require('./shop.service');
const { freshness } = require('./freshness.service');

const BUDGET_WORDS = ['cheap', 'saste', 'sasta', 'budget', 'affordable', 'सस्ता', 'सस्ते'];

// Step 1: understand the sentence -> city + budget + important words
function parseQuery(q, citySlug) {
  let text = ' ' + normalize(q) + ' ';
  let city = null;

  // Is a city name in the sentence? ("jersey in delhi", "dilli")
  for (const row of db.prepare('SELECT * FROM cities').all()) {
    const names = [row.name, ...(row.aliases || '').split(',')].map(normalize).filter(Boolean);
    const hit = names.find((name) => text.includes(' ' + name + ' '));
    if (hit) {
      city = row;
      text = text.replace(' ' + hit + ' ', ' ');
      break;
    }
  }

  // No city typed? Use the one chosen in the dropdown.
  if (!city && citySlug) {
    city = db.prepare('SELECT * FROM cities WHERE slug = ?').get(citySlug) || null;
  }

  const words = text.split(' ').filter(Boolean);
  const budget = words.some((word) => BUDGET_WORDS.includes(word));
  const keywords = keywordsFrom(words.filter((word) => !BUDGET_WORDS.includes(word)).join(' '));

  return { city, budget, keywords };
}

// Step 2a: which markets have the most shops selling these categories?
function marketsSelling(categoryIds, cityId, budget) {
  const params = [...categoryIds];
  let extra = '';
  if (cityId) { extra += ' AND m.city_id = ?'; params.push(cityId); }
  if (budget) { extra += " AND s.price_tier = 'budget'"; }

  return db.prepare(`
    SELECT m.id, m.name, m.area, c.name AS city_name,
      COUNT(DISTINCT s.id) AS matching_shops,
      (SELECT COUNT(*) FROM shops WHERE market_id = m.id AND status = 'active') AS total_shops,
      MAX(s.last_updated_at) AS last_updated_at,
      (SELECT ROUND(AVG(r.rating), 1)
         FROM reviews r JOIN shops s2 ON s2.id = r.shop_id
         WHERE s2.market_id = m.id AND r.status = 'published') AS avg_rating
    FROM markets m
    JOIN cities c ON c.id = m.city_id
    JOIN shops s ON s.market_id = m.id AND s.status = 'active'
    JOIN shop_categories sc ON sc.shop_id = s.id
    WHERE sc.category_id IN (${placeholders(categoryIds)}) ${extra}
    GROUP BY m.id, m.name, m.area, c.name
    ORDER BY matching_shops DESC, avg_rating DESC, m.name
    LIMIT 20
  `).all(...params);
}

// Step 2b: no category matched, so try the market name ("palika")
function marketsByName(words, cityId) {
  const params = [`%${words}%`];
  let extra = '';
  if (cityId) { extra = ' AND m.city_id = ?'; params.push(cityId); }

  return db.prepare(`
    SELECT m.id, m.name, m.area, c.name AS city_name,
      NULL AS matching_shops,
      (SELECT COUNT(*) FROM shops WHERE market_id = m.id AND status = 'active') AS total_shops,
      (SELECT MAX(last_updated_at) FROM shops WHERE market_id = m.id) AS last_updated_at,
      (SELECT ROUND(AVG(r.rating), 1)
         FROM reviews r JOIN shops s2 ON s2.id = r.shop_id
         WHERE s2.market_id = m.id AND r.status = 'published') AS avg_rating
    FROM markets m
    JOIN cities c ON c.id = m.city_id
    WHERE lower(m.name) LIKE ? ${extra}
    ORDER BY m.name
    LIMIT 20
  `).all(...params);
}

// The main search: markets first, then shops
function search(q, citySlug) {
  const { city, budget, keywords } = parseQuery(q, citySlug);
  const cityId = city ? city.id : null;
  const categoryIds = findCategoryIds(keywords);

  let markets = [];
  let shops = [];

  if (categoryIds.length > 0) {
    markets = marketsSelling(categoryIds, cityId, budget);
    shops = listShops({ categoryIds, cityId, tier: budget ? 'budget' : null, limit: 10 });
  } else if (keywords.length > 0) {
    markets = marketsByName(keywords.join(' '), cityId);
    shops = listShops({ q: keywords.join(' '), cityId, limit: 10 });
  }

  markets.forEach((market) => { market.freshness = freshness(market.last_updated_at); });

  const nothingFound = markets.length === 0 && shops.length === 0;
  if (nothingFound && normalize(q)) events.emit('search:empty', normalize(q));

  return {
    interpretation: {
      city: city ? { name: city.name, slug: city.slug } : null,
      categories: getCategoriesByIds(categoryIds),
      budget,
    },
    markets,
    shops,
    suggestions: nothingFound ? listCategories() : [],
  };
}

// Autocomplete: UNION puts four lists into one
function suggest(q) {
  const text = normalize(q);
  if (text.length < 2) return [];
  const like = `${text}%`;

  return db.prepare(`
    SELECT name AS label FROM cities     WHERE lower(name) LIKE ?
    UNION
    SELECT name AS label FROM markets    WHERE lower(name) LIKE ?
    UNION
    SELECT name AS label FROM categories WHERE lower(name) LIKE ?
    UNION
    SELECT name AS label FROM products   WHERE lower(name) LIKE ?
    ORDER BY label
    LIMIT 8
  `).all(like, like, like, like).map((row) => row.label);
}

module.exports = { search, suggest };
