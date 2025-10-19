/**
 * Request logging middleware
 * @param {Object} logger - Winston logger instance
 * @returns {Function} Express middleware function
 */
function requestLogger(logger) {
  return (req, res, next) => {
    const startTime = Date.now();
    
    // Generate request ID if not present
    if (!req.requestId) {
      req.requestId = require('uuid').v4();
    }
    
    // Add request ID to response headers
    res.setHeader('X-Request-ID', req.requestId);
    
    // Log request
    logger.info({
      type: 'request',
      requestId: req.requestId,
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: req.user?.id,
      contentLength: req.get('Content-Length') || 0,
      timestamp: new Date().toISOString()
    });

    // Override res.end to log response
    const originalEnd = res.end;
    res.end = function(chunk, encoding) {
      const duration = Date.now() - startTime;
      
      logger.info({
        type: 'response',
        requestId: req.requestId,
        method: req.method,
        url: req.originalUrl,
        statusCode: res.statusCode,
        duration: `${duration}ms`,
        contentLength: res.get('Content-Length') || 0,
        userId: req.user?.id,
        timestamp: new Date().toISOString()
      });

      // Call original end method
      originalEnd.call(this, chunk, encoding);
    };

    next();
  };
}

/**
 * Request ID middleware
 * @returns {Function} Express middleware function
 */
function requestIdMiddleware() {
  return (req, res, next) => {
    // Generate request ID if not present
    if (!req.requestId) {
      req.requestId = require('uuid').v4();
    }
    
    // Add request ID to response headers
    res.setHeader('X-Request-ID', req.requestId);
    
    next();
  };
}

/**
 * Correlation ID middleware for distributed tracing
 * @returns {Function} Express middleware function
 */
function correlationIdMiddleware() {
  return (req, res, next) => {
    // Get correlation ID from headers or generate new one
    const correlationId = req.get('X-Correlation-ID') || require('uuid').v4();
    
    // Set correlation ID in request and response
    req.correlationId = correlationId;
    res.setHeader('X-Correlation-ID', correlationId);
    
    next();
  };
}

/**
 * User context middleware
 * @returns {Function} Express middleware function
 */
function userContextMiddleware() {
  return (req, res, next) => {
    // Add user context to request
    if (req.user) {
      req.userContext = {
        id: req.user.id,
        email: req.user.email,
        role: req.user.role || 'user',
        permissions: req.user.permissions || []
      };
    }
    
    next();
  };
}

/**
 * Service mesh headers middleware
 * @returns {Function} Express middleware function
 */
function serviceMeshHeadersMiddleware() {
  return (req, res, next) => {
    // Add service mesh headers for Istio
    res.setHeader('X-Service-Name', 'api-gateway');
    res.setHeader('X-Service-Version', '1.0.0');
    
    // Forward tracing headers
    const tracingHeaders = [
      'X-Request-ID',
      'X-Correlation-ID',
      'X-Trace-ID',
      'X-Span-ID',
      'X-Parent-Span-ID'
    ];
    
    tracingHeaders.forEach(header => {
      const value = req.get(header);
      if (value) {
        res.setHeader(header, value);
      }
    });
    
    next();
  };
}

module.exports = {
  requestLogger,
  requestIdMiddleware,
  correlationIdMiddleware,
  userContextMiddleware,
  serviceMeshHeadersMiddleware
};
