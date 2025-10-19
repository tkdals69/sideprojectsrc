const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const router = express.Router();

// Proxy to catalog service
const catalogProxy = createProxyMiddleware({
  target: process.env.CATALOG_SERVICE_URL || 'http://catalog-service:8080',
  changeOrigin: true,
  pathRewrite: {
    '^/api/catalog': '/api/catalog'
  },
  onError: (err, req, res) => {
    console.error('Catalog service proxy error:', err);
    res.status(503).json({
      error: 'Service Unavailable',
      message: 'Catalog service is temporarily unavailable'
    });
  },
  onProxyReq: (proxyReq, req, res) => {
    // Add request ID for tracing
    req.requestId = req.requestId || require('uuid').v4();
    proxyReq.setHeader('X-Request-ID', req.requestId);
  },
  onProxyRes: (proxyRes, req, res) => {
    // Add CORS headers
    proxyRes.headers['Access-Control-Allow-Origin'] = req.headers.origin || '*';
    proxyRes.headers['Access-Control-Allow-Credentials'] = 'true';
  }
});

// All catalog routes are proxied to catalog service
router.use('/', catalogProxy);

module.exports = router;
