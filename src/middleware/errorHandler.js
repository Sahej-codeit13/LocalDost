const { AppError } = require('../utils/http');

// Unknown /api address
function notFound(req, res, next) {
  next(new AppError(404, 'That address does not exist.'));
}

// Every error ends up here and is sent as JSON
function errorHandler(err, req, res, next) {
  const status = err.status || 500;
  if (status === 500) console.error(err);     // real bugs are logged, never shown to users

  res.status(status).json({
    error: { message: status === 500 ? 'Something went wrong on our side.' : err.message },
  });
}

module.exports = { notFound, errorHandler };
