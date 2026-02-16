import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { GatewayService } from '../../modules/gateway/gateway.service';
import { config } from '../../config/gateway.config';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { LoggerService } from '../services/logger.service';
import { UnauthorizedException } from '../../utils/appError';

@Injectable()
export class GatewayProxyMiddleware implements NestMiddleware {
  constructor(
    private readonly gatewayService: GatewayService,
    private readonly jwtAuthGuard: JwtAuthGuard,
    private readonly logger: LoggerService,
  ) { }

  async use(req: Request, res: Response, next: NextFunction) {
    // Exclude static assets and common browser requests from proxying
    const excludedPaths = [
      '/favicon.ico',
      '/robots.txt',
      '/.well-known',
      '/swagger-ui',
      '/api-docs',
    ];

    // Check if path should be excluded from proxying
    const isExcluded = excludedPaths.some(path => req.path.startsWith(path));
    if (isExcluded) {
      return next();
    }

    // Auth endpoints are handled directly by the gateway AuthController, not proxied
    // Check both /auth and /api/v1/auth patterns
    if (req.path.startsWith('/auth') || req.path.startsWith('/api/v1/auth')) {
      return next();
    }

    // Check if this is a gateway route - support both /api/v1/* and direct paths
    let serviceName: string | null = null;
    let subPath: string = '';
    let pathMatch: RegExpMatchArray | null = null;

    // Try /api/v1/{service}/* pattern first
    pathMatch = req.path.match(/^\/api\/v1\/([^/]+)\/(.*)$/);
    if (pathMatch) {
      [, serviceName, subPath] = pathMatch;
    } else {
      // Try direct paths for lms_ai (roadmap, pdf-summary, health, root)
      if (req.path === '/') {
        serviceName = 'lms_ai';
        subPath = '/';
      } else {
        const directPathMatch = req.path.match(/^\/(roadmap|pdf-summary|health)(\/.*)?$/);
        if (directPathMatch) {
          const pathPrefix = directPathMatch[1];
          subPath = directPathMatch[2] || '';
          // Map path prefixes to service names
          if (pathPrefix === 'roadmap' || pathPrefix === 'pdf-summary' || pathPrefix === 'health') {
            serviceName = 'lms_ai';
            // Reconstruct full path for matching
            subPath = req.path;
          }
        }
      }
    }

    if (!serviceName) {
      return next();
    }

    // Find the route config - match by path pattern and method
    const route = config.routes.find((r) => {
      const methodMatch = r.method.toLowerCase() === req.method.toLowerCase();
      if (!methodMatch) return false;

      // Convert route path pattern to regex
      const pathPattern = r.path.replace(/\*/g, '.*');
      const pathRegex = new RegExp(`^${pathPattern}$`);
      return pathRegex.test(req.path) && r.service === serviceName;
    });

    if (!route) {
      return next();
    }

    // Apply authentication if required
    if (route.auth !== false) {
      try {
        const canActivate = await this.jwtAuthGuard.canActivate({
          switchToHttp: () => ({
            getRequest: () => req,
            getResponse: () => res,
          }),
          getHandler: () => null,
          getClass: () => null,
        } as any);
        if (!canActivate) {
          throw new UnauthorizedException('Authentication required');
        }
      } catch (error) {
        return next(error);
      }
    }

    try {
      // Determine target path based on route pattern
      let targetPath = '';

      if (route.path.startsWith('/api/v1/')) {
        // For /api/v1/{service}/* routes
        if (route.stripServicePrefix) {
          // Services with global prefixes (app has 'api/v1', lms has 'lms')
          // Don't add service name prefix, just use subPath directly
          targetPath = subPath;
        } else {
          // Extract base segment and prepend to subPath
          const match = route.path.match(/^\/api\/v1\/([^/]+)\/*\*/);
          const baseSegment = match ? match[1] : '';
          targetPath = baseSegment ? `${baseSegment}/${subPath}` : subPath;
        }
      } else {
        // For direct paths (roadmap/*, pdf-summary/*, /, /health), use the path as-is
        // Remove leading slash if present
        targetPath = req.path.startsWith('/') ? req.path.slice(1) : req.path;
        // Handle root path
        if (targetPath === '') {
          targetPath = '/';
        }
      }

      const response = await this.gatewayService.forwardRequest(
        serviceName,
        targetPath,
        req,
      );

      // Forward response headers
      Object.keys(response.headers).forEach((key) => {
        if (
          key.toLowerCase() !== 'content-encoding' &&
          key.toLowerCase() !== 'content-length'
        ) {
          res.setHeader(key, response.headers[key]);
        }
      });

      return res.status(response.status).json(response.data);
    } catch (error: any) {
      // Handle connection errors gracefully
      if (error?.code === 'ECONNREFUSED' || error?.isAxiosError) {
        const service = config.services[serviceName as keyof typeof config.services];
        this.logger.error(`Service unavailable: ${serviceName}`, error.stack, {
          path: req.path,
          method: req.method,
          service: serviceName,
          errorCode: error.code,
        });

        // Return a 503 Service Unavailable for connection errors
        return res.status(503).json({
          statusCode: 503,
          message: `Service '${serviceName}' is currently unavailable`,
          error: 'Service Unavailable',
          path: req.path,
        });
      }
      this.logger.error(`Gateway proxy error: ${req.path}`, error.stack, {
        path: req.path,
        method: req.method,
        service: serviceName,
      });
      return next(error);
    }
  }
}

