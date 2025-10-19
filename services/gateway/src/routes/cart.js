const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const router = express.Router();

// Proxy to cart service
const cartProxy = createProxyMiddleware({
  target: process.env.CART_SERVICE_URL || 'http://cart-service:8080',
  changeOrigin: true,
  pathRewrite: {
    '^/api/cart': '/api/cart'
  },
  onError: (err, req, res) => {
    console.error('Cart service proxy error:', err);
    res.status(503).json({
      error: 'Service Unavailable',
      message: 'Cart service is temporarily unavailable'
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

// All cart routes are proxied to cart service
router.use('/', cartProxy);

module.exports = router;
