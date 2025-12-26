const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Multi-Service API',
      version: '2.0.0',
      description: 'A production-ready multi-service Docker application API',
      contact: {
        name: 'API Support',
        email: 'support@example.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: '/api',
        description: 'API Server'
      }
    ],
    components: {
      schemas: {
        Item: {
          type: 'object',
          required: ['name'],
          properties: {
            id: {
              type: 'integer',
              description: 'Auto-generated item ID',
              example: 1
            },
            name: {
              type: 'string',
              description: 'Item name',
              example: 'My Item',
              minLength: 1,
              maxLength: 255
            },
            description: {
              type: 'string',
              description: 'Item description',
              example: 'This is a sample item'
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Creation timestamp'
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp'
            }
          }
        },
        CreateItem: {
          type: 'object',
          required: ['name'],
          properties: {
            name: {
              type: 'string',
              description: 'Item name',
              example: 'New Item',
              minLength: 1,
              maxLength: 255
            },
            description: {
              type: 'string',
              description: 'Item description',
              example: 'Description of the new item'
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Error message'
            },
            details: {
              type: 'array',
              items: {
                type: 'object'
              },
              description: 'Validation error details'
            }
          }
        },
        HealthStatus: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              enum: ['healthy', 'degraded', 'unhealthy'],
              example: 'healthy'
            },
            timestamp: {
              type: 'string',
              format: 'date-time'
            },
            version: {
              type: 'string',
              example: '2.0.0'
            },
            uptime: {
              type: 'number',
              description: 'Uptime in seconds'
            },
            services: {
              type: 'object',
              properties: {
                postgres: {
                  type: 'string',
                  enum: ['connected', 'disconnected']
                },
                redis: {
                  type: 'string',
                  enum: ['connected', 'disconnected']
                }
              }
            }
          }
        }
      }
    }
  },
  apis: ['./src/routes/*.js', './src/index.js']
};

const specs = swaggerJsdoc(options);

module.exports = specs;
