import express, { NextFunction, Request, Response } from "express";
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from './config/gateway.config';
import { createGatewayRouter } from './routes/gateway.routes';
import {
  rateLimitMiddleware,
  healthCheckMiddleware,
  corsMiddleware,
} from './middlewares/healthCheck.middleware';
import { HTTPSTATUS } from './config/http.config';
import { errorHandler } from './middlewares/errors/errorHandler.middleware';
import { asyncHandler } from './middlewares/api/asyncHandler.middleware';
import { Env } from "./config/env.config";

const app = express();

// Security middleware
app.use(helmet());

// CORS
app.use(corsMiddleware);

// Request parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
if (Env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Rate limiting
app.use(rateLimitMiddleware(
  config.gateway.rateLimitMax,
  config.gateway.rateLimitWindow
));

// Health check
app.use(healthCheckMiddleware);

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

// Use gateway routes
app.use(createGatewayRouter());

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

// Global error handler
app.use(errorHandler);

// Start the gateway
app.listen(Env.PORT, () => {
  console.log('🚀 API Gateway started successfully');
  console.log(`📍 Server running on port ${Env.PORT}`);
  console.log(`🌍 Environment: ${Env.NODE_ENV}`);
  console.log('📊 Registered services:');
  Object.values(config.services).forEach(service => {
    console.log(`   - ${service.name}: ${service.url}`);
  });
  console.log('\n🔗 Available endpoints:');
  console.log(`   - Health Check: http://localhost:${Env.PORT}/health`);
  console.log(`   - Services List: http://localhost:${Env.PORT}/services`);
  console.log(`   - Service Status: http://localhost:${Env.PORT}/services/status`);
  console.log(`   - API Routes: http://localhost:${Env.PORT}/api/v1/{service}/*`);
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