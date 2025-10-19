const winston = require('winston');

// Logger for error handling
const logger = winston.createLogger({
  level: 'error',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'api-gateway' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

/**
 * Global error handling middleware
 * @param {Error} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
function errorHandler(err, req, res, next) {
  // Log error
  logger.error({
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id,
    timestamp: new Date().toISOString()
  });

  // Handle specific error types
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation Error',
      message: err.message,
      timestamp: new Date().toISOString()
    });
  }

  if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
    return res.status(503).json({
      error: 'Service Unavailable',
      message: 'One or more services are temporarily unavailable',
      timestamp: new Date().toISOString()
    });
  }

  if (err.code === 'ETIMEDOUT') {
    return res.status(504).json({
      error: 'Gateway Timeout',
      message: 'Request timeout - service took too long to respond',
      timestamp: new Date().toISOString()
    });
  }

  if (err.status === 401) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required',
      timestamp: new Date().toISOString()
    });
  }

  if (err.status === 403) {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Access denied',
      timestamp: new Date().toISOString()
    });
  }

  if (err.status === 404) {
    return res.status(404).json({
      error: 'Not Found',
      message: 'Resource not found',
      timestamp: new Date().toISOString()
    });
  }

  if (err.status === 429) {
    return res.status(429).json({
      error: 'Too Many Requests',
      message: 'Rate limit exceeded',
      timestamp: new Date().toISOString()
    });
  }

  // Default error response
  const statusCode = err.statusCode || err.status || 500;
  const message = process.env.NODE_ENV === 'production' 
    ? 'Internal Server Error' 
    : err.message;

  res.status(statusCode).json({
    error: 'Internal Server Error',
    message,
    timestamp: new Date().toISOString(),
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
}

/**
 * 404 handler for unmatched routes
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
function notFoundHandler(req, res, next) {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.originalUrl} not found`,
    timestamp: new Date().toISOString()
  });
}

/**
 * Async error wrapper
 * @param {Function} fn - Async function to wrap
 * @returns {Function} Express middleware function
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Service unavailable handler
 * @param {string} serviceName - Name of the unavailable service
 * @returns {Function} Express middleware function
 */
function serviceUnavailableHandler(serviceName) {
  return (req, res, next) => {
    res.status(503).json({
      error: 'Service Unavailable',
      message: `${serviceName} service is temporarily unavailable`,
      timestamp: new Date().toISOString()
    });
  };
}

/**
 * Circuit breaker middleware
 * @param {Object} options - Circuit breaker options
 * @returns {Function} Express middleware function
 */
function circuitBreakerMiddleware(options = {}) {
  const {
    failureThreshold = 5,
    timeout = 60000,
    resetTimeout = 30000
  } = options;

  let failures = 0;
  let lastFailureTime = null;
  let state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN

  return (req, res, next) => {
    const now = Date.now();

    // Reset failures if timeout has passed
    if (lastFailureTime && (now - lastFailureTime) > resetTimeout) {
      failures = 0;
      state = 'CLOSED';
    }

    // Check circuit breaker state
    if (state === 'OPEN') {
      return res.status(503).json({
        error: 'Service Unavailable',
        message: 'Circuit breaker is open - service is temporarily unavailable',
        timestamp: new Date().toISOString()
      });
    }

    // Track failures
    const originalSend = res.send;
    res.send = function(data) {
      if (res.statusCode >= 500) {
        failures++;
        lastFailureTime = now;
        
        if (failures >= failureThreshold) {
          state = 'OPEN';
        }
      } else if (res.statusCode < 400) {
        failures = 0;
        state = 'CLOSED';
      }
      
      return originalSend.call(this, data);
    };

    next();
  };
}

module.exports = {
  errorHandler,
  notFoundHandler,
  asyncHandler,
  serviceUnavailableHandler,
  circuitBreakerMiddleware
};
