const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const router = express.Router();

// Proxy to inventory service
const inventoryProxy = createProxyMiddleware({
  target: process.env.INVENTORY_SERVICE_URL || 'http://inventory-service:8080',
  changeOrigin: true,
  pathRewrite: {
    '^/api/inventory': '/api/inventory'
  },
  onError: (err, req, res) => {
    console.error('Inventory service proxy error:', err);
    res.status(503).json({
      error: 'Service Unavailable',
      message: 'Inventory service is temporarily unavailable'
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

// All inventory routes are proxied to inventory service
router.use('/', inventoryProxy);

module.exports = router;
