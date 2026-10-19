// Add a shop from the terminal:   npm run add-shop
// (Uses the readline module: it asks questions and waits for typed answers.)
const readline = require('readline/promises');
const db = require('../src/db');
const shopService = require('../src/services/shop.service');

async function main() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  const markets = db.prepare(`
    SELECT m.id, m.name, c.name AS city FROM markets m
    JOIN cities c ON c.id = m.city_id ORDER BY c.name, m.name
  `).all();
  console.log('\nMarkets:');
  markets.forEach((m) => console.log(`  ${m.id}. ${m.name} (${m.city})`));

  const marketId = Number(await rl.question('\nMarket number: '));
  const shopNumber = await rl.question('Shop number (press Enter to skip): ');
  const blockArea = await rl.question('Block or lane (press Enter to skip): ');
  const locationHint = await rl.question('Landmark, e.g. "near main gate" (press Enter to skip): ');
  const name = await rl.question('Shop name (press Enter to skip): ');
  const priceTier = await rl.question('Price level (budget / mid / premium): ');

  const categories = db.prepare('SELECT id, name FROM categories ORDER BY name').all();
  console.log('\nCategories:');
  categories.forEach((c) => console.log(`  ${c.id}. ${c.name}`));
  const answer = await rl.question('Category numbers, separated by commas (main one first): ');
  const categoryIds = answer.split(',').map((n) => Number(n.trim())).filter(Boolean);

  rl.close();

  const shopId = shopService.createShop({
    marketId, shopNumber, blockArea, locationHint, name,
    priceTier: priceTier.trim().toLowerCase(), categoryIds,
  });
  console.log(`\nDone! Shop saved. Open it at /shop.html?id=${shopId}`);
}

main().catch((err) => {
  console.error('\nCould not save the shop:', err.message);
  process.exit(1);
});
