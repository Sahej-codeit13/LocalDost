const express = require('express');
const controller = require('../controllers/city.controller');

const router = express.Router();

router.get('/', controller.list);            // GET /api/cities
router.get('/:slug', controller.show);       // GET /api/cities/delhi

module.exports = router;
