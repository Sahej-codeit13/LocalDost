const db = require('../db');
const { AppError } = require('../utils/http');

function mapsLink(lat, lng) {
  if (lat == null || lng == null) return null;
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
}

function getMarket(id) {
  const market = db.prepare(`
    SELECT m.id, m.name, m.area, m.description, m.market_type, m.numbering_notes,
           m.latitude, m.longitude,
           c.name AS city_name, c.slug AS city_slug,
           (SELECT COUNT(*) FROM shops s WHERE s.market_id = m.id AND s.status = 'active') AS shop_count,
           (SELECT ROUND(AVG(r.rating), 1)
              FROM reviews r JOIN shops s ON s.id = r.shop_id
              WHERE s.market_id = m.id AND r.status = 'published') AS avg_rating
    FROM markets m
    JOIN cities c ON c.id = m.city_id
    WHERE m.id = ?
  `).get(id);

  if (!market) throw new AppError(404, 'We could not find that market.');

  market.maps_link = mapsLink(market.latitude, market.longitude);
  return market;
}

module.exports = { getMarket, mapsLink };
