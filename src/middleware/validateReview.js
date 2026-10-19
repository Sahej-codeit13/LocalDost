const { AppError } = require('../utils/http');

// Checks the review form before the controller sees it.
module.exports = function validateReview(req, res, next) {
  const name = String(req.body.name || '').trim();
  const body = String(req.body.body || '').trim();
  const rating = Number(req.body.rating);

  if (name.length < 1 || name.length > 40) {
    throw new AppError(400, 'Please enter your name (up to 40 letters).');
  }
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw new AppError(400, 'Please choose a rating from 1 to 5.');
  }
  if (body.length > 1000) {
    throw new AppError(400, 'Please keep your review under 1000 letters.');
  }

  req.body = { name, rating, body: body || null };   // keep only the clean values
  next();
};
