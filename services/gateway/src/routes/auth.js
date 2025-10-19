const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const router = express.Router();

// Proxy to auth service
const authProxy = createProxyMiddleware({
  target: process.env.AUTH_SERVICE_URL || 'http://auth-service:8080',
  changeOrigin: true,
  pathRewrite: {
    '^/api/auth': '/api/auth'
  },
  onError: (err, req, res) => {
    console.error('Auth service proxy error:', err);
    res.status(503).json({
      error: 'Service Unavailable',
      message: 'Authentication service is temporarily unavailable'
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

// All auth routes are proxied to auth service
router.use('/', authProxy);

module.exports = router;
