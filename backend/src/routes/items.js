const express = require('express');
const { body, param, validationResult } = require('express-validator');
const router = express.Router();
const pool = require('../config/database');
const { redisClient } = require('../config/redis');
const logger = require('../utils/logger');
const { dbQueryDuration, cacheHits, cacheMisses } = require('../utils/metrics');

// Validation middleware
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      error: 'Validation failed', 
      details: errors.array() 
    });
  }
  next();
};

/**
 * @swagger
 * /items:
 *   get:
 *     summary: Get all items
 *     description: Retrieve a list of all items with Redis caching
 *     tags: [Items]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Maximum number of items to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of items to skip
 *     responses:
 *       200:
 *         description: List of items
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 source:
 *                   type: string
 *                   enum: [cache, database]
 *                 count:
 *                   type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Item'
 */
router.get('/', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);
    const offset = parseInt(req.query.offset) || 0;
    const cacheKey = `items:${limit}:${offset}`;

    // Check cache first
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      cacheHits.inc({ key: 'items' });
      logger.debug('Cache hit for items');
      return res.json({ source: 'cache', ...JSON.parse(cached) });
    }

    cacheMisses.inc({ key: 'items' });
    
    // Query database with timing
    const startTime = Date.now();
    const countResult = await pool.query('SELECT COUNT(*) FROM items');
    const result = await pool.query(
      'SELECT * FROM items ORDER BY created_at DESC LIMIT $1 OFFSET $2',
      [limit, offset]
    );
    dbQueryDuration.observe({ operation: 'select', table: 'items' }, (Date.now() - startTime) / 1000);

    const response = {
      count: parseInt(countResult.rows[0].count),
      data: result.rows
    };

    // Cache for 60 seconds
    await redisClient.setEx(cacheKey, 60, JSON.stringify(response));

    logger.info('Items fetched from database', { count: response.count });
    res.json({ source: 'database', ...response });
  } catch (err) {
    logger.error('Error fetching items', { error: err.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /items/{id}:
 *   get:
 *     summary: Get item by ID
 *     tags: [Items]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Item ID
 *     responses:
 *       200:
 *         description: Item found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Item'
 *       404:
 *         description: Item not found
 */
router.get('/:id',
  param('id').isInt({ min: 1 }).withMessage('ID must be a positive integer'),
  validate,
  async (req, res) => {
    try {
      const { id } = req.params;
      const cacheKey = `item:${id}`;

      // Check cache
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        cacheHits.inc({ key: 'item' });
        return res.json(JSON.parse(cached));
      }

      cacheMisses.inc({ key: 'item' });

      const startTime = Date.now();
      const result = await pool.query('SELECT * FROM items WHERE id = $1', [id]);
      dbQueryDuration.observe({ operation: 'select', table: 'items' }, (Date.now() - startTime) / 1000);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Item not found' });
      }

      // Cache for 5 minutes
      await redisClient.setEx(cacheKey, 300, JSON.stringify(result.rows[0]));

      res.json(result.rows[0]);
    } catch (err) {
      logger.error('Error fetching item', { error: err.message, id: req.params.id });
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/**
 * @swagger
 * /items:
 *   post:
 *     summary: Create a new item
 *     tags: [Items]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateItem'
 *     responses:
 *       201:
 *         description: Item created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Item'
 *       400:
 *         description: Validation error
 */
router.post('/',
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 255 }),
  body('description').optional().trim().isLength({ max: 1000 }),
  validate,
  async (req, res) => {
    try {
      const { name, description } = req.body;

      const startTime = Date.now();
      const result = await pool.query(
        'INSERT INTO items (name, description) VALUES ($1, $2) RETURNING *',
        [name, description]
      );
      dbQueryDuration.observe({ operation: 'insert', table: 'items' }, (Date.now() - startTime) / 1000);

      // Invalidate list cache
      const keys = await redisClient.keys('items:*');
      if (keys.length > 0) {
        await redisClient.del(keys);
      }

      logger.info('Item created', { id: result.rows[0].id, name });
      res.status(201).json(result.rows[0]);
    } catch (err) {
      logger.error('Error creating item', { error: err.message });
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/**
 * @swagger
 * /items/{id}:
 *   put:
 *     summary: Update an item
 *     tags: [Items]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateItem'
 *     responses:
 *       200:
 *         description: Item updated
 *       404:
 *         description: Item not found
 */
router.put('/:id',
  param('id').isInt({ min: 1 }),
  body('name').trim().notEmpty().isLength({ max: 255 }),
  body('description').optional().trim().isLength({ max: 1000 }),
  validate,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { name, description } = req.body;

      const startTime = Date.now();
      const result = await pool.query(
        'UPDATE items SET name = $1, description = $2, updated_at = NOW() WHERE id = $3 RETURNING *',
        [name, description, id]
      );
      dbQueryDuration.observe({ operation: 'update', table: 'items' }, (Date.now() - startTime) / 1000);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Item not found' });
      }

      // Invalidate caches
      await redisClient.del(`item:${id}`);
      const keys = await redisClient.keys('items:*');
      if (keys.length > 0) {
        await redisClient.del(keys);
      }

      logger.info('Item updated', { id, name });
      res.json(result.rows[0]);
    } catch (err) {
      logger.error('Error updating item', { error: err.message, id: req.params.id });
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/**
 * @swagger
 * /items/{id}:
 *   delete:
 *     summary: Delete an item
 *     tags: [Items]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Item deleted
 *       404:
 *         description: Item not found
 */
router.delete('/:id',
  param('id').isInt({ min: 1 }),
  validate,
  async (req, res) => {
    try {
      const { id } = req.params;

      const startTime = Date.now();
      const result = await pool.query('DELETE FROM items WHERE id = $1 RETURNING *', [id]);
      dbQueryDuration.observe({ operation: 'delete', table: 'items' }, (Date.now() - startTime) / 1000);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Item not found' });
      }

      // Invalidate caches
      await redisClient.del(`item:${id}`);
      const keys = await redisClient.keys('items:*');
      if (keys.length > 0) {
        await redisClient.del(keys);
      }

      logger.info('Item deleted', { id });
      res.json({ message: 'Item deleted successfully', item: result.rows[0] });
    } catch (err) {
      logger.error('Error deleting item', { error: err.message, id: req.params.id });
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

module.exports = router;
