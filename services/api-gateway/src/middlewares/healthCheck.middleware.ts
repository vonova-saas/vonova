import { Request, Response, NextFunction } from 'express';
import axios from 'axios';
import { config } from '../config/gateway.config';
import { HTTPSTATUS } from '../config/http.config';
import { TooManyRequestsException } from '../utils/appError';

// Rate limiting store (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export const rateLimitMiddleware = (limit: number = 100, windowMs: number = 15 * 60 * 1000) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const clientId = req.ip || 'unknown';
    const now = Date.now();

    const clientData = rateLimitStore.get(clientId);

    if (!clientData || now > clientData.resetTime) {
      rateLimitStore.set(clientId, {
        count: 1,
        resetTime: now + windowMs
      });
      next();
      return;
    }

    if (clientData.count >= limit) {
      throw new TooManyRequestsException("Rate limit exceeded");
    }

    clientData.count++;
    next();
  };
};

export const healthCheckMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  if (req.path === '/health') {
    const serviceHealth = await Promise.allSettled(
      Object.values(config.services).map(async (service) => {
        try {
          const response = await axios.get(`${service.url}${service.healthCheck}`, {
            timeout: 3000
          });
          return {
            service: service.name,
            status: 'healthy',
            response: response.status
          };
        } catch (error) {
          return {
            service: service.name,
            status: 'unhealthy',
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      })
    );

    const results = serviceHealth.map(result =>
      result.status === 'fulfilled' ? result.value : result.reason
    );

    res.status(HTTPSTATUS.OK).json({
      gateway: 'healthy',
      timestamp: new Date().toISOString(),
      services: results
    });
    return;
  }
  next();
};

export const corsMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(HTTPSTATUS.OK).end();
    return;
  }

  next();
};
