import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from './config/gateway.config';
import { GatewayRoutes } from './routes/gateway.routes';
import {
  rateLimitMiddleware,
  healthCheckMiddleware,
  corsMiddleware,
  errorHandler
} from './middlewares/middleware';

class APIGateway {
  private app: express.Application;
  private gatewayRoutes: GatewayRoutes;

  constructor() {
    this.app = express();
    this.gatewayRoutes = new GatewayRoutes();
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  private setupMiddleware(): void {
    // Security middleware
    this.app.use(helmet());

    // CORS
    this.app.use(corsMiddleware);

    // Request parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Logging
    if (config.environment === 'development') {
      this.app.use(morgan('dev'));
    } else {
      this.app.use(morgan('combined'));
    }

    // Rate limiting
    this.app.use(rateLimitMiddleware(
      config.gateway.rateLimitMax,
      config.gateway.rateLimitWindow
    ));

    // Health check
    this.app.use(healthCheckMiddleware);
  }

  private setupRoutes(): void {
    // Welcome route
    this.app.get('/', (req, res) => {
      res.json({
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
    });

    // Use gateway routes
    this.app.use(this.gatewayRoutes.getRouter());

    // 404 handler for undefined routes
    this.app.use((req, res) => {
      res.status(404).json({
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
    });
  }

  private setupErrorHandling(): void {
    // Global error handler
    this.app.use(errorHandler);
  }

  public start(): void {
    this.app.listen(config.port, () => {
      console.log('🚀 API Gateway started successfully');
      console.log(`📍 Server running on port ${config.port}`);
      console.log(`🌍 Environment: ${config.environment}`);
      console.log('📊 Registered services:');
      // console.log(`🔒 Security stack enabled with ${securityStack.length} protection layers`);

      Object.values(config.services).forEach(service => {
        console.log(`   - ${service.name}: ${service.url}`);
      });

      console.log('\n🔗 Available endpoints:');
      console.log(`   - Health Check: http://localhost:${config.port}/health`);
      console.log(`   - Services List: http://localhost:${config.port}/services`);
      console.log(`   - Service Status: http://localhost:${config.port}/services/status`);
      console.log(`   - API Routes: http://localhost:${config.port}/api/v1/{service}/*`);
    });
  }
}

// Start the gateway
const gateway = new APIGateway();
gateway.start();

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});