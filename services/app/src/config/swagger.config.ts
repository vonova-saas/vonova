export const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'onyx APP Service API Endpoint',
      version: '1.0.0',
      description: 'onyx APP Service API Endpoint documentation with Swagger',
    },
    servers: [
      {
        url: 'http://localhost:4001/api', // Change if needed
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/routes/*.ts', './src/docs/*.ts'], // Include your route/docs folder
};