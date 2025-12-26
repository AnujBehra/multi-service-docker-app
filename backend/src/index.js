const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const hpp = require('hpp');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

// Local imports
const logger = require('./utils/logger');
const { register, metricsMiddleware } = require('./utils/metrics');
const swaggerSpec = require('./config/swagger');
const pool = require('./config/database');
const { redisClient, connectRedis } = require('./config/redis');
const itemsRouter = require('./routes/items');
const authRouter = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 3000;
const startTime = Date.now();

// Trust proxy (for rate limiting behind nginx)
app.set('trust proxy', 1);

// Request ID middleware
app.use((req, res, next) => {
  req.id = req.headers['x-request-id'] || uuidv4();
  res.setHeader('X-Request-ID', req.id);
  next();
});

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));
app.use(hpp());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID']
}));

// Compression
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);

// Body parsing
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Logging
app.use(morgan('combined', {
  stream: { write: (message) => logger.info(message.trim()) }
}));

// Metrics middleware
app.use(metricsMiddleware);

// Health check endpoint
app.get('/health', async (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '2.0.0',
    uptime: Math.floor((Date.now() - startTime) / 1000),
    services: {}
  };

  try {
    const result = await pool.query('SELECT NOW()');
    health.services.postgres = 'connected';
    health.services.postgres_time = result.rows[0].now;
  } catch (err) {
    health.services.postgres = 'disconnected';
    health.status = 'degraded';
    logger.error('PostgreSQL health check failed', { error: err.message });
  }

  try {
    const pong = await redisClient.ping();
    health.services.redis = pong === 'PONG' ? 'connected' : 'disconnected';
  } catch (err) {
    health.services.redis = 'disconnected';
    health.status = 'degraded';
    logger.error('Redis health check failed', { error: err.message });
  }

  const statusCode = health.status === 'healthy' ? 200 : 503;
  res.status(statusCode).json(health);
});

// Readiness probe
app.get('/ready', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    await redisClient.ping();
    res.json({ ready: true });
  } catch (err) {
    res.status(503).json({ ready: false, error: err.message });
  }
});

// Liveness probe
app.get('/live', (req, res) => {
  res.json({ alive: true, uptime: Math.floor((Date.now() - startTime) / 1000) });
});

// Prometheus metrics endpoint
app.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (err) {
    res.status(500).end(err);
  }
});

// API Documentation
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Multi-Service API Documentation'
}));

// API info endpoint
app.get('/api', (req, res) => {
  res.json({
    name: 'Multi-Service API',
    version: '2.0.0',
    description: 'Production-ready multi-service Docker application',
    documentation: '/api/docs',
    health: '/health',
    metrics: '/metrics',
    endpoints: {
      items: '/api/items',
      auth: '/api/auth'
    }
  });
});

// Routes
app.use('/api/items', itemsRouter);
app.use('/api/auth', authRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  logger.error('Unhandled error', { 
    error: err.message, 
    stack: err.stack,
    requestId: req.id 
  });
  
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message,
    requestId: req.id
  });
});

// Graceful shutdown
const gracefulShutdown = async (signal) => {
  logger.info(`${signal} received, shutting down gracefully`);
  
  try {
    await pool.end();
    logger.info('PostgreSQL connection closed');
    
    await redisClient.quit();
    logger.info('Redis connection closed');
    
    process.exit(0);
  } catch (err) {
    logger.error('Error during shutdown', { error: err.message });
    process.exit(1);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start server
const startServer = async () => {
  try {
    await connectRedis();
    logger.info('Connected to Redis');

    await pool.query('SELECT 1');
    logger.info('Connected to PostgreSQL');

    app.listen(PORT, '0.0.0.0', () => {
      logger.info(`🚀 Backend API running on port ${PORT}`);
      logger.info(`📚 API Documentation: http://localhost:${PORT}/api/docs`);
      logger.info(`📊 Metrics: http://localhost:${PORT}/metrics`);
    });
  } catch (err) {
    logger.error('Failed to start server', { error: err.message });
    process.exit(1);
  }
};

startServer();
