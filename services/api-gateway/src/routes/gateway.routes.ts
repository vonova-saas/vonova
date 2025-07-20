import { Router, Request, Response, NextFunction } from 'express';
import { forwardRequest, getServiceStatus } from '../services/proxy.service';
import { config } from '../config/gateway.config';
import { HTTPSTATUS } from '../config/http.config';
import { asyncHandler } from '../middlewares/api/asyncHandler.middleware';

export function createGatewayRouter() {
  const router = Router();

  // Service discovery endpoint
  router.get(
    '/services',
    asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
      const services = Object.values(config.services).map(service => ({
        name: service.name,
        url: service.url,
        healthCheck: service.healthCheck
      }));
      res.status(HTTPSTATUS.OK).json({
        message: 'Available services',
        services
      });
    })
  );

  // Service health status
  router.get(
    '/services/status',
    asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
      try {
        const status = await getServiceStatus();
        res.status(HTTPSTATUS.OK).json({
          message: 'Service health status',
          status
        });
      } catch (error) {
        res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
          error: 'Failed to get service status',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    })
  );

  // Dynamic route handler for all service requests
  router.all(
    '/api/v1/:service',
    asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
      const serviceName = req.params.service;

      // Check if service exists
      const service = config.services[serviceName as keyof typeof config.services];
      if (!service) {
        res.status(HTTPSTATUS.NOT_FOUND).json({
          error: 'Service Not Found',
          message: `Service '${serviceName}' is not available`
        });
        return;
      }
      forwardRequest(serviceName, '', req, res, next);
    })
  );

  // Dynamic route handler for service requests with paths
  router.all(
    '/api/v1/:service/:path',
    asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
      const serviceName = req.params.service;
      const targetPath = req.params.path;

      // Check if service exists
      const service = config.services[serviceName as keyof typeof config.services];
      if (!service) {
        res.status(HTTPSTATUS.NOT_FOUND).json({
          error: 'Service Not Found',
          message: `Service '${serviceName}' is not available`
        });
        return;
      }
      forwardRequest(serviceName, targetPath, req, res, next);
    })
  );

  // Proxy Auth endpoints (no auth required)
  router.all(
    '/api/v1/auth/:path*',
    asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
      const serviceName = 'auth';
      const targetPath = req.params.path + (req.params[0] || '');
      const service = config.services[serviceName as keyof typeof config.services];
      if (!service) {
        res.status(HTTPSTATUS.NOT_FOUND).json({
          error: 'Service Not Found',
          message: `Service '${serviceName}' is not available`
        });
        return;
      }
      forwardRequest(serviceName, targetPath, req, res, next);
    })
  );

  // Proxy User endpoints (no auth required)
  router.all(
    '/api/v1/user/:path*',
    asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
      const serviceName = 'user';
      const targetPath = req.params.path + (req.params[0] || '');
      const service = config.services[serviceName as keyof typeof config.services];
      if (!service) {
        res.status(HTTPSTATUS.NOT_FOUND).json({
          error: 'Service Not Found',
          message: `Service '${serviceName}' is not available`
        });
        return;
      }
      forwardRequest(serviceName, targetPath, req, res, next);
    })
  );

  // Proxy Admin endpoints (no auth required)
  router.all(
    '/api/v1/admin/:path*',
    asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
      const serviceName = 'user';
      const targetPath = 'admin/' + req.params.path + (req.params[0] || '');
      const service = config.services[serviceName as keyof typeof config.services];
      if (!service) {
        res.status(HTTPSTATUS.NOT_FOUND).json({
          error: 'Service Not Found',
          message: `Service '${serviceName}' is not available`
        });
        return;
      }
      forwardRequest(serviceName, targetPath, req, res, next);
    })
  );

  return router;
}