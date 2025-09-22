import { Env } from './env.config';

export interface ServiceConfig {
  name: string;
  url: string;
  healthCheck: string;
  timeout: number;
}

export interface RouteConfig {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  service: string;
  target: string;
  auth?: boolean;
  rateLimit?: number;
}

export const config = {
  // Services configuration
  services: {
    app: {
      name: 'app',
      url: Env.APP_SERVICE_URL,
      healthCheck: '/app/health',
      timeout: 5000
    } as ServiceConfig,

    lms: {
      name: 'lms',
      url: Env.LMS_SERVICE_URL,
      healthCheck: '/lms/health',
      timeout: 5000
    } as ServiceConfig,
  },

  // Route configuration
  routes: [
    {
      path: '/api/v1/app/*',
      method: 'GET',
      service: 'app',
      target: '/*'
    },
    {
      path: '/api/v1/app/*',
      method: 'POST',
      service: 'app',
      target: '/*'
    },
    {
      path: '/api/v1/app/*',
      method: 'PUT',
      service: 'app',
      target: '/*'
    },
    {
      path: '/api/v1/app/*',
      method: 'PATCH',
      service: 'app',
      target: '/*'
    },
    {
      path: '/api/v1/app/*',
      method: 'DELETE',
      service: 'app',
      target: '/*'
    },
    {
      path: '/api/v1/lms/*',
      method: 'GET',
      service: 'lms',
      target: '/*'
    },
    {
      path: '/api/v1/lms/*',
      method: 'POST',
      service: 'lms',
      target: '/*'
    },
    {
      path: '/api/v1/lms/*',
      method: 'PUT',
      service: 'lms',
      target: '/*'
    },
    {
      path: '/api/v1/lms/*',
      method: 'PATCH',
      service: 'lms',
      target: '/*'
    },
    {
      path: '/api/v1/lms/*',
      method: 'DELETE',
      service: 'lms',
      target: '/*'
    },
  ] as RouteConfig[],

  // Gateway settings
  gateway: {
    timeout: 10000,
    retries: 3,
    rateLimitWindow: 15 * 60 * 1000, // 15 minutes
    rateLimitMax: 100 // requests per window
  },
};