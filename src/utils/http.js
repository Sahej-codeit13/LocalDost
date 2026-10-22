// An error that carries an HTTP status code.
class AppError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

// Turn "12" into 12, or throw a 400 error.
function parseId(value) {
  const id = Number(value);
  if (!Number.isInteger(id) || id < 1) {
    throw new AppError(400, 'That id is not valid.');
  }
  return id;
}

module.exports = { AppError, parseId };
