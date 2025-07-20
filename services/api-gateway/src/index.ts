import "dotenv/config";
import express, { NextFunction, Request, Response } from "express";
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from './config/gateway.config';
import { createGatewayRouter } from './routes/gateway.routes';
import {
  healthCheckMiddleware,
} from './middlewares/healthCheck.middleware';
import { applySecurityStack, securityStack } from "./middlewares/security";
import { HTTPSTATUS } from './config/http.config';
import { errorHandler } from './middlewares/errors/errorHandler.middleware';
import { asyncHandler } from './middlewares/api/asyncHandler.middleware';
import { Env } from "./config/env.config";
import { swaggerUi, swaggerSpec } from "./services/swagger.service";
import { swaggerAuth } from "./middlewares/docs/swagger-docs.middleware";
import connectDatabase from "./config/database.config";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Security Layers
applySecurityStack(app, {
  cors: {},
  ddos: {},
  bot: {},
  rateLimit: {},
  noSQL: {},
  xss: {},
});

app.use(helmet());

// Health check
app.use(healthCheckMiddleware);

// Use gateway routes
app.use(createGatewayRouter());

// Global error handler
app.use(errorHandler);

// Logging
if (Env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Welcome route
app.get(
  `/`,
  asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    return res.status(HTTPSTATUS.OK).json({
      message: 'API Gateway is running',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      services: Object.keys(config.services),
      endpoints: {
        health: '/health',
        services: '/services',
        serviceStatus: '/services/status',
        apiRoutes: '/api/v1/{service}/*'
      }
    });
  })
);

// 404 handler for undefined routes
app.use(
  asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    res.status(HTTPSTATUS.NOT_FOUND).json({
      error: 'Not Found',
      message: 'The requested endpoint was not found',
      availableRoutes: [
        'GET /health - Gateway health check',
        'GET /services - List available services',
        'GET /services/status - Service health status',
        'ALL /api/v1/{service} - Forward to service root',
        'ALL /api/v1/{service}/{path} - Forward to service path'
      ]
    });
  })
);

// Swagger API Endpoints Docs
if (Env.NODE_ENV !== 'development') {
  app.use(`/api-docs`, swaggerAuth, swaggerUi.serve, swaggerUi.setup(swaggerSpec));
} else {
  app.use(`/api-docs`, swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}

// Start the gateway
app.listen(Env.PORT, async () => {
  console.log('🚀 API Gateway started successfully');
  console.log(`📍 Server running on port ${Env.PORT}`);
  console.log(`🌍 Environment: ${Env.NODE_ENV}`);
  console.log('📊 Registered services:');
  Object.values(config.services).forEach(service => {
    console.log(`   - ${service.name}: ${service.url}`);
  });
  console.log(`🔒 Security stack enabled with ${securityStack.length} protection layers`);
  await connectDatabase();
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});