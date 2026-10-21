const db = require('../db');
const { AppError } = require('../utils/http');

// All cities, with how many markets each has (JOIN + GROUP BY)
function listCities() {
  return db.prepare(`
    SELECT c.id, c.name, c.slug, c.state, COUNT(m.id) AS market_count
    FROM cities c
    LEFT JOIN markets m ON m.city_id = c.id
    GROUP BY c.id, c.name, c.slug, c.state
    ORDER BY c.name
  `).all();
}

// One city page: its markets and the categories sold there
function getCity(slug) {
  const city = db.prepare('SELECT id, name, slug, state FROM cities WHERE slug = ?').get(slug);
  if (!city) throw new AppError(404, 'We are not in that city yet.');

  const markets = db.prepare(`
    SELECT m.id, m.name, m.area, m.description,
      (SELECT COUNT(*) FROM shops s WHERE s.market_id = m.id AND s.status = 'active') AS shop_count,
      (SELECT ROUND(AVG(r.rating), 1)
         FROM reviews r JOIN shops s ON s.id = r.shop_id
         WHERE s.market_id = m.id AND r.status = 'published') AS avg_rating
    FROM markets m
    WHERE m.city_id = ?
    ORDER BY shop_count DESC, m.name
  `).all(city.id);

  const categories = db.prepare(`
    SELECT cat.id, cat.name, cat.name_hi, cat.icon,
      COUNT(DISTINCT s.id) AS shop_count,
      COUNT(DISTINCT m.id) AS market_count
    FROM categories cat
    JOIN shop_categories sc ON sc.category_id = cat.id
    JOIN shops s ON s.id = sc.shop_id AND s.status = 'active'
    JOIN markets m ON m.id = s.market_id
    WHERE m.city_id = ?
    GROUP BY cat.id, cat.name, cat.name_hi, cat.icon
    ORDER BY shop_count DESC
  `).all(city.id);

  return { ...city, markets, categories };
}

module.exports = { listCities, getCity };
