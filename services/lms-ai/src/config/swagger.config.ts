export const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Vonova LMS AI Roadmap Generation',
      version: '1.0.0',
      description: 'AI-powered learning roadmap generation and management system',
      contact: {
        name: 'Vonova Development Team',
        email: 'dev@vonova.tech',
        url: 'https://vonova.tech/support'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      },
      termsOfService: 'https://vonova.tech/terms'
    },
    servers: [
      {
        url: 'http://localhost:4004/api',
        description: 'Development server'
      },
      {
        url: 'https://api-dev.vonova.tech/api',
        description: 'Staging server'
      },
      {
        url: 'https://api.vonova.tech/api',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token for authenticated requests'
        },
        apiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'X-API-Key',
          description: 'API key for service-to-service communication'
        }
      },
      parameters: {
        RoadmapIdParam: {
          name: 'roadmapId',
          in: 'path',
          required: true,
          schema: {
            type: 'string',
            format: 'uuid'
          },
          description: 'The unique roadmap identifier',
          example: '123e4567-e89b-12d3-a456-426614174000'
        },
        UserIdParam: {
          name: 'userId',
          in: 'path',
          required: true,
          schema: {
            type: 'string',
            format: 'uuid'
          },
          description: 'The user identifier',
          example: '456e7890-e12b-34d5-a678-426614174001'
        },
        PageQuery: {
          name: 'page',
          in: 'query',
          schema: {
            type: 'integer',
            minimum: 1,
            maximum: 1000,
            default: 1
          },
          description: 'Page number for pagination'
        },
        LimitQuery: {
          name: 'limit',
          in: 'query',
          schema: {
            type: 'integer',
            minimum: 1,
            maximum: 100,
            default: 10
          },
          description: 'Number of items per page'
        }
      }
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
    tags: [
      {
        name: 'Roadmap',
        description: 'AI-powered learning roadmap generation and management'
      },
      {
        name: 'Analytics',
        description: 'Analytics and statistics for roadmaps'
      },
      {
        name: 'Health',
        description: 'Service health and monitoring endpoints'
      },
      {
        name: 'Admin',
        description: 'Administrative endpoints for system management'
      }
    ]
  },
  apis: [
    './src/routes/*.ts', 
    './src/ai-roadmap-generator/routes/*.ts',
    './src/ai-roadmap-generator/swagger/*.ts',
    './src/ai-pdf-summary/routes/*.ts',
    './src/ai-problem-solving/routes/*.ts', 
    './src/ai-assistant/routes/*.ts',
    './src/ai-video-gen/routes/*.ts'
  ]
};