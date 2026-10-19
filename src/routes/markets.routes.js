const express = require('express');
const controller = require('../controllers/market.controller');

const router = express.Router();

router.get('/:id', controller.show);             // GET /api/markets/1
router.get('/:id/shops', controller.shops);      // GET /api/markets/1/shops?q=jersey

module.exports = router;
