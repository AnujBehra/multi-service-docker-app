const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const hpp = require('hpp');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');
const { v4: uuidv4 } = require('uuid');
const { Pool } = require('pg');
const redis = require('redis');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const startTime = Date.now();

// ============================================
// Database Configuration
// ============================================
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// ============================================
// Redis Configuration
// ============================================
let redisClient = null;
const connectRedis = async () => {
  if (process.env.REDIS_URL) {
    try {
      redisClient = redis.createClient({ url: process.env.REDIS_URL });
      redisClient.on('error', (err) => console.log('Redis Client Error', err));
      await redisClient.connect();
      console.log('✅ Connected to Redis');
    } catch (err) {
      console.log('⚠️ Redis not available, continuing without cache');
    }
  }
};

// ============================================
// Initialize Database Tables
// ============================================
const initDatabase = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS items (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        username VARCHAR(100) UNIQUE NOT NULL,
        role VARCHAR(50) DEFAULT 'user',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS refresh_tokens (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        token TEXT NOT NULL,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    console.log('✅ Database tables initialized');
  } catch (err) {
    console.error('Database init error:', err.message);
  }
};

// ============================================
// Middleware
// ============================================
app.set('trust proxy', 1);

app.use((req, res, next) => {
  req.id = req.headers['x-request-id'] || uuidv4();
  res.setHeader('X-Request-ID', req.id);
  next();
});

app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
app.use(hpp());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID']
}));
app.use(compression());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests, please try again later.' }
});
app.use('/api', limiter);

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(morgan('combined'));

// ============================================
// Health Check
// ============================================
app.get('/health', async (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    uptime: Math.floor((Date.now() - startTime) / 1000),
    services: {}
  };

  try {
    const result = await pool.query('SELECT NOW()');
    health.services.postgres = 'connected';
  } catch (err) {
    health.services.postgres = 'disconnected';
    health.status = 'degraded';
  }

  try {
    if (redisClient && redisClient.isOpen) {
      await redisClient.ping();
      health.services.redis = 'connected';
    } else {
      health.services.redis = 'not configured';
    }
  } catch (err) {
    health.services.redis = 'disconnected';
  }

  res.status(health.status === 'healthy' ? 200 : 503).json(health);
});

app.get('/', (req, res) => {
  res.json({
    name: 'Multi-Service API',
    version: '2.0.0',
    health: '/health',
    docs: '/api/docs',
    endpoints: {
      items: '/api/items',
      auth: '/api/auth'
    }
  });
});

// ============================================
// Items API
// ============================================
app.get('/api/items', async (req, res) => {
  try {
    // Try cache first
    if (redisClient && redisClient.isOpen) {
      const cached = await redisClient.get('items');
      if (cached) {
        return res.json({ source: 'cache', data: JSON.parse(cached) });
      }
    }

    const result = await pool.query('SELECT * FROM items ORDER BY created_at DESC');
    
    // Cache for 60 seconds
    if (redisClient && redisClient.isOpen) {
      await redisClient.setEx('items', 60, JSON.stringify(result.rows));
    }
    
    res.json({ source: 'database', count: result.rows.length, data: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/items', async (req, res) => {
  try {
    const { name, description } = req.body;
    const result = await pool.query(
      'INSERT INTO items (name, description) VALUES ($1, $2) RETURNING *',
      [name, description]
    );
    
    // Invalidate cache
    if (redisClient && redisClient.isOpen) {
      await redisClient.del('items');
    }
    
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/items/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM items WHERE id = $1', [req.params.id]);
    
    if (redisClient && redisClient.isOpen) {
      await redisClient.del('items');
    }
    
    res.json({ message: 'Item deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// Auth API (simplified for Railway)
// ============================================
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'railway-demo-secret-change-in-production';

app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, username } = req.body;
    const hashedPassword = await bcrypt.hash(password, 12);
    
    const result = await pool.query(
      'INSERT INTO users (email, password, username) VALUES ($1, $2, $3) RETURNING id, email, username, role',
      [email, hashedPassword, username]
    );
    
    const user = result.rows[0];
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    
    res.status(201).json({ message: 'User registered', user, token });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    
    res.json({ message: 'Login successful', user: { id: user.id, email: user.email, username: user.username }, token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// 404 Handler
// ============================================
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// ============================================
// Start Server
// ============================================
const start = async () => {
  await initDatabase();
  await connectRedis();
  
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📚 API: http://localhost:${PORT}`);
  });
};

start();
