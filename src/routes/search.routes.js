const express = require('express');
const controller = require('../controllers/search.controller');

const router = express.Router();

router.get('/', controller.search);              // GET /api/search?q=jersey&city=delhi
router.get('/suggest', controller.suggest);      // GET /api/search/suggest?q=pal

module.exports = router;
