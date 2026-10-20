const marketService = require('../services/market.service');
const shopService = require('../services/shop.service');
const { parseId } = require('../utils/http');

exports.show = (req, res) => {
  res.json({ data: marketService.getMarket(parseId(req.params.id)) });
};

// Shops inside one market, with search + filters
exports.shops = (req, res) => {
  const marketId = parseId(req.params.id);
  marketService.getMarket(marketId);               // 404 if the market does not exist

  const shops = shopService.listShops({
    marketId,
    q: req.query.q,
    tier: req.query.tier,
    verified: req.query.verified === '1',
    minRating: Number(req.query.minRating) || 0,
    sort: req.query.sort,
  });
  res.json({ data: shops });
};
