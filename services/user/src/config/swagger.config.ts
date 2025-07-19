export const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Vonova User Service API Endpoint',
      version: '1.0.0',
      description: 'Vonova User Service API Endpoint documentation with Swagger',
    },
    servers: [
      {
        url: 'http://localhost:4002/api', // Change if needed
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