const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const router = express.Router();

// Proxy to payment service
const paymentProxy = createProxyMiddleware({
  target: process.env.PAYMENT_SERVICE_URL || 'http://payment-service:8080',
  changeOrigin: true,
  pathRewrite: {
    '^/api/payment': '/api/payment'
  },
  onError: (err, req, res) => {
    console.error('Payment service proxy error:', err);
    res.status(503).json({
      error: 'Service Unavailable',
      message: 'Payment service is temporarily unavailable'
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

// All payment routes are proxied to payment service
router.use('/', paymentProxy);

module.exports = router;
