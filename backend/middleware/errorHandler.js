/**
 * errorHandler.js — Centralized error handling middleware
 */

function errorHandler(err, req, res, _next) {
  console.error('[Error]', err.message || err);

  const status = err.status || 500;
  const message = err.message || 'Internal server error';

  res.status(status).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' ? { stack: err.stack } : {}),
  });
}

module.exports = { errorHandler };
