import { Request, Response, NextFunction } from 'express';
import axios from 'axios';
import { config } from '../config/gateway.config';

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
      res.status(429).json({
        error: 'Too Many Requests',
        message: 'Rate limit exceeded'
      });
      return;
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

    res.status(200).json({
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
    res.status(200).end();
    return;
  }

  next();
};

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction): void => {
  console.error('Gateway Error:', err);

  if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
    res.status(503).json({
      error: 'Service Unavailable',
      message: 'The requested service is currently unavailable'
    });
    return;
  }

  if (err.code === 'ECONNABORTED') {
    res.status(504).json({
      error: 'Gateway Timeout',
      message: 'The service request timed out'
    });
    return;
  }

  res.status(500).json({
    error: 'Internal Server Error',
    message: 'An unexpected error occurred'
  });
};