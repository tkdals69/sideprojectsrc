/**
 * Request logging middleware
 * @param {Object} logger - Winston logger instance
 * @returns {Function} Express middleware function
 */
function requestLogger(logger) {
  return (req, res, next) => {
    const startTime = Date.now();
    
    // Log request
    logger.info({
      type: 'request',
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      contentLength: req.get('Content-Length') || 0,
      timestamp: new Date().toISOString()
    });

    // Override res.end to log response
    const originalEnd = res.end;
    res.end = function(chunk, encoding) {
      const duration = Date.now() - startTime;
      
      logger.info({
        type: 'response',
        method: req.method,
        url: req.originalUrl,
        statusCode: res.statusCode,
        duration: `${duration}ms`,
        contentLength: res.get('Content-Length') || 0,
        timestamp: new Date().toISOString()
      });

      // Call original end method
      originalEnd.call(this, chunk, encoding);
    };

    next();
  };
}

module.exports = {
  requestLogger
};
