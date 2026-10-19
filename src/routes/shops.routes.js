const express = require('express');
const shopController = require('../controllers/shop.controller');
const reviewController = require('../controllers/review.controller');
const validateReview = require('../middleware/validateReview');

const router = express.Router();

router.get('/:id', shopController.show);                                     // GET  /api/shops/3
router.post('/:id/reviews', validateReview, reviewController.create);        // POST /api/shops/3/reviews

module.exports = router;
