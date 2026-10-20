const cityService = require('../services/city.service');

exports.list = (req, res) => {
  res.json({ data: cityService.listCities() });
};

exports.show = (req, res) => {
  res.json({ data: cityService.getCity(req.params.slug) });
};
