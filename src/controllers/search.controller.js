const searchService = require('../services/search.service');

exports.search = (req, res) => {
  const q = String(req.query.q || '').slice(0, 100);
  const city = String(req.query.city || '');
  res.json({ data: searchService.search(q, city) });
};

exports.suggest = (req, res) => {
  const q = String(req.query.q || '').slice(0, 100);
  res.json({ data: searchService.suggest(q) });
};
