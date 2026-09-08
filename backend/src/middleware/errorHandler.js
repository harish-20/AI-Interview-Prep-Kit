const env = require('../config/env');

/**
 * Global Centralized Error Handling Middleware
 * Ensures all uncaught errors return structured JSON instead of crashing or leaking stack traces.
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  console.error('[Error Handler]', err);

  const statusCode = err.statusCode || err.status || 500;
  const errorCode = err.code || (statusCode === 404 ? 'NOT_FOUND' : 'INTERNAL_SERVER_ERROR');

  return res.status(statusCode).json({
    error: {
      code: errorCode,
      message: err.message || 'An unexpected error occurred.',
      ...(env.NODE_ENV === 'development' && { stack: err.stack }),
    },
  });
};

module.exports = errorHandler;
