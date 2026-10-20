const shopService = require('../services/shop.service');
const { parseId } = require('../utils/http');

exports.show = (req, res) => {
  res.json({ data: shopService.getShop(parseId(req.params.id)) });
};
