export const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Vonova API',
      version: '1.0.0',
      description: 'Vonova API documentation with Swagger',
    },
    servers: [
      {
        url: 'http://localhost:4004/api', // Change if needed
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