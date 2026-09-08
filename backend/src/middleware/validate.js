/**
 * Helper middleware for basic request payload validation.
 */
const validateBody = (requiredFields) => {
  return (req, res, next) => {
    if (!req.body) {
      return res.status(400).json({
        error: {
          code: 'BAD_REQUEST',
          message: 'Request body is missing.',
        },
      });
    }

    const missing = requiredFields.filter((field) => {
      const val = req.body[field];
      return val === undefined || val === null || val === '';
    });

    if (missing.length > 0) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: `Missing required field(s): ${missing.join(', ')}`,
        },
      });
    }

    next();
  };
};

module.exports = {
  validateBody,
};
