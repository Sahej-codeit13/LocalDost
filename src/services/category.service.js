const db = require('../db');
const { placeholders } = require('../utils/sql');

function listCategories() {
  return db.prepare('SELECT id, name, name_hi, icon FROM categories ORDER BY name').all();
}

function getCategoriesByIds(ids) {
  if (ids.length === 0) return [];
  return db
    .prepare(`SELECT id, name, name_hi, icon FROM categories WHERE id IN (${placeholders(ids)})`)
    .all(...ids);
}

// Turn typed words into category ids.
// "jarsi" -> Sports Jerseys,  "kapde" -> Clothing,  "football jersey" -> Sports Jerseys
function findCategoryIds(keywords) {
  const found = new Set();
  const phrases = [keywords.join(" "), ...keywords];   // whole phrase first, then each word

  for (const phrase of phrases) {
    if (phrase.length < 2) continue;
    const like = `%${phrase}%`;

    // 1. exact synonym (jarsi, kapde, joote ...)
    db.prepare('SELECT category_id FROM synonyms WHERE term = ?')
      .all(phrase).forEach((row) => found.add(row.category_id));

    // 2. part of a category name (English or Hindi)
    db.prepare('SELECT id FROM categories WHERE lower(name) LIKE ? OR name_hi LIKE ?')
      .all(like, like).forEach((row) => found.add(row.id));

    // 3. part of a product name ("football jersey" -> its category)
    db.prepare('SELECT category_id FROM products WHERE lower(name) LIKE ?')
      .all(like).forEach((row) => found.add(row.category_id));

    // The whole phrase matched ("sports jerseys"): stop here, so single words
    // like "sports" do not drag in other categories (like Sports shoes).
    if (found.size > 0 && phrase === phrases[0]) break;
  }

  return [...found];
}

module.exports = { listCategories, getCategoriesByIds, findCategoryIds };
