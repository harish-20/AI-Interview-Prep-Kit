const jwt = require('jsonwebtoken');
const env = require('../config/env');

/**
 * Authentication Middleware
 * Validates JWT token from httpOnly cookies (or Authorization Bearer header).
 * Attaches decoded user payload to `req.user`.
 * Returns clean structured JSON 401 error if token is missing, expired, or invalid.
 */
const protect = (req, res, next) => {
  try {
    let token = req.cookies?.token;

    // Fallback to Bearer token in header if cookie not present
    if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Access denied. Authentication token missing.',
        },
      });
    }

    const decoded = jwt.verify(token, env.JWT_SECRET);
    req.user = { id: decoded.id, email: decoded.email };
    next();
  } catch (err) {
    const isExpired = err.name === 'TokenExpiredError';
    return res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: isExpired ? 'Authentication token expired.' : 'Invalid authentication token.',
      },
    });
  }
};

module.exports = {
  protect,
};
