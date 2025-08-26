export const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Vonova LMS AI Platform',
      version: '1.0.0',
      description: 'Complete AI-powered learning platform with roadmap generation, PDF summarization, and more',
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
        url: 'http://localhost:4005/api',
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
        SummaryIdParam: {
          name: 'summaryId',
          in: 'path',
          required: true,
          schema: {
            type: 'string'
          },
          description: 'The unique PDF summary identifier',
          example: 'summary_123e4567-e89b-12d3-a456-426614174000'
        },
        SessionIdParam: {
          name: 'sessionId',
          in: 'path',
          required: true,
          schema: {
            type: 'string'
          },
          description: 'The PDF session identifier',
          example: 'session_123e4567-e89b-12d3-a456-426614174000'
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
        name: 'AI Roadmap Generator',
        description: 'AI-powered learning roadmap generation and management - All roadmap endpoints'
      },
      {
        name: 'AI PDF Summary',
        description: 'AI-powered PDF document summarization and chat functionality - All PDF endpoints'
      },
      {
        name: 'AI Problem Solving',
        description: 'AI-powered problem solving assistance (Coming Soon)'
      },
      {
        name: 'AI Assistant',
        description: 'Intelligent learning assistant chatbot (Coming Soon)'
      },
      {
        name: 'AI Video Generator',
        description: 'Generate educational videos from content (Coming Soon)'
      }
    ]
  },
  apis: [
    './src/routes/*.ts', 
    './src/ai-roadmap-generator/routes/*.ts',
    './src/ai-roadmap-generator/swagger/*.ts',
    './src/ai-pdf-summary/routes/*.ts',
    './src/ai-pdf-summary/swagger/*.ts',
    './src/ai-problem-solving/routes/*.ts', 
    './src/ai-assistant/routes/*.ts',
    './src/ai-video-gen/routes/*.ts'
  ]
};