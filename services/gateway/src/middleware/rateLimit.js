const rateLimit = require('express-rate-limit');

/**
 * Global rate limiting middleware
 */
const globalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: {
    error: 'Too Many Requests',
    message: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too Many Requests',
      message: 'Too many requests from this IP, please try again later.',
      retryAfter: '15 minutes',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Strict rate limiting for auth endpoints
 */
const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 auth requests per windowMs
  message: {
    error: 'Too Many Requests',
    message: 'Too many authentication attempts, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too Many Requests',
      message: 'Too many authentication attempts, please try again later.',
      retryAfter: '15 minutes',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Rate limiting for API endpoints
 */
const apiRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // limit each IP to 100 API requests per minute
  message: {
    error: 'Too Many Requests',
    message: 'Too many API requests, please try again later.',
    retryAfter: '1 minute'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too Many Requests',
      message: 'Too many API requests, please try again later.',
      retryAfter: '1 minute',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Rate limiting for payment endpoints
 */
const paymentRateLimit = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 5, // limit each IP to 5 payment requests per 5 minutes
  message: {
    error: 'Too Many Requests',
    message: 'Too many payment attempts, please try again later.',
    retryAfter: '5 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too Many Requests',
      message: 'Too many payment attempts, please try again later.',
      retryAfter: '5 minutes',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Rate limiting for search endpoints
 */
const searchRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // limit each IP to 30 search requests per minute
  message: {
    error: 'Too Many Requests',
    message: 'Too many search requests, please try again later.',
    retryAfter: '1 minute'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too Many Requests',
      message: 'Too many search requests, please try again later.',
      retryAfter: '1 minute',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * User-specific rate limiting (requires authentication)
 */
function userRateLimit(maxRequests, windowMs) {
  return rateLimit({
    windowMs,
    max: maxRequests,
    keyGenerator: (req) => {
      // Use user ID if authenticated, otherwise fall back to IP
      return req.user?.id || req.ip;
    },
    message: {
      error: 'Too Many Requests',
      message: 'Too many requests for this user, please try again later.',
      retryAfter: `${Math.ceil(windowMs / 60000)} minutes`
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      res.status(429).json({
        error: 'Too Many Requests',
        message: 'Too many requests for this user, please try again later.',
        retryAfter: `${Math.ceil(windowMs / 60000)} minutes`,
        timestamp: new Date().toISOString()
      });
    }
  });
}

/**
 * Dynamic rate limiting based on user tier
 */
function tieredRateLimit(req, res, next) {
  // Implement tiered rate limiting based on user subscription/tier
  // This is a placeholder - implement based on your business logic
  
  let maxRequests = 100; // Default for free tier
  let windowMs = 15 * 60 * 1000; // 15 minutes
  
  if (req.user?.tier === 'premium') {
    maxRequests = 1000;
    windowMs = 5 * 60 * 1000; // 5 minutes
  } else if (req.user?.tier === 'enterprise') {
    maxRequests = 10000;
    windowMs = 1 * 60 * 1000; // 1 minute
  }
  
  const limiter = rateLimit({
    windowMs,
    max: maxRequests,
    keyGenerator: (req) => req.user?.id || req.ip,
    message: {
      error: 'Too Many Requests',
      message: `Rate limit exceeded for ${req.user?.tier || 'free'} tier.`,
      retryAfter: `${Math.ceil(windowMs / 60000)} minutes`
    },
    standardHeaders: true,
    legacyHeaders: false
  });
  
  limiter(req, res, next);
}

module.exports = {
  globalRateLimit,
  authRateLimit,
  apiRateLimit,
  paymentRateLimit,
  searchRateLimit,
  userRateLimit,
  tieredRateLimit
};
