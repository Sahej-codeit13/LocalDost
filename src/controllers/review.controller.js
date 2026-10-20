const reviewService = require('../services/review.service');
const { parseId } = require('../utils/http');

exports.create = (req, res) => {
  const review = reviewService.addReview(parseId(req.params.id), req.body);
  res.status(201).json({ data: review });
};
