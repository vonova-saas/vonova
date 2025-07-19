import { Router, Request, Response, NextFunction } from 'express';
import { ProxyService } from '../services/proxy.service';
import { config } from '../config/gateway.config';
import { authenticateJWT } from '../middlewares/auth/jwt.middleware';

export class GatewayRoutes {
  private router: Router;
  private proxyService: ProxyService;

  constructor() {
    this.router = Router();
    this.proxyService = new ProxyService();
    this.setupRoutes();
  }

  private setupRoutes(): void {
    // Service discovery endpoint
    this.router.get('/services', (req: Request, res: Response) => {
      const services = Object.values(config.services).map(service => ({
        name: service.name,
        url: service.url,
        healthCheck: service.healthCheck
      }));

      res.json({
        message: 'Available services',
        services
      });
    });

    // Service health status
    this.router.get('/services/status', async (req: Request, res: Response) => {
      try {
        const status = await this.proxyService.getServiceStatus();
        res.json({
          message: 'Service health status',
          status
        });
      } catch (error) {
        res.status(500).json({
          error: 'Failed to get service status',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });

    // Dynamic route handler for all service requests
    this.router.all('/api/v1/:service', (req: Request, res: Response, next: NextFunction) => {
      const serviceName = req.params.service;

      // Check if service exists
      const service = config.services[serviceName as keyof typeof config.services];
      if (!service) {
        res.status(404).json({
          error: 'Service Not Found',
          message: `Service '${serviceName}' is not available`
        });
        return;
      }

      this.proxyService.forwardRequest(serviceName, '', req, res, next);
    });

    // Dynamic route handler for service requests with paths
    this.router.all('/api/v1/:service/:path', (req: Request, res: Response, next: NextFunction) => {
      const serviceName = req.params.service;
      const targetPath = req.params.path;

      // Check if service exists
      const service = config.services[serviceName as keyof typeof config.services];
      if (!service) {
        res.status(404).json({
          error: 'Service Not Found',
          message: `Service '${serviceName}' is not available`
        });
        return;
      }

      this.proxyService.forwardRequest(serviceName, targetPath, req, res, next);
    });

    // Proxy Auth endpoints (no auth required)
    this.router.all('/api/v1/auth/:path*', (req: Request, res: Response, next: NextFunction) => {
      const serviceName = 'auth';
      const targetPath = req.params.path + (req.params[0] || '');
      const service = config.services[serviceName as keyof typeof config.services];
      if (!service) {
        res.status(404).json({
          error: 'Service Not Found',
          message: `Service '${serviceName}' is not available`
        });
        return;
      }
      this.proxyService.forwardRequest(serviceName, targetPath, req, res, next);
    });

    // Protected User service endpoints
    this.router.all('/api/v1/user', authenticateJWT, (req: Request, res: Response, next: NextFunction) => {
      const serviceName = 'user';
      const service = config.services[serviceName as keyof typeof config.services];
      if (!service) {
        res.status(404).json({
          error: 'Service Not Found',
          message: `Service '${serviceName}' is not available`
        });
        return;
      }
      this.proxyService.forwardRequest(serviceName, '', req, res, next);
    });

    this.router.all('/api/v1/user/:path*', authenticateJWT, (req: Request, res: Response, next: NextFunction) => {
      const serviceName = 'user';
      const targetPath = req.params.path + (req.params[0] || '');
      const service = config.services[serviceName as keyof typeof config.services];
      if (!service) {
        res.status(404).json({
          error: 'Service Not Found',
          message: `Service '${serviceName}' is not available`
        });
        return;
      }
      this.proxyService.forwardRequest(serviceName, targetPath, req, res, next);
    });
  }

  public getRouter(): Router {
    return this.router;
  }
}