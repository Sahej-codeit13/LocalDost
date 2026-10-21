const db = require('../db');
const events = require('../events');
const { AppError } = require('../utils/http');

function addReview(shopId, { name, rating, body }) {
  const shop = db.prepare('SELECT id FROM shops WHERE id = ?').get(shopId);
  if (!shop) throw new AppError(404, 'We could not find that shop.');

  const createdAt = new Date().toISOString();
  const result = db.prepare(`
    INSERT INTO reviews (shop_id, reviewer_name, rating, body, created_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(shopId, name, rating, body, createdAt);

  const review = { id: result.lastInsertRowid, shop_id: shopId, reviewer_name: name, rating, body, created_at: createdAt };
  events.emit('review:added', review);      // the log listener in events.js reacts to this
  return review;
}

module.exports = { addReview };
