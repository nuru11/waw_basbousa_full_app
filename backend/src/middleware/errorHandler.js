const AppError = require('../utils/AppError');

function errorHandler(err, _req, res, _next) {
  const statusCode = err.statusCode || 500;
  const message = err.isOperational ? err.message : 'Internal server error';
  const code = err.code || (err.isOperational ? 'INTERNAL_ERROR' : 'INTERNAL_ERROR');

  if (!err.isOperational) {
    console.error(err);
  }

  res.status(statusCode).json({
    success: false,
    code,
    message,
    ...(err.params ? { params: err.params } : {}),
    ...(process.env.NODE_ENV === 'development' && !err.isOperational
      ? { stack: err.stack }
      : {}),
  });
}

module.exports = errorHandler;
