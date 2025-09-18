import Router from 'express';
import { forwardRequest, getServiceStatus } from '../services/proxy.service';
import { config } from '../config/gateway.config';
import { HTTPSTATUS } from '../config/http.config';
import { asyncHandler } from '../middlewares/api/asyncHandler.middleware';
import { InternalServerException, NotFoundException } from '../utils/appError';

export function createGatewayRouter() {
  const router = Router();

  // Service discovery endpoint
  router.get(
    '/services',
    asyncHandler(async (req, res, next) => {
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
    asyncHandler(async (req, res, next) => {
      try {
        const status = await getServiceStatus();
        res.status(HTTPSTATUS.OK).json({
          message: 'Service health status',
          status
        });
      } catch (error) {
        throw new InternalServerException("Failed to get service status");
      }
    })
  );

  // Proxy App endpoints
  router.all(
    '/api/v1/app/*',
    asyncHandler(async (req, res, next) => {
      const serviceName = 'app';
      const subPath = req.params[0] || '';
      const targetPath = 'app/' + subPath;
      const service = config.services[serviceName as keyof typeof config.services];
      if (!service) {
        throw new NotFoundException(`Service '${serviceName}' is not available`);
      }
      forwardRequest(serviceName, targetPath, req, res, next);
    })
  );

  // Proxy Quiz endpoints
  router.all(
    '/api/v1/quiz/*',
    asyncHandler(async (req, res, next) => {
      const serviceName = 'quiz';
      const subPath = req.params[0] || '';
      const targetPath = 'quiz/' + subPath;
      const service = config.services[serviceName as keyof typeof config.services];
      if (!service) {
        throw new NotFoundException(`Service '${serviceName}' is not available`);
      }
      forwardRequest(serviceName, targetPath, req, res, next);
    })
  );
  return router;
}