const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const winston = require('winston');
const client = require('prom-client');
const { createProxyMiddleware } = require('http-proxy-middleware');
const authRoutes = require('./routes/auth');
const catalogRoutes = require('./routes/catalog');
const cartRoutes = require('./routes/cart');
const orderRoutes = require('./routes/order');
const inventoryRoutes = require('./routes/inventory');
const paymentRoutes = require('./routes/payment');
const notificationRoutes = require('./routes/notification');
const { errorHandler } = require('./middleware/errorHandler');
const { requestLogger } = require('./middleware/requestLogger');
const { authMiddleware } = require('./middleware/auth');
const { globalRateLimit } = require('./middleware/rateLimit');

const app = express();
const PORT = process.env.PORT || 8080;

// Prometheus metrics
const register = new client.Registry();
client.collectDefaultMetrics({ register });

const httpRequestsTotal = new client.Counter({
  name: 'gateway_http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'endpoint', 'status', 'service'],
  registers: [register]
});

const httpRequestDuration = new client.Histogram({
  name: 'gateway_http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'endpoint', 'service'],
  registers: [register]
});

// Logger configuration
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
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

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true
}));

// Global rate limiting
app.use(globalRateLimit);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use(requestLogger(logger));

// Metrics middleware
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const service = req.route?.path?.split('/')[2] || 'unknown';
    const labels = {
      method: req.method,
      endpoint: req.route?.path || req.path,
      status: res.statusCode,
      service: service
    };
    
    httpRequestsTotal.inc(labels);
    httpRequestDuration.observe({ method: req.method, endpoint: req.route?.path || req.path, service }, duration);
  });
  
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'api-gateway',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Metrics endpoint for Prometheus
app.get('/metrics', (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(register.metrics());
});

// API routes with authentication
app.use('/api/auth', authRoutes);
app.use('/api/catalog', catalogRoutes);
app.use('/api/cart', authMiddleware, cartRoutes);
app.use('/api/orders', authMiddleware, orderRoutes);
app.use('/api/inventory', authMiddleware, inventoryRoutes);
app.use('/api/payment', authMiddleware, paymentRoutes);
app.use('/api/notifications', authMiddleware, notificationRoutes);

// BFF (Backend for Frontend) routes
app.use('/api/bff', require('./routes/bff'));

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`,
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use(errorHandler);

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  logger.info(`API Gateway started on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
