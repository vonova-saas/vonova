import { Router, Request, Response, NextFunction } from 'express';
import { forwardRequest, getServiceStatus } from '../services/proxy.service';
import { config } from '../config/gateway.config';

export function createGatewayRouter() {
  const router = Router();

  // Service discovery endpoint
  router.get('/services', (req: Request, res: Response) => {
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
  router.get('/services/status', async (req: Request, res: Response) => {
    try {
      const status = await getServiceStatus();
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
  router.all('/api/v1/:service', (req: Request, res: Response, next: NextFunction) => {
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
    forwardRequest(serviceName, '', req, res, next);
  });

  // Dynamic route handler for service requests with paths
  router.all('/api/v1/:service/:path', (req: Request, res: Response, next: NextFunction) => {
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
    forwardRequest(serviceName, targetPath, req, res, next);
  });

  // Proxy Auth endpoints (no auth required)
  router.all('/api/v1/auth/:path*', (req: Request, res: Response, next: NextFunction) => {
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
    forwardRequest(serviceName, targetPath, req, res, next);
  });

  // Proxy User endpoints (no auth required)
  router.all('/api/v1/user/:path*', (req: Request, res: Response, next: NextFunction) => {
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
    forwardRequest(serviceName, targetPath, req, res, next);
  });

  // Proxy Admin endpoints (no auth required)
  router.all('/api/v1/admin/:path*', (req: Request, res: Response, next: NextFunction) => {
    const serviceName = 'user';
    const targetPath = 'admin/' + req.params.path + (req.params[0] || '');
    const service = config.services[serviceName as keyof typeof config.services];
    if (!service) {
      res.status(404).json({
        error: 'Service Not Found',
        message: `Service '${serviceName}' is not available`
      });
      return;
    }
    forwardRequest(serviceName, targetPath, req, res, next);
  });

  return router;
}