// Global error handler middleware
function errorHandler(err, req, res, next) {
  console.error('Error:', err.message);

  // Handle custom errors
  if (err.statusCode) {
    return res.status(err.statusCode).json({
      error: err.message,
      type: err.name
    });
  }

  // Handle Sequelize validation errors
  if (err.name === 'SequelizeValidationError') {
    return res.status(400).json({
      error: 'Validation error',
      details: err.errors.map(e => e.message)
    });
  }

  // Handle Sequelize unique constraint errors
  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json({
      error: 'A record with this value already exists',
      field: err.errors[0].path
    });
  }

  // Default error response
  res.status(500).json({
    error: err.message || 'Internal server error',
    type: 'InternalError'
  });
}

module.exports = errorHandler;
