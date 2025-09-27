import Router from 'express';
import { forwardRequest, getServiceStatus } from '../services/proxy.service';
import { config } from '../config/gateway.config';
import { HTTPSTATUS } from '../config/http.config';
import { asyncHandler } from '../middlewares/api/asyncHandler.middleware';
import { InternalServerException, NotFoundException } from '../utils/appError';
import { authenticateToken } from '../middlewares/auth/isAuthenticated.middleware';
import authRoutes from './auth/auth.route';
import { validateForwardParams } from '../middlewares/api/parameterValidation.middleware';

export function createGatewayRouter() {
  const router = Router();

  // Service discovery endpoint
  router.get(
    '/services',
    asyncHandler(async (req, res, next) => {
      try {
        const statusMap = await getServiceStatus();
        const now = new Date().toISOString();
        const services = Object.values(config.services).map(service => ({
          name: service.name,
          url: service.url,
          healthCheck: service.healthCheck,
          timeout: service.timeout,
          healthy: statusMap[service.name] ?? false,
          lastCheckedAt: now,
        }));
        res.status(HTTPSTATUS.OK).json({
          message: 'Available services',
          services
        });
      } catch (err) {
        throw new InternalServerException('Failed to get services');
      }
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

  // Auth Layer
  router.use('/api/v1/auth', authRoutes);

  // Auto-register dynamic routes from config.routes
  // Derive service base segment from route.path e.g. '/api/v1/app/*' -> 'app'
  for (const r of config.routes) {
    const method = r.method.toLowerCase() as 'get' | 'post' | 'put' | 'patch' | 'delete';
    const serviceName = r.service;
    const service = config.services[serviceName as keyof typeof config.services];
    if (!service) {
      // skip invalid service entries
      continue;
    }

    const path = r.path; // e.g., '/api/v1/app/*'
    const match = path.match(/^\/api\/v1\/([^/]+)\/*\*/);
    const baseSegment = match ? match[1] : '';

    const middlewares: any[] = [];
    middlewares.push(validateForwardParams(serviceName));
    if (r.auth !== false) {
      middlewares.push(authenticateToken);
    }

    (router as any)[method](
      path,
      ...middlewares,
      asyncHandler(async (req, res, next) => {
        const subPath = (req.params as any)[0] || '';
        const targetPath = (baseSegment ? baseSegment + '/' : '') + subPath;
        const svc = config.services[serviceName as keyof typeof config.services];
        if (!svc) {
          throw new NotFoundException(`Service '${serviceName}' is not available`);
        }
        forwardRequest(serviceName, targetPath, req, res, next);
      })
    );
  }

  return router;
}