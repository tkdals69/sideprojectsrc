const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const router = express.Router();

// Proxy to order service
const orderProxy = createProxyMiddleware({
  target: process.env.ORDER_SERVICE_URL || 'http://order-service:8080',
  changeOrigin: true,
  pathRewrite: {
    '^/api/orders': '/api/orders'
  },
  onError: (err, req, res) => {
    console.error('Order service proxy error:', err);
    res.status(503).json({
      error: 'Service Unavailable',
      message: 'Order service is temporarily unavailable'
    });
  },
  onProxyReq: (proxyReq, req, res) => {
    // Add request ID for tracing
    req.requestId = req.requestId || require('uuid').v4();
    proxyReq.setHeader('X-Request-ID', req.requestId);
    
    // Add user ID from JWT token
    if (req.user && req.user.id) {
      proxyReq.setHeader('X-User-ID', req.user.id);
    }
  },
  onProxyRes: (proxyRes, req, res) => {
    // Add CORS headers
    proxyRes.headers['Access-Control-Allow-Origin'] = req.headers.origin || '*';
    proxyRes.headers['Access-Control-Allow-Credentials'] = 'true';
  }
});

// All order routes are proxied to order service
router.use('/', orderProxy);

module.exports = router;
