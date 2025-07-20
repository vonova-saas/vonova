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
    auth: {
      name: 'auth',
      url: Env.AUTH_SERVICE_URL,
      healthCheck: '/health',
      timeout: 5000
    } as ServiceConfig,

    user: {
      name: 'user',
      url: Env.USER_SERVICE_URL,
      healthCheck: '/health',
      timeout: 5000
    } as ServiceConfig,
  },

  // Route configuration
  routes: [
    {
      path: '/api/v1/auth/*',
      method: 'GET',
      service: 'auth',
      target: '/*'
    },
    {
      path: '/api/v1/auth/*',
      method: 'POST',
      service: 'auth',
      target: '/*'
    },
    {
      path: '/api/v1/user/*',
      method: 'GET',
      service: 'user',
      target: '/*'
    },
    {
      path: '/api/v1/user/*',
      method: 'POST',
      service: 'user',
      target: '/*'
    },
    {
      path: '/api/v1/user/*',
      method: 'PUT',
      service: 'user',
      target: '/*'
    },
    {
      path: '/api/v1/user/*',
      method: 'PATCH',
      service: 'user',
      target: '/*'
    },
    {
      path: '/api/v1/user/*',
      method: 'DELETE',
      service: 'user',
      target: '/*'
    }
  ] as RouteConfig[],

  // Gateway settings
  gateway: {
    timeout: 10000,
    retries: 3,
    rateLimitWindow: 15 * 60 * 1000, // 15 minutes
    rateLimitMax: 100 // requests per window
  },

  // // Auth settings
  // auth: {
  //   jwtSecret: process.env.JWT_SECRET || 'your_default_jwt_secret',
  // }
};