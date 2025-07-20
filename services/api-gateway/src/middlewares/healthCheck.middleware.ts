import { Request, Response, NextFunction } from 'express';
import axios from 'axios';
import { config } from '../config/gateway.config';
import { HTTPSTATUS } from '../config/http.config';

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